import { Feedback } from "../models/Feedback.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildFeedbackAcknowledgementEmail, sendEmail } from "../services/mailService.js";

export const createFeedback = asyncHandler(async (req, res) => {
  const authUser = req.user || null;
  const name = (authUser?.name || req.body.name || "").trim();
  const email = (authUser?.email || req.body.email || "").trim().toLowerCase();
  const category = req.body.category || "OTHER";
  const message = (req.body.message || "").trim();
  const rating = Number(req.body.rating || 5);

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email" });
  }
  if (!message) {
    return res.status(400).json({ message: "Feedback message is required" });
  }
  if (![1, 2, 3, 4, 5].includes(rating)) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const feedback = await Feedback.create({
    user: authUser?._id,
    name,
    email,
    role: authUser?.role || "GUEST",
    category: ["UX", "BUG", "CLAIMS", "POLICY", "VERIFICATION", "SUPPORT", "OTHER"].includes(category) ? category : "OTHER",
    rating,
    message
  });

  await sendEmail({
    to: email,
    subject: "TrustShield AI feedback received",
    html: buildFeedbackAcknowledgementEmail({
      name,
      category: feedback.category,
      rating: feedback.rating,
      message: feedback.message
    })
  });

  res.status(201).json({
    message: "Feedback submitted successfully",
    feedback
  });
});
