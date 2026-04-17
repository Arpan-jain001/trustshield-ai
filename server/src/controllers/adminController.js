import { User } from "../models/User.js";
import { Claim } from "../models/Claim.js";
import { FraudAlert } from "../models/FraudAlert.js";
import { Policy } from "../models/Policy.js";
import { SystemAlert } from "../models/SystemAlert.js";
import { FeatureSnapshot } from "../models/FeatureSnapshot.js";
import { FraudGraphEdge } from "../models/FraudGraphEdge.js";
import { Feedback } from "../models/Feedback.js";
import { ProviderProfile } from "../models/ProviderProfile.js";
import { ProviderReserveLedger } from "../models/ProviderReserveLedger.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { initiateInstantPayout } from "../services/paymentService.js";
import { sendEmail, buildAdminInviteEmail, buildAdminRemovalEmail, buildNotificationEmail, buildStatusEmail } from "../services/mailService.js";

function generateTemporaryPassword(length = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function applyStatus({ userId, admin, actionType, status, reason }) {
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  const defaultReasonMap = {
    ACTIVE: "Your account has been reviewed and approved by admin.",
    REJECTED: "Your account could not be approved during admin review.",
    SUSPENDED: "Your account has been suspended by admin.",
    BANNED: "Your account has been banned by admin."
  };
  const resolvedReason = (reason || defaultReasonMap[status] || "").trim();

  user.status = status;
  user.statusReason = resolvedReason;
  user.adminActions.push({
    actionType,
    reason: resolvedReason,
    performedBy: admin._id,
    timestamp: new Date()
  });

  await user.save();

  await SystemAlert.create({
    user: user._id,
    audience: "USER",
    title: `Account ${status}`,
    message: resolvedReason || "Your account status has been updated by admin.",
    severity: status === "ACTIVE" ? "INFO" : status === "REJECTED" ? "WARN" : "CRITICAL",
    createdBy: admin._id,
    emailSent: true
  });

  await sendEmail({
    to: user.email,
    subject: `TrustShield AI account ${status.toLowerCase()}`,
    html: buildStatusEmail(user.name, `Account ${status}`, resolvedReason || "Your account status has been updated by admin.")
  });

  return user;
}

export const getUsers = asyncHandler(async (req, res) => {
  const [users, admins, stats, fraudAlerts, claims, notifications, feedback] = await Promise.all([
    User.find({ role: "USER" }).sort({ createdAt: -1 }),
    User.find({ role: "ADMIN" }).sort({ createdAt: -1 }),
    User.aggregate([
      { $match: { role: "USER" } },
      { $group: { _id: "$status", total: { $sum: 1 } } }
    ]),
    FraudAlert.find({ status: "OPEN" }).populate("user claim").sort({ createdAt: -1 }),
    Claim.find()
      .populate("user", "name email accountType")
      .populate("provider", "name organizationName accountType")
      .populate("review.reviewedBy", "name role accountType organizationName")
      .populate("review.requestedBy", "name role accountType organizationName")
      .sort({ createdAt: -1 })
      .limit(12),
    SystemAlert.find().populate("user createdBy").sort({ createdAt: -1 }).limit(8),
    Feedback.find().populate("user reviewedBy").sort({ createdAt: -1 }).limit(8)
  ]);

  const policyCount = await Policy.countDocuments();
  const reviewClaims = claims.filter((claim) => claim.review?.status === "PENDING");
  res.json({ users, admins, stats, fraudAlerts, claims, reviewClaims, notifications, feedback, policyCount });
});

export const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const [claims, policies, alerts, featureSnapshots, graphEdges] = await Promise.all([
    Claim.find({ user: user._id }).populate("provider", "name organizationName accountType").sort({ createdAt: -1 }).limit(20),
    Policy.find({ user: user._id }).populate("provider", "name organizationName accountType").sort({ createdAt: -1 }).limit(10),
    SystemAlert.find({
      $or: [{ audience: "GLOBAL" }, { user: user._id }]
    }).sort({ createdAt: -1 }).limit(10),
    FeatureSnapshot.find({ user: user._id }).sort({ createdAt: -1 }).limit(10),
    FraudGraphEdge.find({ user: user._id }).sort({ createdAt: -1 }).limit(12)
  ]);

  res.json({
    user,
    claims,
    policies,
    alerts,
    featureSnapshots,
    graphEdges
  });
});

