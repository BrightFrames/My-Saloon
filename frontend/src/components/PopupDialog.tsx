type PopupDialogProps = {
  open: boolean;
  title: string;
  message: string;
  tone?: "success" | "error" | "info" | "warning";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

const toneStyles = {
  success: {
    badge: "bg-emerald-100 text-emerald-700",
    ring: "ring-emerald-200/70",
    accent: "from-emerald-500 to-emerald-600",
  },
  error: {
    badge: "bg-rose-100 text-rose-700",
    ring: "ring-rose-200/70",
    accent: "from-rose-500 to-rose-600",
  },
  info: {
    badge: "bg-[#F4E9E5] text-[#6B554D]",
    ring: "ring-[#E7D6CF]",
    accent: "from-[#C49B89] to-[#6B554D]",
  },
  warning: {
    badge: "bg-amber-100 text-amber-700",
    ring: "ring-amber-200/70",
    accent: "from-amber-500 to-amber-600",
  },
};

export function PopupDialog({
  open,
  title,
  message,
  tone = "info",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: PopupDialogProps) {
  if (!open) return null;

  const styles = toneStyles[tone];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/55 px-4 py-6 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl ring-1 ${styles.ring}`}
      >
        <div className="mb-5 flex items-start gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${styles.accent} text-white shadow-lg`}
          >
            <span className="text-lg font-semibold">!</span>
          </div>
          <div className="flex-1">
            <div
              className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${styles.badge}`}
            >
              {tone}
            </div>
            <h3 className="font-serif text-2xl text-stone-900">{title}</h3>
          </div>
        </div>

        <p className="text-sm leading-6 text-stone-600">{message}</p>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
            >
              {cancelLabel}
            </button>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="rounded-xl bg-[#6B554D] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#5C4841]"
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
