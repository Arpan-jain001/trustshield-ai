import { asyncHandler } from "../utils/asyncHandler.js";
import { Policy } from "../models/Policy.js";
import { Claim } from "../models/Claim.js";
import { SystemAlert } from "../models/SystemAlert.js";
import { ProviderProfile } from "../models/ProviderProfile.js";
import { ProviderPolicyProduct } from "../models/ProviderPolicyProduct.js";
import { ProviderReserveLedger } from "../models/ProviderReserveLedger.js";
import { computePolicyPricing } from "../services/policyService.js";
import { getDisruptionSignals } from "../services/triggerService.js";
import { initiateInstantPayout } from "../services/paymentService.js";
import { verifyRazorpayPaymentSignature } from "../services/paymentService.js";
import { env } from "../config/env.js";
import Razorpay from "razorpay";
import { User } from "../models/User.js";

const razorpay = new Razorpay({
  key_id: env.razorpayKeyId,
  key_secret: env.razorpayKeySecret
});

async function getOrCreateProviderProfile(userId) {
  let profile = await ProviderProfile.findOne({ user: userId });
  if (!profile) {
    profile = await ProviderProfile.create({
      user: userId,
      underwritingHistory: [
        {
          version: 1,
          underwritingMode: "BALANCED",
          maxPayoutPerClaim: 3000,
          autoApprovalThreshold: 35,
          reviewThreshold: 70,
          targetLossRatio: 58,
          focusRegions: [],
          notes: "Initial provider underwriting profile"
        }
      ]
    });
  } else if (!profile.underwritingHistory?.length) {
    profile.underwritingHistory = [
      {
        version: profile.activeRuleVersion || 1,
        underwritingMode: profile.underwritingMode,
        maxPayoutPerClaim: profile.maxPayoutPerClaim,
        autoApprovalThreshold: profile.autoApprovalThreshold,
        reviewThreshold: profile.reviewThreshold,
        targetLossRatio: profile.targetLossRatio,
        focusRegions: profile.focusRegions || [],
        notes: profile.notes || "Imported provider underwriting profile"
      }
    ];
    await profile.save();
  }
  return profile;
}

async function ensureDefaultProduct(providerUser) {
  const existingProduct = await ProviderPolicyProduct.findOne({ provider: providerUser._id });
  if (existingProduct) return existingProduct;

  return ProviderPolicyProduct.create({
    provider: providerUser._id,
    name: `${providerUser.organizationName || providerUser.name} Weekly Shield`,
    description: "Default weekly parametric cover for linked workers.",
    weeklyBasePremium: 149,
    coverageHours: 24,
    riskMultiplier: 1,
    maxPayout: 3000,
    eligibilityTags: ["gig-workers", "weather-triggered"],
    isDefault: true
  });
}

async function normalizeApprovedClaimPayout(claim) {
  if (!claim || claim.decision !== "APPROVED") {
    return claim;
  }

  if ((claim.payout?.total || 0) <= 0 || claim.payout?.status === "SUCCESS") {
    return claim;
  }

  claim.payout = {
    ...claim.payout,
    status: "SUCCESS",
    transactionId: claim.payout.transactionId || claim.payout.paymentId || claim.payout.orderId || `TXN-${claim._id.toString().slice(-10)}`,
    processedAt: claim.payout.processedAt || new Date(),
    processingSeconds: claim.payout.processingSeconds || 8,
    message: claim.payout.message || `INR ${claim.payout.total} credited instantly via ${claim.payout.gateway || "SIMULATOR"}`
  };

  await claim.save();
  return claim;
}

