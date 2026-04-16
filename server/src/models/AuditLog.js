import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    requestId: { type: String, index: true },
    actorUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorRole: { type: String, default: "PUBLIC" },
    actorEmail: { type: String, default: "" },
    method: { type: String, required: true },
    route: { type: String, required: true },
    statusCode: { type: Number, required: true },
    durationMs: { type: Number, default: 0 },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    details: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
