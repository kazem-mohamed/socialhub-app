import { forwardRef } from "react";

type ButtonVariant = "primary" | "ghost" | "subtle" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Swaps the label for `busyLabel` and blocks the click. */
  isBusy?: boolean;
  busyLabel?: string;
  isFullWidth?: boolean;
}

/**
 * The one button in the system.
 *
 * Its signature is the vertical wipe (docs/brand-guidelines.md §6): a
 * vermilion field rises from the bottom edge on hover in 380ms. The label
 * sits on its own layer above the wipe, so nothing about the text moves —
 * only the ground behind it changes.
 *
 * Labels are set in Inter, sentence case. Mono is reserved for notation
 * (handles, counts, timestamps), which a button label is not.
 */
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "border-verm bg-verm text-on-verm hover:text-ink",
  ghost: "border-rail text-ink hover:border-verm hover:text-on-verm",
  subtle: "border-transparent text-ink-2 hover:text-ink",
  danger: "border-verm/60 text-verm-ink hover:border-verm hover:text-on-verm",
};

/** The wipe's colour: it rises *out* of a filled button and *into* an empty one. */
const WIPE_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-ground",
  ghost: "bg-verm",
  subtle: "bg-recess",
  danger: "bg-verm",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "ghost",
    size = "md",
    isBusy = false,
    busyLabel,
    isFullWidth = false,
    className,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isBusy}
      className={[
        "group/btn relative isolate cursor-pointer overflow-hidden border font-semibold",
        "transition-colors duration-300 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:text-inherit",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        isFullWidth ? "w-full" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={[
          "absolute inset-0 -z-10 origin-bottom scale-y-0 transition-transform duration-[380ms]",
          "[transition-timing-function:cubic-bezier(.16,1,.3,1)]",
          "group-hover/btn:scale-y-100 group-disabled/btn:hidden",
          WIPE_CLASS[variant],
        ].join(" ")}
      />
      <span className="relative">{isBusy ? (busyLabel ?? children) : children}</span>
    </button>
  );
});
