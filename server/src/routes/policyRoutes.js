import { Router } from "express";
import { createPolicy, getUserPolicy } from "../controllers/policyController.js";
import { requireActiveUser, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/create", requireAuth, requireActiveUser, createPolicy);
router.get("/user", requireAuth, requireActiveUser, getUserPolicy);

export default router;
