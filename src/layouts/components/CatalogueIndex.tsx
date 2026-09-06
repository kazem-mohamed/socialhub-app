import { NavLink } from "react-router";
import { accessionNumber } from "@/shared/lib/aura";
import { Avatar } from "@/shared/ui/Avatar";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { Wordmark } from "@/shared/ui/Wordmark";
import { routes } from "@/app/router/routes";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { useUnreadNotificationCount } from "@/features/notifications/hooks/useNotifications";

/**
 * The catalogue index.
 *
 * A collection is entered through its index, not through a banner across
 * the top: destinations run down the left edge as catalogue sections, and
 * the wall fills the rest. This is what replaced the top bar — the single
 * biggest reason the previous build read as the same layout in new colours.
 */
const SECTION_CLASS =
  "px-3 pt-6 pb-2 font-mono text-micro font-medium uppercase tracking-[0.18em] text-ink-3";

function IndexLink({
  to,
  label,
  end,
  badge,
}: {
  to: string;
  label: string;
  end?: boolean;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      viewTransition
      className={({ isActive }) =>
        [
          "group/idx relative flex items-center justify-between gap-2 rounded-[2px] px-3 py-[7px]",
          "text-sm transition-colors duration-150",
          isActive
            ? "bg-recess font-semibold text-ink"
            : "font-medium text-ink-2 hover:bg-recess/60 hover:text-ink",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {/* The catalogue tab: a vermilion mark on the entry you are in. */}
          <span
            aria-hidden="true"
            className={[
              "absolute top-1/2 left-0 h-4 w-[2px] -translate-y-1/2 rounded-full bg-verm",
              "origin-center transition-transform duration-200 ease-out",
              isActive ? "scale-y-100" : "scale-y-0",
            ].join(" ")}
          />
          <span className="truncate">{label}</span>
          {badge && badge > 0 ? (
            <span className="shrink-0 font-mono text-micro text-verm-ink tabular-nums">
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}

export function CatalogueIndex() {
  const { signOut } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const { data: unreadCount } = useUnreadNotificationCount();

  const displayName = currentUser?.name ?? "You";
  const handle = currentUser?.handle ?? displayName;
  const unread = typeof unreadCount === "number" ? unreadCount : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-6 pb-2">
        <NavLink
          to={routes.home}
          viewTransition
          className="inline-block transition-opacity duration-150 hover:opacity-70"
          aria-label="Aura, the wall"
        >
          <Wordmark className="block w-[72px]" />
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <p className={SECTION_CLASS}>Collection</p>
        <div className="space-y-0.5">
          <IndexLink to={routes.home} label="The wall" end />
          <IndexLink to={routes.people} label="People" />
          <IndexLink to={routes.notifications} label="Notices" badge={unread} />
        </div>

        <p className={SECTION_CLASS}>You</p>
        <div className="space-y-0.5">
          <IndexLink to={routes.profile} label="Your collection" />
          <IndexLink to={routes.settings} label="Settings" />
        </div>
      </nav>

      <div className="border-t border-rail p-3">
        <div className="flex items-center gap-2.5">
          <Avatar alt={displayName} seed={handle} size={32} src={currentUser?.photo} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
            <p className="truncate font-mono text-micro text-ink-3 tabular-nums">
              {accessionNumber(handle)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={signOut}
            className="cursor-pointer rounded-[2px] px-2 py-1.5 font-mono text-micro font-medium tracking-[0.14em] text-ink-3 uppercase transition-colors duration-150 hover:bg-recess hover:text-verm-ink"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
