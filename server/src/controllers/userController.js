import { Policy } from "../models/Policy.js";
import { Claim } from "../models/Claim.js";
import { SystemAlert } from "../models/SystemAlert.js";
import { FeatureSnapshot } from "../models/FeatureSnapshot.js";
import { FraudGraphEdge } from "../models/FraudGraphEdge.js";
import { ProviderPolicyProduct } from "../models/ProviderPolicyProduct.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createPredictiveAlert } from "../services/triggerService.js";
import { sendEmail, buildSecondaryEmailOtp } from "../services/mailService.js";
import { getDisruptionSignals, getDisruptionSignalsFromCoordinates } from "../services/triggerService.js";
import { ingestSignals } from "../services/ingestionService.js";
import { enqueueJob } from "../services/queueService.js";

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    accountType: user.accountType,
    organizationName: user.organizationName,
    linkedProvider: user.linkedProvider,
    linkedProviderName: user.linkedProviderName,
    secondaryEmail: user.secondaryEmail,
    location: user.location,
    address: user.address,
    mobileNumber: user.mobileNumber,
    avatarUrl: user.avatarUrl,
    workType: user.workType,
    customWorkType: user.customWorkType,
    role: user.role,
    status: user.status,
    statusReason: user.statusReason,
    emailVerificationVerified: Boolean(user.emailVerification?.verified),
    hourlyRate: user.hourlyRate,
    riskProfile: user.riskProfile,
    settings: user.settings,
    createdAt: user.createdAt
  };
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

export const getProfile = asyncHandler(async (req, res) => {
  const [policy, claims, alerts, policyHistory, featureSnapshots, graphEdges, availableProducts] = await Promise.all([
    Policy.findOne({ user: req.user._id, status: "ACTIVE" }).populate("provider", "name organizationName accountType").sort({ createdAt: -1 }),
    Claim.find({ user: req.user._id }).populate("review.reviewedBy", "name role accountType organizationName").populate("review.requestedBy", "name role accountType organizationName").sort({ createdAt: -1 }).limit(8),
    SystemAlert.find({
      $or: [{ audience: "GLOBAL" }, { user: req.user._id }]
    }).sort({ createdAt: -1 }).limit(8),
    Policy.find({ user: req.user._id }).populate("provider", "name organizationName accountType").sort({ createdAt: -1 }).limit(6),
    FeatureSnapshot.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5),
    FraudGraphEdge.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(8),
    req.user.linkedProvider
      ? ProviderPolicyProduct.find({ provider: req.user.linkedProvider, status: "ACTIVE" }).sort({ isDefault: -1, createdAt: -1 }).limit(6)
      : []
  ]);

  const normalizedClaims = await Promise.all(claims.map((claim) => normalizeApprovedClaimPayout(claim)));

  if (!alerts.length) {
    if (req.user.status === "ACTIVE") {
      await createPredictiveAlert(req.user);
    } else {
      await SystemAlert.create({
        user: req.user._id,
        audience: "USER",
        title: "Account under admin review",
        message: req.user.statusReason || "Your email is verified. An admin review is still pending before full dashboard access unlocks.",
        severity: req.user.status === "PENDING_VERIFICATION" ? "INFO" : "WARN"
      });
    }
  }

  res.json({
    user: serializeUser(req.user),
    policy,
    claims: normalizedClaims,
    policyHistory,
    summary: {
      totalClaims: normalizedClaims.length,
      approvedClaims: normalizedClaims.filter((claim) => claim.decision === "APPROVED").length,
      rejectedClaims: normalizedClaims.filter((claim) => claim.decision === "REJECTED").length,
      reviewClaims: normalizedClaims.filter((claim) => claim.decision === "NEEDS_REVIEW").length,
      totalPayout: normalizedClaims.reduce((sum, claim) => sum + (claim.payout?.total || 0), 0)
    },
    featureSnapshots,
    graphEdges,
    availableProducts,
    alerts: await SystemAlert.find({
      $or: [{ audience: "GLOBAL" }, { user: req.user._id }]
    }).sort({ createdAt: -1 }).limit(8)
  });
});

