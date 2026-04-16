import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquareHeart, ShieldCheck, Sparkles, Star } from "lucide-react";
import { AppShell } from "../layouts/AppShell";
import { GlassCard } from "../components/GlassCard";
import { Loader } from "../components/Loader";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { withMinimumDelay } from "../utils/withMinimumDelay";
import { frontendEnv } from "../config/env";

const categories = [
  { value: "UX", label: "UI / UX" },
  { value: "BUG", label: "Bug Report" },
  { value: "CLAIMS", label: "Claims" },
  { value: "POLICY", label: "Policy" },
  { value: "VERIFICATION", label: "Verification" },
  { value: "SUPPORT", label: "Support" },
  { value: "OTHER", label: "Other" }
];

export default function FeedbackPage() {
  const { token, user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    category: "UX",
    rating: 5,
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Invalid email");
      return;
    }
    if (!form.message.trim()) {
      setError("Feedback message is required");
      return;
    }

    setLoading(true);
    try {
      const data = await withMinimumDelay(
        api("/feedback", {
          method: "POST",
          token,
          body: {
            ...form,
            rating: Number(form.rating)
          }
        })
      );
      setMessage(data.message);
      setForm((current) => ({ ...current, category: "UX", rating: 5, message: "" }));
    } catch (err) {
      setError(err.message || "Unable to submit feedback");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan">Feedback Loop</p>
            <h1 className="mt-4 font-space text-5xl font-bold leading-tight sm:text-6xl">Tell us what feels strong and what needs work.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">
              TrustShield AI keeps a live feedback channel for workers, operators, and guests so product quality, workflows, and trust surfaces can keep improving.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-cyan/20 bg-cyan/10 p-5">
                <MessageSquareHeart className="text-cyan" size={20} />
                <p className="mt-4 text-lg font-semibold">Real inbox</p>
                <p className="mt-2 text-sm leading-7 text-white/68">Every feedback entry is stored in MongoDB and visible to admin operators.</p>
              </div>
              <div className="rounded-[28px] border border-sand/20 bg-sand/10 p-5">
                <ShieldCheck className="text-sand" size={20} />
                <p className="mt-4 text-lg font-semibold">Protected or public</p>
                <p className="mt-2 text-sm leading-7 text-white/68">Logged-in users submit with account context, while guests can still report issues manually.</p>
              </div>
              <div className="rounded-[28px] border border-mint/20 bg-mint/10 p-5">
                <Sparkles className="text-mint" size={20} />
                <p className="mt-4 text-lg font-semibold">Fast acknowledgement</p>
                <p className="mt-2 text-sm leading-7 text-white/68">A branded confirmation mail is sent immediately after submission.</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              <Star size={16} className="text-cyan" />
              Product Feedback
            </div>
            <h2 className="mt-5 font-space text-4xl font-bold">Send feedback</h2>
            <p className="mt-3 text-white/70">Share bugs, UX notes, claim issues, or support pain points. Support contact: {frontendEnv.supportEmail}</p>
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="field"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                />
                <input
                  className="field"
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  className="field"
                  value={form.category}
                  onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <select
                  className="field"
                  value={form.rating}
                  onChange={(e) => setForm((current) => ({ ...current, rating: Number(e.target.value) }))}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} Star{value > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className="field min-h-36"
                placeholder="Tell us what happened, what you expected, and what would make this better."
                value={form.message}
                onChange={(e) => setForm((current) => ({ ...current, message: e.target.value }))}
              />
              {message ? <p className="text-sm text-mint">{message}</p> : null}
              {error ? <p className="text-sm text-coral">{error}</p> : null}
              {loading ? (
                <Loader label="Submitting feedback..." />
              ) : (
                <button className="w-full rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.01]" type="submit">
                  Submit feedback
                </button>
              )}
            </form>
            <div className="mt-6 flex items-center justify-between text-sm text-white/70">
              <Link to="/help-center">Help center</Link>
              <Link to="/demo">View demo</Link>
            </div>
          </GlassCard>
        </div>
      </section>
    </AppShell>
  );
}
