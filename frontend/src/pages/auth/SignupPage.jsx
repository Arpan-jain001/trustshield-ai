import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Orbit, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { useAuth } from "../../context/AuthContext";
import { Loader } from "../../components/Loader";
import { withMinimumDelay } from "../../utils/withMinimumDelay";
import { frontendEnv } from "../../config/env";
import { api } from "../../api/client";

const accountPanels = {
  WORKER: {
    title: "Worker onboarding",
    headline: "Create a protection-ready worker identity.",
    description:
      "Built for delivery partners and riders who need weekly disruption-led protection, claim visibility, and trust-aware decisions.",
    nameLabel: "Full name",
    locationLabel: "Primary city",
    orgLabel: "",
    submit: "Create worker account"
  },
  INSURER: {
    title: "Provider onboarding",
    headline: "Create an insurer and underwriting workspace.",
    description:
      "Built for insurance providers that need portfolio visibility, trust telemetry, review signals, and fair payout governance.",
    nameLabel: "Contact person name",
    locationLabel: "Operating city",
    orgLabel: "Provider / company name",
    submit: "Create provider account"
  },
  PLATFORM: {
    title: "Platform ops onboarding",
    headline: "Create a platform operations control identity.",
    description:
      "Built for payout and operations teams that need signal visibility, graph pressure tracking, and workflow monitoring.",
    nameLabel: "Ops lead name",
    locationLabel: "Primary operating city",
    orgLabel: "Platform / operations team",
    submit: "Create ops account"
  }
};

const coverageRules = [
  "Weekly subscription pricing only",
  "Income-loss protection from weather, pollution, or curfew disruption",
  "No health, life, accident, or vehicle insurance",
  "Email verification first, then admin approval for full dashboard access"
];

