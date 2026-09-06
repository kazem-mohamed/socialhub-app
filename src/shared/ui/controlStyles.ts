/**
 * One shell for every form control.
 *
 * Field, SelectField and Textarea previously each carried their own
 * borders, paddings and focus rules, so an input and a textarea sitting in
 * the same form did not match. This is the single description of what a
 * control looks like at rest, on hover, on focus, in error and disabled —
 * change it here and all three move together.
 */
export interface ControlStateOptions {
  hasError?: boolean;
  isDisabled?: boolean;
}

/** Border, ground and focus behaviour shared by input, select and textarea. */
export function controlShell({ hasError, isDisabled }: ControlStateOptions = {}): string {
  return [
    "w-full rounded-[2px] border bg-plate text-[15px] text-ink outline-none",
    "transition-[border-color,background-color,box-shadow] duration-200 ease-out",
    "placeholder:text-ink-3",
    hasError
      ? "border-verm bg-verm/[0.045] focus:border-verm"
      : "border-rail hover:border-rail-strong focus:border-verm",
    isDisabled ? "cursor-not-allowed opacity-50" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** The notation-voice label that sits above every control. */
export const CONTROL_LABEL_CLASS =
  "font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-ink-3";

/** Supporting copy under a control — requirements, formats, limits. */
export const CONTROL_HINT_CLASS = "mt-2 text-[12.5px] leading-relaxed text-ink-3";

/** Validation message under a control. */
export const CONTROL_ERROR_CLASS =
  "mt-2 flex items-start gap-1.5 font-mono text-[10px] leading-[1.5] tracking-[0.08em] text-verm-ink";

/** Comfortable hit area for a single-line control. */
export const CONTROL_PADDING = "px-3.5 py-2.5";
