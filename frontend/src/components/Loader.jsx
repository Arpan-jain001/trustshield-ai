export function Loader({ label = "Loading..." }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      {label}
    </div>
  );
}
