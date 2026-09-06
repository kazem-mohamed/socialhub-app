import { forwardRef, useId, useState } from "react";
import {
  CONTROL_ERROR_CLASS,
  CONTROL_HINT_CLASS,
  CONTROL_LABEL_CLASS,
  CONTROL_PADDING,
  controlShell,
} from "./controlStyles";

/* `prefix` is also a (string) HTML attribute, so it is omitted before being
   redeclared as a slot. */
interface FieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "prefix"> {
  label: string;
  error?: string;
  /** Requirements or format notes, shown under the control. */
  hint?: string;
  /** Rendered at the right of the label row — e.g. a "forgot password" link. */
  action?: React.ReactNode;
  /** Icon or unit rendered inside the control's leading edge. */
  prefix?: React.ReactNode;
}

/**
 * A single-line form control.
 *
 * Password fields get a reveal toggle, because asking someone to type a
 * password they cannot check is the most common avoidable form failure.
 * The toggle is a real button, keyboard reachable, and announces its state.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, action, prefix, className, type = "text", disabled, ...rest },
  ref,
) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const [isRevealed, setIsRevealed] = useState(false);

  const isPassword = type === "password";
  const resolvedType = isPassword && isRevealed ? "text" : type;

  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={CONTROL_LABEL_CLASS}>
          {label}
        </label>
        {action}
      </div>

      <div className="relative mt-2">
        {prefix ? (
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3">
            {prefix}
          </span>
        ) : null}

        <input
          ref={ref}
          id={id}
          type={resolvedType}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={[
            controlShell({ hasError: Boolean(error), isDisabled: disabled }),
            CONTROL_PADDING,
            prefix ? "pl-10" : "",
            isPassword ? "pr-16" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setIsRevealed((shown) => !shown)}
            disabled={disabled}
            aria-pressed={isRevealed}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer font-mono text-micro font-medium tracking-[0.14em] text-ink-3 uppercase transition-colors duration-200 hover:text-ink disabled:cursor-not-allowed"
          >
            {isRevealed ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>

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
  );
});
