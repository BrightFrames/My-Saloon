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
    <div className="fixed inset-x-4 top-4 z-80 flex w-auto flex-col sm:left-1/2 sm:top-6 sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:px-0">
      <div
        className={`w-full overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ${styles.ring} animate-in fade-in slide-in-from-top-4 duration-300`}
      >
        <div className="flex items-start gap-4 p-4 sm:p-5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${styles.accent} text-white shadow-md`}
          >
            <span className="text-base font-bold">!</span>
          </div>
          <div className="flex-1 pt-1">
            <h3 className="text-base font-semibold text-stone-900">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              {message}
            </p>

            {(onCancel || onConfirm) && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="min-h-11 rounded-lg border border-stone-200 px-4 py-2 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
                  >
                    {cancelLabel}
                  </button>
                )}
                {onConfirm && (
                  <button
                    onClick={onConfirm}
                    className="min-h-11 rounded-lg bg-[#6B554D] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#5C4841]"
                  >
                    {confirmLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
