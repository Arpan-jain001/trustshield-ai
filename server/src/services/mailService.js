import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;
const supportEmail = env.supportEmail;

export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.warn("Resend is not configured. Email skipped.");
    return { skipped: true };
  }

  return resend.emails.send({
    from: env.emailFrom,
    to,
    ...(supportEmail ? { cc: supportEmail } : {}),
    subject,
    html
  });
}

export function buildOtpEmail(name, otp) {
  return `
    <div style="font-family:Arial,sans-serif;background:#07111f;padding:32px;color:#e5f0ff">
      <div style="max-width:620px;margin:auto;background:linear-gradient(135deg,#0f1c2e,#122945);padding:32px;border-radius:24px;border:1px solid rgba(255,255,255,0.1)">
        <p style="color:#75d5ff;letter-spacing:0.2em;text-transform:uppercase;font-size:12px">TrustShield AI</p>
        <h1 style="margin:0 0 16px;font-size:28px">Password reset verification</h1>
        <p style="line-height:1.6">Hi ${name}, use the OTP below to reset your password. This code stays valid for 10 minutes.</p>
        <div style="margin:28px 0;padding:18px 22px;background:#04101d;border-radius:16px;font-size:32px;font-weight:700;letter-spacing:0.4em;text-align:center">${otp}</div>
        <p style="line-height:1.6;color:#c2d8ef">If you did not request this, you can ignore this email.</p>
      </div>
    </div>
  `;
}

export function buildAccountVerificationEmail({ name, otp, verificationUrl }) {
  return `
    <div style="font-family:Arial,sans-serif;background:#07111f;padding:32px;color:#e5f0ff">
      <div style="max-width:680px;margin:auto;background:linear-gradient(135deg,#0d1e32,#143250);padding:32px;border-radius:24px;border:1px solid rgba(255,255,255,0.1)">
        <p style="color:#75d5ff;letter-spacing:0.2em;text-transform:uppercase;font-size:12px">TrustShield AI Account Verification</p>
        <h1 style="margin:0 0 16px;font-size:28px">Verify your worker account</h1>
        <p style="line-height:1.7;color:#d8e9ff">Hello ${name}, your account must be verified before you can complete login and access the TrustShield AI dashboard.</p>
        <div style="margin-top:24px;background:#08131f;padding:22px;border-radius:18px">
          <p style="margin:0 0 10px;color:#c7d8eb">Use this OTP within 10 minutes:</p>
          <div style="padding:18px 22px;background:#04101d;border-radius:16px;font-size:32px;font-weight:700;letter-spacing:0.4em;text-align:center">${otp}</div>
        </div>
        <div style="margin-top:24px;line-height:1.8;color:#c7d8eb">
          <p style="margin:0 0 8px"><strong>Or use secure link verification</strong></p>
          <p style="margin:0 0 16px">Open the link below from the same email inbox to verify instantly.</p>
          <p style="margin:0;word-break:break-word"><a href="${verificationUrl}" style="color:#75d5ff">${verificationUrl}</a></p>
        </div>
        <p style="margin-top:24px;line-height:1.7;color:#c7d8eb">After email verification, your account will remain in the moderation queue until an admin approves it.</p>
      </div>
    </div>
  `;
}

export function buildSecondaryEmailOtp(name, otp) {
  return `
    <div style="font-family:Arial,sans-serif;background:#07111f;padding:32px;color:#e5f0ff">
      <div style="max-width:620px;margin:auto;background:linear-gradient(135deg,#0f1c2e,#122945);padding:32px;border-radius:24px;border:1px solid rgba(255,255,255,0.1)">
        <p style="color:#75d5ff;letter-spacing:0.2em;text-transform:uppercase;font-size:12px">TrustShield AI</p>
        <h1 style="margin:0 0 16px;font-size:28px">Verify secondary email</h1>
        <p style="line-height:1.6">Hi ${name}, use this OTP to verify your secondary email address for TrustShield AI.</p>
        <div style="margin:28px 0;padding:18px 22px;background:#04101d;border-radius:16px;font-size:32px;font-weight:700;letter-spacing:0.4em;text-align:center">${otp}</div>
        <p style="line-height:1.6;color:#c2d8ef">This code is valid for 10 minutes.</p>
      </div>
    </div>
  `;
}

