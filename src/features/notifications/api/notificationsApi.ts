import { request } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import { ApiError } from "@/shared/api/errors";
import type { AxiosRequestConfig } from "axios";
import {
  extractUnreadCount,
  normalizeNotificationList,
} from "../model/notification.normalize";
import type { AppNotification } from "../model/notification.types";

const NOTIFICATIONS_PAGE_LIMIT = 10;

/**
 * The read endpoints are not documented consistently — the app has always
 * probed a list of method/path combinations until one is accepted.
 *
 * The behaviour is preserved but expressed once: a 404 counts as success
 * (nothing left to mark), a 405 means "wrong verb, try the next candidate", and
 * anything else is a real failure.
 */
async function tryRequestCandidates(
  candidates: AxiosRequestConfig[],
  notFoundIsSuccess: boolean,
): Promise<void> {
  let lastError: unknown = null;

  for (const config of candidates) {
    try {
      await request(config);
      return;
    } catch (error) {
      lastError = error;
      const status = error instanceof ApiError ? error.status : null;

      if (status === 404 && notFoundIsSuccess) return;
      if (status !== 404 && status !== 405) throw error;
    }
  }

  throw lastError ?? new ApiError("Failed to update notifications.", null, null);
}

export const notificationsApi = {
  async getNotifications(onlyUnread: boolean): Promise<AppNotification[]> {
    const data = await request({
      method: "GET",
      url: endpoints.notifications.list,
      params: { unread: onlyUnread, page: 1, limit: NOTIFICATIONS_PAGE_LIMIT },
    });

    const notifications = normalizeNotificationList(data);
    // The `unread` parameter is not always honoured server-side.
    return onlyUnread ? notifications.filter((item) => !item.isRead) : notifications;
  },

  async getUnreadCount(): Promise<number> {
    const data = await request({ method: "GET", url: endpoints.notifications.unreadCount });
    return extractUnreadCount(data);
  },

  markAsRead(notificationId: string): Promise<void> {
    if (!notificationId) {
      return Promise.reject(new ApiError("Missing notification id.", null, null));
    }

    const body = { notificationId, id: notificationId };

    return tryRequestCandidates(
      [
        { method: "PUT", url: endpoints.notifications.read(notificationId) },
        { method: "PATCH", url: endpoints.notifications.read(notificationId) },
        { method: "PUT", url: endpoints.notifications.readBulk, data: body },
        { method: "PATCH", url: endpoints.notifications.readBulk, data: body },
      ],
      true,
    );
  },

  markAllAsRead(): Promise<void> {
    return tryRequestCandidates(
      [
        { method: "PUT", url: endpoints.notifications.readAll },
        { method: "PATCH", url: endpoints.notifications.readAll },
        { method: "POST", url: endpoints.notifications.readAll },
      ],
      true,
    );
  },
};
