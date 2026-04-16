import { getRuntimeSnapshot, markSchedulerState } from "../services/runtimeService.js";

function readSchedulerMetric(name, key) {
  return getRuntimeSnapshot().schedulers.find((item) => item.name === name)?.[key] || 0;
}

export function createScheduledTask(name, handler) {
  let running = false;
  markSchedulerState(name, {});

  return async function runScheduledTask() {
    if (running) {
      markSchedulerState(name, {
        skippedOverlaps: readSchedulerMetric(name, "skippedOverlaps") + 1
      });
      return { skipped: true };
    }

    running = true;
    markSchedulerState(name, {
      running: true,
      runs: readSchedulerMetric(name, "runs") + 1,
      lastStartedAt: new Date(),
      lastError: ""
    });

    try {
      await handler();
      markSchedulerState(name, {
        running: false,
        lastCompletedAt: new Date()
      });
      return { skipped: false };
    } catch (error) {
      markSchedulerState(name, {
        running: false,
        failures: readSchedulerMetric(name, "failures") + 1,
        lastFailedAt: new Date(),
        lastError: error.message
      });
      throw error;
    } finally {
      running = false;
    }
  };
}
