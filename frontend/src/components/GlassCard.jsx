export function GlassCard({ className = "", children }) {
  return (
    <div
      className={`ui-panel group relative overflow-hidden rounded-[28px] p-5 shadow-glass transition duration-500 hover:-translate-y-1 hover:scale-[1.01] hover:border-cyan/30 hover:bg-white/10 sm:p-6 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(118,228,247,0.16),transparent_35%)] opacity-80 transition duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.08),transparent)] opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}
