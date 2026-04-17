import { Router } from "express";
import {
  adjustProviderLiquidity,
  createProviderProduct,
  getProviderDashboard,
  escalateProviderClaim,
  reviewProviderClaim,
  initiateProviderLiquidityTopUp,
  verifyProviderLiquidityTopUp,
  simulateProviderPricing,
  updateProviderProduct,
  updateProviderProfile
} from "../controllers/providerController.js";
import { requireAccountType, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/dashboard", requireAuth, requireAccountType("INSURER"), getProviderDashboard);
router.put("/profile", requireAuth, requireAccountType("INSURER"), updateProviderProfile);
router.post("/simulate-pricing", requireAuth, requireAccountType("INSURER"), simulateProviderPricing);
router.post("/products", requireAuth, requireAccountType("INSURER"), createProviderProduct);
router.put("/products/:productId", requireAuth, requireAccountType("INSURER"), updateProviderProduct);
router.post("/liquidity", requireAuth, requireAccountType("INSURER"), adjustProviderLiquidity);
router.post("/liquidity/top-up", requireAuth, requireAccountType("INSURER"), initiateProviderLiquidityTopUp);
router.post("/liquidity/top-up/verify", requireAuth, requireAccountType("INSURER"), verifyProviderLiquidityTopUp);
router.post("/claims/review", requireAuth, requireAccountType("INSURER"), reviewProviderClaim);
router.post("/claims/escalate", requireAuth, requireAccountType("INSURER"), escalateProviderClaim);

export default router;
