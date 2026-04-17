export function AnimatedNoticeDialog({
  open,
  title,
  description,
  primaryLabel = "Okay",
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md animate-modal-fade-in">
      <div className="w-full max-w-lg rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,rgba(9,20,31,0.98),rgba(17,35,55,0.98))] p-6 shadow-2xl animate-modal-pop-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan">TrustShield AI</p>
            <h3 className="mt-4 text-3xl font-bold text-white">{title}</h3>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/60 transition hover:border-cyan/30 hover:text-white"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <p className="mt-4 text-base leading-8 text-white/72">{description}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {secondaryLabel ? (
            <button
              type="button"
              className="flex-1 rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30"
              onClick={onSecondary}
            >
              {secondaryLabel}
            </button>
          ) : null}
          <button
            type="button"
            className="flex-1 rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.01]"
            onClick={onPrimary}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}