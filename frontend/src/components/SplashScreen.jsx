import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Waypoints } from "lucide-react";

export function SplashScreen({ visible }) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[120] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(19,63,102,0.9),transparent_30%),linear-gradient(135deg,#020611,#07182b_42%,#123453)]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: "easeOut" } }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:68px_68px] opacity-20" />
          <motion.div
            className="absolute left-1/2 top-[22%] h-72 w-72 -translate-x-1/2 rounded-full bg-cyan/20 blur-3xl"
            animate={{ scale: [0.9, 1.15, 1], opacity: [0.4, 0.8, 0.55] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[18%] right-[14%] h-56 w-56 rounded-full bg-sand/15 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />

          <div className="relative flex min-h-screen items-center justify-center px-6">
            <div className="w-full max-w-3xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mx-auto max-w-2xl rounded-[36px] border border-white/10 bg-white/8 px-8 py-10 shadow-[0_35px_90px_rgba(2,6,17,0.45)] backdrop-blur-2xl"
              >
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-cyan/25 bg-cyan/12 shadow-[0_0_45px_rgba(118,228,247,0.22)]">
                  <Shield className="text-cyan" size={42} />
                </div>

                <motion.div
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.38em] text-cyan"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Sparkles size={14} />
                  TrustShield AI
                </motion.div>

                <motion.h1
                  className="mt-6 font-space text-4xl font-bold text-white sm:text-5xl"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                >
                  Zero-Trust Protection Engine
                </motion.h1>

                <motion.p
                  className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/70 sm:text-base"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.34 }}
                >
                  Warming up live trust layers, secure routing, provider-linked policy context, and adversarial defense signals.
                </motion.p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    "Signal fusion online",
                    "Provider isolation ready",
                    "Fraud graph synced"
                  ].map((item, index) => (
                    <motion.div
                      key={item}
                      className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.42 + index * 0.08 }}
                    >
                      {item}
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-center gap-3 text-white/65">
                  <Waypoints className="text-cyan" size={18} />
                  <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-cyan via-sand to-mint"
                      initial={{ x: "-100%" }}
                      animate={{ x: ["-100%", "0%", "100%"] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
