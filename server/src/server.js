import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import app from "./app.js";
import { startDisruptionJob } from "./jobs/disruptionJob.js";
import { startStreamProcessorJob } from "./jobs/streamProcessorJob.js";
import { User } from "./models/User.js";

async function bootstrap() {
  await connectDb();

  const hasAdmin = env.adminEmail ? await User.findOne({ email: env.adminEmail }) : null;
  if (env.adminEmail && env.adminPassword && !hasAdmin) {
    await User.create({
      name: "Arpan Jain",
      email: env.adminEmail,
      password: env.adminPassword,
      location: "Delhi",
      workType: "OTHER",
      role: "ADMIN",
      status: "ACTIVE"
    });
  }

  const server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
    if (env.configWarnings.length) {
      console.warn(`Configuration warnings: ${env.configWarnings.join(" | ")}`);
    }
  });

  if (env.enableSchedulers) {
    startDisruptionJob();
    startStreamProcessorJob();
  } else {
    console.warn("Schedulers are disabled via ENABLE_SCHEDULERS=false");
  }

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  console.error("Bootstrap failed", error);
  process.exit(1);
});
