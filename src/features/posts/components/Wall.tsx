/**
 * The hang.
 *
 * One line of works, each below the last, in a single column held to a
 * reading measure. A gallery hangs in a line far more often than it tiles a
 * grid, and a feed is read rather than scanned — masonry buries recency in
 * whichever column happens to be short.
 *
 * The column is centred in the content area rather than filling it, so the
 * works keep a comfortable measure on a wide screen instead of stretching.
 */
export function Wall<T>({
  items,
  getKey,
  renderItem,
  /** Rendered above the first work — the composer sits here. */
  lead,
}: {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  lead?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-px sm:gap-6">
      {lead}
      {items.map((item, index) => (
        <div key={getKey(item)}>{renderItem(item, index)}</div>
      ))}
    </div>
  );
}