export const getSettings = asyncHandler(async (req, res) => {
  res.json({
    profile: serializeUser(req.user),
    settings: req.user.settings || {
      notifications: { email: true, sms: false },
      theme: "SYSTEM"
    }
  });
});

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await SystemAlert.find({
    $or: [{ audience: "GLOBAL" }, { user: req.user._id }]
  })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ notifications });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await SystemAlert.findOne({ _id: req.params.notificationId, $or: [{ user: req.user._id }, { audience: "GLOBAL" }] });

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  await SystemAlert.deleteOne({ _id: notification._id });
  res.json({ message: "Notification deleted permanently" });
});

export const getLiveContext = asyncHandler(async (req, res) => {
  const latitude = Number(req.body?.latitude);
  const longitude = Number(req.body?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ message: "Valid latitude and longitude are required" });
  }

  const liveSignals = await getDisruptionSignalsFromCoordinates({
    latitude,
    longitude,
    locationLabel: req.user.location || "Live device location"
  });

  const latestClaim = await Claim.findOne({ user: req.user._id }).sort({ createdAt: -1 });

  res.json({
    location: {
      latitude,
      longitude,
      label: req.user.location || "Live device location",
      capturedAt: new Date()
    },
    weather: liveSignals.weather,
    disruption: {
      rainfall: liveSignals.rainfall,
      aqi: liveSignals.aqi,
      curfew: liveSignals.curfew,
      source: liveSignals.source,
      shouldTrigger: liveSignals.shouldTrigger,
      observedAt: liveSignals.observedAt
    },
    latestDecision: latestClaim
      ? {
          status: latestClaim.decision,
          reviewStatus: latestClaim.review?.status || "NOT_REQUIRED",
          reason: latestClaim.decisionReason,
          createdAt: latestClaim.createdAt
        }
      : null
  });
});

export const ingestUserSignals = asyncHandler(async (req, res) => {
  const trigger = await getDisruptionSignals(req.user.location);
  const priorClaimCount = await Claim.countDocuments({
    user: req.user._id,
    createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) }
  });

  const result = await ingestSignals({
    user: req.user,
    trigger,
    ipAddress: req.ip,
    deviceFingerprint: req.headers["x-device-fingerprint"],
    signalPayload: req.body || {},
    source: "SIGNAL_INGESTION",
    priorClaimCount
  });

  res.status(201).json({
    message: "Signals ingested successfully",
    snapshot: result.snapshot,
    signalFusion: result.signalFusion,
    anomaly: result.anomaly
  });
});

export const enqueueUserSignals = asyncHandler(async (req, res) => {
  const job = await enqueueJob({
    type: "SIGNAL_INGESTION",
    payload: {
      userId: req.user._id,
      location: req.user.location,
      ipAddress: req.ip,
      deviceFingerprint: req.headers["x-device-fingerprint"],
      signalPayload: req.body || {}
    }
  });

  res.status(202).json({
    message: "Signal event queued for stream processing",
    job
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, location, address, mobileNumber, avatarUrl, workType, customWorkType, hourlyRate, organizationName } = req.body;

  if (name?.trim()) req.user.name = name.trim();
  if (location?.trim()) req.user.location = location.trim();
  if (typeof address === "string") req.user.address = address.trim();
  if (typeof mobileNumber === "string") req.user.mobileNumber = mobileNumber.trim();
  if (typeof avatarUrl === "string") req.user.avatarUrl = avatarUrl.trim();
  if (typeof organizationName === "string") req.user.organizationName = organizationName.trim();
  if (["ZOMATO", "SWIGGY", "ZEPTO", "AMAZON", "OTHER"].includes(workType)) {
    req.user.workType = workType;
    req.user.customWorkType = workType === "OTHER" ? (customWorkType || req.user.customWorkType || "").trim() : "";
  }
  if (workType === "OTHER" && !req.user.customWorkType) {
    return res.status(400).json({ message: "Enter your work category" });
  }
  if (hourlyRate && !Number.isNaN(Number(hourlyRate))) req.user.hourlyRate = Number(hourlyRate);

  await req.user.save();

  res.json({
    message: "Profile updated successfully",
    user: serializeUser(req.user)
  });
});

export const requestSecondaryEmailOtp = asyncHandler(async (req, res) => {
  const { secondaryEmail } = req.body;
  if (!/^\S+@\S+\.\S+$/.test(secondaryEmail || "")) {
    return res.status(400).json({ message: "Invalid secondary email" });
  }

  const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
  req.user.resetOtp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    email: secondaryEmail.toLowerCase()
  };
  await req.user.save();

  await sendEmail({
    to: secondaryEmail,
    subject: "TrustShield AI secondary email OTP",
    html: buildSecondaryEmailOtp(req.user.name, otp)
  });

  res.json({ message: "Secondary email OTP sent successfully" });
});

