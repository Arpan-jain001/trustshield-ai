import { Router } from "express";
import {
  createPlatformIncident,
  enqueueModelTrainingJob,
  getPlatformDashboard,
  processPlatformQueue,
  replayQueueJob,
  retryQueueJob,
  rollbackPlatformModels,
  updatePlatformIncident
} from "../controllers/platformController.js";
import { requireAccountType, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/dashboard", requireAuth, requireAccountType("PLATFORM"), getPlatformDashboard);
router.post("/queue/process", requireAuth, requireAccountType("PLATFORM"), processPlatformQueue);
router.post("/queue/retry", requireAuth, requireAccountType("PLATFORM"), retryQueueJob);
router.post("/queue/replay", requireAuth, requireAccountType("PLATFORM"), replayQueueJob);
router.post("/models/train", requireAuth, requireAccountType("PLATFORM"), enqueueModelTrainingJob);
router.post("/models/rollback", requireAuth, requireAccountType("PLATFORM"), rollbackPlatformModels);
router.post("/incidents", requireAuth, requireAccountType("PLATFORM"), createPlatformIncident);
router.put("/incidents/:incidentId", requireAuth, requireAccountType("PLATFORM"), updatePlatformIncident);

export default router;
