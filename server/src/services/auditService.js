import { AuditLog } from "../models/AuditLog.js";

export async function writeAuditLog(entry) {
  try {
    await AuditLog.create(entry);
  } catch {
    // Avoid breaking product flows because of observability failures.
  }
}
