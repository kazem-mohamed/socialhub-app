import { Link } from "react-router";
import { accessionNumber } from "@/shared/lib/aura";
import { Avatar } from "./Avatar";

interface TombstoneLabelProps {
  name: string;
  handle: string;
  photo?: string | null;
  /** ISO string; rendered as the acquisition date. */
  date?: string | null;
  dateLabel: string;
  profileHref: string;
  /** `wall` sits under a plate; `record` heads a full object page. */
  variant?: "wall" | "record";
  /** Trailing slot — the post menu on a record. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * The label beside a work.
 *
 * It states facts and nothing else: who made it, its catalogue number, and
 * when it entered the collection.
 *
 * The author's portrait carries their aura as its ring, so the measured
 * colour and the face arrive together — a separate colour chip alongside it
 * was saying the same thing twice.
 */
export function TombstoneLabel({
  name,
  handle,
  photo,
  dateLabel,
  profileHref,
  variant = "wall",
  action,
  className,
}: TombstoneLabelProps) {
  const isRecord = variant === "record";
  const accession = accessionNumber(handle);

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <Link
        to={profileHref}
        viewTransition
        className="shrink-0 transition-transform duration-200 ease-out hover:scale-[1.06]"
        aria-label={name}
      >
        <Avatar alt={name} seed={handle} size={isRecord ? 44 : 38} src={photo} />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to={profileHref}
          viewTransition
          className={[
            "block truncate font-semibold tracking-[-0.01em] text-ink",
            "transition-colors duration-150 hover:text-verm-ink",
            isRecord ? "text-lg" : "text-base",
          ].join(" ")}
        >
          {name}
        </Link>

        <p
          className={[
            "mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-ink-3 tabular-nums",
            isRecord ? "text-label" : "text-micro",
          ].join(" ")}
        >
          <span className="truncate">{handle}</span>
          <span aria-hidden="true" className="text-rail-strong">
            ·
          </span>
          <span>{dateLabel}</span>
          {/* The number nobody chose. Held back on the wall so the label
              stays two lines; stated in full on the record. */}
          {isRecord ? (
            <>
              <span aria-hidden="true" className="text-rail-strong">
                ·
              </span>
              <span className="tracking-[0.06em]">{accession}</span>
            </>
          ) : null}
        </p>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
