interface LabelProps {
  /** `accent` tints it vermilion — used for the one active/primary label in a group. */
  tone?: "muted" | "accent" | "strong";
  as?: "span" | "p" | "h2" | "h3" | "dt";
  className?: string;
  children: React.ReactNode;
}

const TONE_CLASS = {
  muted: "text-ink-3",
  accent: "text-verm-ink",
  strong: "text-ink-2",
} as const;

/**
 * The system's notation voice (docs/brand-guidelines.md §3): JetBrains Mono,
 * small, heavily tracked, uppercase. Everything that labels rather than
 * reads — section headings, counts, timestamps, states — is set this way,
 * which is what keeps mono out of prose while still giving every screen the
 * brand's texture.
 */
export function Label({
  tone = "muted",
  as: Tag = "span",
  className,
  children,
}: LabelProps) {
  return (
    <Tag
      className={[
        "font-mono text-micro font-medium tracking-[0.22em] uppercase",
        TONE_CLASS[tone],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
