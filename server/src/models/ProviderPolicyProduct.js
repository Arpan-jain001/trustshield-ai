import mongoose from "mongoose";

const providerPolicyProductSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PAUSED", "RETIRED"],
      default: "ACTIVE"
    },
    weeklyBasePremium: {
      type: Number,
      default: 149
    },
    coverageHours: {
      type: Number,
      default: 24
    },
    riskMultiplier: {
      type: Number,
      default: 1
    },
    maxPayout: {
      type: Number,
      default: 3000
    },
    eligibilityTags: {
      type: [String],
      default: []
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

providerPolicyProductSchema.index({ provider: 1, status: 1, createdAt: -1 });

export const ProviderPolicyProduct = mongoose.model("ProviderPolicyProduct", providerPolicyProductSchema);