export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ message: "Invalid admin name" });
  }
  if (!/^\S+@\S+\.\S+$/.test(email || "")) {
    return res.status(400).json({ message: "Invalid email" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Admin email already exists" });
  }

  const password = generateTemporaryPassword();
  const adminUser = await User.create({
    name,
    email,
    password,
    location: "Delhi",
    workType: "OTHER",
    role: "ADMIN",
    accountType: "PLATFORM",
    organizationName: "TrustShield AI",
    status: "ACTIVE"
  });

  await sendEmail({
    to: adminUser.email,
    subject: "TrustShield AI admin credentials",
    html: buildAdminInviteEmail({
      name: adminUser.name,
      email: adminUser.email,
      password,
      supportEmail: env.supportEmail
    })
  });

  res.status(201).json({
    message: "Admin created successfully and credentials emailed.",
    admin: {
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      status: adminUser.status
    }
  });
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  const { adminId, reason } = req.body;

  if (!reason?.trim()) {
    return res.status(400).json({ message: "Reason is required for permanent admin deletion" });
  }

  const adminUser = await User.findById(adminId);
  if (!adminUser || adminUser.role !== "ADMIN") {
    return res.status(404).json({ message: "Admin not found" });
  }

  if (adminUser._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: "You cannot delete your own admin account" });
  }

  await sendEmail({
    to: adminUser.email,
    subject: "TrustShield AI admin access removed",
    html: buildAdminRemovalEmail({
      name: adminUser.name,
      reason,
      supportEmail: env.supportEmail
    })
  });

  await User.deleteOne({ _id: adminUser._id });

  res.json({ message: "Admin deleted permanently" });
});

export const sendNotification = asyncHandler(async (req, res) => {
  const { title, message, severity = "INFO", audience = "GLOBAL", userId, sendEmailToUser = false } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ message: "Notification title is required" });
  }
  if (!message?.trim()) {
    return res.status(400).json({ message: "Notification message is required" });
  }

  const normalizedSeverity = ["INFO", "WARN", "CRITICAL"].includes(severity) ? severity : "INFO";

  if (audience === "USER") {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found for notification" });
    }

    const alert = await SystemAlert.create({
      user: user._id,
      audience: "USER",
      title,
      message,
      severity: normalizedSeverity,
      createdBy: req.user._id,
      emailSent: Boolean(sendEmailToUser)
    });

    if (sendEmailToUser) {
      await sendEmail({
        to: user.email,
        subject: `TrustShield AI: ${title}`,
        html: buildNotificationEmail({
          name: user.name,
          title,
          message,
          supportEmail: env.supportEmail
        })
      });
    }

    return res.status(201).json({ message: "User notification sent successfully", alert });
  }

  const activeUsers = await User.find({ role: "USER" });
  const alerts = await SystemAlert.insertMany(
    activeUsers.map((user) => ({
      user: user._id,
      audience: "GLOBAL",
      title,
      message,
      severity: normalizedSeverity,
      createdBy: req.user._id,
      emailSent: Boolean(sendEmailToUser)
    }))
  );

  if (sendEmailToUser) {
    await Promise.all(
      activeUsers.map((user) =>
        sendEmail({
          to: user.email,
          subject: `TrustShield AI: ${title}`,
          html: buildNotificationEmail({
            name: user.name,
            title,
            message,
            supportEmail: env.supportEmail
          })
        })
      )
    );
  }

  res.status(201).json({ message: "Global notification broadcast completed", count: alerts.length });
});

export const verifyUser = asyncHandler(async (req, res) => {
  const user = await applyStatus({
    userId: req.body.userId,
    admin: req.user,
    actionType: "VERIFY",
    status: "ACTIVE",
    reason: req.body.reason || "Admin has verified your account. Full dashboard access is now unlocked."
  });
  res.json({ user });
});

