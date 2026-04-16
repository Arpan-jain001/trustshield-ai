import { asyncHandler } from "../utils/asyncHandler.js";
import { FeatureSnapshot } from "../models/FeatureSnapshot.js";
import { FraudGraphEdge } from "../models/FraudGraphEdge.js";
import { QueueJob } from "../models/QueueJob.js";
import { ModelArtifact } from "../models/ModelArtifact.js";
import { SystemAlert } from "../models/SystemAlert.js";
import { AuditLog } from "../models/AuditLog.js";
import { PlatformIncident } from "../models/PlatformIncident.js";
import { enqueueJob, processQueueBatch } from "../services/queueService.js";
import { rollbackLatestArtifacts } from "../services/mlService.js";
import { getMetricsSnapshot } from "../services/metricsService.js";
import { env } from "../config/env.js";
import { buildEnvironmentHealth } from "../utils/environmentHealth.js";

export const getPlatformDashboard = asyncHandler(async (req, res) => {
  const [featureSnapshots, graphEdges, queueJobs, artifacts, notifications, auditLogs, incidents] = await Promise.all([
    FeatureSnapshot.find().sort({ createdAt: -1 }).limit(20),
    FraudGraphEdge.find().sort({ createdAt: -1 }).limit(20),
    QueueJob.find().sort({ createdAt: -1 }).limit(20),
    ModelArtifact.find().sort({ createdAt: -1 }).limit(10),
    SystemAlert.find({
      $or: [{ audience: "GLOBAL" }, { user: req.user._id }]
    }).sort({ createdAt: -1 }).limit(10),
    AuditLog.find().sort({ createdAt: -1 }).limit(15),
    PlatformIncident.find().sort({ createdAt: -1 }).limit(12)
  ]);

  const environment = buildEnvironmentHealth({ queueJobs, incidents, auditLogs, artifacts, configWarnings: env.configWarnings });

  res.json({
    summary: {
      featureSnapshots: featureSnapshots.length,
      graphEdges: graphEdges.length,
      queuePending: queueJobs.filter((job) => job.status === "PENDING").length,
      queueFailed: queueJobs.filter((job) => job.status === "FAILED").length,
      artifacts: artifacts.length,
      auditEvents: auditLogs.length,
      openIncidents: incidents.filter((item) => item.status !== "RESOLVED").length
    },
    featureSnapshots,
    graphEdges,
    queueJobs,
    artifacts,
    notifications,
    auditLogs,
    incidents,
    metrics: getMetricsSnapshot(),
    environment
  });
});

export const rollbackPlatformModels = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before rolling back model artifacts" });
  }

  const rolledBack = await rollbackLatestArtifacts();
  if (!rolledBack.length) {
    return res.status(400).json({ message: "No archived model artifacts are available for rollback" });
  }

  res.json({
    message: "Latest model artifacts rolled back successfully",
    artifacts: rolledBack
  });
});

export const enqueueModelTrainingJob = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before queueing model training jobs" });
  }
  const job = await enqueueJob({
    type: "MODEL_TRAINING",
    payload: {
      requestedBy: req.user._id,
      requestedAt: new Date()
    }
  });

  res.status(201).json({ message: "Model training job queued successfully", job });
});

export const processPlatformQueue = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before processing queue batches" });
  }
  const limit = Math.max(1, Math.min(20, Number(req.body?.limit) || 5));
  await processQueueBatch(limit);
  const latestJobs = await QueueJob.find().sort({ createdAt: -1 }).limit(20);

  res.json({
    message: `Queue batch processed for ${limit} job slots`,
    queueJobs: latestJobs
  });
});

export const retryQueueJob = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before retrying queue jobs" });
  }
  const job = await QueueJob.findById(req.body?.jobId);
  if (!job) {
    return res.status(404).json({ message: "Queue job not found" });
  }

  job.status = "PENDING";
  job.lastError = "";
  job.processedAt = undefined;
  await job.save();

  res.json({ message: "Queue job moved back to pending", job });
});

export const replayQueueJob = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before replaying queue jobs" });
  }

  const sourceJob = await QueueJob.findById(req.body?.jobId);
  if (!sourceJob) {
    return res.status(404).json({ message: "Queue job not found" });
  }

  const replayedJob = await enqueueJob({
    type: sourceJob.type,
    payload: {
      ...sourceJob.payload,
      replayedFrom: sourceJob._id,
      replayedAt: new Date(),
      replayedBy: req.user._id
    }
  });

  res.status(201).json({ message: "Replay job enqueued successfully", job: replayedJob });
});

export const createPlatformIncident = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before creating incidents" });
  }

  const { title, description, severity } = req.body;
  if (!title?.trim()) {
    return res.status(400).json({ message: "Incident title is required" });
  }

  const incident = await PlatformIncident.create({
    title: title.trim(),
    description: `${description || ""}`.trim(),
    severity: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(severity) ? severity : "MEDIUM",
    createdBy: req.user._id
  });

  res.status(201).json({ message: "Incident created successfully", incident });
});

export const updatePlatformIncident = asyncHandler(async (req, res) => {
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Admin approval is required before updating incidents" });
  }

  const incident = await PlatformIncident.findById(req.params.incidentId);
  if (!incident) {
    return res.status(404).json({ message: "Incident not found" });
  }

  const { status } = req.body;
  if (!["ACKNOWLEDGED", "RESOLVED"].includes(status)) {
    return res.status(400).json({ message: "Incident status must be ACKNOWLEDGED or RESOLVED" });
  }

  incident.status = status;
  if (status === "ACKNOWLEDGED") {
    incident.acknowledgedBy = req.user._id;
    incident.acknowledgedAt = new Date();
  }
  if (status === "RESOLVED") {
    incident.resolvedBy = req.user._id;
    incident.resolvedAt = new Date();
  }
  await incident.save();

  res.json({ message: `Incident ${status.toLowerCase()} successfully`, incident });
});
