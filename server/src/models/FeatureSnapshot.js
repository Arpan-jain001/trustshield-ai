import mongoose from "mongoose";

const featureSnapshotSchema = new mongoose.Schema(
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
    source: {
      type: String,
      enum: ["SIGNAL_INGESTION", "CLAIM_PIPELINE", "POLICY_PIPELINE"],
      default: "SIGNAL_INGESTION"
    },
    rawSignals: {
      location: String,
      rainfall: Number,
      aqi: Number,
      curfew: Boolean,
      networkLatencyMs: Number,
      speedKph: Number,
      sensorMotion: String,
      trafficContext: String,
      gpsCoordinates: {
        latitude: Number,
        longitude: Number
      },
      cellTowerCoordinates: {
        latitude: Number,
        longitude: Number
      },
      ipCoordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    derivedFeatures: {
      integrityScore: Number,
      spoofRisk: Number,
      consistencyScore: Number,
      locationConfidence: Number,
      motionConfidence: Number,
      networkConfidence: Number,
      deviceConfidence: Number,
      anomalyScore: Number,
      anomalyVerdict: String,
      flags: [String]
    }
  },
  { timestamps: true }
);

export const FeatureSnapshot = mongoose.model("FeatureSnapshot", featureSnapshotSchema);
