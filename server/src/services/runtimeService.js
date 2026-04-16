const runtimeState = {
  schedulers: {}
};

export function markSchedulerState(name, patch) {
  runtimeState.schedulers[name] = {
    name,
    running: false,
    runs: 0,
    failures: 0,
    skippedOverlaps: 0,
    lastStartedAt: null,
    lastCompletedAt: null,
    lastFailedAt: null,
    lastError: "",
    ...(runtimeState.schedulers[name] || {}),
    ...patch
  };
}

export function getRuntimeSnapshot() {
  return {
    schedulers: Object.values(runtimeState.schedulers)
  };
}
