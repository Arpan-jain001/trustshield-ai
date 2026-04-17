import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    claim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim"
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["INITIATED", "COMPLETED", "FAILED", "CANCELLED"],
      default: "INITIATED",
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ["RAZORPAY", "BANK_TRANSFER"],
      default: "BANK_TRANSFER"
    },
    transferReference: String,
    razorpayDetails: {
      orderId: String,
      paymentId: String,
      signature: String,
      receiptId: String,
      failureReason: String
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      bankName: String
    },
    notes: String,
    completedAt: Date,
    failedAt: Date,
    retryCount: {
      type: Number,
      default: 0
    },
    lastRetryAt: Date,
    ipAddress: String,
    userAgent: String
  },
  {
    timestamps: true
  }
);

// Index for quick user withdrawal history
withdrawalSchema.index({ user: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });

export const WorkerWithdrawal = mongoose.model("WorkerWithdrawal", withdrawalSchema);
