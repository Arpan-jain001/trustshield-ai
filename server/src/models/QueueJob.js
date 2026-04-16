import mongoose from "mongoose";

const queueJobSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["SIGNAL_INGESTION", "MODEL_TRAINING", "CLAIM_REVIEW_SYNC"],
      required: true
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "PENDING"
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    attempts: {
      type: Number,
      default: 0
    },
    lastError: String,
    processedAt: Date
  },
  { timestamps: true }
);

queueJobSchema.index({ type: 1, status: 1, createdAt: 1 });

export const QueueJob = mongoose.model("QueueJob", queueJobSchema);
