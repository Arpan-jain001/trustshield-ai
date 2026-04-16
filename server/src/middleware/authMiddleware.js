import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub);
    if (user) {
      req.user = user;
    }
  } catch {
    req.user = null;
  }

  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export function requireActiveUser(req, res, next) {
  if (req.user.role === "ADMIN") return next();

  if (!req.user.emailVerification?.verified) {
    return res.status(403).json({
      message: "Account verification required",
      status: "EMAIL_VERIFICATION_REQUIRED",
      email: req.user.email
    });
  }

  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({
      message: req.user.status === "SUSPENDED" ? "Your account is suspended" : "Your account is not active",
      reason: req.user.statusReason,
      status: req.user.status
    });
  }

  next();
}

export function requireAccountType(...allowedTypes) {
  return (req, res, next) => {
    if (req.user?.role === "ADMIN") {
      return next();
    }

    if (!allowedTypes.includes(req.user?.accountType)) {
      return res.status(403).json({ message: "Account type access denied", accountType: req.user?.accountType });
    }

    next();
  };
}