async function writeReserveEntry({ providerId, entryType, amount, note, createdBy }) {
  const profile = await getOrCreateProviderProfile(providerId);
  const numericAmount = Math.max(0, Number(amount) || 0);

  if (entryType === "ADD") {
    profile.reservePool += numericAmount;
    profile.availableLiquidity += numericAmount;
  }

  if (entryType === "WITHDRAW") {
    if (profile.availableLiquidity < numericAmount) {
      throw new Error("Available liquidity is lower than the requested withdrawal");
    }
    profile.reservePool = Math.max(0, profile.reservePool - numericAmount);
    profile.availableLiquidity = Math.max(0, profile.availableLiquidity - numericAmount);
  }

  if (entryType === "PAYOUT_LOCK") {
    if (profile.availableLiquidity < numericAmount) {
      throw new Error("Available liquidity is lower than the payout lock amount");
    }
    profile.availableLiquidity -= numericAmount;
    profile.lockedLiquidity += numericAmount;
  }

  if (entryType === "PAYOUT_RELEASE") {
    profile.availableLiquidity += numericAmount;
    profile.lockedLiquidity = Math.max(0, profile.lockedLiquidity - numericAmount);
  }

  if (entryType === "PAYOUT_SETTLED") {
    profile.lockedLiquidity = Math.max(0, profile.lockedLiquidity - numericAmount);
    profile.reservePool = Math.max(0, profile.reservePool - numericAmount);
  }

  await profile.save();

  return ProviderReserveLedger.create({
    provider: providerId,
    entryType,
    amount: numericAmount,
    note,
    balanceAfter: profile.availableLiquidity,
    createdBy
  });
}

