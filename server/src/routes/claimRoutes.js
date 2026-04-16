import { Router } from "express";
import { createClaim, getClaimHistory, getClaimPaymentConfig, verifyClaimPayment } from "../controllers/claimController.js";
import { requireActiveUser, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/create", requireAuth, requireActiveUser, createClaim);
router.get("/history", requireAuth, requireActiveUser, getClaimHistory);
router.get("/payment/config", requireAuth, requireActiveUser, getClaimPaymentConfig);
router.post("/payment/verify", requireAuth, requireActiveUser, verifyClaimPayment);

export default router;
