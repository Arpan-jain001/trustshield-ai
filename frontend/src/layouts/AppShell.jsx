import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo } from "react";

export function AppShell({ children }) {
  const { user } = useAuth();
  const effectiveTheme = useMemo(() => {
    const selectedTheme = user?.settings?.theme || "SYSTEM";
    return selectedTheme === "SYSTEM" ? "CLASSIC" : selectedTheme;
  }, [user?.settings?.theme]);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("theme-light", "theme-dark", "theme-night", "theme-classic");
    if (effectiveTheme === "LIGHT") {
      root.classList.add("theme-light");
    } else if (effectiveTheme === "DARK") {
      root.classList.add("theme-dark");
    } else if (effectiveTheme === "NIGHT") {
      root.classList.add("theme-night");
    } else {
      root.classList.add("theme-classic");
    }
  }, [effectiveTheme]);

  const shellClass =
    effectiveTheme === "LIGHT"
      ? "bg-[radial-gradient(circle_at_top_left,#d9f3ff,transparent_30%),radial-gradient(circle_at_top_right,#ffe4d6,transparent_28%),linear-gradient(135deg,#fdfefe,#edf6ff_42%,#f7fbff)] text-slate-900"
      : effectiveTheme === "NIGHT"
        ? "bg-[radial-gradient(circle_at_18%_10%,rgba(83,243,255,0.2),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(255,202,122,0.16),transparent_28%),linear-gradient(135deg,#020611,#071225_40%,#0a1830)] text-white"
        : effectiveTheme === "DARK"
          ? "bg-[radial-gradient(circle_at_20%_8%,rgba(83,243,255,0.18),transparent_28%),radial-gradient(circle_at_84%_20%,rgba(255,202,122,0.12),transparent_30%),linear-gradient(135deg,#071521,#10253b_40%,#173652)] text-white"
        : "bg-[radial-gradient(circle_at_22%_10%,rgba(83,243,255,0.2),transparent_30%),radial-gradient(circle_at_88%_22%,rgba(255,202,122,0.14),transparent_30%),linear-gradient(135deg,#06131f,#0d2135_40%,#112f49)] text-white";

  return (
    <div className={`relative min-h-screen overflow-hidden ${shellClass}`}>
      <div className={`pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full blur-3xl ${effectiveTheme === "LIGHT" ? "bg-cyan/30" : "bg-cyan/10"}`} />
      <div className={`pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full blur-3xl ${effectiveTheme === "LIGHT" ? "bg-orange-200/30" : effectiveTheme === "DARK" ? "bg-indigo-400/10" : "bg-sand/10"}`} />
      <div className={`pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full blur-3xl ${effectiveTheme === "LIGHT" ? "bg-sky-200/30" : "bg-mint/10"}`} />
      <div className="pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]">
        <div className="absolute left-[8%] top-[18%] h-32 w-32 rounded-[32px] border border-white/8 bg-white/5 backdrop-blur-sm" />
        <div className="absolute right-[12%] top-[12%] h-20 w-20 rounded-full border border-cyan/15 bg-cyan/8" />
        <div className="absolute left-[18%] bottom-[12%] h-24 w-24 rounded-full border border-mint/15 bg-mint/8" />
        <div className="absolute right-[22%] bottom-[18%] h-28 w-28 rounded-[30px] border border-sand/15 bg-sand/8 backdrop-blur-sm" />
      </div>
      {effectiveTheme === "LIGHT" ? (
        <>
          <div className="pointer-events-none absolute right-[8%] top-28 h-28 w-28 rounded-full border border-white/60 bg-white/40 blur-sm" />
          <div className="pointer-events-none absolute left-[12%] top-[34%] h-16 w-16 rounded-full border border-cyan/20 bg-cyan/10" />
          <div className="pointer-events-none absolute right-[18%] bottom-[16%] h-20 w-20 rounded-[28px] rotate-12 border border-orange-200/40 bg-white/30 backdrop-blur-sm" />
        </>
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(transparent,rgba(255,255,255,0.02))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_36%)]" />
      <div className={`absolute inset-0 ${effectiveTheme === "LIGHT" ? "opacity-30 [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)]" : "opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]"} [background-size:64px_64px]`} />
      {effectiveTheme === "NIGHT" ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="shooting-star left-[8%] top-[18%]" />
          <span className="shooting-star delay-1000 left-[28%] top-[10%]" />
          <span className="shooting-star delay-2000 left-[55%] top-[16%]" />
          <span className="shooting-star delay-3000 left-[74%] top-[8%]" />
        </div>
      ) : null}
      <div className="relative">
        <Navbar />
        {children}
        <Footer />
      </div>
    </div>
  );
}
