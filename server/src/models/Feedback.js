import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: ["GUEST", "USER", "ADMIN"],
      default: "GUEST"
    },
    category: {
      type: String,
      enum: ["UX", "BUG", "CLAIMS", "POLICY", "VERIFICATION", "SUPPORT", "OTHER"],
      default: "OTHER"
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["NEW", "IN_REVIEW", "RESOLVED"],
      default: "NEW"
    },
    resolutionNote: {
      type: String,
      trim: true,
      default: ""
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: Date
  },
  { timestamps: true }
);

export const Feedback = mongoose.model("Feedback", feedbackSchema);
