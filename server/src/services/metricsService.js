const metrics = {
  startedAt: new Date().toISOString(),
  requests: 0,
  errors: 0,
  routeStats: {},
  queue: {
    processed: 0,
    failed: 0
  }
};

export function recordRequest({ method, route, durationMs, statusCode }) {
  metrics.requests += 1;
  if (statusCode >= 400) {
    metrics.errors += 1;
  }

  const key = `${method} ${route}`;
  const current = metrics.routeStats[key] || { count: 0, totalDurationMs: 0, lastStatusCode: 200 };
  current.count += 1;
  current.totalDurationMs += durationMs;
  current.lastStatusCode = statusCode;
  metrics.routeStats[key] = current;
}

export function recordQueueResult({ success }) {
  if (success) metrics.queue.processed += 1;
  else metrics.queue.failed += 1;
}

export function getMetricsSnapshot() {
  return {
    ...metrics,
    routeStats: Object.entries(metrics.routeStats).map(([route, stat]) => ({
      route,
      count: stat.count,
      avgDurationMs: stat.count ? Math.round(stat.totalDurationMs / stat.count) : 0,
      lastStatusCode: stat.lastStatusCode
    }))
  };
}