export const rejectUser = asyncHandler(async (req, res) => {
  const user = await applyStatus({
    userId: req.body.userId,
    admin: req.user,
    actionType: "REJECT",
    status: "REJECTED",
    reason: req.body.reason || "Verification requirements were not met."
  });
  res.json({ user });
});

export const suspendUser = asyncHandler(async (req, res) => {
  if (!req.body.reason) {
    return res.status(400).json({ message: "Reason is required for suspension" });
  }

  const user = await applyStatus({
    userId: req.body.userId,
    admin: req.user,
    actionType: "SUSPEND",
    status: "SUSPENDED",
    reason: req.body.reason
  });
  res.json({ user });
});

export const banUser = asyncHandler(async (req, res) => {
  if (!req.body.reason) {
    return res.status(400).json({ message: "Reason is required for ban" });
  }

  const user = await applyStatus({
    userId: req.body.userId,
    admin: req.user,
    actionType: "BAN",
    status: "BANNED",
    reason: req.body.reason
  });
  res.json({ user });
});

export const reviewClaim = asyncHandler(async (req, res) => {
  const { claimId, action, notes } = req.body;
  if (!["APPROVE", "REJECT"].includes(action)) {
    return res.status(400).json({ message: "Invalid review action" });
  }

  const claim = await Claim.findById(claimId).populate("user");
  if (!claim) {
    return res.status(404).json({ message: "Claim not found" });
  }

  claim.review = {
    status: action === "APPROVE" ? "APPROVED" : "REJECTED",
    notes: notes?.trim() || "",
    reviewedBy: req.user._id,
    reviewedAt: new Date()
  };
  claim.decision = action === "APPROVE" ? "APPROVED" : "REJECTED";
  claim.decisionSource = "ADMIN_REVIEW";
  claim.decisionReason =
    action === "APPROVE"
      ? notes?.trim() || "Admin approved the claim after manual review."
      : notes?.trim() || "Admin rejected the claim after manual review.";

  if (action === "APPROVE") {
    const payoutAmount = Math.max(
      0,
      Number(claim.payout?.total) ||
        Number(claim.policy?.claimCoverage) ||
        (Number(claim.payout?.hoursLost) || 0) * (Number(claim.payout?.hourlyRate) || Number(claim.user?.hourlyRate) || 0)
    );
    const payoutResult = await initiateInstantPayout({
      amount: payoutAmount,
      referenceId: `admin-claim-${claim._id.toString().slice(-10)}`,
      notes: {
        claimId: claim._id.toString(),
        reviewer: req.user._id.toString(),
        path: "ADMIN_REVIEW"
      }
    });
    if (claim.provider && payoutAmount > 0) {
      const providerProfile = await ProviderProfile.findOne({ user: claim.provider });
      if (providerProfile) {
        providerProfile.reservePool = Math.max(0, providerProfile.reservePool - payoutAmount);
        providerProfile.availableLiquidity = Math.max(0, providerProfile.availableLiquidity - payoutAmount);
        await providerProfile.save();

        await ProviderReserveLedger.create({
          provider: claim.provider,
          entryType: "PAYOUT_SETTLED",
          amount: payoutAmount,
          note: `Admin approved claim ${claim._id}`,
          balanceAfter: providerProfile.availableLiquidity,
          createdBy: req.user._id
        });
      }
    }
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
    claim.payout = {
      ...claim.payout,
      total: 0,
      status: "FAILED",
      message: "Claim rejected in manual review"
    };
  }

  await claim.save();

  if (claim.user?.email) {
    await sendEmail({
      to: claim.user.email,
      subject: `TrustShield AI claim ${action === "APPROVE" ? "approved" : "rejected"} after review`,
      html: buildStatusEmail(
        claim.user.name,
        `Claim ${action === "APPROVE" ? "Approved" : "Rejected"}`,
        claim.decisionReason
      )
    });
  }

  res.json({ message: "Claim review completed", claim });
});

