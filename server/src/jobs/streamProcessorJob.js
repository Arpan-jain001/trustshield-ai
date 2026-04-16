import cron from "node-cron";
import { processQueueBatch } from "../services/queueService.js";
import { enqueueJob } from "../services/queueService.js";
import { createScheduledTask } from "../utils/scheduledTask.js";

export function startStreamProcessorJob() {
  const runQueueProcessor = createScheduledTask("queue-processor", async () => {
    await processQueueBatch(20);
  });

  const runTrainingScheduler = createScheduledTask("scheduled-model-training", async () => {
    await enqueueJob({
      type: "MODEL_TRAINING",
      payload: { scheduled: true }
    });
  });

  cron.schedule("*/2 * * * *", runQueueProcessor);
  cron.schedule("0 * * * *", runTrainingScheduler);
}