export const getProviderDashboard = asyncHandler(async (req, res) => {
  const providerProfile = await getOrCreateProviderProfile(req.user._id);
  await ensureDefaultProduct(req.user);

  const [policies, claims, notifications, workers, products, reserveEntries] = await Promise.all([
    Policy.find({ provider: req.user._id }).sort({ createdAt: -1 }).limit(30).populate("user", "name email location linkedProviderName").populate("product", "name"),
    Claim.find({ provider: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("user", "name email location linkedProviderName")
      .populate("review.requestedBy", "name role accountType organizationName")
      .populate("review.reviewedBy", "name role accountType organizationName"),
    SystemAlert.find({
      $or: [{ audience: "GLOBAL" }, { user: req.user._id }]
    }).sort({ createdAt: -1 }).limit(10),
    User.find({ role: "USER", accountType: "WORKER", linkedProvider: req.user._id }).sort({ createdAt: -1 }).select("name email location status linkedProviderName createdAt"),
    ProviderPolicyProduct.find({ provider: req.user._id }).sort({ isDefault: -1, createdAt: -1 }),
    ProviderReserveLedger.find({ provider: req.user._id }).sort({ createdAt: -1 }).limit(12)
  ]);

  const normalizedClaims = await Promise.all(claims.map((claim) => normalizeApprovedClaimPayout(claim)));

  const totalPremium = policies.reduce((sum, item) => sum + (item.weeklyPremium || item.monthlyPremium || 0), 0);
  const totalPayout = normalizedClaims.reduce((sum, item) => sum + (item.payout?.total || 0), 0);
  const claimMix = {
    approved: normalizedClaims.filter((item) => item.decision === "APPROVED").length,
    review: normalizedClaims.filter((item) => item.decision === "NEEDS_REVIEW").length,
    rejected: normalizedClaims.filter((item) => item.decision === "REJECTED").length
  };
  const lossRatio = totalPremium ? Number(((totalPayout / totalPremium) * 100).toFixed(2)) : 0;

  const focusLocations = [...new Set(workers.map((worker) => worker.location).filter(Boolean))].slice(0, 3);
  const forecasts = await Promise.all(focusLocations.map((location) => getDisruptionSignals(location)));
  const strongestForecast = forecasts.sort((a, b) => (b.forecastProbability || b.rainfall || 0) - (a.forecastProbability || a.rainfall || 0))[0];
  const nextWeekRiskScore = strongestForecast
    ? Math.min(
        100,
        Math.round((strongestForecast.forecastProbability || 0) * 0.45 + strongestForecast.rainfall * 0.35 + (strongestForecast.aqi / 4) * 0.2)
      )
    : 0;
  const nextWeekRiskBand = nextWeekRiskScore >= 70 ? "HIGH" : nextWeekRiskScore >= 45 ? "MEDIUM" : "LOW";
  const payoutDurations = normalizedClaims.map((item) => item.payout?.processingSeconds).filter((value) => Number.isFinite(Number(value)) && Number(value) > 0);
  const avgPayoutSeconds = payoutDurations.length
    ? Math.round(payoutDurations.reduce((sum, value) => sum + Number(value), 0) / payoutDurations.length)
    : 0;
  const highRiskFraudClaims = normalizedClaims.filter((item) => (item.fraud?.score || 0) >= 65).length;

  res.json({
    providerProfile,
    portfolio: {
      totalPolicies: policies.length,
      activePolicies: policies.filter((item) => item.status === "ACTIVE").length,
      totalPremium,
      totalPayout,
      lossRatio,
      averageRiskScore: normalizedClaims.length ? Math.round(normalizedClaims.reduce((sum, item) => sum + (item.aiRisk?.score || 0), 0) / normalizedClaims.length) : 0,
      claimMix,
      openReviewClaims: normalizedClaims.filter((item) => item.decision === "NEEDS_REVIEW").length,
      liquidityRatio: providerProfile.reservePool ? Math.round((providerProfile.availableLiquidity / providerProfile.reservePool) * 100) : 0
    },
    intelligence: {
      nextWeekRisk: {
        band: nextWeekRiskBand,
        score: nextWeekRiskScore,
        expectedHotspot: strongestForecast?.location || "N/A",
        forecast: strongestForecast
          ? `Rain ${strongestForecast.rainfall}, AQI ${strongestForecast.aqi}, precip-prob ${strongestForecast.forecastProbability || 0}%`
          : "No live forecast available"
      },
      payout: {
        avgProcessingSeconds: avgPayoutSeconds,
        underThirtySecondsRate: normalizedClaims.length
          ? Math.round((normalizedClaims.filter((item) => (item.payout?.processingSeconds || 0) <= 30 && item.payout?.processingSeconds > 0).length / normalizedClaims.length) * 100)
          : 0
      },
      fraud: {
        highRiskClaims: highRiskFraudClaims,
        manualReviews: claimMix.review,
        autoApproved: claimMix.approved
      }
    },
    workers,
    policies,
    claims: normalizedClaims,
    notifications,
    products,
    reserveEntries
  });
});

export const updateProviderProfile = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before updating provider configuration" });
  }
  const providerProfile = await getOrCreateProviderProfile(req.user._id);
  const { underwritingMode, reservePool, maxPayoutPerClaim, autoApprovalThreshold, reviewThreshold, targetLossRatio, focusRegions, notes } = req.body;

  if (["BALANCED", "GROWTH", "DEFENSIVE"].includes(underwritingMode)) providerProfile.underwritingMode = underwritingMode;
  if (Number.isFinite(Number(reservePool))) {
    const nextReserve = Math.max(0, Number(reservePool));
    const delta = nextReserve - providerProfile.reservePool;
    providerProfile.reservePool = nextReserve;
    providerProfile.availableLiquidity = Math.max(0, providerProfile.availableLiquidity + delta);
  }
  if (Number.isFinite(Number(maxPayoutPerClaim))) providerProfile.maxPayoutPerClaim = Number(maxPayoutPerClaim);
  if (Number.isFinite(Number(autoApprovalThreshold))) providerProfile.autoApprovalThreshold = Number(autoApprovalThreshold);
  if (Number.isFinite(Number(reviewThreshold))) providerProfile.reviewThreshold = Number(reviewThreshold);
  if (Number.isFinite(Number(targetLossRatio))) providerProfile.targetLossRatio = Number(targetLossRatio);
  if (Array.isArray(focusRegions)) providerProfile.focusRegions = focusRegions.map((item) => `${item}`.trim()).filter(Boolean);
  if (typeof notes === "string") providerProfile.notes = notes.trim();

  providerProfile.activeRuleVersion = (providerProfile.activeRuleVersion || 1) + 1;
  providerProfile.underwritingHistory.unshift({
    version: providerProfile.activeRuleVersion,
    underwritingMode: providerProfile.underwritingMode,
    maxPayoutPerClaim: providerProfile.maxPayoutPerClaim,
    autoApprovalThreshold: providerProfile.autoApprovalThreshold,
    reviewThreshold: providerProfile.reviewThreshold,
    targetLossRatio: providerProfile.targetLossRatio,
    focusRegions: providerProfile.focusRegions,
    notes: providerProfile.notes
  });
  providerProfile.underwritingHistory = providerProfile.underwritingHistory.slice(0, 10);

  await providerProfile.save();

  res.json({ message: "Provider underwriting profile updated successfully", providerProfile });
});

