import { writeAuditLog } from "../services/auditService.js";

function shouldAudit(req) {
  if (req.method === "GET" || req.method === "OPTIONS") return false;
  return req.originalUrl?.startsWith("/api/");
}

export function auditMiddleware(req, res, next) {
  const started = Date.now();

  res.on("finish", () => {
    if (!shouldAudit(req)) return;

    const actorUser = req.user?._id || null;
    const actorRole = req.user?.role || "PUBLIC";
    const actorEmail = req.user?.email || req.body?.email || "";

    writeAuditLog({
      requestId: req.requestId,
      actorUser,
      actorRole,
      actorEmail,
      method: req.method,
      route: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Date.now() - started,
      ipAddress: req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() || req.ip || "",
      userAgent: req.headers["user-agent"] || "",
      details: {
        accountType: req.user?.accountType || "",
        targetUserId: req.body?.userId || req.params?.userId || req.body?.jobId || ""
      }
    });
  });

  next();
}
