import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpenText, BrainCircuit, Building2, CheckCircle2, Download, LifeBuoy, Radar, ShieldCheck, Sparkles, Truck, Users, Waypoints } from "lucide-react";
import { AppShell } from "../layouts/AppShell";
import { GlassCard } from "../components/GlassCard";
import { OrbScene } from "../components/OrbScene";
import { frontendEnv } from "../config/env";
import { downloadGuide } from "../utils/downloadGuide";

const copy = {
  badge: "Zero-trust parametric insurance for adversarial environments",
  title: "TrustShield AI protects worker income with provider-backed policies, fraud-aware claims, and role-based control surfaces.",
  description:
    "Workers buy policies from the provider organization they are linked to. Providers see only their own workforce. Ops keeps the trust pipeline healthy. Admin controls verification and governance across the system.",
  ctaPrimary: "Create account",
  ctaSecondary: "Open docs",
  ctaTertiary: "Download PDF guide",
  supportLabel: "Support line",
  siteLabel: "Live site",
  whatTitle: "What is TrustShield AI?",
  whatBody:
    "TrustShield AI is an adversarially resilient parametric insurance platform built for gig workers, providers, and payout operators. It replaces fragile GPS-only trust with a zero-trust decision engine that combines provider-linked policies, signal fusion, anomaly intelligence, graph defense, and human review.",
  chooseTitle: "Why choose us?",
  chooseSubtitle: "Designed for real-world fraud pressure, fast support, and long-term payout sustainability.",
  sectionsTitle: "How the platform is actually used",
  sectionsSubtitle: "Every role gets a different surface, different permissions, and different responsibilities.",
  reasonsTitle: "Why teams use TrustShield AI",
  rolesTitle: "Role-based platform surfaces",
  flowTitle: "Complete protected journey",
  footerCtaTitle: "Need onboarding help before you sign up?",
  footerCtaBody: "Read the full guide, check the help center, or contact support before opening a protected role.",
  roleCards: [
    {
      icon: Truck,
      title: "Worker dashboard",
      text: "Workers sign up under a selected insurer/provider, buy weekly policies, ingest signals, simulate claims, and view claim, payout, fraud, and risk evidence.",
      can: "Can buy or renew policy from the linked provider and view only their own records.",
      cannot: "Cannot moderate accounts, change provider rules, or operate system queues."
    },
    {
      icon: ShieldCheck,
      title: "Insurer / Provider dashboard",
      text: "Providers configure underwriting posture, simulate pricing, and inspect only their linked workers, issued policies, and provider-tagged claims.",
      can: "Can manage provider configuration and provider-owned portfolio visibility.",
      cannot: "Cannot see another provider's workers or perform admin moderation."
    },
    {
      icon: Building2,
      title: "Platform Ops dashboard",
      text: "Ops teams monitor queue activity, graph pressure, feature snapshots, retry failed jobs, and trigger model-training workflows.",
      can: "Can keep the trust and processing pipeline healthy.",
      cannot: "Cannot buy policies, issue policies, or verify users."
    },
    {
      icon: Users,
      title: "Admin dashboard",
      text: "Admin controls the trust boundary by verifying, rejecting, suspending, or banning users, and by reviewing claims and fraud alerts.",
      can: "Can approve access and inspect full-system evidence.",
      cannot: "Should not act as worker, provider, or ops for daily role workflows."
    }
  ],
  reasons: [
    "Multi-modal verification reduces GPS-only fraud exposure.",
    "Provider-linked visibility protects worker data isolation.",
    "Admin approval adds a second trust gate after email verification.",
    "Providers, ops, and admins each get purpose-built dashboards.",
    "OpenWeather and IP geolocation signals improve disruption evidence."
  ],
  flow: [
    "Choose Worker, Insurer, or Platform Ops during signup.",
    "Verify email by OTP or secure mail link.",
    "Admin reviews the account before full dashboard actions unlock.",
    "Workers buy policies from the linked provider organization.",
    "Claims use real telemetry, weather, and anti-spoof checks.",
    "Only the linked provider and admin can inspect that worker's portfolio trail."
  ],
  whatCards: [
    {
      icon: BrainCircuit,
      title: "Zero-trust intelligence",
      text: "Claims do not depend on one fragile signal. Location, device, behavior, network, and cluster risk all contribute to the final decision."
    },
    {
      icon: ShieldCheck,
      title: "Provider-linked ownership",
      text: "Workers buy policies from their selected provider organization, and protected portfolio data stays limited to that provider and admin."
    },
    {
      icon: Waypoints,
      title: "Operational trust chain",
      text: "Workers, insurers, ops teams, and admins each get role-specific visibility instead of one generic dashboard for everyone."
    }
  ],
  chooseCards: [
    {
      icon: Radar,
      title: "Built for adversarial environments",
      text: "TrustShield is designed to resist spoofing, synchronized fraud, and manipulated claims before payouts move."
    },
    {
      icon: Sparkles,
      title: "Fast but fair decisions",
      text: "Genuine users can move quickly, while suspicious activity is slowed down through soft verification and manual review."
    },
    {
      icon: Building2,
      title: "Scales across organizations",
      text: "Providers manage their own workforce book, ops keeps the pipeline healthy, and admins govern access centrally."
    }
  ]
};

