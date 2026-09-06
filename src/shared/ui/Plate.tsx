interface PlateProps {
  children: React.ReactNode;
  /**
   * Phones get the plate full-bleed: no side borders, no corner radius, no
   * shadow. A mounted work on a wall has an edge; a sheet held in the hand
   * meets the edge of the screen.
   */
  isBleedOnMobile?: boolean;
  /** Lifts on hover — for plates that open something. */
  isInteractive?: boolean;
  /** Applied for shared-element view transitions between wall and record. */
  viewTransitionName?: string;
  as?: "div" | "article" | "section";
  className?: string;
}

/**
 * A mounted work.
 *
 * The plate is the only container in this system. It is a real surface —
 * lifted off the wall by an offset shadow with a soft blur, never by a
 * coloured halo — with a crisp archival edge rather than an app-rounded
 * one. Everything else on the page is a rule, a label, or air.
 */
export function Plate({
  children,
  isBleedOnMobile = false,
  isInteractive = false,
  viewTransitionName,
  as: Tag = "div",
  className,
}: PlateProps) {
  return (
    <Tag
      style={viewTransitionName ? { viewTransitionName } : undefined}
      className={[
        "border-rail bg-plate",
        isBleedOnMobile
          ? "border-y sm:rounded-[3px] sm:border sm:shadow-[var(--plate-shadow)]"
          : "rounded-[3px] border shadow-[var(--plate-shadow)]",
        isInteractive
          ? [
              "transition-[box-shadow,transform,border-color] duration-[240ms]",
              "[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
              "hover:-translate-y-[3px] hover:border-rail-strong",
              "hover:shadow-[var(--plate-shadow-lifted)]",
              // Pressing it settles the plate back against the wall.
              "active:translate-y-0 active:duration-100",
            ].join(" ")
          : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
