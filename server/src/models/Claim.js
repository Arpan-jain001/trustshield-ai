import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
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
    providerName: String,
    policy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
      required: true
    },
    triggerType: {
      type: String,
      enum: ["RAIN", "AQI", "CURFEW", "MANUAL_SIMULATION"],
      required: true
    },
    disruptionData: {
      rainfall: Number,
      aqi: Number,
      curfew: Boolean,
      location: String,
      source: String,
      weatherCode: Number,
      observedAt: Date,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    signalFusion: {
      integrityScore: Number,
      spoofRisk: Number,
      consistencyScore: Number,
      locationConfidence: Number,
      motionConfidence: Number,
      networkConfidence: Number,
      deviceConfidence: Number,
      clusterRisk: Number,
      anomalyScore: Number,
      flags: [String],
      details: {
        gpsLocation: String,
        cellTowerLocation: String,
        ipLocation: String,
        ipCity: String,
        ipThreatScore: Number,
        latencyMs: Number,
        speedKph: Number,
        sensorMotion: String,
        trafficContext: String
      }
    },
    aiRisk: {
      score: Number,
      explanation: String
    },
    fraud: {
      score: Number,
      flags: [String],
      linkedAccounts: Number,
      sharedSignals: [String],
      clusterId: String
    },
    anomaly: {
      score: Number,
      verdict: String,
      reasons: [String]
    },
    decision: {
      type: String,
      enum: ["APPROVED", "REJECTED", "NEEDS_REVIEW"],
      default: "NEEDS_REVIEW"
    },
    decisionReason: String,
    review: {
      status: {
        type: String,
        enum: ["NOT_REQUIRED", "PENDING", "APPROVED", "REJECTED"],
        default: "NOT_REQUIRED"
      },
      notes: String,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      reviewedAt: Date
    },
    payout: {
      hoursLost: Number,
      hourlyRate: Number,
      total: Number,
      processedAt: Date,
      status: {
        type: String,
        enum: ["PENDING", "SUCCESS", "FAILED", "SKIPPED"],
        default: "PENDING"
      },
      gateway: String,
      orderId: String,
      paymentId: String,
      transactionId: String,
      currency: {
        type: String,
        default: "INR"
      },
      processingSeconds: Number,
      message: String
    }
  },
  { timestamps: true }
);

export const Claim = mongoose.model("Claim", claimSchema);
