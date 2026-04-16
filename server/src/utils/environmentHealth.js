export function buildEnvironmentHealth({ queueJobs = [], incidents = [], auditLogs = [], artifacts = [], configWarnings = [] } = {}) {
  const failedJobs = queueJobs.filter((job) => job.status === "FAILED").length;
  const openIncidents = incidents.filter((incident) => incident.status !== "RESOLVED").length;
  const auditFailures = auditLogs.filter((item) => Number(item.statusCode) >= 400).length;
  const activeArtifacts = artifacts.filter((artifact) => artifact.metadata?.status === "ACTIVE").length;

  const postureScore = Math.max(
    0,
    100 - failedJobs * 8 - openIncidents * 12 - auditFailures * 2 + Math.min(15, activeArtifacts * 3)
  );

  return {
    status: postureScore >= 75 ? "HEALTHY" : postureScore >= 50 ? "WATCH" : "DEGRADED",
    postureScore,
    failedJobs,
    openIncidents,
    auditFailures,
    activeArtifacts,
    configWarnings
  };
}
