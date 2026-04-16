import test from "node:test";
import assert from "node:assert/strict";
import { buildEnvironmentHealth } from "./environmentHealth.js";

test("buildEnvironmentHealth reports healthy posture for low pressure", () => {
  const result = buildEnvironmentHealth({
    queueJobs: [{ status: "PENDING" }],
    incidents: [{ status: "RESOLVED" }],
    auditLogs: [{ statusCode: 200 }],
    artifacts: [{ metadata: { status: "ACTIVE" } }, { metadata: { status: "ACTIVE" } }]
  });

  assert.equal(result.status, "HEALTHY");
  assert.equal(result.failedJobs, 0);
  assert.equal(result.openIncidents, 0);
});

test("buildEnvironmentHealth degrades under failures and incidents", () => {
  const result = buildEnvironmentHealth({
    queueJobs: [{ status: "FAILED" }, { status: "FAILED" }, { status: "PENDING" }],
    incidents: [{ status: "OPEN" }, { status: "ACKNOWLEDGED" }],
    auditLogs: [{ statusCode: 500 }, { statusCode: 403 }],
    artifacts: []
  });

  assert.equal(result.failedJobs, 2);
  assert.equal(result.openIncidents, 2);
  assert.equal(result.auditFailures, 2);
  assert.equal(result.status, "WATCH");
});
