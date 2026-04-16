import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, KeyRound, MailCheck, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { api } from "../../api/client";
import { Loader } from "../../components/Loader";
import { withMinimumDelay } from "../../utils/withMinimumDelay";

const recoveryPoints = [
  "Request a one-time password on your registered email.",
  "Enter the OTP and set a new secure password.",
  "Return to login with your updated credentials.",
  "If the account is unverified, the login flow will redirect you to verification."
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otpForm, setOtpForm] = useState({ otp: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function sendOtp() {
    setError("");
    setMessage("");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Invalid email");
      return;
    }

    setSendingOtp(true);
    try {
      const data = await withMinimumDelay(api("/auth/forgot-password", { method: "POST", body: { email } }));
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingOtp(false);
    }
  }

  async function resetPassword() {
    setError("");
    setMessage("");

    if (!otpForm.otp.trim()) {
      setError("Enter the OTP");
      return;
    }
    if ((otpForm.newPassword || "").length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setResettingPassword(true);
    try {
      const data = await withMinimumDelay(
        api("/auth/reset-password", {
          method: "POST",
          body: { email, otp: otpForm.otp, newPassword: otpForm.newPassword }
        })
      );
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setResettingPassword(false);
    }
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan">Password Recovery</p>
            <h1 className="mt-4 max-w-3xl font-space text-5xl font-bold leading-tight sm:text-6xl">
              Reset access without losing your protected account.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">
              TrustShield AI keeps password recovery separate from account verification so identity checks remain strict while recovery stays simple and secure.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-cyan/20 bg-cyan/10 p-5">
                <MailCheck className="text-cyan" size={20} />
                <p className="mt-4 text-lg font-semibold">OTP Delivery</p>
                <p className="mt-2 text-sm leading-7 text-white/68">A time-limited code is sent to the registered email with the same branded mail flow.</p>
              </div>
              <div className="rounded-[28px] border border-sand/20 bg-sand/10 p-5">
                <ShieldCheck className="text-sand" size={20} />
                <p className="mt-4 text-lg font-semibold">Secure Reset</p>
                <p className="mt-2 text-sm leading-7 text-white/68">The password changes only after OTP validation succeeds against the backend.</p>
              </div>
              <div className="rounded-[28px] border border-mint/20 bg-mint/10 p-5">
                <Sparkles className="text-mint" size={20} />
                <p className="mt-4 text-lg font-semibold">Fast Return</p>
                <p className="mt-2 text-sm leading-7 text-white/68">Once reset is complete, users can return directly to the login surface.</p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {recoveryPoints.map((point, index) => (
                <div key={point} className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-white/75">
                  <span className="mr-3 text-cyan">{index + 1}.</span>
                  {point}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              <KeyRound size={16} className="text-cyan" />
              Recovery Surface
            </div>
            <h2 className="mt-5 font-space text-4xl font-bold">Forgot password</h2>
            <p className="mt-3 text-white/70">Request the OTP first, then submit the code with a new password to regain access.</p>
            <div className="mt-8 space-y-4">
              <input className="field" placeholder="Registered email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {sendingOtp ? (
                <Loader label="Sending recovery OTP..." />
              ) : (
                <button className="w-full rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.01]" onClick={sendOtp}>
                  Send OTP
                </button>
              )}
              <input className="field tracking-[0.35em]" placeholder="OTP" value={otpForm.otp} onChange={(e) => setOtpForm({ ...otpForm, otp: e.target.value.replace(/\D/g, "") })} />
              <div className="relative">
                <input
                  className="field pr-14"
                  placeholder="New password"
                  type={showPassword ? "text" : "password"}
                  value={otpForm.newPassword}
                  onChange={(e) => setOtpForm({ ...otpForm, newPassword: e.target.value })}
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 transition hover:text-cyan" type="button" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {resettingPassword ? (
                <Loader label="Resetting password..." />
              ) : (
                <button className="w-full rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30 hover:text-cyan" onClick={resetPassword}>
                  Reset password
                </button>
              )}
              {message && <p className="text-sm text-mint">{message}</p>}
              {error && <p className="text-sm text-coral">{error}</p>}
              <div className="flex items-center justify-between text-sm text-white/70">
                <Link to="/login">Back to login</Link>
                <Link to="/help-center">Help center</Link>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
    </AppShell>
  );
}