export function buildStatusEmail(name, title, body) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:28px">
      <div style="max-width:620px;margin:auto;background:#ffffff;padding:28px;border-radius:18px;border:1px solid #e5ecf6">
        <h1 style="margin-top:0;color:#0b1f33">${title}</h1>
        <p style="color:#1f3a55;line-height:1.7">Hi ${name},</p>
        <p style="color:#1f3a55;line-height:1.7">${body}</p>
        <p style="color:#1f3a55;line-height:1.7">You can sign in to TrustShield AI at any time to check your latest account status from the dashboard.</p>
        <p style="color:#4b647d;line-height:1.7">TrustShield AI is focused only on income-loss coverage from external disruptions like weather, pollution, and curfews.</p>
      </div>
    </div>
  `;
}

export function buildAdminInviteEmail({ name, email, password, supportEmail }) {
  return `
    <div style="font-family:Arial,sans-serif;background:#07111f;padding:32px;color:#e5f0ff">
      <div style="max-width:680px;margin:auto;background:linear-gradient(135deg,#0d1e32,#143250);padding:32px;border-radius:24px;border:1px solid rgba(255,255,255,0.1)">
        <p style="color:#75d5ff;letter-spacing:0.2em;text-transform:uppercase;font-size:12px">TrustShield AI Admin Access</p>
        <h1 style="margin:0 0 16px;font-size:28px">Your admin account is ready</h1>
        <p style="line-height:1.7;color:#d8e9ff">Hello ${name}, you have been granted access to the TrustShield AI admin control center.</p>
        <div style="margin-top:24px;background:#08131f;padding:22px;border-radius:18px">
          <p style="margin:0 0 8px"><strong>Login email:</strong> ${email}</p>
          <p style="margin:0 0 8px"><strong>Temporary password:</strong> ${password}</p>
          <p style="margin:0"><strong>Role:</strong> ADMIN</p>
        </div>
        <div style="margin-top:24px;line-height:1.8;color:#c7d8eb">
          <p style="margin:0 0 8px"><strong>Login instructions</strong></p>
          <p style="margin:0">1. Open the TrustShield AI login page.</p>
          <p style="margin:0">2. Sign in with the credentials above.</p>
          <p style="margin:0">3. Access the admin dashboard to manage verification, fraud alerts, claims, and risk workflows.</p>
          <p style="margin:0">4. Immediately go to Settings and change the temporary password for security.</p>
          <p style="margin:12px 0 0">For support contact: ${supportEmail}</p>
        </div>
      </div>
    </div>
  `;
}

export function buildNotificationEmail({ name, title, message, supportEmail }) {
  return `
    <div style="font-family:Arial,sans-serif;background:#07111f;padding:32px;color:#e5f0ff">
      <div style="max-width:680px;margin:auto;background:linear-gradient(135deg,#0d1e32,#143250);padding:32px;border-radius:24px;border:1px solid rgba(255,255,255,0.1)">
        <p style="color:#75d5ff;letter-spacing:0.2em;text-transform:uppercase;font-size:12px">TrustShield AI Notification</p>
        <h1 style="margin:0 0 16px;font-size:28px">${title}</h1>
        <p style="line-height:1.7;color:#d8e9ff">Hello ${name},</p>
        <p style="line-height:1.8;color:#c7d8eb">${message}</p>
        <p style="margin-top:24px;line-height:1.7;color:#c7d8eb">For support contact: ${supportEmail}</p>
      </div>
    </div>
  `;
}

export function buildAdminRemovalEmail({ name, reason, supportEmail }) {
  return `
    <div style="font-family:Arial,sans-serif;background:#07111f;padding:32px;color:#e5f0ff">
      <div style="max-width:680px;margin:auto;background:linear-gradient(135deg,#1b1420,#2b1626);padding:32px;border-radius:24px;border:1px solid rgba(255,255,255,0.1)">
        <p style="color:#ff9478;letter-spacing:0.2em;text-transform:uppercase;font-size:12px">TrustShield AI Admin Update</p>
        <h1 style="margin:0 0 16px;font-size:28px">Admin access removed</h1>
        <p style="line-height:1.7;color:#f5dfe4">Hello ${name}, your admin access has been permanently removed from TrustShield AI.</p>
        <div style="margin-top:20px;background:#120c14;padding:22px;border-radius:18px">
          <p style="margin:0"><strong>Reason:</strong> ${reason}</p>
        </div>
        <p style="margin-top:20px;line-height:1.7;color:#dfc8d0">If you believe this action was made in error, contact support at ${supportEmail}.</p>
      </div>
    </div>
  `;
}

export function buildFeedbackAcknowledgementEmail({ name, category, rating, message }) {
  return `
    <div style="font-family:Arial,sans-serif;background:#07111f;padding:32px;color:#e5f0ff">
      <div style="max-width:680px;margin:auto;background:linear-gradient(135deg,#0d1e32,#143250);padding:32px;border-radius:24px;border:1px solid rgba(255,255,255,0.1)">
        <p style="color:#75d5ff;letter-spacing:0.2em;text-transform:uppercase;font-size:12px">TrustShield AI Feedback</p>
        <h1 style="margin:0 0 16px;font-size:28px">We received your feedback</h1>
        <p style="line-height:1.7;color:#d8e9ff">Hello ${name}, thanks for helping improve TrustShield AI.</p>
        <div style="margin-top:20px;background:#08131f;padding:22px;border-radius:18px">
          <p style="margin:0 0 8px"><strong>Category:</strong> ${category}</p>
          <p style="margin:0 0 8px"><strong>Rating:</strong> ${rating}/5</p>
          <p style="margin:0"><strong>Message:</strong> ${message}</p>
        </div>
        <p style="margin-top:24px;line-height:1.7;color:#c7d8eb">Our team will review this input and use it to improve the product experience, workflows, and platform reliability.</p>
      </div>
    </div>
  `;
}
