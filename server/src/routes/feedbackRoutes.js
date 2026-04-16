import { Router } from "express";
import { createFeedback } from "../controllers/feedbackController.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", optionalAuth, createFeedback);

export default router;
