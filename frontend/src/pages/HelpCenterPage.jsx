import { Link } from "react-router-dom";
import { Download, LifeBuoy, Mail, ShieldCheck, Sparkles, KeyRound, Workflow, MessageSquareHeart } from "lucide-react";
import { AppShell } from "../layouts/AppShell";
import { GlassCard } from "../components/GlassCard";
import { frontendEnv } from "../config/env";
import { downloadGuide } from "../utils/downloadGuide";

const copy = {
  badge: "Help Center",
  title: "Understand the flows before you depend on them.",
  description: "Use this page for support, onboarding clarification, verification help, and role-specific guidance.",
  cards: [
    {
      title: "Verification support",
      text: "Email verification is required before normal access, and admin approval controls when protected actions fully unlock."
    },
    {
      title: "Role guidance",
      text: "Workers, providers, ops, and admins have different dashboards, different permissions, and different ownership boundaries."
    },
    {
      title: "Policy ownership",
      text: "Worker policies are issued through the selected provider organization, and the worker's protected data is visible only to that provider and admin."
    }
  ],
  notes: [
    "Forgot Password helps with password recovery only. It does not replace account verification.",
    "Workers can still view account status while admin review is pending.",
    "Provider dashboards are limited to provider-owned workers, policies, and claims.",
    "Platform Ops is for operational trust-pipeline monitoring and queue controls."
  ],
  support: "Need a real person?",
  actions: "Quick support actions",
  download: "Download PDF guide"
};

const supportActions = [
  { icon: Sparkles, label: "Create account", to: "/signup" },
  { icon: ShieldCheck, label: "Open verification", to: "/verify-account" },
  { icon: KeyRound, label: "Reset password", to: "/forgot-password" },
  { icon: Workflow, label: "Docs", to: "/docs" },
  { icon: MessageSquareHeart, label: "Feedback", to: "/feedback" }
];

export default function HelpCenterPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan">{copy.badge}</p>
          <h1 className="mt-4 font-space text-5xl font-bold leading-tight sm:text-6xl">{copy.title}</h1>
          <p className="mt-5 text-lg leading-8 text-white/70">{copy.description}</p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {copy.cards.map((card) => (
            <GlassCard key={card.title} className="bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(118,228,247,0.04))]">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan">{card.title}</p>
              <p className="mt-4 leading-8 text-white/70">{card.text}</p>
            </GlassCard>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <GlassCard>
            <h2 className="flex items-center gap-3 text-2xl font-bold">
              <ShieldCheck className="text-cyan" size={22} />
              Important support notes
            </h2>
            <div className="mt-5 space-y-3">
              {copy.notes.map((item, index) => (
                <div key={item} className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-white/75">
                  <span className="mr-3 text-cyan">{index + 1}.</span>
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="space-y-5">
            <GlassCard className="bg-[linear-gradient(145deg,rgba(255,215,168,0.08),rgba(118,228,247,0.06),rgba(255,255,255,0.04))]">
              <h2 className="flex items-center gap-3 text-2xl font-bold">
                <LifeBuoy className="text-sand" size={22} />
                {copy.support}
              </h2>
              <p className="mt-4 leading-8 text-white/70">Reach support for verification problems, onboarding confusion, role selection questions, or access issues.</p>
              <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.25em] text-cyan">Support Email</p>
                <p className="mt-3 inline-flex items-center gap-3 text-lg font-semibold">
                  <Mail size={18} className="text-cyan" />
                  {frontendEnv.supportEmail}
                </p>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">{copy.actions}</h2>
                <button className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white" onClick={() => downloadGuide()}>
                  <Download size={16} />
                  {copy.download}
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {supportActions.map((action) => (
                  <Link
                    key={action.label}
                    className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-white/80 transition hover:border-cyan/25"
                    to={action.to}
                  >
                    <action.icon size={18} className="text-cyan" />
                    {action.label}
                  </Link>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
