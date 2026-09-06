import { useState } from "react";
import { getErrorMessage } from "@/shared/api/errors";
import { Plate } from "@/shared/ui/Plate";
import { PersonSkeleton } from "@/shared/ui/Skeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../hooks/useNotifications";
import type { NotificationFilter } from "../model/notification.types";
import { NotificationItem } from "./NotificationItem";

/**
 * The daybook.
 *
 * What has happened to your works since you last looked, in one plain
 * column. The two filters use the same underline the rooms use, so "you are
 * here" reads identically across every screen.
 */
export function NotificationsPanel() {
  const { isAuthenticated } = useAuth();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const onlyUnread = activeFilter === "unread";

  const { data: notifications = [], isLoading, error } = useNotifications(onlyUnread);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const actionError = markOne.error ?? markAll.error;
  const isReady = !isLoading && !error;

  return (
    <div className="min-h-screen bg-ground">
      <div className="mx-auto max-w-[680px] px-5 py-8 sm:px-8 sm:py-12">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink">Notices</h1>
            <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-ink-2">
              Everything that has happened to your works.
            </p>
          </div>

          <button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={!isAuthenticated || markAll.isPending || unreadCount <= 0}
            className="shrink-0 cursor-pointer rounded-[2px] border border-rail px-3 py-1.5 font-mono text-micro font-medium tracking-[0.12em] text-ink-2 uppercase transition-colors duration-150 hover:border-rail-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {markAll.isPending ? "Marking" : "Mark all read"}
          </button>
        </header>

        <div role="tablist" aria-label="Filter" className="mt-8 -mx-1 flex gap-1 border-b border-rail">
          {(
            [
              { key: "all" as const, label: "All" },
              { key: "unread" as const, label: "Unread" },
            ]
          ).map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(tab.key)}
                className={`relative cursor-pointer rounded-[2px] px-3 py-2 text-sm transition-colors duration-150 ${
                  isActive ? "font-semibold text-ink" : "font-medium text-ink-3 hover:text-ink-2"
                }`}
              >
                {tab.label}
                {tab.key === "unread" && unreadCount > 0 ? (
                  <span className="ml-1.5 font-mono text-micro text-verm-ink tabular-nums">
                    {unreadCount}
                  </span>
                ) : null}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 -bottom-px h-[2px] origin-left rounded-full bg-verm transition-transform duration-200 ease-out ${
                    isActive ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-2">
          {isLoading ? (
            <div aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <PersonSkeleton key={index} />
              ))}
            </div>
          ) : null}

          {!isLoading && error ? (
            <Plate className="mt-6 border-l-2 border-l-verm p-5">
              <p className="font-mono text-micro font-medium tracking-[0.16em] text-verm-ink uppercase">
                Could not load notices
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                {getErrorMessage(error, "The daybook did not respond. Try again.")}
              </p>
            </Plate>
          ) : null}

          {isReady && notifications.length === 0 ? (
            <Plate className="mt-6 p-8 text-center">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                {onlyUnread ? "Nothing unread" : "Nothing has happened yet"}
              </h2>
              <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-relaxed text-ink-2">
                {onlyUnread
                  ? "You are caught up. New notices land here first."
                  : "When someone follows you, or likes or answers one of your works, it is recorded here."}
              </p>
            </Plate>
          ) : null}

          {isReady
            ? notifications.map((notification) => (
                <NotificationItem
                  key={notification.id || `${notification.actorName}-${notification.createdAt}`}
                  notification={notification}
                  isMutating={markOne.isPending && markOne.variables === notification.id}
                  onMarkRead={(notificationId) => markOne.mutate(notificationId)}
                />
              ))
            : null}

          {actionError ? (
            <p
              role="alert"
              className="mt-4 border-l-2 border-l-verm py-2 pl-3 font-mono text-micro text-verm-ink"
            >
              {getErrorMessage(actionError, "Could not update notices.")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
