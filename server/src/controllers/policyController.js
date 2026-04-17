import { Claim } from "../models/Claim.js";
import { Policy } from "../models/Policy.js";
import { ProviderProfile } from "../models/ProviderProfile.js";
import { ProviderReserveLedger } from "../models/ProviderReserveLedger.js";
import { ProviderPolicyProduct } from "../models/ProviderPolicyProduct.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { computePolicyPricing } from "../services/policyService.js";
import { verifyRazorpayPaymentSignature } from "../services/paymentService.js";

export const createPolicy = asyncHandler(async (req, res) => {
  if (!req.user.linkedProvider) {
    return res.status(400).json({ message: "No insurer/provider organization is linked to this worker account" });
  }

  let selectedProduct = null;
  if (req.body?.productId) {
    selectedProduct = await ProviderPolicyProduct.findOne({
      _id: req.body.productId,
      provider: req.user.linkedProvider,
      status: "ACTIVE"
    });
    if (!selectedProduct) {
      return res.status(404).json({ message: "Selected provider policy product is not available" });
    }
  } else {
    selectedProduct = await ProviderPolicyProduct.findOne({
      provider: req.user.linkedProvider,
      status: "ACTIVE",
      isDefault: true
    }).sort({ createdAt: -1 });

    if (!selectedProduct) {
      selectedProduct = await ProviderPolicyProduct.findOne({
        provider: req.user.linkedProvider,
        status: "ACTIVE"
      }).sort({ createdAt: -1 });
    }
  }

  const claimCount = await Claim.countDocuments({ user: req.user._id });
  const result = await computePolicyPricing(req.user, claimCount, selectedProduct);
  const existingActivePolicy = await Policy.findOne({ user: req.user._id, status: "ACTIVE" }).sort({ createdAt: -1 });

  await Policy.updateMany({ user: req.user._id, status: "ACTIVE" }, { status: "EXPIRED" });

  const policy = await Policy.create({
    user: req.user._id,
    provider: req.user.linkedProvider,
    product: selectedProduct?._id,
    productName: selectedProduct?.name || "Provider weekly cover",
    providerName: req.user.linkedProviderName || "Assigned insurer",
    weeklyPremium: result.pricingBreakdown.total,
    coverageHours: result.coverageHours,
    maxPayout: selectedProduct?.maxPayout || 3000,
    riskScore: result.risk.score,
    pricingBreakdown: result.pricingBreakdown,
    aiExplanation: result.risk.explanation,
    riskInputs: {
      rainfall: result.disruptionSignals?.rainfall,
      aqi: result.disruptionSignals?.aqi,
      curfew: result.disruptionSignals?.curfew,
      source: result.disruptionSignals?.source
    },
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  req.user.riskProfile = {
    score: result.risk.score,
    explanation: result.risk.explanation,
    updatedAt: new Date()
  };
  await req.user.save();

  res.status(201).json({
    message: existingActivePolicy ? "Weekly policy renewed successfully" : "Weekly policy activated successfully",
    action: existingActivePolicy ? "RENEWED" : "CREATED",
    policy
  });
});

export const getUserPolicy = asyncHandler(async (req, res) => {
  const policy = await Policy.findOne({ user: req.user._id, status: "ACTIVE" })
    .populate("provider", "name organizationName")
    .populate("product", "name description coverageHours maxPayout")
    .sort({ createdAt: -1 });
  res.json({ policy });
});

// Policy Tier System - Subscription-based policies
const POLICY_TIERS = {
  BASIC: {
    monthlyPremium: 49,
    claimCoverage: 500,
    displayName: "Basic Protection",
    description: "₹500 coverage per claim"
  },
  STANDARD: {
    monthlyPremium: 99,
    claimCoverage: 1000,
    displayName: "Standard Protection",
    description: "₹1000 coverage per claim"
  },
  PREMIUM: {
    monthlyPremium: 149,
    claimCoverage: 1500,
    displayName: "Premium Protection",
    description: "₹1500 coverage per claim"
  }
};

export const getPolicyTiers = asyncHandler(async (_req, res) => {
  res.json({
    tiers: Object.entries(POLICY_TIERS).map(([key, value]) => ({
      tier: key,
      ...value
    }))
  });
});

export const getUserActiveTierPolicy = asyncHandler(async (req, res) => {
  const policy = await Policy.findOne({
    user: req.user._id,
    policyType: "SELF_PURCHASED",
    status: "ACTIVE",
    paymentStatus: "SUCCESS",
    endsAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!policy) {
    return res.status(404).json({ message: "No active subscription policy found", policy: null });
  }

  res.json({ policy });
});

export const purchaseTierPolicy = asyncHandler(async (req, res) => {
  const { tier } = req.body;

  if (!tier || !POLICY_TIERS[tier]) {
    return res.status(400).json({ message: "Invalid tier. Must be BASIC, STANDARD, or PREMIUM" });
  }

  if (!req.user.linkedProvider) {
    return res.status(400).json({ message: "No linked provider found for this worker account" });
  }

  const tierConfig = POLICY_TIERS[tier];

  // Check for existing active self-purchased policy
  const existingPolicy = await Policy.findOne({
    user: req.user._id,
    policyType: "SELF_PURCHASED",
    status: "ACTIVE",
    paymentStatus: "SUCCESS",
    endsAt: { $gt: new Date() }
  });

  if (existingPolicy) {
    return res.status(400).json({ 
      message: "You already have an active policy. Please renew or cancel it first.",
      existingPolicy 
    });
  }

  // Create new policy
  const policy = new Policy({
    user: req.user._id,
    provider: req.user.linkedProvider,
    providerName: req.user.linkedProviderName || "Assigned insurer",
    tier: tier,
    monthlyPremium: tierConfig.monthlyPremium,
    claimCoverage: tierConfig.claimCoverage,
    policyType: "SELF_PURCHASED",
    paymentStatus: "PENDING",
    status: "PENDING_PAYMENT",
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });

  await policy.save();

  res.status(201).json({
    message: "Policy created successfully. Proceed to payment.",
    policy,
    paymentDetails: {
      amount: tierConfig.monthlyPremium,
      currency: "INR",
      description: `${tierConfig.displayName} - Monthly Premium`,
      policyId: policy._id.toString()
    }
  });
});

export const verifyTierPolicyPayment = asyncHandler(async (req, res) => {
  const { policyId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!policyId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      message: "policyId, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required"
    });
  }

  const policy = await Policy.findOne({ _id: policyId, user: req.user._id, policyType: "SELF_PURCHASED" });
  if (!policy) {
    return res.status(404).json({ message: "Policy not found" });
  }

  if (policy.status === "ACTIVE" && policy.paymentStatus === "SUCCESS") {
    return res.json({ message: "Policy already activated", policy });
  }

  if (policy.status !== "PENDING_PAYMENT" && policy.paymentStatus !== "PENDING" && policy.paymentStatus !== "SUCCESS") {
    return res.status(400).json({ message: "This policy is not awaiting payment verification" });
  }

  if (policy.razorpayOrderId && policy.razorpayOrderId !== razorpay_order_id) {
    return res.status(400).json({ message: "Razorpay order ID does not match the policy payment order" });
  }

  const isValid = verifyRazorpayPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature
  });

  if (!isValid) {
    return res.status(400).json({ message: "Invalid Razorpay payment signature" });
  }

  const now = new Date();
  const renewalWindow = 30 * 24 * 60 * 60 * 1000;

  if (policy.renewedFrom) {
    await Policy.updateOne(
      { _id: policy.renewedFrom, user: req.user._id },
      { $set: { status: "EXPIRED" } }
    );
  }

  policy.paymentStatus = "SUCCESS";
  policy.paymentId = razorpay_payment_id;
  policy.transactionId = razorpay_payment_id;
  policy.razorpayOrderId = razorpay_order_id;
  policy.status = "ACTIVE";
  policy.paymentVerifiedAt = now;
  if (!policy.startsAt || policy.status === "PENDING_PAYMENT") {
    policy.startsAt = now;
  }
  if (!policy.endsAt || policy.endsAt < now) {
    policy.endsAt = new Date(now.getTime() + renewalWindow);
  }

  await policy.save();

  if (policy.provider && policy.monthlyPremium > 0) {
    let providerProfile = await ProviderProfile.findOne({ user: policy.provider });
    if (!providerProfile) {
      providerProfile = await ProviderProfile.create({
        user: policy.provider,
        underwritingHistory: [
          {
            version: 1,
            underwritingMode: "BALANCED",
            maxPayoutPerClaim: 3000,
            autoApprovalThreshold: 35,
            reviewThreshold: 70,
            targetLossRatio: 58,
            focusRegions: [],
            notes: "Auto-created profile at first worker premium credit"
          }
        ]
      });
    }

    providerProfile.reservePool += policy.monthlyPremium;
    providerProfile.availableLiquidity += policy.monthlyPremium;
    await providerProfile.save();

    await ProviderReserveLedger.create({
      provider: policy.provider,
      entryType: "ADD",
      amount: policy.monthlyPremium,
      note: `Premium collected for ${policy.tier} policy ${policy._id} (${policy.paymentId || "payment"})`,
      balanceAfter: providerProfile.availableLiquidity,
      createdBy: req.user._id
    });
  }

  res.json({
    message: "Policy payment verified successfully",
    policy
  });
});

