import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, Home, RefreshCcw, ShieldAlert } from "lucide-react";
import { AppShell } from "../layouts/AppShell";
import { GlassCard } from "../components/GlassCard";

export default function NotFoundPage() {
  return (
    <AppShell>
      <section className="mx-auto flex min-h-[78vh] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="h-full bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,148,120,0.06),rgba(255,255,255,0.04))]">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan">404 Signal Lost</p>
              <h1 className="mt-4 font-space text-6xl font-bold leading-none sm:text-7xl">Page not found</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
                The route you requested is outside the TrustShield AI grid. The protection engine is still online, but this page does not exist in the current system map.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className="inline-flex items-center gap-2 rounded-full bg-cyan px-5 py-3 font-semibold text-ink" to="/">
                  <Home size={18} />
                  Return Home
                </Link>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCcw size={18} />
                  Refresh Route
                </button>
              </div>
            </GlassCard>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12 }}>
            <GlassCard className="h-full">
              <div className="grid gap-4">
                <div className="rounded-3xl bg-white/5 p-5">
                  <ShieldAlert className="text-coral" />
                  <h2 className="mt-3 text-2xl font-bold">Suggested routes</h2>
                  <p className="mt-2 text-white/70">Try one of the verified product surfaces instead of this invalid path.</p>
                </div>
                <Link className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:border-cyan/30 hover:bg-black/30" to="/demo">
                  <Compass className="text-cyan" />
                  <p className="mt-3 font-semibold">Open Demo</p>
                  <p className="mt-1 text-sm text-white/60">See the end-to-end claim and payout journey.</p>
                </Link>
                <Link className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:border-cyan/30 hover:bg-black/30" to="/how-to-use">
                  <Compass className="text-cyan" />
                  <p className="mt-3 font-semibold">Open How To Use</p>
                  <p className="mt-1 text-sm text-white/60">Learn the worker and admin operational flow.</p>
                </Link>
                <Link className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:border-cyan/30 hover:bg-black/30" to="/login">
                  <Compass className="text-cyan" />
                  <p className="mt-3 font-semibold">Open Login</p>
                  <p className="mt-1 text-sm text-white/60">Authenticate into the live dashboard surfaces.</p>
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    </AppShell>
  );
}
