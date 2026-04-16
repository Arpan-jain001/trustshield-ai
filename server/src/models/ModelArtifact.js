import mongoose from "mongoose";

const modelArtifactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["ISOLATION_FOREST_SURROGATE", "SEQUENCE_TRAJECTORY_MODEL", "RISK_BASELINE_MODEL"],
      required: true
    },
    version: {
      type: Number,
      default: 1
    },
    metadata: {
      sampleSize: Number,
      trainedAt: Date,
      notes: String,
      status: {
        type: String,
        enum: ["ACTIVE", "ARCHIVED", "ROLLED_BACK"],
        default: "ACTIVE"
      },
      promotedAt: Date,
      rolledBackAt: Date,
      requestedBy: mongoose.Schema.Types.Mixed,
      trainingWindow: String,
      evaluation: mongoose.Schema.Types.Mixed
    },
    artifact: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

modelArtifactSchema.index({ name: 1, version: -1 });
modelArtifactSchema.index({ name: 1, "metadata.status": 1, createdAt: -1 });

export const ModelArtifact = mongoose.model("ModelArtifact", modelArtifactSchema);