const targetUserGroups = [
  "Gig workers: delivery partners and riders",
  "Insurance providers offering parametric coverage",
  "Platforms managing real-time risk-based payouts"
];

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    location: "",
    workType: "ZOMATO",
    customWorkType: "",
    accountType: "WORKER",
    organizationName: "",
    linkedProviderId: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const currentPanel = accountPanels[form.accountType];

  useEffect(() => {
    let active = true;

    async function loadProviders() {
      setProvidersLoading(true);
      try {
        const data = await api("/auth/providers");
        if (!active) return;
        setProviders(data.providers || []);
        setForm((current) => ({
          ...current,
          linkedProviderId: current.linkedProviderId || data.providers?.[0]?.id || ""
        }));
      } catch {
        if (!active) return;
        setProviders([]);
      } finally {
        if (active) setProvidersLoading(false);
      }
    }

    loadProviders();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.name.trim()) {
      setError("Invalid name");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Invalid email");
      return;
    }
    if (form.password.length < 8) {
      setError("Invalid password");
      return;
    }
    if (!form.location.trim()) {
      setError("Invalid location");
      return;
    }
    if (form.accountType === "WORKER" && form.workType === "OTHER" && !form.customWorkType.trim()) {
      setError("Enter your work category");
      return;
    }
    if (form.accountType === "WORKER" && !form.linkedProviderId) {
      setError("Select the insurer/provider organization for this worker");
      return;
    }
    if (form.accountType !== "WORKER" && !form.organizationName.trim()) {
      setError("Enter your organization name");
      return;
    }

    setLoading(true);
    try {
      const data = await withMinimumDelay(signup(form));
      setMessage(data.message);
      navigate(`/verify-account?email=${encodeURIComponent(form.email)}`, {
        replace: true,
        state: {
          message: data.message,
          email: form.email
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(255,215,168,0.08),rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              <Link className="rounded-full px-5 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white" to="/login">
                Login
              </Link>
              <Link className="rounded-full bg-cyan px-5 py-2 text-sm font-semibold text-ink" to="/signup">
                Signup
              </Link>
            </div>
            <p className="text-sm uppercase tracking-[0.35em] text-sand">{currentPanel.title}</p>
            <h1 className="mt-4 max-w-3xl font-space text-5xl font-bold leading-tight sm:text-6xl">
              {currentPanel.headline}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">
              {currentPanel.description}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-cyan/20 bg-cyan/10 p-5">
                <ShieldCheck className="text-cyan" size={20} />
                <p className="mt-4 text-lg font-semibold">Verified identity</p>
                <p className="mt-2 text-sm leading-7 text-white/68">Signup first enters email verification, then moves into admin approval before full access opens.</p>
              </div>
              <div className="rounded-[28px] border border-sand/20 bg-sand/10 p-5">
                <Orbit className="text-sand" size={20} />
                <p className="mt-4 text-lg font-semibold">Signal-aware claims</p>
                <p className="mt-2 text-sm leading-7 text-white/68">Worker identity later links to signal ingestion, claims, and graph-based fraud evidence.</p>
              </div>
              <div className="rounded-[28px] border border-mint/20 bg-mint/10 p-5">
                <Sparkles className="text-mint" size={20} />
                <p className="mt-4 text-lg font-semibold">Fast onboarding</p>
                <p className="mt-2 text-sm leading-7 text-white/68">Responsive onboarding with OTP, secure mail link, and admin review status tracking.</p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {coverageRules.map((rule) => (
                <div key={rule} className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4 text-white/75">
                  <CheckCircle2 size={18} className="mt-1 text-cyan" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan">Target users</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {targetUserGroups.map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-white/62">
                Multi-modal trust architecture, AI-driven fraud detection, graph intelligence, and fair human-in-the-loop review are built to support genuine users while resisting spoofed or coordinated claims.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(118,228,247,0.03))]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              <Sparkles size={16} className="text-cyan" />
              Role-aware Protected Registration
            </div>
            <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              <Link className="rounded-full px-5 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white" to="/login">
                Login
              </Link>
              <Link className="rounded-full bg-cyan px-5 py-2 text-sm font-semibold text-ink" to="/signup">
                Signup
              </Link>
            </div>
            <p className="mt-5 text-sm uppercase tracking-[0.28em] text-cyan">Create Your Access</p>
            <h2 className="mt-3 font-space text-4xl font-bold">{currentPanel.title}</h2>
            <p className="mt-3 text-white/70">
              Choose the target role first. Login ke baad isi selected role ke according dashboard open hoga, aur email verification ke baad admin approval state bhi track hogi.
            </p>
            <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div className="sm:col-span-2 grid grid-cols-3 gap-2 rounded-[24px] border border-white/10 bg-white/5 p-2">
                {Object.entries(accountPanels).map(([key, panel]) => (
                  <button
                    key={key}
                    type="button"
                    className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                      form.accountType === key ? "bg-cyan text-ink" : "text-white/70 hover:bg-white/5"
                    }`}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        accountType: key,
                        workType: key === "WORKER" ? current.workType || "ZOMATO" : "OTHER",
                        customWorkType: key === "WORKER" ? current.customWorkType : key === "INSURER" ? "Insurance provider" : "Platform operations",
                        linkedProviderId: key === "WORKER" ? current.linkedProviderId || providers[0]?.id || "" : ""
                      }))
                    }
                  >
                    {key === "WORKER" ? "Worker" : key === "INSURER" ? "Insurer" : "Platform Ops"}
                  </button>
                ))}
              </div>
              <input className="field sm:col-span-2" placeholder={currentPanel.nameLabel} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
              <input className="field" placeholder={currentPanel.locationLabel} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              {form.accountType === "WORKER" ? (
                <>
                  <select
                    className="field"
                    value={form.workType}
                    onChange={(e) => setForm({ ...form, workType: e.target.value, customWorkType: e.target.value === "OTHER" ? form.customWorkType : "" })}
                  >
                    <option value="ZOMATO">Zomato</option>
                    <option value="SWIGGY">Swiggy</option>
                    <option value="ZEPTO">Zepto</option>
                    <option value="AMAZON">Amazon</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <select className="field sm:col-span-2" value={form.linkedProviderId} onChange={(e) => setForm({ ...form, linkedProviderId: e.target.value })} disabled={providersLoading}>
                    <option value="">{providersLoading ? "Loading provider organizations..." : "Select insurer / provider organization"}</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.organizationName} | {provider.location}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <input
                  className="field"
                  placeholder={currentPanel.orgLabel}
                  value={form.organizationName}
                  onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                />
              )}
              {form.accountType === "WORKER" && form.workType === "OTHER" ? (
                <input className="field sm:col-span-2" placeholder="Enter your work category" value={form.customWorkType} onChange={(e) => setForm({ ...form, customWorkType: e.target.value })} />
              ) : null}
              {form.accountType === "WORKER" ? (
                <p className="sm:col-span-2 text-sm text-white/55">Worker ki policy selected insurer/provider organization ke through issue hogi aur worker ka data sirf usi provider aur admin ko visible hoga.</p>
              ) : null}
              <p className="sm:col-span-2 text-sm text-white/55">Use at least 8 characters for the password.</p>
              {message && <p className="sm:col-span-2 text-sm text-mint">{message}</p>}
              {error && <p className="sm:col-span-2 text-sm text-coral">{error}</p>}
              <div className="sm:col-span-2">
                {loading ? (
                  <Loader label="Creating protected account..." />
                ) : (
                  <button className="w-full rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.01]" type="submit">
                    {currentPanel.submit}
                  </button>
                )}
              </div>
            </form>
            <div className="mt-6 flex items-center justify-between text-sm text-white/70">
              <span>
                Already registered? <Link to="/login">Login</Link>
              </span>
              <Link to="/help-center">Need help?</Link>
            </div>
            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan">Support</p>
              <p className="mt-2 text-sm leading-7 text-white/60">Contact support for onboarding, verification, or mail issues: {frontendEnv.supportEmail}</p>
            </div>
          </GlassCard>
        </div>
      </section>
    </AppShell>
  );
}
