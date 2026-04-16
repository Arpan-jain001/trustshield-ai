import { motion } from "framer-motion";
import { ArrowRight, Bot, CheckCircle2, CloudRain, RefreshCcw, ShieldAlert, Wallet, Waypoints, Radar, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "../layouts/AppShell";
import { GlassCard } from "../components/GlassCard";

const steps = [
  {
    icon: CheckCircle2,
    title: "1. Identity and verification",
    text: "A worker signs up, enters the account verification flow, and moves into a protected state before any operational dashboard can be accessed."
  },
  {
    icon: ShieldAlert,
    title: "2. Policy activation",
    text: "Once the account is ready, the worker creates a weekly policy with AI-supported pricing, clear premium breakdown, and coverage hours."
  },
  {
    icon: CloudRain,
    title: "3. Live disruption and ingestion",
    text: "Environmental signals and worker telemetry move through the ingestion pipeline, building feature snapshots and graph links before the claim decision stage."
  },
  {
    icon: Radar,
    title: "4. Fraud and anomaly intelligence",
    text: "Signal fusion, cluster insight, anomaly scoring, and graph-based evidence work together to decide whether the claim is safe, suspicious, or review-worthy."
  },
  {
    icon: Bot,
    title: "5. AI decision support",
    text: "Gemini-assisted reasoning and stored model artifacts enrich the final claim score with explainable decision context and chatbot-ready summaries."
  },
  {
    icon: Wallet,
    title: "6. Review, payout, and operations",
    text: "Approved claims produce payout totals, review claims enter the admin queue, and fraud alerts can be resolved with reason tracking and operator oversight."
  }
];

const demoStreams = [
  "Email verification + OTP mail flow",
  "Weekly pricing with live disruption context",
  "Feature store snapshots and fraud graph edges",
  "Manual review queue and fraud alert resolution",
  "Worker notifications and admin broadcast center",
  "Responsive dashboards with charts and evidence panels"
];

const operatorChecklist = [
  "Create a worker account and finish verification.",
  "Login as worker and buy a weekly policy.",
  "Ingest worker signals to populate the feature store.",
  "Run a trigger simulation to generate a database-backed claim.",
  "Inspect fraud score, anomaly verdict, and decision reason.",
  "Login as admin to review flagged claims or resolve alerts."
];

export default function DemoPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan">Interactive Demo Flow</p>
          <h1 className="mt-4 font-space text-5xl font-bold leading-tight sm:text-6xl">
            Walk through the full TrustShield AI operating loop.
          </h1>
          <p className="mt-5 text-lg leading-8 text-white/70">
            This public demo map shows how verification, pricing, signal ingestion, fraud intelligence, review workflows, and payout visibility work together in one adversarial-first product.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-cyan px-5 py-3 font-semibold text-ink"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw size={18} />
              Refresh Demo
            </button>
            <Link className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white" to="/signup">
              Start live flow
            </Link>
          </div>
        </motion.div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <GlassCard className="h-full bg-[linear-gradient(180deg,rgba(118,228,247,0.08),rgba(255,255,255,0.03))]">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-cyan/15 p-3">
                    <step.icon className="text-cyan" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                    <p className="mt-3 leading-8 text-white/70">{step.text}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]">
          <GlassCard>
            <p className="text-sm uppercase tracking-[0.3em] text-sand">Operator checklist</p>
            <div className="mt-5 space-y-3">
              {operatorChecklist.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-3xl bg-white/5 p-4">
                  <ArrowRight size={18} className="text-cyan" />
                  <span className="text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="bg-[linear-gradient(145deg,rgba(181,245,200,0.08),rgba(255,255,255,0.04))]">
            <p className="text-sm uppercase tracking-[0.3em] text-mint">Platform layers</p>
            <div className="mt-5 space-y-3">
              {demoStreams.map((item) => (
                <div key={item} className="rounded-3xl bg-white/5 p-4 text-white/80">
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan">Demo pulse</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-sm text-white/50">Processing philosophy</p>
                <p className="mt-2 font-semibold">Zero-trust, review-capable, fraud-aware</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-sm text-white/50">Decision route</p>
                <p className="mt-2 font-semibold">Approve, reject, or manual review</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-sm text-white/50">Coverage boundary</p>
                <p className="mt-2 font-semibold">Income loss only from external disruption</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-sm text-white/50">Ops visibility</p>
                <p className="mt-2 inline-flex items-center gap-2 font-semibold">
                  <Activity size={16} className="text-cyan" />
                  Feature store, graph edges, review queue
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
    </AppShell>
  );
}
