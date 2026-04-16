import { QueueJob } from "../models/QueueJob.js";
import { User } from "../models/User.js";
import { getDisruptionSignals } from "./triggerService.js";
import { ingestSignals } from "./ingestionService.js";
import { trainModelArtifacts } from "./mlService.js";
import { recordQueueResult } from "./metricsService.js";
import { Claim } from "../models/Claim.js";

export async function enqueueJob({ type, payload }) {
  return QueueJob.create({ type, payload });
}

export async function processQueueBatch(limit = 10) {
  const jobs = await QueueJob.find({ status: "PENDING" }).sort({ createdAt: 1 }).limit(limit);

  for (const job of jobs) {
    try {
      job.status = "PROCESSING";
      job.attempts += 1;
      await job.save();

      if (job.type === "SIGNAL_INGESTION") {
        const user = await User.findById(job.payload.userId);
        if (!user) {
          throw new Error("Queue target user not found");
        }
        const priorClaimCount = await Claim.countDocuments({
          user: user._id,
          createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) }
        });
        const trigger = await getDisruptionSignals(job.payload.location || user.location);
        await ingestSignals({
          user,
          trigger,
          ipAddress: job.payload.ipAddress,
          deviceFingerprint: job.payload.deviceFingerprint,
          signalPayload: job.payload.signalPayload || {},
          source: "SIGNAL_INGESTION",
          priorClaimCount
        });
      }

      if (job.type === "MODEL_TRAINING") {
        const artifacts = await trainModelArtifacts();
        job.result = {
          trainedArtifacts: artifacts
            ? Object.values(artifacts).map((artifact) => ({
                id: artifact._id,
                name: artifact.name,
                version: artifact.version
              }))
            : []
        };
      }

      job.status = "COMPLETED";
      job.processedAt = new Date();
      await job.save();
      recordQueueResult({ success: true });
    } catch (error) {
      job.status = "FAILED";
      job.lastError = error.message;
      await job.save();
      recordQueueResult({ success: false });
    }
  }
}
