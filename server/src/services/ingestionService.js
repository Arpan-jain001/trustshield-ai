import { FeatureSnapshot } from "../models/FeatureSnapshot.js";
import { FraudGraphEdge } from "../models/FraudGraphEdge.js";
import { collectVerificationSignals, evaluateAnomaly } from "./signalService.js";

async function upsertEdge({ userId, providerId, claimId, edgeType, value, weight = 1, metadata = {} }) {
  if (!value) return;

  const existing = await FraudGraphEdge.findOne({ user: userId, edgeType, value, claim: claimId || null });
  if (existing) {
    existing.weight += weight;
    existing.metadata = {
      ...existing.metadata,
      ...metadata
    };
    await existing.save();
    return existing;
  }

  return FraudGraphEdge.create({
    user: userId,
    provider: providerId,
    claim: claimId || undefined,
    edgeType,
    value,
    weight,
    metadata
  });
}

export async function deriveSignalAssessment({ user, trigger, ipAddress, deviceFingerprint, signalPayload = {}, priorClaimCount = 0 }) {
  const signalFusion = await collectVerificationSignals({
    user,
    trigger,
    ipAddress,
    deviceFingerprint,
    signalPayload
  });
  const anomaly = evaluateAnomaly({ trigger, signalFusion, priorClaimCount });

  return { signalFusion, anomaly };
}

export async function ingestSignals({
  user,
  trigger,
  ipAddress,
  deviceFingerprint,
  signalPayload = {},
  claimId = null,
  source = "SIGNAL_INGESTION",
  priorClaimCount = 0,
  assessment
}) {
  const computedAssessment =
    assessment ||
    (await deriveSignalAssessment({
      user,
      trigger,
      ipAddress,
      deviceFingerprint,
      signalPayload,
      priorClaimCount
    }));
  const { signalFusion, anomaly } = computedAssessment;

  const snapshot = await FeatureSnapshot.create({
    user: user._id,
    provider: user.linkedProvider,
    claim: claimId || undefined,
    source,
    rawSignals: {
      location: trigger.location,
      rainfall: trigger.rainfall,
      aqi: trigger.aqi,
      curfew: trigger.curfew,
      networkLatencyMs: signalFusion.details.latencyMs,
      speedKph: signalFusion.details.speedKph,
      sensorMotion: signalFusion.details.sensorMotion,
      trafficContext: signalFusion.details.trafficContext,
      gpsCoordinates: signalPayload.gpsCoordinates,
      cellTowerCoordinates: signalPayload.cellTowerCoordinates,
      ipCoordinates: signalPayload.ipCoordinates
    },
    derivedFeatures: {
      integrityScore: signalFusion.integrityScore,
      spoofRisk: signalFusion.spoofRisk,
      consistencyScore: signalFusion.consistencyScore,
      locationConfidence: signalFusion.locationConfidence,
      motionConfidence: signalFusion.motionConfidence,
      networkConfidence: signalFusion.networkConfidence,
      deviceConfidence: signalFusion.deviceConfidence,
      anomalyScore: anomaly.score,
      anomalyVerdict: anomaly.verdict,
      flags: [...signalFusion.flags, ...anomaly.reasons]
    }
  });

  await Promise.all([
    upsertEdge({
      userId: user._id,
      providerId: user.linkedProvider,
      claimId,
      edgeType: "IP",
      value: ipAddress || "unknown-ip",
      metadata: { signalCount: 1 }
    }),
    upsertEdge({
      userId: user._id,
      providerId: user.linkedProvider,
      claimId,
      edgeType: "DEVICE",
      value: deviceFingerprint || user.deviceFingerprint || "unknown-device",
      metadata: { signalCount: 1 }
    }),
    upsertEdge({
      userId: user._id,
      providerId: user.linkedProvider,
      claimId,
      edgeType: "LOCATION_CLUSTER",
      value: trigger.location?.toLowerCase().replace(/\s+/g, "-") || "unknown-location",
      metadata: { note: trigger.source || "signal-source" }
    }),
    upsertEdge({
      userId: user._id,
      providerId: user.linkedProvider,
      claimId,
      edgeType: "CLAIM_CLUSTER",
      value: `${trigger.location?.toLowerCase().replace(/\s+/g, "-") || "unknown"}:${trigger.curfew ? "curfew" : trigger.aqi > 300 ? "aqi" : "rain"}`,
      metadata: { note: "Derived from disruption trigger cluster" }
    })
  ]);

  return { signalFusion, anomaly, snapshot };
}
