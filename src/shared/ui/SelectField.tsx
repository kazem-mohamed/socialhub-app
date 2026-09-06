import { forwardRef, useId } from "react";
import {
  CONTROL_ERROR_CLASS,
  CONTROL_HINT_CLASS,
  CONTROL_LABEL_CLASS,
  CONTROL_PADDING,
  controlShell,
} from "./controlStyles";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id" | "children"> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
}

/**
 * The select counterpart to {@link Field}.
 *
 * Native element, deliberately: it gives every platform its own picker —
 * a wheel on iOS, a sheet on Android — which no custom listbox matches for
 * one-of-four choices. The page only replaces the chrome around it: the
 * default arrow is swapped for a drawn chevron that answers hover and
 * focus, and an unchosen placeholder stays in muted grey so an empty
 * select never reads as a filled one.
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    { label, options, placeholder, error, hint, className, disabled, value, ...rest },
    ref,
  ) {
    const id = useId();
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const isEmpty = value === "" || value === undefined;

    const describedBy = [error ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={className}>
        <label htmlFor={id} className={CONTROL_LABEL_CLASS}>
          {label}
        </label>

        <div className="group/select relative mt-2">
          <select
            ref={ref}
            id={id}
            value={value}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            className={[
              controlShell({ hasError: Boolean(error), isDisabled: disabled }),
              CONTROL_PADDING,
              "cursor-pointer appearance-none pr-10",
              isEmpty ? "text-ink-3" : "text-ink",
            ].join(" ")}
            {...rest}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-3 transition-colors duration-200 group-hover/select:text-ink-2 group-focus-within/select:text-verm-ink"
          >
            <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
              <path
                d="M1 1L5.5 5.5L10 1"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
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
  },
);
