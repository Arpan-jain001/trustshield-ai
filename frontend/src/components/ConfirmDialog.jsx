export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(9,20,31,0.98),rgba(17,35,55,0.96))] p-6 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan">Confirmation</p>
        <h3 className="mt-4 text-3xl font-bold text-white">{title}</h3>
        <p className="mt-4 leading-8 text-white/70">{description}</p>
        <div className="mt-8 flex gap-3">
          <button
            className="flex-1 rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="flex-1 rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.01]"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
