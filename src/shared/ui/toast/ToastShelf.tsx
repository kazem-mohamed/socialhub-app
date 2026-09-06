import { CloseIcon } from "../icons";
import type { Toast, ToastTone } from "./ToastProvider";

interface ToastShelfProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

/** Only a problem interrupts a screen reader; the rest are polite. */
const TONE_ROLE: Record<ToastTone, "status" | "alert"> = {
  note: "status",
  saved: "status",
  problem: "alert",
};

const TONE_EDGE: Record<ToastTone, string> = {
  note: "border-l-rail-strong",
  saved: "border-l-gold-ink",
  problem: "border-l-verm",
};

const TONE_LABEL: Record<ToastTone, string> = {
  note: "text-ink-3",
  saved: "text-gold-ink",
  problem: "text-verm-ink",
};

/**
 * Condition notes, stacked bottom-right.
 *
 * Each is a small plate that slides in from the edge and files itself away.
 * It clears the phone dock rather than sitting on top of it, and the
 * container is click-through so a note never blocks the work underneath.
 */
export function ToastShelf({ toasts, onDismiss }: ToastShelfProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:items-end sm:px-6 sm:pb-6 lg:pb-6"
    >
      {toasts.map((toast) => (
        <article
          key={toast.id}
          role={TONE_ROLE[toast.tone]}
          className={[
            "toast-note pointer-events-auto w-full max-w-[400px] rounded-[3px] border border-l-2 border-rail bg-plate",
            "shadow-[var(--plate-shadow-lifted)]",
            TONE_EDGE[toast.tone],
          ].join(" ")}
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p
                className={`font-mono text-micro font-medium tracking-[0.16em] uppercase ${TONE_LABEL[toast.tone]}`}
              >
                {toast.title}
              </p>
              {toast.body ? (
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{toast.body}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss"
              className="-mr-1 shrink-0 cursor-pointer rounded-[2px] p-1.5 text-ink-3 transition-colors duration-150 hover:bg-recess hover:text-ink"
            >
              <CloseIcon size={14} />
            </button>
          </div>

          {/* The time it has left, drawn as a rule retracting along the edge. */}
          {toast.duration > 0 ? (
            <span
              aria-hidden="true"
              className="toast-timer block h-[2px] origin-left bg-rail-strong"
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          ) : null}
        </article>
      ))}
    </div>
  );
}
