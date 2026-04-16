import { Router } from "express";
import {
  changePassword,
  getLiveContext,
  getNotifications,
  getProfile,
  getSettings,
  enqueueUserSignals,
  ingestUserSignals,
  requestSecondaryEmailOtp,
  updateProfile,
  updateSettings,
  verifySecondaryEmailOtp
} from "../controllers/userController.js";
import { requireActiveUser, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/profile", requireAuth, getProfile);
router.get("/notifications", requireAuth, requireActiveUser, getNotifications);
router.post("/live-context", requireAuth, requireActiveUser, getLiveContext);
router.post("/signals/ingest", requireAuth, requireActiveUser, ingestUserSignals);
router.post("/signals/queue", requireAuth, requireActiveUser, enqueueUserSignals);
router.get("/settings", requireAuth, getSettings);
router.put("/profile", requireAuth, updateProfile);
router.post("/secondary-email/request-otp", requireAuth, requestSecondaryEmailOtp);
router.post("/secondary-email/verify-otp", requireAuth, verifySecondaryEmailOtp);
router.put("/settings", requireAuth, updateSettings);
router.post("/change-password", requireAuth, changePassword);

export default router;
