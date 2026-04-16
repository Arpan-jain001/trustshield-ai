import mongoose from "mongoose";

const policySchema = new mongoose.Schema(
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
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderPolicyProduct"
    },
    productName: String,
    providerName: String,
    weeklyPremium: Number,
    coverageHours: Number,
    maxPayout: Number,
    riskScore: Number,
    pricingBreakdown: {
      base: Number,
      risk: Number,
      discount: Number,
      total: Number
    },
    aiExplanation: String,
    riskInputs: {
      rainfall: Number,
      aqi: Number,
      curfew: Boolean,
      source: String
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED"],
      default: "ACTIVE"
    },
    startsAt: {
      type: Date,
      default: Date.now
    },
    endsAt: Date
  },
  { timestamps: true }
);

export const Policy = mongoose.model("Policy", policySchema);
