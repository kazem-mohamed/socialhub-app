import { Link } from "react-router";
import { Avatar } from "@/shared/ui/Avatar";
import type { DiscoveredUser } from "../../model/user.types";

interface UserCardProps {
  user: DiscoveredUser;
  isFollowing: boolean;
  followersCount: number;
  isUpdating: boolean;
  /** `list` is the sidebar row, `grid` the wider two-column variant. */
  layout: "list" | "grid";
  onToggleFollow: () => void;
}

/**
 * One person, as a ruled row.
 *
 * The old version printed "1 mutual" on every card regardless of who was
 * being shown — the API returns no mutual-follower data, so the number was
 * decoration pretending to be a fact. It is gone.
 */
export function UserCard({
  user,
  isFollowing,
  followersCount,
  isUpdating,
  layout,
  onToggleFollow,
}: UserCardProps) {
  const isGrid = layout === "grid";

  return (
    <article className="flex items-center justify-between gap-3 border-t border-rail py-3.5">
      <Link
        to={`/profile/${user.id}`}
        className="group/user flex min-w-0 items-center gap-3"
      >
        <Avatar alt={user.name} seed={user.username} size={isGrid ? 40 : 34} src={user.photo} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink transition-colors duration-200 group-hover/user:text-verm-ink">
            {user.name}
          </p>
          <p className="truncate font-mono text-micro tracking-[0.06em] text-ink-3 tabular-nums">
            @{user.username} · {followersCount}
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={onToggleFollow}
        disabled={isUpdating}
        aria-pressed={isFollowing}
        className={`shrink-0 cursor-pointer border px-3 py-1.5 font-mono text-micro font-medium tracking-[0.14em] uppercase transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
          isFollowing
            ? "border-rail text-ink-3 hover:border-verm hover:text-verm-ink"
            : "border-verm text-verm-ink hover:bg-verm hover:text-on-verm"
        }`}
      >
        {isUpdating ? "…" : isFollowing ? "Following" : "Follow"}
      </button>
    </article>
  );
}