export const verifySecondaryEmailOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!req.user.resetOtp?.code || !req.user.resetOtp?.email || !req.user.resetOtp?.expiresAt) {
    return res.status(400).json({ message: "Secondary email OTP not found" });
  }
  if (req.user.resetOtp.code !== otp || req.user.resetOtp.expiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  req.user.secondaryEmail = {
    email: req.user.resetOtp.email,
    verified: true
  };
  req.user.resetOtp = undefined;
  await req.user.save();

  res.json({
    message: "Secondary email verified successfully",
    secondaryEmail: req.user.secondaryEmail
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const notifications = req.body.notifications || {};
  const theme = req.body.theme;

  req.user.settings = {
    notifications: {
      email: typeof notifications.email === "boolean" ? notifications.email : req.user.settings?.notifications?.email ?? true,
      sms: typeof notifications.sms === "boolean" ? notifications.sms : req.user.settings?.notifications?.sms ?? false
    },
    theme: ["SYSTEM", "LIGHT", "DARK", "NIGHT"].includes(theme) ? theme : req.user.settings?.theme || "SYSTEM"
  };

  await req.user.save();

  res.json({
    message: "Settings updated successfully",
    settings: req.user.settings
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ message: "Current password is required" });
  }

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters" });
  }

  const valid = await req.user.comparePassword(currentPassword);
  if (!valid) {
    return res.status(400).json({ message: "Current password is invalid" });
  }

  req.user.password = newPassword;
  await req.user.save();

  res.json({ message: "Password changed successfully" });
});

export const getWithdrawalAvailable = asyncHandler(async (req, res) => {
  const user = await req.user.populate([
    {
      path: "policy",
      model: "Policy",
      match: { status: "ACTIVE" }
    }
  ]);

  const approvedClaims = await Claim.find({
    user: req.user._id,
    decision: "APPROVED",
    "payout.status": { $in: ["SUCCESS", "SETTLED", "PENDING_WITHDRAWAL"] }
  });

  let totalAvailable = 0;
  let claimDetails = [];

  for (const claim of approvedClaims) {
    const payoutTotal = Number(claim.payout?.total) || 0;
    const withdrawnAmount = Number(claim.payout?.withdrawnAmount) || 0;
    const claimAvailable = Math.max(0, payoutTotal - withdrawnAmount);
    if (claimAvailable > 0) {
      totalAvailable += claimAvailable;
      claimDetails.push({
        claimId: claim._id,
        amount: claimAvailable,
        total: payoutTotal,
        withdrawnAmount,
        approvedAt: claim.review?.approvedAt || claim.createdAt,
        status: claim.payout?.status
      });
    }
  }

  res.json({
    available: totalAvailable,
    claimCount: approvedClaims.length,
    claims: claimDetails,
    policy: user.policy
  });
});

