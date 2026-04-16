import { Claim } from "../models/Claim.js";
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
  const claims = await Claim.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ claims });
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

  await claim.save();
  res.json({ message: "Claim payout verified successfully", claim });
});
