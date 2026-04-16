import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";
import claimRoutes from "./routes/claimRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import opsRoutes from "./routes/opsRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
import platformRoutes from "./routes/platformRoutes.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { observabilityMiddleware } from "./middleware/observabilityMiddleware.js";
import { auditMiddleware } from "./middleware/auditMiddleware.js";
import { rateLimitMiddleware, securityHeadersMiddleware } from "./middleware/securityMiddleware.js";
import { getRuntimeSnapshot } from "./services/runtimeService.js";

const app = express();
app.set("trust proxy", 1);

app.use(
  cors(
    env.clientUrl
      ? { origin: env.clientUrl, credentials: true }
      : { origin: true, credentials: true }
  )
);
app.use(securityHeadersMiddleware);
app.use(rateLimitMiddleware({ windowMs: 60_000, max: 180 }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(observabilityMiddleware);
app.use(auditMiddleware);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "TrustShield AI API",
    configWarnings: env.configWarnings,
    runtime: getRuntimeSnapshot()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/policy", policyRoutes);
app.use("/api/claim", claimRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/ops", opsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/platform", platformRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
