import { NavLink } from "react-router";
import { HomeIcon, MessageCircleIcon, UserIcon, UsersIcon } from "@/shared/ui/icons";
import { routes } from "@/app/router/routes";
import { useUnreadNotificationCount } from "@/features/notifications/hooks/useNotifications";

/**
 * The index, on a phone.
 *
 * The same destinations as the desktop catalogue, moved to where a thumb
 * reaches. It carries icons and sits on a solid ground with a defined top
 * rule, because a bottom bar is read peripherally: an earlier version was
 * text-only mono at 11px on a translucent ground, and it was missed
 * entirely on first look.
 */
const DESTINATIONS = [
  { to: routes.home, label: "Wall", end: true, Icon: HomeIcon },
  { to: routes.people, label: "People", end: false, Icon: UsersIcon },
  { to: routes.notifications, label: "Notices", end: false, Icon: MessageCircleIcon },
  { to: routes.profile, label: "You", end: false, Icon: UserIcon },
] as const;

export function MobileDock() {
  const { data: unreadCount } = useUnreadNotificationCount();
  const unread = typeof unreadCount === "number" ? unreadCount : 0;

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rail-strong bg-plate shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg">
        {DESTINATIONS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            viewTransition
            className={({ isActive }) =>
              [
                "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1",
                "text-[11px] font-medium tracking-[0.01em]",
                "transition-colors duration-150",
                isActive ? "text-verm-ink" : "text-ink-3",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {/* The catalogue tab, reading along the top edge. */}
                <span
                  aria-hidden="true"
                  className={[
                    "absolute top-0 h-[2px] w-10 rounded-full bg-verm origin-center",
                    "transition-transform duration-200 ease-out",
                    isActive ? "scale-x-100" : "scale-x-0",
                  ].join(" ")}
                />

                <span className="relative">
                  <item.Icon size={21} />
                  {item.to === routes.notifications && unread > 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 -right-1.5 block h-2 w-2 rounded-full bg-verm ring-2 ring-plate"
                    />
                  ) : null}
                </span>

                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
