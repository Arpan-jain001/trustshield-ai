import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";
import { env } from "../config/env.js";
import { sendEmail, buildAccountVerificationEmail, buildOtpEmail, buildStatusEmail } from "../services/mailService.js";

function generateOtp() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function generateVerificationToken() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

function buildVerificationState() {
  const otp = generateOtp();
  const token = generateVerificationToken();

  return {
    otp,
    token,
    state: {
      verified: false,
      otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      token,
      tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  };
}

async function sendVerificationEmail(user) {
  if (!user.emailVerification?.otp || !user.emailVerification?.token) {
    return;
  }

  const verificationUrl = `${env.clientUrl}/verify-account?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(user.emailVerification.token)}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your TrustShield AI account",
    html: buildAccountVerificationEmail({
      name: user.name,
      otp: user.emailVerification.otp,
      verificationUrl
    })
  });
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    accountType: user.accountType,
    organizationName: user.organizationName,
    linkedProvider: user.linkedProvider,
    linkedProviderName: user.linkedProviderName,
    secondaryEmail: user.secondaryEmail,
    location: user.location,
    address: user.address,
    mobileNumber: user.mobileNumber,
    avatarUrl: user.avatarUrl,
    workType: user.workType,
    customWorkType: user.customWorkType,
    role: user.role,
    status: user.status,
    statusReason: user.statusReason,
    emailVerificationVerified: Boolean(user.emailVerification?.verified),
    hourlyRate: user.hourlyRate,
    riskProfile: user.riskProfile,
    settings: user.settings
  };
}

export const listActiveProviders = asyncHandler(async (_req, res) => {
  const providers = await User.find({
    role: "USER",
    accountType: "INSURER",
    status: "ACTIVE"
  })
    .select("_id name organizationName location status")
    .sort({ organizationName: 1, name: 1 });

  res.json({
    providers: providers.map((provider) => ({
      id: provider._id,
      name: provider.name,
      organizationName: provider.organizationName || provider.name,
      location: provider.location,
      status: provider.status
    }))
  });
});

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, location, workType, customWorkType, accountType, organizationName, linkedProviderId } = req.body;
  const normalizedAccountType = ["WORKER", "INSURER", "PLATFORM"].includes(accountType) ? accountType : "WORKER";
  if (!name?.trim()) {
    return res.status(400).json({ message: "Invalid name" });
  }
  if (!/^\S+@\S+\.\S+$/.test(email || "")) {
    return res.status(400).json({ message: "Invalid email" });
  }
  if ((password || "").length < 8) {
    return res.status(400).json({ message: "Invalid password" });
  }
  if (!location?.trim()) {
    return res.status(400).json({ message: "Invalid location" });
  }
  const resolvedWorkType = normalizedAccountType === "WORKER" ? workType : "OTHER";
  const resolvedCustomWorkType =
    normalizedAccountType === "WORKER"
      ? workType === "OTHER"
        ? customWorkType?.trim() || ""
        : ""
      : customWorkType?.trim() || (normalizedAccountType === "INSURER" ? "Insurance provider" : "Platform operations");
  if (!["ZOMATO", "SWIGGY", "ZEPTO", "AMAZON", "OTHER"].includes(resolvedWorkType)) {
    return res.status(400).json({ message: "Invalid work type" });
  }
  if (normalizedAccountType === "WORKER" && resolvedWorkType === "OTHER" && !resolvedCustomWorkType) {
    return res.status(400).json({ message: "Enter your work category" });
  }
  if (normalizedAccountType !== "WORKER" && !organizationName?.trim()) {
    return res.status(400).json({ message: "Organization name is required" });
  }

  let linkedProvider = null;
  if (normalizedAccountType === "WORKER") {
    if (!linkedProviderId) {
      return res.status(400).json({ message: "Select the insurer/provider organization for this worker" });
    }

    linkedProvider = await User.findOne({
      _id: linkedProviderId,
      role: "USER",
      accountType: "INSURER",
      status: "ACTIVE"
    });

    if (!linkedProvider) {
      return res.status(400).json({ message: "Selected insurer/provider organization is not available" });
    }
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const verification = buildVerificationState();

  const user = await User.create({
    name,
    email,
    password,
    location,
    workType: resolvedWorkType,
    customWorkType: resolvedCustomWorkType,
    accountType: normalizedAccountType,
    organizationName: normalizedAccountType === "WORKER" ? "" : organizationName.trim(),
    linkedProvider: linkedProvider?._id,
    linkedProviderName: linkedProvider?.organizationName || linkedProvider?.name || "",
    emailVerification: verification.state
  });

  await sendVerificationEmail(user);

  res.status(201).json({
    message: "Signup successful. First verify your email, then your account will go to admin review.",
    user: sanitizeUser(user),
    verificationRequired: true
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, expectedRole } = req.body;
  if (!/^\S+@\S+\.\S+$/.test(email || "")) {
    return res.status(400).json({ message: "Invalid email" });
  }
  if (!password) {
    return res.status(400).json({ message: "Invalid password" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Invalid email" });
  }

  if (!(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid password" });
  }

  if (!user.role) {
    return res.status(403).json({ message: "Role not found" });
  }

  if (expectedRole && user.role !== expectedRole) {
    return res.status(403).json({
      message: expectedRole === "ADMIN" ? "Admin account not found for this login" : "User account not found for this login"
    });
  }

  if (user.role === "USER" && !user.emailVerification?.verified) {
    const verification = buildVerificationState();
    user.emailVerification = verification.state;
    await user.save();
    await sendVerificationEmail(user);

    return res.status(403).json({
      message: "Account verification required",
      status: "EMAIL_VERIFICATION_REQUIRED",
      email: user.email
    });
  }

  user.lastLoginAt = new Date();
  user.lastLoginIp = req.ip;
  user.deviceFingerprint = req.headers["x-device-fingerprint"] || user.deviceFingerprint;
  await user.save();

  res.json({
    token: generateToken(user),
    user: sanitizeUser(user)
  });
});

export const refreshSession = asyncHandler(async (req, res) => {
  const user = req.user;

  user.lastLoginAt = new Date();
  user.lastLoginIp = req.ip;
  await user.save();

  res.json({
    token: generateToken(user),
    user: sanitizeUser(user)
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message: "If the email exists, an OTP has been sent." });
  }

  const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
  user.resetOtp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  };
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "TrustShield AI password reset OTP",
    html: buildOtpEmail(user.name, otp)
  });

  res.json({ message: "If the email exists, an OTP has been sent." });
});

export const requestAccountVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!/^\S+@\S+\.\S+$/.test(email || "")) {
    return res.status(400).json({ message: "Invalid email" });
  }

  const user = await User.findOne({ email });
  if (!user || user.role !== "USER") {
    return res.json({ message: "If the account exists, a verification email has been sent." });
  }

  if (user.emailVerification?.verified) {
    return res.json({ message: "Account already verified." });
  }

  const verification = buildVerificationState();
  user.emailVerification = verification.state;
  await user.save();
  await sendVerificationEmail(user);

  res.json({ message: "Verification OTP and secure link sent." });
});

export const verifyAccount = asyncHandler(async (req, res) => {
  const { email, otp, token } = req.body;
  if (!/^\S+@\S+\.\S+$/.test(email || "")) {
    return res.status(400).json({ message: "Invalid email" });
  }

  const user = await User.findOne({ email });
  if (!user || user.role !== "USER") {
    return res.status(404).json({ message: "Account not found" });
  }

  if (user.emailVerification?.verified) {
    return res.json({
      message: user.status === "ACTIVE" ? "Account already verified." : "Email verified. Your account is waiting for admin approval.",
      user: sanitizeUser(user)
    });
  }

  const now = new Date();
  const otpValid =
    otp &&
    user.emailVerification?.otp &&
    user.emailVerification?.otp === otp &&
    user.emailVerification?.otpExpiresAt &&
    user.emailVerification.otpExpiresAt > now;
  const tokenValid =
    token &&
    user.emailVerification?.token &&
    user.emailVerification?.token === token &&
    user.emailVerification?.tokenExpiresAt &&
    user.emailVerification.tokenExpiresAt > now;

  if (!otpValid && !tokenValid) {
    return res.status(400).json({ message: "Invalid or expired verification request" });
  }

  user.emailVerification = {
    verified: true,
    verifiedAt: now
  };
  user.status = "PENDING_VERIFICATION";
  user.statusReason = "Email verified successfully. Waiting for admin approval.";
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "TrustShield AI account email verified",
    html: buildStatusEmail(
      user.name,
      "Email verified successfully",
      "Your email has been verified successfully. You can now log in and open your dashboard, but full platform access will unlock only after an admin approves your account."
    )
  });

  res.json({
    message: "Email verified successfully. You can log in now, and your account is waiting for admin approval.",
    user: sanitizeUser(user)
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user?.resetOtp?.code || !user?.resetOtp?.expiresAt) {
    return res.status(400).json({ message: "OTP not found" });
  }

  if (user.resetOtp.code !== otp || user.resetOtp.expiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.password = newPassword;
  user.resetOtp = undefined;
  await user.save();

  res.json({ message: "Password reset successfully" });
});
