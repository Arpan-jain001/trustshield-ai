import crypto from "crypto";
import { recordRequest } from "../services/metricsService.js";

export function observabilityMiddleware(req, res, next) {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    recordRequest({
      method: req.method,
      route: req.originalUrl || req.url,
      durationMs: Date.now() - started,
      statusCode: res.statusCode
    });
  });

  next();
}
