import type { PostsFilter as PostsFilterValue } from "../model/post.types";

interface PostsFilterProps {
  activeFilter: PostsFilterValue;
  onFilterChange: (filter: PostsFilterValue) => void;
}

/**
 * The rooms of the collection.
 *
 * These are a filter of one wall, not four destinations — which is why they
 * live at the head of the wall rather than in the catalogue index. The
 * active room carries the same vermilion mark the index uses, so "you are
 * here" reads identically wherever it appears.
 */
const ROOMS: { key: PostsFilterValue; label: string }[] = [
  { key: "community", label: "Everyone" },
  { key: "feed", label: "Following" },
  { key: "my-posts", label: "Yours" },
  { key: "saved", label: "Saved" },
];

export function PostsFilter({ activeFilter, onFilterChange }: PostsFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Rooms"
      className="-mx-1 flex gap-1 overflow-x-auto pb-px"
    >
      {ROOMS.map((room) => {
        const isActive = activeFilter === room.key;
        return (
          <button
            key={room.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(room.key)}
            className={[
              "group/room relative shrink-0 cursor-pointer rounded-[2px] px-3 py-1.5",
              "text-sm transition-colors duration-150",
              isActive
                ? "font-semibold text-ink"
                : "font-medium text-ink-3 hover:text-ink-2",
            ].join(" ")}
          >
            {room.label}
            <span
              aria-hidden="true"
              className={[
                "absolute inset-x-3 -bottom-px h-[2px] origin-left rounded-full bg-verm",
                "transition-transform duration-200 ease-out",
                isActive ? "scale-x-100" : "scale-x-0",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
