import mongoose from "mongoose";

const providerReserveLedgerSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    entryType: {
      type: String,
      enum: ["ADD", "WITHDRAW", "PAYOUT_LOCK", "PAYOUT_RELEASE", "PAYOUT_SETTLED"],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    note: {
      type: String,
      default: "",
      trim: true
    },
    balanceAfter: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

providerReserveLedgerSchema.index({ provider: 1, createdAt: -1 });

export const ProviderReserveLedger = mongoose.model("ProviderReserveLedger", providerReserveLedgerSchema);
