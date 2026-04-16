import mongoose from "mongoose";

const underwritingHistorySchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    underwritingMode: String,
    maxPayoutPerClaim: Number,
    autoApprovalThreshold: Number,
    reviewThreshold: Number,
    targetLossRatio: Number,
    focusRegions: { type: [String], default: [] },
    notes: String,
    savedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const providerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    underwritingMode: {
      type: String,
      enum: ["BALANCED", "GROWTH", "DEFENSIVE"],
      default: "BALANCED"
    },
    reservePool: {
      type: Number,
      default: 250000
    },
    availableLiquidity: {
      type: Number,
      default: 250000
    },
    lockedLiquidity: {
      type: Number,
      default: 0
    },
    maxPayoutPerClaim: {
      type: Number,
      default: 3000
    },
    autoApprovalThreshold: {
      type: Number,
      default: 35
    },
    reviewThreshold: {
      type: Number,
      default: 70
    },
    targetLossRatio: {
      type: Number,
      default: 58
    },
    focusRegions: {
      type: [String],
      default: []
    },
    notes: {
      type: String,
      default: ""
    },
    activeRuleVersion: {
      type: Number,
      default: 1
    },
    underwritingHistory: {
      type: [underwritingHistorySchema],
      default: []
    }
  },
  { timestamps: true }
);

export const ProviderProfile = mongoose.model("ProviderProfile", providerProfileSchema);
