import { Claim } from "../models/Claim.js";
import { FraudAlert } from "../models/FraudAlert.js";
import { User } from "../models/User.js";

function buildClusterId(user, ipAddress, deviceFingerprint) {
  return [
    user.location?.toLowerCase().replace(/\s+/g, "-") || "unknown",
    (ipAddress || "no-ip").replace(/[:.]/g, "-"),
    (deviceFingerprint || "no-device").slice(0, 16)
  ].join(":");
}

export async function evaluateFraud({ user, trigger, ipAddress, deviceFingerprint, signalFusion, anomaly }) {
  const recentClaims = await Claim.find({
    user: user._id,
    createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) }
  });
  const recentWindow = new Date(Date.now() - 1000 * 60 * 60 * 24 * 21);
  const [sameIpUsers, sameDeviceUsers, linkedClaims] = await Promise.all([
    ipAddress ? User.find({ _id: { $ne: user._id }, lastLoginIp: ipAddress, role: "USER" }).select("_id email") : [],
    deviceFingerprint ? User.find({ _id: { $ne: user._id }, deviceFingerprint, role: "USER" }).select("_id email") : [],
    Claim.find({
      user: { $ne: user._id },
      createdAt: { $gte: recentWindow },
      "disruptionData.location": trigger.location
    }).select("_id decision createdAt")
  ]);

  const flags = [];
  const sharedSignals = [];
  let score = 12 + Math.round((signalFusion?.spoofRisk || 0) * 0.18) + Math.round((anomaly?.score || 0) * 0.12);

  if (recentClaims.length >= 3) {
    score += 35;
    flags.push("Unusual claim frequency in 14-day window");
  }

  if (user.lastLoginIp && ipAddress && user.lastLoginIp !== ipAddress) {
    score += 20;
    flags.push("IP mismatch against recent login");
  }

  if (user.deviceFingerprint && deviceFingerprint && user.deviceFingerprint !== deviceFingerprint) {
    score += 18;
    flags.push("Device fingerprint mismatch");
  }

  if (sameIpUsers.length) {
    score += 16 + sameIpUsers.length * 4;
    flags.push("Same IP observed across multiple worker accounts");
    sharedSignals.push(`${sameIpUsers.length + 1} accounts share this IP`);
  }

  if (sameDeviceUsers.length) {
    score += 20 + sameDeviceUsers.length * 6;
    flags.push("Same device fingerprint linked with multiple accounts");
    sharedSignals.push(`${sameDeviceUsers.length + 1} accounts share this device fingerprint`);
  }

  if (linkedClaims.length >= 3) {
    score += 14;
    flags.push("Synchronized claim pattern observed in the same area");
    sharedSignals.push(`${linkedClaims.length} nearby claims in the last 21 days`);
  }

  if (trigger.location && user.location.toLowerCase() !== trigger.location.toLowerCase()) {
    score += 20;
    flags.push("Location mismatch across policy and disruption source");
  }

  if ((signalFusion?.flags || []).length) {
    flags.push(...signalFusion.flags);
  }

  if (trigger.aqi > 350 || trigger.rainfall > 120) {
    score -= 6;
  }

  score = Math.max(0, Math.min(100, score));
  const linkedAccounts = new Set([...sameIpUsers.map((account) => account._id.toString()), ...sameDeviceUsers.map((account) => account._id.toString())]).size;

  return {
    score,
    flags,
    linkedAccounts,
    sharedSignals,
    clusterId: buildClusterId(user, ipAddress, deviceFingerprint)
  };
}

export async function createFraudAlertIfNeeded({ userId, claimId, fraud }) {
  if (fraud.score < 65) return null;

  return FraudAlert.create({
    user: userId,
    provider: fraud.providerId,
    claim: claimId,
    score: fraud.score,
    flags: fraud.flags,
    linkedAccounts: fraud.linkedAccounts,
    clusterId: fraud.clusterId,
    sharedSignals: fraud.sharedSignals
  });
}
