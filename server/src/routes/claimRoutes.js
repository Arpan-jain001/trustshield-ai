import { Router } from "express";
import { createClaim, getClaimHistory, getClaimPaymentConfig, requestManualClaimReview, verifyClaimPayment, preTriggerAnalysis } from "../controllers/claimController.js";
import { requireActiveUser, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/create", requireAuth, requireActiveUser, createClaim);
router.post("/pre-trigger-analysis", requireAuth, requireActiveUser, preTriggerAnalysis);
router.get("/history", requireAuth, requireActiveUser, getClaimHistory);
router.post("/manual-review", requireAuth, requireActiveUser, requestManualClaimReview);
router.get("/payment/config", requireAuth, requireActiveUser, getClaimPaymentConfig);
router.post("/payment/verify", requireAuth, requireActiveUser, verifyClaimPayment);

export default router;
