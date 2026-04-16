import { Claim } from "../models/Claim.js";
import { Policy } from "../models/Policy.js";
import { createFraudAlertIfNeeded, evaluateFraud } from "./fraudService.js";
import { generateRiskAssessment } from "./aiService.js";
import { getDisruptionSignals } from "./triggerService.js";
import { deriveSignalAssessment, ingestSignals } from "./ingestionService.js";
import { getUserClusterInsights } from "./graphService.js";
import { scoreAgainstArtifacts } from "./mlService.js";
import { initiateInstantPayout } from "./paymentService.js";

function buildDecision({ aiRisk, fraud, anomaly, signalFusion }) {
  if (signalFusion.spoofRisk >= 78 || fraud.score >= 88) {
    return {
      decision: "REJECTED",
      decisionReason: "Signal spoofing and linked-account pressure exceeded automatic rejection threshold."
    };
  }

  if (fraud.score >= 65 || anomaly.score >= 50 || signalFusion.spoofRisk >= 45) {
    return {
      decision: "NEEDS_REVIEW",
      decisionReason: "Claim routed to soft verification because fraud or anomaly pressure is elevated."
    };
  }

  if (aiRisk.score <= 72) {
    return {
      decision: "APPROVED",
      decisionReason: "Low composite risk with acceptable signal integrity and no major fraud indicators."
    };
  }

  return {
    decision: "REJECTED",
    decisionReason: "Composite risk exceeded the safe automatic payout threshold."
  };
}

export async function autoCreateClaim({ user, ipAddress, deviceFingerprint, signalPayload = {}, manual = false }) {
  const policy = await Policy.findOne({ user: user._id, status: "ACTIVE" }).sort({ createdAt: -1 });
  if (!policy) {
    return null;
  }

  const trigger = await getDisruptionSignals(user.location);
  if (!trigger.shouldTrigger && !manual) {
    return null;
  }

  const recentDuplicate = await Claim.findOne({
    user: user._id,
    triggerType: manual ? "MANUAL_SIMULATION" : trigger.curfew ? "CURFEW" : trigger.aqi > 300 ? "AQI" : "RAIN",
    createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 12) }
  }).sort({ createdAt: -1 });
  if (recentDuplicate) {
    return recentDuplicate;
  }

  const priorClaimCount = await Claim.countDocuments({
    user: user._id,
    createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) }
  });

  const assessment = await deriveSignalAssessment({
    user,
    trigger,
    ipAddress,
    deviceFingerprint,
    signalPayload,
    priorClaimCount
  });
  const { signalFusion, anomaly } = assessment;
  const clusterInsights = await getUserClusterInsights(user._id);

  const aiRisk = await generateRiskAssessment({
    weatherRisk: Math.min(100, Math.round(trigger.rainfall * 0.65 + (trigger.curfew ? 18 : 0))),
    locationRisk: policy.riskScore,
    pastClaimsRisk: Math.min(95, priorClaimCount * 18),
    behaviorRisk: Math.max(12, 100 - signalFusion.consistencyScore),
    networkRisk: Math.min(95, Math.round(trigger.aqi / 3.2)),
    deviceRisk: Math.max(10, 100 - signalFusion.deviceConfidence),
    clusterRisk: Math.min(100, Math.round(clusterInsights.clusterRisk * 0.6 + anomaly.score * 0.25 + signalFusion.spoofRisk * 0.15))
  });

  const fraud = {
    ...(await evaluateFraud({ user, trigger, ipAddress, deviceFingerprint, signalFusion, anomaly })),
    providerId: policy.provider
  };
  const hoursLost = Math.min(policy.coverageHours, trigger.rainfall > 80 ? 6 : trigger.aqi > 300 ? 4 : 3);
  const modelEvidence = await scoreAgainstArtifacts({
    fraudScore: fraud.score,
    anomalyScore: anomaly.score,
    integrityScore: signalFusion.integrityScore,
    hoursLost
  });
  signalFusion.clusterRisk = clusterInsights.clusterRisk;
  signalFusion.anomalyScore = anomaly.score;
  signalFusion.flags = [...(signalFusion.flags || []), `Cluster ${clusterInsights.clusterId} size ${clusterInsights.clusterSize}`];
  const adjustedAiRisk = {
    ...aiRisk,
    score: Math.min(
      100,
      aiRisk.score + Math.round(modelEvidence.isolationDeviation * 4 + modelEvidence.trajectoryDeviation * 2 + modelEvidence.anomalyDeviation * 3)
    ),
    explanation: `${aiRisk.explanation} Model evidence: IF deviation ${modelEvidence.isolationDeviation}, sequence deviation ${modelEvidence.trajectoryDeviation}.`
  };
  const decisionState = buildDecision({
    aiRisk: adjustedAiRisk,
    fraud: {
      ...fraud,
      clusterId: clusterInsights.clusterId
    },
    anomaly,
    signalFusion
  });
  const payoutAmount = hoursLost * user.hourlyRate;
  const payoutResult =
    decisionState.decision === "APPROVED"
      ? await initiateInstantPayout({
          amount: payoutAmount,
          referenceId: `claim-${user._id.toString().slice(-8)}-${Date.now().toString().slice(-6)}`,
          notes: {
            workerId: user._id.toString(),
            reason: "AUTO_APPROVED_CLAIM"
          }
        })
      : null;
  const payout =
    decisionState.decision === "APPROVED"
      ? {
          hoursLost,
          hourlyRate: user.hourlyRate,
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
        }
      : {
          hoursLost,
          hourlyRate: user.hourlyRate,
          total: 0,
          status: "PENDING",
          currency: "INR"
        };

  const claim = await Claim.create({
    user: user._id,
    provider: policy.provider,
    providerName: policy.providerName,
    policy: policy._id,
    triggerType: manual ? "MANUAL_SIMULATION" : trigger.curfew ? "CURFEW" : trigger.aqi > 300 ? "AQI" : "RAIN",
    disruptionData: trigger,
    signalFusion,
    aiRisk: adjustedAiRisk,
    fraud,
    anomaly,
    decision: decisionState.decision,
    decisionReason: decisionState.decisionReason,
    review: {
      status: decisionState.decision === "NEEDS_REVIEW" ? "PENDING" : "NOT_REQUIRED"
    },
    payout
  });

  await ingestSignals({
    user,
    trigger,
    ipAddress,
    deviceFingerprint,
    signalPayload,
    claimId: claim._id,
    source: "CLAIM_PIPELINE",
    priorClaimCount,
    assessment
  });

  await createFraudAlertIfNeeded({ userId: user._id, claimId: claim._id, fraud });
  return claim;
}
