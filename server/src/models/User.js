import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminActionSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      enum: ["VERIFY", "REJECT", "SUSPEND", "BAN"],
      required: true
    },
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { _id: false }
);

const otpSchema = new mongoose.Schema(
  {
    code: String,
    expiresAt: Date,
    email: String
  },
  { _id: false }
);

const emailVerificationSchema = new mongoose.Schema(
  {
    verified: { type: Boolean, default: false },
    otp: String,
    otpExpiresAt: Date,
    token: String,
    tokenExpiresAt: Date,
    verifiedAt: Date
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    theme: {
      type: String,
      enum: ["SYSTEM", "LIGHT", "DARK", "NIGHT"],
      default: "SYSTEM"
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    secondaryEmail: {
      email: { type: String, lowercase: true, trim: true },
      verified: { type: Boolean, default: false }
    },
    password: { type: String, required: true },
    location: { type: String, required: true },
    address: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    workType: {
      type: String,
      enum: ["ZOMATO", "SWIGGY", "ZEPTO", "AMAZON", "OTHER"],
      required: true
    },
    customWorkType: {
      type: String,
      default: "",
      trim: true
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER"
    },
    accountType: {
      type: String,
      enum: ["WORKER", "INSURER", "PLATFORM"],
      default: "WORKER"
    },
    organizationName: {
      type: String,
      default: "",
      trim: true
    },
    linkedProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    linkedProviderName: {
      type: String,
      default: "",
      trim: true
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED", "BANNED", "REJECTED"],
      default: "PENDING_VERIFICATION"
    },
    statusReason: String,
    hourlyRate: {
      type: Number,
      default: 120
    },
    riskProfile: {
      score: { type: Number, default: 0 },
      explanation: { type: String, default: "Risk score will appear after policy evaluation." },
      updatedAt: Date
    },
    lastLoginAt: Date,
    lastLoginIp: String,
    deviceFingerprint: String,
    emailVerification: {
      type: emailVerificationSchema,
      default: () => ({
        verified: false
      })
    },
    resetOtp: otpSchema,
    settings: {
      type: settingsSchema,
      default: () => ({
        notifications: { email: true, sms: false },
        theme: "SYSTEM"
      })
    },
    adminActions: [adminActionSchema]
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