export const renewTierPolicy = asyncHandler(async (req, res) => {
  const { policyId, tier } = req.body;

  if (!policyId || !tier || !POLICY_TIERS[tier]) {
    return res.status(400).json({ message: "policyId and valid tier are required" });
  }

  const oldPolicy = await Policy.findOne({ _id: policyId, user: req.user._id, policyType: "SELF_PURCHASED" });
  if (!oldPolicy) {
    return res.status(404).json({ message: "Policy not found" });
  }

  const tierConfig = POLICY_TIERS[tier];

  // Create new renewed policy
  const newPolicy = new Policy({
    user: req.user._id,
    provider: oldPolicy.provider || req.user.linkedProvider,
    providerName: oldPolicy.providerName || req.user.linkedProviderName || "Assigned insurer",
    tier: tier,
    monthlyPremium: tierConfig.monthlyPremium,
    claimCoverage: tierConfig.claimCoverage,
    policyType: "SELF_PURCHASED",
    paymentStatus: "PENDING",
    status: "PENDING_PAYMENT",
    renewedFrom: oldPolicy._id,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });

  await newPolicy.save();

  res.status(201).json({
    message: "Policy renewal created successfully. Proceed to payment.",
    policy: newPolicy,
    paymentDetails: {
      amount: tierConfig.monthlyPremium,
      currency: "INR",
      description: `${tierConfig.displayName} - Renewal`,
      policyId: newPolicy._id.toString()
    }
  });
});

export const cancelTierPolicy = asyncHandler(async (req, res) => {
  const { policyId } = req.body;

  if (!policyId) {
    return res.status(400).json({ message: "policyId is required" });
  }

  const policy = await Policy.findOne({ _id: policyId, user: req.user._id, policyType: "SELF_PURCHASED" });
  if (!policy) {
    return res.status(404).json({ message: "Policy not found" });
  }

  policy.status = "CANCELLED";
  await policy.save();

  res.json({ message: "Policy cancelled successfully", policy });
});

export const getPolicyHistory = asyncHandler(async (req, res) => {
  const policies = await Policy.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ policies });
});
