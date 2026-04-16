import { motion } from "framer-motion";
import { Download, LifeBuoy, RefreshCcw, ShieldCheck, Users, Workflow, Building2, Truck } from "lucide-react";
import { AppShell } from "../layouts/AppShell";
import { GlassCard } from "../components/GlassCard";
import { downloadGuide } from "../utils/downloadGuide";

const copy = {
  badge: "Docs / How To Use",
  title: "Use TrustShield AI with the right role, the right expectations, and the right approval flow.",
  description:
    "This guide explains what happens after signup, what each dashboard can do, what it cannot do, and why the role-based model matters.",
  refresh: "Refresh guide",
  download: "Download PDF guide",
  journeyTitle: "Protected onboarding journey",
  notesTitle: "Important usage notes",
  roles: [
    {
      icon: Truck,
      title: "Worker",
      items: [
        "Signup as Worker and select your insurer/provider organization.",
        "Email verification is mandatory before login proceeds normally.",
        "You can open the dashboard while admin review is pending, but full actions stay locked.",
        "After admin approval, you can buy or renew weekly policies from the linked provider.",
        "You can ingest signals, queue stream events, simulate claims, and inspect risk, fraud, and payout history."
      ]
    },
    {
      icon: ShieldCheck,
      title: "Insurer / Provider",
      items: [
        "Signup as Insurer and create the provider identity for your organization.",
        "After approval, the provider can configure underwriting posture and run pricing simulations.",
        "The provider sees only workers linked to that provider during signup.",
        "Issued policies and claims are limited to that provider's own portfolio."
      ]
    },
    {
      icon: Building2,
      title: "Platform Ops",
      items: [
        "Signup as Platform Ops for operational and system-health workflows.",
        "Ops users can process queue jobs, retry failures, and monitor graph pressure and feature snapshots.",
        "Ops users cannot issue policies or moderate account verification."
      ]
    },
    {
      icon: Users,
      title: "Admin",
      items: [
        "Admin verifies, rejects, suspends, or bans accounts.",
        "Admin reviews claims, resolves fraud alerts, and inspects cross-system data.",
        "Admin approval unlocks full dashboard actions for user accounts."
      ]
    }
  ],
  lifecycle: [
    "Choose the correct role during signup.",
    "Verify your email using OTP or the secure link.",
    "Wait for admin review if your role requires protected access.",
    "Open the dashboard and review current account status.",
    "Perform only the actions allowed for your role.",
    "Use Help Center or support email if onboarding gets blocked."
  ],
  quickFacts: [
    "Workers take policies from the linked provider organization, not from a generic global pool.",
    "Only the linked provider and admin can inspect a worker's protected portfolio trail.",
    "Platform Ops is for pipeline operations, not policy ownership.",
    "Admin is the trust gate for protected full access."
  ]
};

export default function HowToUsePage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan">{copy.badge}</p>
          <h1 className="mt-4 font-space text-5xl font-bold leading-tight sm:text-6xl">{copy.title}</h1>
          <p className="mt-5 text-lg leading-8 text-white/70">{copy.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <button className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white" onClick={() => window.location.reload()}>
              <RefreshCcw size={18} />
              {copy.refresh}
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan px-5 py-3 font-semibold text-ink" onClick={() => downloadGuide()}>
              <Download size={18} />
              {copy.download}
            </button>
          </div>
        </motion.div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {copy.roles.map((section, index) => (
            <motion.div key={section.title} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
              <GlassCard className="h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(118,228,247,0.04))]">
                <section.icon className="text-cyan" size={22} />
                <h2 className="mt-4 text-2xl font-bold">{section.title}</h2>
                <div className="mt-5 space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <div key={item} className="rounded-3xl bg-white/5 p-4 text-white/80">
                      <span className="mr-3 text-cyan">{itemIndex + 1}.</span>
                      {item}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
            <h2 className="flex items-center gap-3 text-2xl font-bold">
              <Workflow className="text-cyan" size={22} />
              {copy.journeyTitle}
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {copy.lifecycle.map((item, index) => (
                <div key={item} className="rounded-3xl bg-white/5 p-4">
                  <p className="text-sm uppercase tracking-[0.25em] text-cyan">Step {index + 1}</p>
                  <p className="mt-2 text-white/80">{item}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="space-y-4">
            <GlassCard>
              <h2 className="text-2xl font-bold">{copy.notesTitle}</h2>
              <div className="mt-4 space-y-3">
                {copy.quickFacts.map((fact) => (
                  <div key={fact} className="rounded-3xl bg-white/5 p-4 text-white/75">
                    {fact}
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard className="bg-[linear-gradient(145deg,rgba(255,215,168,0.08),rgba(255,255,255,0.04))]">
              <h2 className="flex items-center gap-3 text-2xl font-bold">
                <LifeBuoy className="text-sand" size={22} />
                Support and docs
              </h2>
              <p className="mt-4 leading-8 text-white/75">Use this page as the canonical role guide. The downloadable PDF contains the same core flow in a shareable format for demos, onboarding, and project review.</p>
            </GlassCard>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
