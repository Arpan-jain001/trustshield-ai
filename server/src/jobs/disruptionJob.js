import cron from "node-cron";
import { User } from "../models/User.js";
import { autoCreateClaim } from "../services/claimService.js";
import { createScheduledTask } from "../utils/scheduledTask.js";

export function startDisruptionJob() {
  const runDisruptionSweep = createScheduledTask("disruption-sweep", async () => {
    const activeUsers = await User.find({ status: "ACTIVE", role: "USER" }).limit(20);
    for (const user of activeUsers) {
      await autoCreateClaim({
        user,
        ipAddress: user.lastLoginIp,
        deviceFingerprint: user.deviceFingerprint
      });
    }
  });

  cron.schedule("*/30 * * * *", runDisruptionSweep);
}
