import mongoose from "mongoose";

const platformIncidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM"
    },
    status: {
      type: String,
      enum: ["OPEN", "ACKNOWLEDGED", "RESOLVED"],
      default: "OPEN"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    acknowledgedAt: Date,
    resolvedAt: Date
  },
  { timestamps: true }
);

platformIncidentSchema.index({ status: 1, severity: 1, createdAt: -1 });

export const PlatformIncident = mongoose.model("PlatformIncident", platformIncidentSchema);
