import { Router } from "express";
import { getOpsHealth, getOpsMetrics } from "../controllers/opsController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/health", requireAuth, requireAdmin, getOpsHealth);
router.get("/metrics", requireAuth, requireAdmin, getOpsMetrics);

export default router;
