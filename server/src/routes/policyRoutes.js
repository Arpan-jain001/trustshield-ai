import { Router } from "express";
import {
  createPolicy,
  getUserPolicy,
  getPolicyTiers,
  getUserActiveTierPolicy,
  purchaseTierPolicy,
  verifyTierPolicyPayment,
  renewTierPolicy,
  cancelTierPolicy,
  getPolicyHistory
} from "../controllers/policyController.js";
import { requireActiveUser, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Provider-assigned weekly policies
router.post("/create", requireAuth, requireActiveUser, createPolicy);
router.get("/user", requireAuth, requireActiveUser, getUserPolicy);

// Subscription Tier System
router.get("/tiers", getPolicyTiers);
router.get("/active-tier", requireAuth, getUserActiveTierPolicy);
router.post("/purchase-tier", requireAuth, purchaseTierPolicy);
router.post("/verify-payment", requireAuth, verifyTierPolicyPayment);
router.post("/renew-tier", requireAuth, renewTierPolicy);
router.post("/cancel-tier", requireAuth, cancelTierPolicy);
router.get("/history", requireAuth, getPolicyHistory);

export default router;
