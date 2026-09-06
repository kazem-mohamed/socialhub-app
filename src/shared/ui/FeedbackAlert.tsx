import type { AlertState } from "./alertState";

interface FeedbackAlertProps {
  state: AlertState;
  wrapperClassName?: string;
  onClose: () => void;
}

/**
 * Inline success / failure feedback.
 *
 * One rule, one mono line. Success and failure differ only by which side
 * the marker sits on and its colour — success is the user's own progress so
 * it stays quiet in foreground grey; failure earns the vermilion, because a
 * problem is the one thing that should pull the eye.
 */
export function FeedbackAlert({ state, wrapperClassName, onClose }: FeedbackAlertProps) {
  if (!state.isVisible) return null;

  const isProblem = state.color === "danger" || state.color === "warning";

  return (
    <div className={wrapperClassName}>
      <div
        role={isProblem ? "alert" : "status"}
        className={`flex items-start gap-3 border-l-[1px] py-2.5 pl-3.5 ${
          isProblem ? "border-verm" : "border-fg-3"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p
            className={`font-mono text-micro font-medium tracking-[0.18em] uppercase ${
              isProblem ? "text-verm-ink" : "text-ink-3"
            }`}
          >
            {state.title}
          </p>
          {state.description ? (
            <p className="mt-1 text-sm leading-relaxed text-ink-2">{state.description}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 cursor-pointer font-mono text-micro tracking-[0.14em] text-ink-3 uppercase transition-colors duration-200 hover:text-ink"
        >
          Close
        </button>
      </div>
    </div>
  );
}
