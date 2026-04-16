import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { MailCheck, RefreshCcw, ShieldCheck } from "lucide-react";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { Loader } from "../../components/Loader";
import { api } from "../../api/client";
import { withMinimumDelay } from "../../utils/withMinimumDelay";

export default function VerifyAccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    email: searchParams.get("email") || location.state?.email || "",
    otp: ""
  });
  const [message, setMessage] = useState(location.state?.message || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const token = searchParams.get("token") || "";

  useEffect(() => {
    if (!token || !form.email) return;

    let active = true;
    async function verifyWithLink() {
      setLoading(true);
      setError("");
      try {
        const data = await withMinimumDelay(
          api("/auth/verify-account", {
            method: "POST",
            body: { email: form.email, token }
          })
        );
        if (!active) return;
        setMessage(data.message);
        setTimeout(() => navigate("/login", { replace: true }), 2200);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Verification failed");
      } finally {
        if (active) setLoading(false);
      }
    }

    verifyWithLink();
    return () => {
      active = false;
    };
  }, [form.email, navigate, token]);

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Invalid email");
      return;
    }

    if (!form.otp.trim()) {
      setError("Enter the OTP sent to your email");
      return;
    }

    setLoading(true);
    try {
      const data = await withMinimumDelay(
        api("/auth/verify-account", {
          method: "POST",
          body: { email: form.email, otp: form.otp.trim() }
        })
      );
      setMessage(data.message);
      setTimeout(() => navigate("/login", { replace: true }), 2200);
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Invalid email");
      return;
    }

    setResending(true);
    try {
      const data = await withMinimumDelay(
        api("/auth/request-account-verification", {
          method: "POST",
          body: { email: form.email }
        })
      );
      setMessage(data.message);
    } catch (err) {
      setError(err.message || "Unable to resend verification");
    } finally {
      setResending(false);
    }
  }

  return (
    <AppShell>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.1),rgba(255,255,255,0.04))]">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan">Secure Verification</p>
          <h1 className="mt-4 font-space text-4xl font-bold sm:text-5xl">Verify your account before login.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
            TrustShield AI first verifies the worker email. After that, the account stays visible in the dashboard but full access unlocks only after admin approval.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: MailCheck, title: "OTP + Link", text: "Both verification paths are issued automatically during signup and login recovery." },
              { icon: ShieldCheck, title: "Two-step trust", text: "Email verification happens first, then admin approval decides whether full dashboard access unlocks." },
              { icon: RefreshCcw, title: "Always recoverable", text: "If you leave this page accidentally, logging in again will bring you back here." }
            ].map((item) => (
              <div key={item.title} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <item.icon className="text-cyan" size={20} />
                <p className="mt-4 text-lg font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-white/68">{item.text}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="font-space text-3xl font-bold">Account verification</h2>
          <p className="mt-3 text-white/70">Use the verification code from your inbox, or open the secure link from the same email. After this step, admin review will remain pending until approved.</p>
          <form className="mt-8 space-y-4" onSubmit={handleVerify}>
            <input
              className="field"
              placeholder="Registered email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((value) => ({ ...value, email: e.target.value }))}
            />
            <input
              className="field tracking-[0.35em]"
              placeholder="6 digit OTP"
              inputMode="numeric"
              maxLength={6}
              value={form.otp}
              onChange={(e) => setForm((value) => ({ ...value, otp: e.target.value.replace(/\D/g, "") }))}
            />
            {message ? <p className="text-sm text-mint">{message}</p> : null}
            {error ? <p className="text-sm text-coral">{error}</p> : null}
            {loading ? (
              <Loader label="Verifying protected account..." />
            ) : (
              <button className="w-full rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.01]" type="submit">
                Verify account
              </button>
            )}
          </form>
          <button
            className="mt-4 w-full rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30"
            type="button"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? "Sending new verification..." : "Resend OTP and secure link"}
          </button>
          <div className="mt-6 flex items-center justify-between text-sm text-white/70">
            <Link to="/login">Back to login</Link>
            <Link to="/help-center">Need help?</Link>
          </div>
        </GlassCard>
      </section>
    </AppShell>
  );
}
