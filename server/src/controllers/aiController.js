import { Claim } from "../models/Claim.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { answerChatbot } from "../services/aiService.js";

export const getRisk = asyncHandler(async (req, res) => {
  res.json({
    risk: req.user.riskProfile
  });
});

export const chatbotQuery = asyncHandler(async (req, res) => {
  const claims = await Claim.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(3);
  const claimSummary = claims.length
    ? claims.map((claim) => `${claim.triggerType}:${claim.decision}:${claim.decisionReason || "No reason recorded"}`).join(", ")
    : "No claims yet";

  const answer = await answerChatbot(req.body.question, {
    workerName: req.user.name,
    status: req.user.status,
    riskScore: req.user.riskProfile?.score || 0,
    riskExplanation: req.user.riskProfile?.explanation || "No policy created yet",
    claimSummary
  });

  res.json({ answer });
});
