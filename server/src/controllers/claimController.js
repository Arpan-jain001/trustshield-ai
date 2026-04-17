import { Claim } from "../models/Claim.js";
import { SystemAlert } from "../models/SystemAlert.js";
import { ProviderProfile } from "../models/ProviderProfile.js";
import { ProviderReserveLedger } from "../models/ProviderReserveLedger.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { autoCreateClaim } from "../services/claimService.js";
import { getPaymentGateway, getRazorpayPublicConfig, verifyRazorpayPaymentSignature } from "../services/paymentService.js";

export const createClaim = asyncHandler(async (req, res) => {
  const claim = await autoCreateClaim({
    user: req.user,
    ipAddress: req.ip,
    deviceFingerprint: req.headers["x-device-fingerprint"],
    signalPayload: req.body?.signalPayload || {},
    manual: true
  });

  if (!claim) {
    return res.status(400).json({ message: "No active policy found" });
  }

  res.status(201).json({ claim });
});

export const getClaimHistory = asyncHandler(async (req, res) => {
  const claims = await Claim.find({ user: req.user._id }).populate("review.reviewedBy", "name role accountType organizationName").populate("review.requestedBy", "name role accountType organizationName").sort({ createdAt: -1 });
  res.json({ claims });
});

export const requestManualClaimReview = asyncHandler(async (req, res) => {
  const { claimId, reason } = req.body;

  if (!claimId) {
    return res.status(400).json({ message: "claimId is required" });
  }

  const claim = await Claim.findOne({ _id: claimId, user: req.user._id }).populate("provider", "name organizationName accountType");
  if (!claim) {
    return res.status(404).json({ message: "Claim not found" });
  }

  claim.decision = "NEEDS_REVIEW";
  claim.decisionSource = "MANUAL";
  claim.decisionReason = reason?.trim() || "Worker requested a manual review after the AI decision.";
  claim.review = {
    ...claim.review,
    status: "PENDING",
    notes: reason?.trim() || claim.review?.notes || "Worker requested manual review",
    requestedBy: req.user._id,
    requestedAt: new Date()
  };
  await claim.save();

  if (claim.provider?._id) {
    await SystemAlert.create({
      user: claim.provider._id,
      audience: "USER",
      title: "Worker requested claim re-verification",
      message: `Claim ${claim._id} escalated by ${req.user.name}. Fraud ${claim.fraud?.score || 0}, AI risk ${claim.aiRisk?.score || 0}, spoof risk ${claim.signalFusion?.spoofRisk || 0}.`,
      severity: "WARN",
      createdBy: req.user._id
    });
  }

  await SystemAlert.create({
    audience: "GLOBAL",
    title: "Manual claim review requested",
    message: `Worker ${req.user.name} requested manual review for claim ${claim._id}. Fraud ${claim.fraud?.score || 0}, AI risk ${claim.aiRisk?.score || 0}. Provider/admin final decision required.`,
    severity: "WARN",
    createdBy: req.user._id
  });

  res.json({ message: "Manual review requested successfully", claim });
});

export const getClaimPaymentConfig = asyncHandler(async (_req, res) => {
  res.json({
    paymentGateway: getPaymentGateway(),
    razorpay: getRazorpayPublicConfig()
  });
});

export const verifyClaimPayment = asyncHandler(async (req, res) => {
  const { claimId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!claimId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "claimId, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required" });
  }

  const claim = await Claim.findOne({ _id: claimId, user: req.user._id });
  if (!claim) {
    return res.status(404).json({ message: "Claim not found" });
  }

  if (claim.payout?.gateway !== "RAZORPAY_TEST") {
    return res.status(400).json({ message: "This claim is not configured for Razorpay verification" });
  }

  if (claim.payout?.status === "SUCCESS") {
    return res.json({ message: "Payment already verified", claim });
  }

  if (claim.payout?.orderId && claim.payout.orderId !== razorpay_order_id) {
    return res.status(400).json({ message: "Razorpay order ID does not match claim payout order" });
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
  const processingSeconds = Math.max(1, Math.round((now.getTime() - claim.createdAt.getTime()) / 1000));

  claim.payout = {
    ...claim.payout,
    status: "SUCCESS",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    transactionId: razorpay_payment_id,
    processingSeconds,
    processedAt: now,
    message: `Razorpay payment verified successfully in ${processingSeconds}s`
  };

  if (claim.provider && claim.payout?.total > 0) {
    const providerProfile = await ProviderProfile.findOne({ user: claim.provider });
    if (providerProfile) {
      providerProfile.reservePool = Math.max(0, providerProfile.reservePool - claim.payout.total);
      providerProfile.availableLiquidity = Math.max(0, providerProfile.availableLiquidity - claim.payout.total);
      await providerProfile.save();

      await ProviderReserveLedger.create({
        provider: claim.provider,
        entryType: "PAYOUT_SETTLED",
        amount: claim.payout.total,
        note: `Claim payout verified for claim ${claim._id}`,
        balanceAfter: providerProfile.availableLiquidity,
        createdBy: req.user._id
      });
    }
  }

  await claim.save();
  res.json({ message: "Claim payout verified successfully", claim });
});

export const preTriggerAnalysis = asyncHandler(async (req, res) => {
  const { signalPayload } = req.body;

  if (!signalPayload) {
    return res.status(400).json({ message: "signalPayload is required" });
  }

  try {
    // Import here to avoid circular dependency
    const { simulateClaimTrust } = await import("../services/claimService.js");

    // Get active policy
    const { Policy } = await import("../models/Policy.js");
    const policy = await Policy.findOne({ user: req.user._id, status: "ACTIVE" }).populate("provider");

    if (!policy) {
      return res.status(400).json({ message: "No active policy found" });
    }

    // Simulate trust analysis without creating claim
    const trustAnalysis = await simulateClaimTrust({
      user: req.user,
      policy,
      signalPayload,
      ipAddress: req.ip,
      deviceFingerprint: req.headers["x-device-fingerprint"]
    });

    // Return only the analysis data (fraud, aiRisk, anomaly, disruptionData)
    res.json({
      fraud: trustAnalysis.fraud || {},
      aiRisk: trustAnalysis.aiRisk || {},
      anomaly: trustAnalysis.anomaly || {},
      disruptionData: trustAnalysis.disruptionData || {},
      signalFusion: trustAnalysis.signalFusion || {},
      decisionReason: trustAnalysis.decisionReason || ""
    });
  } catch (error) {
    console.error("Pre-trigger analysis error:", error);
    res.status(500).json({
      message: "Failed to analyze claim risk",
      error: error.message
    });
  }
});