export const initiateWithdrawal = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Valid amount is required" });
  }

  const availableClaims = await Claim.find({
    user: req.user._id,
    decision: "APPROVED",
    "payout.status": { $in: ["SUCCESS", "SETTLED", "PENDING_WITHDRAWAL"] }
  }).sort({ createdAt: 1 });

  const totalAvailable = availableClaims.reduce((sum, claim) => {
    const payoutTotal = Number(claim.payout?.total) || 0;
    const withdrawnAmount = Number(claim.payout?.withdrawnAmount) || 0;
    return sum + Math.max(0, payoutTotal - withdrawnAmount);
  }, 0);

  if (amount > totalAvailable) {
    return res.status(400).json({
      message: "Insufficient balance",
      available: totalAvailable,
      requested: amount
    });
  }

  try {
    const { WorkerWithdrawal } = await import("../models/WorkerWithdrawal.js");
    const transferReference = `TRF-${req.user._id.toString().slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    let remaining = Number(amount);
    const touchedClaims = [];

    for (const claim of availableClaims) {
      if (remaining <= 0) {
        break;
      }

      const payoutTotal = Number(claim.payout?.total) || 0;
      const withdrawnAmount = Number(claim.payout?.withdrawnAmount) || 0;
      const claimAvailable = Math.max(0, payoutTotal - withdrawnAmount);

      if (claimAvailable <= 0) {
        continue;
      }

      const allocation = Math.min(remaining, claimAvailable);
      const nextWithdrawnAmount = withdrawnAmount + allocation;

      claim.payout = {
        ...claim.payout,
        withdrawnAmount: nextWithdrawnAmount,
        withdrawnAt: now,
        withdrawalId: undefined,
        status: nextWithdrawnAmount >= payoutTotal ? "WITHDRAWN" : "SUCCESS",
        message: `INR ${allocation} moved to withdrawal transfer ${transferReference}`
      };
      touchedClaims.push(claim);
      remaining -= allocation;
    }

    if (remaining > 0) {
      return res.status(400).json({
        message: "Insufficient balance after allocation",
        available: totalAvailable,
        requested: amount
      });
    }

    const withdrawal = new WorkerWithdrawal({
      user: req.user._id,
      amount: Number(amount),
      status: "COMPLETED",
      paymentMethod: "BANK_TRANSFER",
      transferReference,
      bankDetails: {
        accountHolderName: req.user.name || "Worker"
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      completedAt: now,
      notes: "Auto-settled payout from insurer-funded claim wallet"
    });

    withdrawal.razorpayDetails = {
      receiptId: transferReference
    };
    await withdrawal.save();
    for (const claim of touchedClaims) {
      claim.payout = {
        ...claim.payout,
        withdrawalId: withdrawal._id
      };
    }
    await Promise.all(touchedClaims.map((claim) => claim.save()));

    res.json({
      success: true,
      withdrawalId: withdrawal._id,
      amount: Number(amount),
      transferReference,
      paymentMethod: withdrawal.paymentMethod,
      status: withdrawal.status,
      completedAt: withdrawal.completedAt
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create withdrawal",
      error: error.message
    });
  }
});

export const verifyWithdrawal = asyncHandler(async (req, res) => {
  const { withdrawalId } = req.body;

  if (!withdrawalId) {
    return res.status(400).json({ message: "withdrawalId is required" });
  }

  const { WorkerWithdrawal } = await import("../models/WorkerWithdrawal.js");
  const withdrawal = await WorkerWithdrawal.findById(withdrawalId);

  if (!withdrawal || withdrawal.user.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: "Withdrawal not found" });
  }

  res.json({
    success: true,
    message: "Withdrawal is settled directly. No payment gateway verification is required.",
    withdrawalId: withdrawal._id,
    amount: withdrawal.amount,
    completedAt: withdrawal.completedAt,
    paymentMethod: withdrawal.paymentMethod,
    transferReference: withdrawal.transferReference
  });
});

export const getWithdrawalHistory = asyncHandler(async (req, res) => {
  const { WorkerWithdrawal } = await import("../models/WorkerWithdrawal.js");

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const withdrawals = await WorkerWithdrawal.find({
    user: req.user._id
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await WorkerWithdrawal.countDocuments({
    user: req.user._id
  });

  res.json({
    withdrawals,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
