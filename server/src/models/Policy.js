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
    // Subscription Tier System
    tier: {
      type: String,
      enum: ["BASIC", "STANDARD", "PREMIUM"],
      default: "BASIC"
    },
    monthlyPremium: {
      type: Number,
      default: 0
    },
    claimCoverage: {
      type: Number,
      default: 500
    },
    policyType: {
      type: String,
      enum: ["SELF_PURCHASED", "PROVIDER_ASSIGNED"],
      default: "SELF_PURCHASED"
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING"
    },
    paymentId: String,
    transactionId: String,
    razorpayOrderId: String,
    paymentVerifiedAt: Date,
    renewedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy"
    },
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "ACTIVE", "EXPIRED", "CANCELLED"],
      default: "ACTIVE"
    },
    startsAt: {
      type: Date,
      default: Date.now
    },
    endsAt: Date,
    renewalReminder: {
      sent: Boolean,
      sentAt: Date
    }
  },
  { timestamps: true }
);

export const Policy = mongoose.model("Policy", policySchema);
