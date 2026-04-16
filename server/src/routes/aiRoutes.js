import { Router } from "express";
import { chatbotQuery, getRisk } from "../controllers/aiController.js";
import { requireActiveUser, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/risk", requireAuth, requireActiveUser, getRisk);
router.post("/chatbot/query", requireAuth, requireActiveUser, chatbotQuery);

export default router;
