import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

/** Below this, a request finished fast enough that a bar would only flicker. */
const APPEAR_AFTER_MS = 220;

/**
 * The fetch rule.
 *
 * One hairline across the very top of the window whenever the collection is
 * being consulted or changed. It replaces nothing visible — skeletons still
 * own first paint — but it accounts for the background work a skeleton
 * cannot show: a refetch, a like in flight, an upload.
 *
 * It waits before appearing, so a request that returns quickly never causes
 * a flash of loading chrome.
 */
export function FetchRule() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const isBusy = fetching + mutating > 0;

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isBusy) {
      setIsVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setIsVisible(true), APPEAR_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [isBusy]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px] overflow-hidden transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="fetch-rule block h-full w-full bg-verm" />
    </div>
  );
}
