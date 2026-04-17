import { Router } from "express";
import {
  banUser,
  createAdmin,
  deleteAdmin,
  getUserDetails,
  getUsers,
  rejectUser,
  resolveFraudAlert,
  reviewClaim,
  sendNotification,
  suspendUser,
  deleteFeedback,
  updateFeedbackStatus,
  verifyUser,
  getAllWithdrawals,
  getWithdrawalStats,
  getWithdrawalDetails
} from "../controllers/adminController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/users", requireAuth, requireAdmin, getUsers);
router.get("/users/:userId", requireAuth, requireAdmin, getUserDetails);
router.post("/create-admin", requireAuth, requireAdmin, createAdmin);
router.post("/delete-admin", requireAuth, requireAdmin, deleteAdmin);
router.post("/notifications", requireAuth, requireAdmin, sendNotification);
router.post("/feedback/status", requireAuth, requireAdmin, updateFeedbackStatus);
router.delete("/feedback/:feedbackId", requireAuth, requireAdmin, deleteFeedback);
router.post("/claims/review", requireAuth, requireAdmin, reviewClaim);
router.post("/fraud-alerts/resolve", requireAuth, requireAdmin, resolveFraudAlert);
router.post("/verify", requireAuth, requireAdmin, verifyUser);
router.post("/reject", requireAuth, requireAdmin, rejectUser);
router.post("/suspend", requireAuth, requireAdmin, suspendUser);
router.post("/ban", requireAuth, requireAdmin, banUser);
router.get("/withdrawals", requireAuth, requireAdmin, getAllWithdrawals);
router.get("/withdrawals/stats", requireAuth, requireAdmin, getWithdrawalStats);
router.get("/withdrawals/:withdrawalId", requireAuth, requireAdmin, getWithdrawalDetails);

export default router;
