import mongoose from "mongoose";

const systemAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    audience: {
      type: String,
      enum: ["GLOBAL", "USER"],
      default: "USER"
    },
    title: String,
    message: String,
    emailSent: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    severity: {
      type: String,
      enum: ["INFO", "WARN", "CRITICAL"],
      default: "INFO"
    }
  },
  { timestamps: true }
);

export const SystemAlert = mongoose.model("SystemAlert", systemAlertSchema);
