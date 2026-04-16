import mongoose from "mongoose";

const fraudGraphEdgeSchema = new mongoose.Schema(
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
    edgeType: {
      type: String,
      enum: ["IP", "DEVICE", "LOCATION_CLUSTER", "CLAIM_CLUSTER"],
      required: true
    },
    value: {
      type: String,
      required: true
    },
    claim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim"
    },
    weight: {
      type: Number,
      default: 1
    },
    metadata: {
      signalCount: Number,
      note: String
    }
  },
  { timestamps: true }
);

fraudGraphEdgeSchema.index({ edgeType: 1, value: 1 });

export const FraudGraphEdge = mongoose.model("FraudGraphEdge", fraudGraphEdgeSchema);
