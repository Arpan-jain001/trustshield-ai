import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function generateToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      status: user.status
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}
