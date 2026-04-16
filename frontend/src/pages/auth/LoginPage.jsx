import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { useAuth } from "../../context/AuthContext";
import { Loader } from "../../components/Loader";
import { withMinimumDelay } from "../../utils/withMinimumDelay";
import { frontendEnv } from "../../config/env";

const rolePanels = {
  USER: {
    eyebrow: "Worker access",
    title: "Enter the live protection workspace.",
    description: "Track account status, weekly coverage, operational signals, and claim outcomes from one protected surface with admin approval gating.",
    bullets: [
      "Email verification allows dashboard entry and status tracking.",
      "Full dashboard tools unlock only after admin approval.",
      "Your stored signup role decides whether worker, insurer, or platform dashboard opens.",
      "Signal ingestion and fraud-aware claims remain tied to your worker identity once the account is active."
    ]
  },
  ADMIN: {
    eyebrow: "Admin control",
    title: "Open the moderation and risk command center.",
    description: "Review verification queues, fraud alerts, graph evidence, queue health, and claim decisions without leaving the admin surface.",
    bullets: [
      "Review pending claims and resolve fraud alerts.",
      "Broadcast notifications and manage operator access.",
      "Inspect feature snapshots, graph links, and ops telemetry."
    ]
  }
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", expectedRole: "USER", rememberMe: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Invalid email");
      return;
    }
    if (!form.password) {
      setError("Invalid password");
      return;
    }

    setLoading(true);
    try {
      const data = await withMinimumDelay(login(form));
      navigate(data.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      if (err.status === "EMAIL_VERIFICATION_REQUIRED" && err.email) {
        navigate(`/verify-account?email=${encodeURIComponent(err.email)}`, {
          replace: true,
          state: {
            email: err.email,
            message: "Verify your account by OTP or secure email link before logging in."
          }
        });
        return;
      }
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.1),rgba(255,255,255,0.04))]">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              <Link className="rounded-full bg-cyan px-5 py-2 text-sm font-semibold text-ink" to="/login">
                Login
              </Link>
              <Link className="rounded-full px-5 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white" to="/signup">
                Signup
              </Link>
            </div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan">{rolePanels[form.expectedRole].eyebrow}</p>
            <h1 className="mt-4 max-w-3xl font-space text-5xl font-bold leading-tight sm:text-6xl">
              {rolePanels[form.expectedRole].title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">{rolePanels[form.expectedRole].description}</p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-cyan/20 bg-cyan/10 p-5">
                <ShieldCheck className="text-cyan" size={20} />
                <p className="mt-4 text-lg font-semibold">Protected access</p>
                <p className="mt-2 text-sm leading-7 text-white/68">Role-aware entry keeps worker and admin flows properly separated.</p>
              </div>
              <div className="rounded-[28px] border border-sand/20 bg-sand/10 p-5">
                <Workflow className="text-sand" size={20} />
                <p className="mt-4 text-lg font-semibold">Live workflows</p>
                <p className="mt-2 text-sm leading-7 text-white/68">Claims, alerts, and verification logic remain backed by database state.</p>
              </div>
              <div className="rounded-[28px] border border-mint/20 bg-mint/10 p-5">
                <Sparkles className="text-mint" size={20} />
                <p className="mt-4 text-lg font-semibold">Advanced UX</p>
                <p className="mt-2 text-sm leading-7 text-white/68">Fast entry surface with support links, password recovery, and verification redirects.</p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {rolePanels[form.expectedRole].bullets.map((item, index) => (
                <div key={item} className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-white/75">
                  <span className="mr-3 text-cyan">{index + 1}.</span>
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(118,228,247,0.04))]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              <LockKeyhole size={16} className="text-cyan" />
              Secure Session Entry
            </div>
            <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              <Link className="rounded-full bg-cyan px-5 py-2 text-sm font-semibold text-ink" to="/login">
                Login
              </Link>
              <Link className="rounded-full px-5 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white" to="/signup">
                Signup
              </Link>
            </div>
            <p className="mt-5 text-sm uppercase tracking-[0.28em] text-cyan">Welcome Back</p>
            <h2 className="mt-3 font-space text-4xl font-bold">Login to TrustShield AI</h2>
            <p className="mt-3 text-white/70">
              Sign in to continue your protected workflow. Role, approval state, and dashboard routing are restored automatically from your stored account.
            </p>
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-2 rounded-[24px] border border-white/10 bg-white/5 p-2">
                {[
                  { label: "User Login", value: "USER" },
                  { label: "Admin Login", value: "ADMIN" }
                ].map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                      form.expectedRole === role.value ? "bg-cyan text-ink" : "text-white/70 hover:bg-white/5"
                    }`}
                    onClick={() => setForm({ ...form, expectedRole: role.value })}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
              <input className="field" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <div className="relative">
                <input
                  className="field pr-14"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 transition hover:text-cyan"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <label className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                />
                Remember me on this device until the token expires
              </label>
              {error && <p className="text-sm text-coral">{error}</p>}
              {loading ? (
                <Loader label="Authenticating secure session..." />
              ) : (
                <button className="w-full rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.01]" type="submit">
                  Login
                </button>
              )}
            </form>
            <div className="mt-6 flex items-center justify-between text-sm text-white/70">
              <Link to="/forgot-password">Forgot password?</Link>
              <Link to="/signup">Create account</Link>
            </div>
            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan">Support</p>
              <p className="mt-2 text-sm leading-7 text-white/60">Contact support for verification, admin access, or account recovery: {frontendEnv.supportEmail}</p>
            </div>
          </GlassCard>
        </div>
      </section>
    </AppShell>
  );
}