export const resolveFraudAlert = asyncHandler(async (req, res) => {
  const { alertId, reason } = req.body;
  if (!reason?.trim()) {
    return res.status(400).json({ message: "Resolution reason is required" });
  }

  const alert = await FraudAlert.findById(alertId);
  if (!alert) {
    return res.status(404).json({ message: "Fraud alert not found" });
  }

  alert.status = "RESOLVED";
  alert.resolution = {
    reason: reason.trim(),
    resolvedBy: req.user._id,
    resolvedAt: new Date()
  };
  await alert.save();

  res.json({ message: "Fraud alert resolved", alert });
});

export const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { feedbackId, status, resolutionNote } = req.body;

  if (!["NEW", "IN_REVIEW", "RESOLVED"].includes(status)) {
    return res.status(400).json({ message: "Invalid feedback status" });
  }

  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    return res.status(404).json({ message: "Feedback not found" });
  }

  feedback.status = status;
  feedback.resolutionNote = (resolutionNote || "").trim();
  feedback.reviewedBy = req.user._id;
  feedback.reviewedAt = new Date();
  await feedback.save();

  res.json({ message: "Feedback status updated", feedback });
});

export const deleteFeedback = asyncHandler(async (req, res) => {
  const { feedbackId } = req.params;

  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    return res.status(404).json({ message: "Feedback not found" });
  }

  await Feedback.deleteOne({ _id: feedback._id });
  res.json({ message: "Feedback deleted permanently" });
});

export const getAllWithdrawals = asyncHandler(async (req, res) => {
  const { WorkerWithdrawal } = await import("../models/WorkerWithdrawal.js");

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const status = req.query.status;
  const userId = req.query.userId;

  let query = {};
  if (status) query.status = status;
  if (userId) query.user = userId;

  const withdrawals = await WorkerWithdrawal.find(query)
    .populate("user", "name email mobileNumber accountType")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await WorkerWithdrawal.countDocuments(query);

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

export const getWithdrawalStats = asyncHandler(async (req, res) => {
  const { WorkerWithdrawal } = await import("../models/WorkerWithdrawal.js");

  const stats = await WorkerWithdrawal.aggregate([
    {
      $facet: {
        byStatus: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              total: { $sum: "$amount" }
            }
          }
        ],
        overall: [
          {
            $group: {
              _id: null,
              totalWithdrawals: { $sum: 1 },
              totalAmount: { $sum: "$amount" },
              completedCount: {
                $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
              },
              completedAmount: {
                $sum: {
                  $cond: [{ $eq: ["$status", "COMPLETED"] }, "$amount", 0]
                }
              },
              pendingCount: {
                $sum: { $cond: [{ $eq: ["$status", "INITIATED"] }, 1, 0] }
              },
              failedCount: {
                $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] }
              }
            }
          }
        ],
        recentTransactions: [
          {
            $sort: { createdAt: -1 }
          },
          {
            $limit: 10
          },
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "userDetails"
            }
          },
          {
            $unwind: "$userDetails"
          },
          {
            $project: {
              _id: 1,
              amount: 1,
              status: 1,
              createdAt: 1,
              userName: "$userDetails.name",
              userEmail: "$userDetails.email",
              userPhone: "$userDetails.mobileNumber"
            }
          }
        ]
      }
    }
  ]);

  const [byStatus] = stats[0].byStatus;
  const [overall] = stats[0].overall;
  const recentTransactions = stats[0].recentTransactions;

  res.json({
    overall,
    byStatus,
    recentTransactions
  });
});

export const getWithdrawalDetails = asyncHandler(async (req, res) => {
  const { withdrawalId } = req.params;
  const { WorkerWithdrawal } = await import("../models/WorkerWithdrawal.js");

  const withdrawal = await WorkerWithdrawal.findById(withdrawalId).populate(
    "user",
    "name email mobileNumber accountType organizationName"
  );

  if (!withdrawal) {
    return res.status(404).json({ message: "Withdrawal not found" });
  }

  res.json(withdrawal);
});