export const simulateProviderPricing = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before running pricing simulations" });
  }
  const { location, claimCount = 0, hourlyRate = 120, workType = "OTHER", customWorkType = "Insurance portfolio simulation", productId } = req.body;

  if (!location?.trim()) {
    return res.status(400).json({ message: "Location is required for pricing simulation" });
  }

  let product = null;
  if (productId) {
    product = await ProviderPolicyProduct.findOne({ _id: productId, provider: req.user._id });
  }

  const pricing = await computePolicyPricing(
    {
      ...req.user.toObject(),
      location: location.trim(),
      hourlyRate: Number(hourlyRate) || 120,
      workType,
      customWorkType
    },
    Number(claimCount) || 0,
    product
  );

  res.json({
    message: "Pricing simulation completed",
    simulation: {
      location: location.trim(),
      claimCount: Number(claimCount) || 0,
      product: product ? { id: product._id, name: product.name } : null,
      pricingBreakdown: pricing.pricingBreakdown,
      coverageHours: pricing.coverageHours,
      risk: pricing.risk,
      disruptionSignals: pricing.disruptionSignals
    }
  });
});

export const createProviderProduct = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before creating provider products" });
  }

  const {
    name,
    description,
    weeklyBasePremium,
    coverageHours,
    riskMultiplier,
    maxPayout,
    eligibilityTags,
    isDefault
  } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ message: "Product name is required" });
  }

  if (isDefault) {
    await ProviderPolicyProduct.updateMany({ provider: req.user._id }, { isDefault: false });
  }

  const product = await ProviderPolicyProduct.create({
    provider: req.user._id,
    name: name.trim(),
    description: `${description || ""}`.trim(),
    weeklyBasePremium: Math.max(99, Number(weeklyBasePremium) || 149),
    coverageHours: Math.max(12, Number(coverageHours) || 24),
    riskMultiplier: Math.max(0.5, Number(riskMultiplier) || 1),
    maxPayout: Math.max(500, Number(maxPayout) || 3000),
    eligibilityTags: Array.isArray(eligibilityTags) ? eligibilityTags.map((item) => `${item}`.trim()).filter(Boolean) : [],
    isDefault: Boolean(isDefault)
  });

  res.status(201).json({ message: "Provider product created successfully", product });
});

