import { QueueJob } from "../models/QueueJob.js";
import { ModelArtifact } from "../models/ModelArtifact.js";
import { getMetricsSnapshot } from "../services/metricsService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AuditLog } from "../models/AuditLog.js";

export const getOpsHealth = asyncHandler(async (req, res) => {
  const [queuePending, queueFailed, artifacts, auditFailures] = await Promise.all([
    QueueJob.countDocuments({ status: "PENDING" }),
    QueueJob.countDocuments({ status: "FAILED" }),
    ModelArtifact.find().sort({ createdAt: -1 }).limit(5),
    AuditLog.countDocuments({ statusCode: { $gte: 400 }, createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) } })
  ]);

  res.json({
    status: "ok",
    queuePending,
    queueFailed,
    auditFailuresLast24h: auditFailures,
    latestArtifacts: artifacts.map((artifact) => ({
      name: artifact.name,
      version: artifact.version,
      trainedAt: artifact.metadata?.trainedAt || artifact.createdAt
    }))
  });
});

export const getOpsMetrics = asyncHandler(async (req, res) => {
  const [queue, auditLogs] = await Promise.all([
    QueueJob.find().sort({ createdAt: -1 }).limit(20),
    AuditLog.find().sort({ createdAt: -1 }).limit(25)
  ]);
  res.json({
    metrics: getMetricsSnapshot(),
    queue,
    auditLogs
  });
});
