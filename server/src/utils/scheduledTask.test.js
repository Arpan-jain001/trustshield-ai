import test from "node:test";
import assert from "node:assert/strict";
import { createScheduledTask } from "./scheduledTask.js";
import { getRuntimeSnapshot } from "../services/runtimeService.js";

test("createScheduledTask records successful runs", async () => {
  const task = createScheduledTask("test-success-task", async () => {});
  const result = await task();

  const snapshot = getRuntimeSnapshot().schedulers.find((item) => item.name === "test-success-task");
  assert.equal(result.skipped, false);
  assert.equal(snapshot.runs >= 1, true);
  assert.equal(snapshot.failures, 0);
});

test("createScheduledTask skips overlapping runs", async () => {
  let release;
  const blocker = new Promise((resolve) => {
    release = resolve;
  });

  const task = createScheduledTask("test-overlap-task", async () => {
    await blocker;
  });

  const firstRun = task();
  const secondRun = await task();
  release();
  await firstRun;

  const snapshot = getRuntimeSnapshot().schedulers.find((item) => item.name === "test-overlap-task");
  assert.equal(secondRun.skipped, true);
  assert.equal(snapshot.skippedOverlaps >= 1, true);
});
