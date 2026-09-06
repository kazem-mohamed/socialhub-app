import { Link } from "react-router";
import { formatRelativeShort } from "@/shared/lib/dates";
import { auraRingColor } from "@/shared/lib/aura";
import { Avatar } from "@/shared/ui/Avatar";
import { routes } from "@/app/router/routes";
import type { AppNotification } from "../model/notification.types";
import { NotificationTypeIcon } from "./NotificationTypeIcon";

interface NotificationItemProps {
  notification: AppNotification;
  isMutating: boolean;
  onMarkRead: (notificationId: string) => void;
}

/**
 * One entry in the daybook.
 *
 * Unread is marked by the person's own colour standing at the leading edge
 * rather than by tinting the whole row — the text keeps full contrast
 * either way, and the mark tells you whose notice it is at the same time.
 */
export function NotificationItem({
  notification,
  isMutating,
  onMarkRead,
}: NotificationItemProps) {
  const profileHref = notification.actorId
    ? routes.userProfile(notification.actorId)
    : routes.profile;
  const isUnread = !notification.isRead;

  return (
    <article className="group/note flex items-start gap-3.5 border-b border-rail py-4">
      <span
        aria-hidden="true"
        className="mt-1 h-8 w-1.5 shrink-0 rounded-[1px] transition-opacity duration-150"
        style={{
          background: auraRingColor(notification.actorName),
          opacity: isUnread ? 1 : 0.28,
        }}
      />

      <div className="relative shrink-0">
        <Link to={profileHref} viewTransition aria-label={notification.actorName}>
          <Avatar
            alt={notification.actorName}
            seed={notification.actorName}
            size={36}
            src={notification.actorPhoto}
          />
        </Link>
        <span className="absolute -right-1 -bottom-1 grid h-[17px] w-[17px] place-items-center rounded-full border border-rail bg-plate text-ink-2">
          <NotificationTypeIcon type={notification.type} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-relaxed ${isUnread ? "text-ink" : "text-ink-2"}`}>
          <Link
            to={profileHref}
            viewTransition
            className="font-semibold text-ink transition-colors duration-150 hover:text-verm-ink"
          >
            {notification.actorName}
          </Link>{" "}
          {notification.content}
        </p>

        <div className="mt-1.5 flex items-center gap-4">
          <time
            dateTime={notification.createdAt ?? undefined}
            className="font-mono text-micro text-ink-3 tabular-nums"
          >
            {formatRelativeShort(notification.createdAt)}
          </time>

          {isUnread ? (
            <button
              type="button"
              onClick={() => onMarkRead(notification.id)}
              disabled={!notification.id || isMutating}
              className="cursor-pointer font-mono text-micro font-medium tracking-[0.12em] text-ink-3 uppercase transition-colors duration-150 hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isMutating ? "Marking" : "Mark read"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
