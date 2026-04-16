import mongoose from "mongoose";

const fraudAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    claim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim"
    },
    score: Number,
    flags: [String],
    linkedAccounts: Number,
    clusterId: String,
    sharedSignals: [String],
    status: {
      type: String,
      enum: ["OPEN", "RESOLVED"],
      default: "OPEN"
    },
    resolution: {
      reason: String,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      resolvedAt: Date
    }
  },
  { timestamps: true }
);

export const FraudAlert = mongoose.model("FraudAlert", fraudAlertSchema);
