import { Claim } from "../models/Claim.js";
import { ModelArtifact } from "../models/ModelArtifact.js";

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values, mean) {
  if (!values.length) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export async function trainModelArtifacts() {
  const claims = await Claim.find().sort({ createdAt: -1 }).limit(500);
  if (!claims.length) return null;

  await ModelArtifact.updateMany(
    {
      name: { $in: ["ISOLATION_FOREST_SURROGATE", "SEQUENCE_TRAJECTORY_MODEL", "RISK_BASELINE_MODEL"] },
      "metadata.status": "ACTIVE"
    },
    {
      $set: {
        "metadata.status": "ARCHIVED"
      }
    }
  );

  const fraudScores = claims.map((claim) => claim.fraud?.score || 0);
  const integrityScores = claims.map((claim) => claim.signalFusion?.integrityScore || 0);
  const anomalyScores = claims.map((claim) => claim.anomaly?.score || 0);
  const hoursLost = claims.map((claim) => claim.payout?.hoursLost || 0);
  const trainingWindow = `${claims[claims.length - 1]?.createdAt?.toISOString?.() || ""} -> ${claims[0]?.createdAt?.toISOString?.() || ""}`;
  const evaluation = {
    approvedRate: Number((claims.filter((claim) => claim.decision === "APPROVED").length / claims.length).toFixed(3)),
    reviewRate: Number((claims.filter((claim) => claim.decision === "NEEDS_REVIEW").length / claims.length).toFixed(3)),
    rejectedRate: Number((claims.filter((claim) => claim.decision === "REJECTED").length / claims.length).toFixed(3))
  };

  const isolationArtifact = await ModelArtifact.create({
    name: "ISOLATION_FOREST_SURROGATE",
    version: Date.now(),
    metadata: {
      sampleSize: claims.length,
      trainedAt: new Date(),
      notes: "Statistical baseline trained from live claim evidence.",
      status: "ACTIVE",
      promotedAt: new Date(),
      trainingWindow,
      evaluation
    },
    artifact: {
      fraudMean: average(fraudScores),
      fraudStdDev: standardDeviation(fraudScores, average(fraudScores)),
      anomalyMean: average(anomalyScores),
      anomalyStdDev: standardDeviation(anomalyScores, average(anomalyScores))
    }
  });

  const sequenceArtifact = await ModelArtifact.create({
    name: "SEQUENCE_TRAJECTORY_MODEL",
    version: Date.now() + 1,
    metadata: {
      sampleSize: claims.length,
      trainedAt: new Date(),
      notes: "Sequence-style baseline derived from motion and hours-lost trajectories.",
      status: "ACTIVE",
      promotedAt: new Date(),
      trainingWindow,
      evaluation
    },
    artifact: {
      integrityMean: average(integrityScores),
      integrityStdDev: standardDeviation(integrityScores, average(integrityScores)),
      hoursLostMean: average(hoursLost),
      hoursLostStdDev: standardDeviation(hoursLost, average(hoursLost))
    }
  });

  const riskArtifact = await ModelArtifact.create({
    name: "RISK_BASELINE_MODEL",
    version: Date.now() + 2,
    metadata: {
      sampleSize: claims.length,
      trainedAt: new Date(),
      notes: "Risk baseline for production heuristics.",
      status: "ACTIVE",
      promotedAt: new Date(),
      trainingWindow,
      evaluation
    },
    artifact: {
      approvedRate: evaluation.approvedRate,
      reviewRate: evaluation.reviewRate,
      rejectedRate: evaluation.rejectedRate
    }
  });

  return { isolationArtifact, sequenceArtifact, riskArtifact };
}

export async function getLatestModelArtifacts() {
  const artifacts = await ModelArtifact.find({
    name: {
      $in: ["ISOLATION_FOREST_SURROGATE", "SEQUENCE_TRAJECTORY_MODEL", "RISK_BASELINE_MODEL"]
    },
    "metadata.status": "ACTIVE"
  }).sort({ createdAt: -1 });

  const latest = {};
  for (const artifact of artifacts) {
    if (!latest[artifact.name]) {
      latest[artifact.name] = artifact;
    }
  }
  return latest;
}

export async function rollbackLatestArtifacts() {
  const artifactNames = ["ISOLATION_FOREST_SURROGATE", "SEQUENCE_TRAJECTORY_MODEL", "RISK_BASELINE_MODEL"];
  const rolledBack = [];

  for (const name of artifactNames) {
    const [active, previous] = await Promise.all([
      ModelArtifact.findOne({ name, "metadata.status": "ACTIVE" }).sort({ createdAt: -1 }),
      ModelArtifact.findOne({ name, "metadata.status": "ARCHIVED" }).sort({ createdAt: -1 })
    ]);

    if (!previous) continue;

    if (active) {
      active.metadata = {
        ...active.metadata,
        status: "ROLLED_BACK",
        rolledBackAt: new Date()
      };
      await active.save();
    }

    previous.metadata = {
      ...previous.metadata,
      status: "ACTIVE",
      promotedAt: new Date()
    };
    await previous.save();
    rolledBack.push(previous);
  }

  return rolledBack;
}

export async function scoreAgainstArtifacts({ fraudScore, anomalyScore, integrityScore, hoursLost }) {
  const artifacts = await getLatestModelArtifacts();
  const isolation = artifacts.ISOLATION_FOREST_SURROGATE?.artifact;
  const sequence = artifacts.SEQUENCE_TRAJECTORY_MODEL?.artifact;

  const isolationDeviation = isolation
    ? Math.abs(fraudScore - (isolation.fraudMean || 0)) / Math.max(1, isolation.fraudStdDev || 1)
    : 0;
  const anomalyDeviation = isolation
    ? Math.abs(anomalyScore - (isolation.anomalyMean || 0)) / Math.max(1, isolation.anomalyStdDev || 1)
    : 0;
  const trajectoryDeviation = sequence
    ? Math.abs(integrityScore - (sequence.integrityMean || 0)) / Math.max(1, sequence.integrityStdDev || 1) +
      Math.abs(hoursLost - (sequence.hoursLostMean || 0)) / Math.max(1, sequence.hoursLostStdDev || 1)
    : 0;

  return {
    isolationDeviation: Number(isolationDeviation.toFixed(2)),
    anomalyDeviation: Number(anomalyDeviation.toFixed(2)),
    trajectoryDeviation: Number(trajectoryDeviation.toFixed(2))
  };
}
