import { Router } from "express";
import { forgotPassword, listActiveProviders, login, refreshSession, requestAccountVerification, resetPassword, signup, verifyAccount } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/signup", signup);
router.get("/providers", listActiveProviders);
router.post("/login", login);
router.post("/refresh", requireAuth, refreshSession);
router.post("/request-account-verification", requestAccountVerification);
router.post("/verify-account", verifyAccount);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
