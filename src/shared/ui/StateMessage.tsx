interface StateMessageProps {
  /** `error` tints the rule and the text; everything else stays neutral. */
  variant?: "neutral" | "error";
  /** `compact` is the inline strip used inside a row; `block` owns its own space. */
  size?: "block" | "compact";
  children: React.ReactNode;
}

/**
 * Loading, empty and error states.
 *
 * No card: in a ruled system a state is a bounded stretch of the column,
 * marked by hairlines and set in mono — the same notation voice as every
 * other label in the app. An error tints the rule vermilion rather than
 * introducing a second alert colour.
 */
export function StateMessage({
  variant = "neutral",
  size = "block",
  children,
}: StateMessageProps) {
  const isError = variant === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={[
        "border-y text-center font-mono tracking-[0.14em] uppercase",
        isError ? "border-verm/45 text-verm-ink" : "border-rail text-ink-3",
        size === "compact" ? "px-3 py-3 text-micro" : "px-4 py-10 text-micro",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
