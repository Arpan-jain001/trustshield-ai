import { Link, useLocation } from "react-router-dom";
import { ArrowRight, BookOpenText, Globe, LifeBuoy, Mail, Shield, Sparkles } from "lucide-react";
import { frontendEnv } from "../config/env";

export function Footer() {
  const location = useLocation();
  const isDashboardSurface =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/notifications") ||
    location.pathname.startsWith("/settings") ||
    location.pathname.startsWith("/profile");

  return (
    <footer className="mx-auto mt-10 max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      {isDashboardSurface ? (
        <div className="ui-panel rounded-[28px] px-5 py-4 text-center text-sm text-white/60">
          © 2026 TrustShield AI. All rights reserved. || Developed by Arpan Jain (AJ001)
        </div>
      ) : (
        <div className="ui-panel relative overflow-hidden rounded-[36px] p-5 sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(118,228,247,0.15),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,215,168,0.14),transparent_28%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-[24px] border border-cyan/20 bg-cyan/12 p-3 shadow-[0_0_28px_rgba(118,228,247,0.14)]">
                  <Shield className="text-cyan" size={18} />
                </div>
                <div>
                  <p className="font-space text-xl font-bold text-white">TrustShield AI</p>
                  <p className="text-sm text-white/60">
                    Adversarially resilient parametric insurance for workers, providers, and platform operators.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.32em] text-cyan">
                  <Sparkles size={14} />
                  Public Trust Layer
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
                  Explore the product story, read the role guide, understand how the platform works, and move into protected dashboards only after the right trust checks are complete.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan px-5 py-3 font-semibold text-ink" to="/signup">
                    Get Protected
                    <ArrowRight size={16} />
                  </Link>
                  <Link className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white" to="/how-it-works">
                    <BookOpenText size={16} />
                    How It Works
                  </Link>
                </div>
              </div>

              <p className="mt-5 text-sm text-white/55">© 2026 TrustShield AI. All rights reserved. || Developed by Arpan Jain (AJ001)</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.25em] text-cyan">Docs</p>
                <div className="mt-4 space-y-2 text-sm text-white/75">
                  <Link className="flex items-center gap-2 transition hover:text-cyan" to="/how-it-works">
                    <BookOpenText size={16} className="text-cyan" />
                    How It Works
                  </Link>
                  <Link className="flex items-center gap-2 transition hover:text-cyan" to="/docs">
                    <BookOpenText size={16} className="text-cyan" />
                    How To Use
                  </Link>
                  <Link className="flex items-center gap-2 transition hover:text-cyan" to="/help-center">
                    <LifeBuoy size={16} className="text-cyan" />
                    Help Center
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.25em] text-cyan">Support</p>
                <div className="mt-4 flex break-all items-center gap-2 text-sm text-white/75 sm:break-normal">
                  <Mail size={16} className="text-cyan" />
                  {frontendEnv.supportEmail}
                </div>
                <a className="mt-4 flex break-all items-center gap-2 text-sm text-white/75 transition hover:text-cyan sm:break-normal" href={frontendEnv.siteUrl} target="_blank" rel="noreferrer">
                  <Globe size={16} className="text-cyan" />
                  {frontendEnv.siteUrl}
                </a>
                <p className="mt-4 text-sm leading-7 text-white/58">
                  Worker onboarding, provider configuration, dashboard access, and trust-flow support.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
