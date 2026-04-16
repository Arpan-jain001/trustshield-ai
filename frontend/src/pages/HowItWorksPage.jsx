import { motion } from "framer-motion";
import { Download, Globe, Link as LinkIcon, Radar, ShieldCheck, Waypoints, Workflow, BrainCircuit, Building2, LifeBuoy } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "../layouts/AppShell";
import { GlassCard } from "../components/GlassCard";
import { frontendEnv } from "../config/env";
import { downloadGuide } from "../utils/downloadGuide";

const sections = [
  {
    icon: Workflow,
    title: "1. Signup and trust bootstrapping",
    body:
      "Users sign up as Worker, Insurer, or Platform Ops. Workers choose the insurer/provider organization they work under. Email verification happens first, then admin approval decides when full protected actions unlock."
  },
  {
    icon: Radar,
    title: "2. Policy ownership and issuer mapping",
    body:
      "Workers do not buy policies from a generic pool. They buy from the linked provider organization, which becomes the issuer for policy ownership, claims, and protected portfolio visibility."
  },
  {
    icon: BrainCircuit,
    title: "3. Multi-signal verification",
    body:
      "TrustShield AI combines weather, IP intelligence, device context, motion telemetry, traffic context, graph links, and anomaly signals. This replaces fragile GPS-only trust with layered evidence."
  },
  {
    icon: Waypoints,
    title: "4. Claim decision pipeline",
    body:
      "Claims move through ingestion, signal fusion, anomaly scoring, graph pressure analysis, composite risk scoring, and then into approve, soft verification, or manual review."
  },
  {
    icon: Building2,
    title: "5. Provider-side controls",
    body:
      "Insurers publish policy products, configure underwriting posture, manage liquidity, and review only the claims issued under their own organization."
  },
  {
    icon: ShieldCheck,
    title: "6. Ops and admin governance",
    body:
      "Platform Ops handles queue processing, job replay, model workflows, and incidents. Admin remains the final trust gate for verification, moderation, fraud review, and governance."
  }
];

const roleNotes = [
  {
    title: "Worker",
    text: "Can buy provider-issued policy products, ingest signals, simulate claims, and inspect personal history. Cannot configure provider rules or review other accounts."
  },
  {
    title: "Insurer / Provider",
    text: "Can publish products, manage underwriting and liquidity, and review provider-linked claims. Cannot inspect another provider's workers or perform admin moderation."
  },
  {
    title: "Platform Ops",
    text: "Can process queues, replay jobs, create incidents, and inspect system health. Cannot issue policies or moderate user trust status."
  },
  {
    title: "Admin",
    text: "Can verify, reject, suspend, or ban users and inspect cross-system evidence. Admin decides when protected actions fully unlock."
  }
];

export default function HowItWorksPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan">How It Works</p>
          <h1 className="mt-4 font-space text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Full workflow documentation for how TrustShield AI actually operates.
          </h1>
          <p className="mt-5 text-base leading-8 text-white/72 sm:text-lg">
            This page explains role onboarding, provider-linked policy issuance, trust verification, claim routing, admin governance, and who can see what inside the platform.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan px-5 py-3 font-semibold text-ink" onClick={() => downloadGuide()}>
              <Download size={18} />
              Download PDF
            </button>
            <a className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white" href={frontendEnv.siteUrl} target="_blank" rel="noreferrer">
              <Globe size={18} />
              Open Live Site
            </a>
          </div>
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan">Core Flow</p>
            <div className="mt-6 space-y-4">
              {sections.map((section) => (
                <div key={section.title} className="rounded-3xl bg-white/5 p-5">
                  <div className="flex items-start gap-3">
                    <section.icon className="mt-1 text-cyan" size={20} />
                    <div>
                      <h2 className="text-xl font-bold">{section.title}</h2>
                      <p className="mt-3 leading-8 text-white/72">{section.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard>
              <p className="text-sm uppercase tracking-[0.3em] text-sand">Site URL</p>
              <div className="mt-4 rounded-3xl bg-white/5 p-5">
                <a className="inline-flex items-start gap-3 break-all text-white/85 transition hover:text-cyan" href={frontendEnv.siteUrl} target="_blank" rel="noreferrer">
                  <LinkIcon size={18} className="mt-1 text-cyan" />
                  {frontendEnv.siteUrl}
                </a>
              </div>
            </GlassCard>

            <GlassCard className="bg-[linear-gradient(145deg,rgba(255,215,168,0.08),rgba(255,255,255,0.04))]">
              <p className="text-sm uppercase tracking-[0.3em] text-sand">Role Permissions</p>
              <div className="mt-5 space-y-3">
                {roleNotes.map((item) => (
                  <div key={item.title} className="rounded-3xl bg-white/5 p-4">
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-white/72">{item.text}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan">Need More?</p>
              <div className="mt-5 flex flex-col gap-3">
                <Link className="rounded-full border border-white/15 px-5 py-3 text-center font-semibold text-white transition hover:border-cyan/25" to="/docs">
                  Open Role Guide
                </Link>
                <Link className="rounded-full border border-white/15 px-5 py-3 text-center font-semibold text-white transition hover:border-cyan/25" to="/help-center">
                  <span className="inline-flex items-center gap-2">
                    <LifeBuoy size={16} />
                    Help Center
                  </span>
                </Link>
                <Link className="rounded-full border border-white/15 px-5 py-3 text-center font-semibold text-white transition hover:border-cyan/25" to="/signup">
                  Start Signup
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
