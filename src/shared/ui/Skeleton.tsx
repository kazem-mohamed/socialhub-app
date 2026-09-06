import { Plate } from "./Plate";

/** One shimmering block. Never used alone — it composes the shapes below. */
export function SkeletonBar({
  className,
  width,
}: {
  className?: string;
  width?: string;
}) {
  return (
    <span
      aria-hidden="true"
      style={width ? { width } : undefined}
      className={`skeleton block rounded-[2px] ${className ?? "h-3"}`}
    />
  );
}

/**
 * A plate whose label has not been written yet.
 *
 * It matches the real plate's geometry — same gutter for the colour chip,
 * same label rhythm — so content does not jump when it arrives. Widths
 * vary per index so a wall of them reads as different works rather than a
 * repeating pattern.
 */
export function PlateSkeleton({ index = 0 }: { index?: number }) {
  const bodyLines = [3, 2, 4, 2, 3][index % 5];
  const hasImage = index % 3 !== 1;

  return (
    <Plate as="article" className="overflow-hidden">
      {hasImage ? (
        <SkeletonBar className="h-48 w-full rounded-none" />
      ) : null}

      <div className="p-4">
        <div className="space-y-2">
          {Array.from({ length: bodyLines }).map((_, line) => (
            <SkeletonBar
              key={line}
              className="h-3"
              width={line === bodyLines - 1 ? "62%" : "100%"}
            />
          ))}
        </div>

        <div className="mt-5 flex items-start gap-3 border-t border-rail pt-4">
          <SkeletonBar className="h-6 w-1.5 shrink-0 rounded-[1px]" />
          <div className="flex-1 space-y-1.5">
            <SkeletonBar className="h-3" width="42%" />
            <SkeletonBar className="h-2.5" width="68%" />
          </div>
        </div>
      </div>
    </Plate>
  );
}

/** A wall of unwritten plates, for the feed's first paint. */
export function WallSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="contents">
      {Array.from({ length: count }).map((_, index) => (
        <PlateSkeleton key={index} index={index} />
      ))}
    </div>
  );
}

/** A row in a people list. */
export function PersonSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 border-b border-rail py-3.5">
      <SkeletonBar className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <SkeletonBar className="h-3" width="45%" />
        <SkeletonBar className="h-2.5" width="30%" />
      </div>
      <SkeletonBar className="h-7 w-20 shrink-0 rounded-[2px]" />
    </div>
  );
}