export const updateProviderProduct = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before updating provider products" });
  }

  const product = await ProviderPolicyProduct.findOne({ _id: req.params.productId, provider: req.user._id });
  if (!product) {
    return res.status(404).json({ message: "Provider product not found" });
  }

  const { name, description, weeklyBasePremium, coverageHours, riskMultiplier, maxPayout, eligibilityTags, status, isDefault } = req.body;
  if (typeof name === "string" && name.trim()) product.name = name.trim();
  if (typeof description === "string") product.description = description.trim();
  if (Number.isFinite(Number(weeklyBasePremium))) product.weeklyBasePremium = Math.max(99, Number(weeklyBasePremium));
  if (Number.isFinite(Number(coverageHours))) product.coverageHours = Math.max(12, Number(coverageHours));
  if (Number.isFinite(Number(riskMultiplier))) product.riskMultiplier = Math.max(0.5, Number(riskMultiplier));
  if (Number.isFinite(Number(maxPayout))) product.maxPayout = Math.max(500, Number(maxPayout));
  if (Array.isArray(eligibilityTags)) product.eligibilityTags = eligibilityTags.map((item) => `${item}`.trim()).filter(Boolean);
  if (["ACTIVE", "PAUSED", "RETIRED"].includes(status)) product.status = status;

  if (typeof isDefault === "boolean") {
    if (isDefault) {
      await ProviderPolicyProduct.updateMany({ provider: req.user._id }, { isDefault: false });
    }
    product.isDefault = isDefault;
  }

  await product.save();
  res.json({ message: "Provider product updated successfully", product });
});

export const adjustProviderLiquidity = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before adjusting provider liquidity" });
  }

  const { entryType, amount, note } = req.body;
  if (!["ADD", "WITHDRAW"].includes(entryType)) {
    return res.status(400).json({ message: "Supported liquidity actions are ADD and WITHDRAW" });
  }

  const entry = await writeReserveEntry({
    providerId: req.user._id,
    entryType,
    amount,
    note,
    createdBy: req.user._id
  });
  const providerProfile = await getOrCreateProviderProfile(req.user._id);

  res.json({
    message: entryType === "ADD" ? "Liquidity added successfully" : "Liquidity withdrawn successfully",
    entry,
    providerProfile
  });
});

export const initiateProviderLiquidityTopUp = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before topping up provider liquidity" });
  }

  const amount = Math.max(0, Number(req.body?.amount) || 0);
  const note = typeof req.body?.note === "string" ? req.body.note.trim() : "Provider reserve top-up";

  if (amount <= 0) {
    return res.status(400).json({ message: "A valid top-up amount is required" });
  }

  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    return res.status(400).json({ message: "Razorpay credentials are missing for provider top-up" });
  }

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: `provider-topup-${req.user._id.toString().slice(-10)}`,
    notes: {
      providerId: req.user._id.toString(),
      note
    }
  });

  res.status(201).json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env.razorpayKeyId,
    enabled: true
  });
});

export const verifyProviderLiquidityTopUp = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before verifying provider top-up" });
  }

  const { amount, razorpay_order_id, razorpay_payment_id, razorpay_signature, note } = req.body || {};
  const numericAmount = Math.max(0, Number(amount) || 0);

  if (!numericAmount || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "amount, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required" });
  }

  const isValid = verifyRazorpayPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature
  });

  if (!isValid) {
    return res.status(400).json({ message: "Invalid Razorpay payment signature" });
  }

  const entry = await writeReserveEntry({
    providerId: req.user._id,
    entryType: "ADD",
    amount: numericAmount,
    note: `${note?.trim() || "Provider reserve top-up"} | Order ${razorpay_order_id}`,
    createdBy: req.user._id
  });

  const providerProfile = await getOrCreateProviderProfile(req.user._id);

  res.json({
    message: "Provider liquidity topped up successfully",
    entry,
    providerProfile,
    paymentId: razorpay_payment_id
  });
});

