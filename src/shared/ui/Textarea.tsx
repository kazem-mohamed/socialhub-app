import { forwardRef, useId } from "react";
import {
  CONTROL_ERROR_CLASS,
  CONTROL_HINT_CLASS,
  CONTROL_LABEL_CLASS,
  controlShell,
} from "./controlStyles";

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  /** Visually hidden unless `showLabel` — every control still needs a name. */
  label: string;
  showLabel?: boolean;
  error?: string;
  hint?: string;
  /** Shows a live remaining-characters count against `maxLength`. */
  showCount?: boolean;
  value?: string;
}

/**
 * Multi-line input — the same shell as {@link Field}, in the shape a
 * paragraph needs. When a limit exists the remaining count is shown rather
 * than silently swallowing the keystrokes past it.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, showLabel = false, error, hint, showCount = false, className, disabled, maxLength, value, ...rest },
  ref,
) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const length = typeof value === "string" ? value.length : 0;
  const remaining = typeof maxLength === "number" ? maxLength - length : null;
  const isTight = remaining !== null && remaining <= 40;

  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={showLabel ? `mb-2 block ${CONTROL_LABEL_CLASS}` : "sr-only"}
      >
        {label}
      </label>

      <textarea
        ref={ref}
        id={id}
        value={value}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={[
          controlShell({ hasError: Boolean(error), isDisabled: disabled }),
          "resize-none px-3.5 py-3 leading-relaxed",
        ].join(" ")}
        {...rest}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {hint ? (
            <p id={hintId} className={CONTROL_HINT_CLASS}>
              {hint}
            </p>
          ) : null}

          {error ? (
            <p id={errorId} className={CONTROL_ERROR_CLASS}>
              <span aria-hidden="true">—</span>
              <span>{error}</span>
            </p>
          ) : null}
        </div>

        {showCount && remaining !== null ? (
          <span
            className={`mt-2 shrink-0 font-mono text-micro tracking-[0.1em] tabular-nums ${
              isTight ? "text-verm-ink" : "text-ink-3"
            }`}
          >
            {remaining}
          </span>
        ) : null}
      </div>
    </div>
  );
});