export default function HomePage() {
  return (
    <AppShell>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:pt-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="inline-flex max-w-full rounded-full border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm text-cyan">{copy.badge}</div>
          <div>
            <h1 className="max-w-5xl font-space text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">{copy.title}</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/70 sm:text-lg">{copy.description}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link className="rounded-full bg-cyan px-6 py-3 text-center font-semibold text-ink" to="/signup">
              {copy.ctaPrimary}
            </Link>
            <Link className="rounded-full border border-white/15 px-6 py-3 text-center font-semibold text-white" to="/docs">
              {copy.ctaSecondary}
            </Link>
            <Link className="rounded-full border border-white/15 px-6 py-3 text-center font-semibold text-white" to="/how-it-works">
              How It Works
            </Link>
            <button className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan/25 bg-cyan/10 px-6 py-3 font-semibold text-cyan" onClick={() => downloadGuide()}>
              <Download size={18} />
              {copy.ctaTertiary}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {copy.reasons.slice(0, 3).map((item) => (
              <div key={item} className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-white/78">
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
          <GlassCard className="overflow-hidden">
            <OrbScene />
            <div className="space-y-4">
              <div className="flex flex-col gap-2 rounded-3xl bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-white/70">Provider-linked worker policy</span>
                <span className="font-bold text-cyan">Issued by selected insurer</span>
              </div>
              <div className="flex flex-col gap-2 rounded-3xl bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-white/70">Trust fabric</span>
                <span className="font-bold text-sand">Weather + IP + telemetry + graph</span>
              </div>
              <div className="flex flex-col gap-2 rounded-3xl bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-white/70">Role surfaces</span>
                <span className="font-bold text-mint">Worker / Provider / Ops / Admin</span>
              </div>
              <div className="grid gap-4 rounded-3xl bg-gradient-to-r from-cyan/20 to-sand/20 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-sand">{copy.supportLabel}</p>
                  <p className="mt-2 break-all text-white/80">{frontendEnv.supportEmail || "Set VITE_SUPPORT_EMAIL"}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-sand">{copy.siteLabel}</p>
                  <a className="mt-2 block break-all text-white/80 transition hover:text-cyan" href={frontendEnv.siteUrl} target="_blank" rel="noreferrer">
                    {frontendEnv.siteUrl}
                  </a>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan">{copy.whatTitle}</p>
            <h2 className="mt-4 max-w-3xl font-space text-4xl font-bold">{copy.whatBody}</h2>
            <div className="mt-6 grid gap-4">
              {copy.whatCards.map((item) => (
                <div key={item.title} className="rounded-3xl bg-white/5 p-5">
                  <item.icon className="text-cyan" />
                  <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 leading-7 text-white/70">{item.text}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="bg-[linear-gradient(145deg,rgba(255,215,168,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.35em] text-sand">{copy.chooseTitle}</p>
            <h2 className="mt-4 max-w-3xl font-space text-4xl font-bold">{copy.chooseSubtitle}</h2>
            <div className="mt-6 grid gap-4">
              {copy.chooseCards.map((item) => (
                <div key={item.title} className="rounded-3xl bg-white/5 p-5">
                  <item.icon className="text-sand" />
                  <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 leading-7 text-white/70">{item.text}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan">{copy.rolesTitle}</p>
          <h2 className="mt-3 font-space text-3xl font-bold sm:text-4xl">{copy.sectionsTitle}</h2>
          <p className="mt-4 text-white/70">{copy.sectionsSubtitle}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {copy.roleCards.map((item) => (
            <GlassCard key={item.title} className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
              <item.icon className="text-cyan" />
                <h3 className="mt-4 text-xl font-bold sm:text-2xl">{item.title}</h3>
              <p className="mt-3 leading-8 text-white/72">{item.text}</p>
              <div className="mt-5 rounded-3xl bg-white/5 p-4 text-sm text-white/78">
                <span className="font-semibold text-mint">Can:</span> {item.can}
              </div>
              <div className="mt-3 rounded-3xl bg-white/5 p-4 text-sm text-white/78">
                <span className="font-semibold text-coral">Cannot:</span> {item.cannot}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(255,215,168,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.35em] text-sand">{copy.reasonsTitle}</p>
            <div className="mt-6 space-y-3">
              {copy.reasons.map((point) => (
                <div key={point} className="rounded-3xl bg-white/5 p-4 text-white/78">
                  {point}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan">{copy.flowTitle}</p>
            <div className="mt-6 space-y-3">
              {copy.flow.map((item, index) => (
                <div key={item} className="flex items-start gap-3 rounded-3xl bg-white/5 p-4">
                  <CheckCircle2 size={18} className="mt-1 text-cyan" />
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-white/45">Step {index + 1}</p>
                    <p className="mt-1 text-white/78">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <GlassCard className="bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(118,228,247,0.08),rgba(255,215,168,0.06))]">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan">{copy.footerCtaTitle}</p>
              <h2 className="mt-3 text-3xl font-bold">{copy.footerCtaBody}</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white" to="/help-center">
                <LifeBuoy size={18} />
                Help Center
              </Link>
              <Link className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white" to="/how-it-works">
                <BookOpenText size={18} />
                How It Works
              </Link>
              <Link className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white" to="/docs">
                <BookOpenText size={18} />
                Docs
              </Link>
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan px-5 py-3 font-semibold text-ink" onClick={() => downloadGuide()}>
                <Download size={18} />
                PDF
              </button>
            </div>
          </div>
        </GlassCard>
      </section>
    </AppShell>
  );
}