export const reviewProviderClaim = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before reviewing claims" });
  }

  const { claimId, decision, notes } = req.body;
  if (!["APPROVED", "REJECTED"].includes(decision)) {
    return res.status(400).json({ message: "Claim decision must be APPROVED or REJECTED" });
  }

  const claim = await Claim.findOne({ _id: claimId, provider: req.user._id }).populate("user", "name email");
  if (!claim) {
    return res.status(404).json({ message: "Provider claim not found" });
  }

  const providerProfile = await getOrCreateProviderProfile(req.user._id);
  const payoutAmount = Math.max(
    0,
    Number(claim.payout?.total) ||
      Number(claim.policy?.claimCoverage) ||
      (Number(claim.payout?.hoursLost) || 0) * (Number(claim.payout?.hourlyRate) || Number(claim.user?.hourlyRate) || 0)
  );

  if (decision === "APPROVED") {
    if (providerProfile.availableLiquidity < payoutAmount) {
      return res.status(400).json({ message: "Available liquidity is too low to approve this claim" });
    }
    const payoutResult = await initiateInstantPayout({
      amount: payoutAmount,
      referenceId: `provider-claim-${claim._id.toString().slice(-10)}`,
      notes: {
        claimId: claim._id.toString(),
        providerId: req.user._id.toString(),
        path: "PROVIDER_REVIEW"
      }
    });
    await writeReserveEntry({
      providerId: req.user._id,
      entryType: "PAYOUT_SETTLED",
      amount: payoutAmount,
      note: `Claim ${claim._id} approved by provider`,
      createdBy: req.user._id
    });
    claim.review = {
      status: "APPROVED",
      notes: notes?.trim() || "Approved by provider review",
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    };
    claim.decision = "APPROVED";
    claim.decisionSource = "PROVIDER_REVIEW";
    claim.decisionReason = notes?.trim() || "Approved by provider-side manual review";
    claim.payout = {
      ...claim.payout,
      total: payoutAmount,
      status: payoutResult.status,
      gateway: payoutResult.gateway,
      orderId: payoutResult.orderId,
      paymentId: payoutResult.paymentId,
      transactionId: payoutResult.transactionId,
      currency: payoutResult.currency,
      processingSeconds: payoutResult.processingSeconds,
      processedAt: payoutResult.processedAt,
      message: payoutResult.message
    };
  } else {
    claim.review = {
      status: "REJECTED",
      notes: notes?.trim() || "Rejected by provider review",
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    };
    claim.decision = "REJECTED";
    claim.decisionSource = "PROVIDER_REVIEW";
    claim.decisionReason = notes?.trim() || "Rejected by provider-side manual review";
    claim.payout = {
      ...claim.payout,
      total: 0,
      status: "FAILED",
      message: "Claim rejected in provider manual review"
    };
  }

  await claim.save();
  await SystemAlert.create({
    user: claim.user?._id,
    audience: "USER",
    title: "Provider reviewed your claim",
    message: `${req.user.organizationName || req.user.name} marked your claim as ${decision}. ${notes || ""}`.trim(),
    severity: decision === "APPROVED" ? "INFO" : "WARN",
    createdBy: req.user._id
  });

  res.json({ message: "Claim reviewed successfully", claim });
});

export const escalateProviderClaim = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before escalating claims" });
  }

  const { claimId, notes } = req.body;
  if (!claimId) {
    return res.status(400).json({ message: "claimId is required" });
  }

  const claim = await Claim.findOne({ _id: claimId, provider: req.user._id }).populate("user", "name email");
  if (!claim) {
    return res.status(404).json({ message: "Provider claim not found" });
  }

  claim.decision = "NEEDS_REVIEW";
  claim.decisionSource = "PROVIDER_REVIEW";
  claim.decisionReason = notes?.trim() || "Provider escalated this claim for admin review.";
  claim.review = {
    ...claim.review,
    status: "PENDING",
    notes: notes?.trim() || "Provider escalated claim for admin review",
    requestedBy: req.user._id,
    requestedAt: new Date()
  };

  await claim.save();

  await SystemAlert.create({
    audience: "GLOBAL",
    title: "Claim escalated to admin review",
    message: `${req.user.organizationName || req.user.name} escalated claim ${claim._id} for admin review. Worker: ${claim.user?.name || "Unknown worker"}.`,
    severity: "WARN",
    createdBy: req.user._id
  });

  res.json({ message: "Claim escalated to admin review", claim });
});
