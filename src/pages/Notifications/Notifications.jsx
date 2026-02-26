import React, { useMemo, useState } from "react";
import axios from "axios";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link } from "react-router-dom";

const DEFAULT_PROFILE_IMAGE =
  "https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png";

function extractApiMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.errors?.[0]?.msg ||
    error?.message ||
    fallbackMessage
  );
}

function getValidImageUrl(url) {
  if (typeof url !== "string") return DEFAULT_PROFILE_IMAGE;
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_PROFILE_IMAGE;
  return trimmed;
}

function getRelativeTimeShort(dateValue) {
  if (!dateValue) return "now";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "now";

  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m`;
  if (diffMs < day) return `${Math.max(1, Math.floor(diffMs / hour))}h`;
  return `${Math.max(1, Math.floor(diffMs / day))}d`;
}

function extractNotifications(responseData) {
  const raw =
    responseData?.data?.notifications ||
    responseData?.notifications ||
    responseData?.data?.data ||
    responseData?.data ||
    [];

  return Array.isArray(raw) ? raw : [];
}

function extractUnreadCount(responseData) {
  const value =
    responseData?.data?.count ??
    responseData?.data?.unreadCount ??
    responseData?.count ??
    responseData?.unreadCount ??
    0;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function normalizeNotification(item) {
  const actor =
    item?.fromUser ||
    item?.sender ||
    item?.user ||
    item?.actor ||
    item?.createdBy ||
    null;
  const actorName = actor?.name || actor?.username || item?.userName || "Someone";
  const actorId = actor?._id || actor?.id || null;
  const actorPhoto = getValidImageUrl(
    actor?.photo || actor?.avatar || item?.userPhoto || item?.photo
  );

  const type = String(item?.type || item?.action || item?.event || "").toLowerCase();
  const content =
    item?.content ||
    item?.message ||
    item?.body ||
    (type.includes("comment")
      ? "commented on your post"
      : type.includes("like")
        ? "liked your post"
        : type.includes("share")
          ? "shared your post"
          : type.includes("follow")
            ? "started following you"
            : "sent you a notification");

  return {
    id: item?._id || item?.id || item?.notificationId || "",
    actorName,
    actorId,
    actorPhoto,
    content,
    type,
    isRead: Boolean(item?.isRead ?? item?.read ?? item?.seen),
    createdAt: item?.createdAt || item?.updatedAt || item?.date || null,
  };
}

async function fetchNotifications(token, onlyUnread) {
  const response = await axios.request({
    method: "GET",
    url: "https://route-posts.routemisr.com/notifications",
    headers: { token },
    params: {
      unread: onlyUnread,
      page: 1,
      limit: 10,
    },
  });

  const normalizedNotifications = extractNotifications(response?.data).map(
    normalizeNotification
  );

  if (onlyUnread) {
    return normalizedNotifications.filter((notification) => !notification.isRead);
  }

  return normalizedNotifications;
}

async function fetchUnreadCount(token) {
  const response = await axios.request({
    method: "GET",
    url: "https://route-posts.routemisr.com/notifications/unread-count",
    headers: { token },
  });

  return extractUnreadCount(response?.data);
}

async function markNotificationRead(token, notificationId) {
  if (!notificationId) {
    throw new Error("Missing notification id.");
  }

  const attempts = [
    {
      method: "PUT",
      url: `https://route-posts.routemisr.com/notifications/${notificationId}/read`,
    },
    {
      method: "PATCH",
      url: `https://route-posts.routemisr.com/notifications/${notificationId}/read`,
    },
    {
      method: "PUT",
      url: "https://route-posts.routemisr.com/notifications/read",
      data: { notificationId, id: notificationId },
    },
    {
      method: "PATCH",
      url: "https://route-posts.routemisr.com/notifications/read",
      data: { notificationId, id: notificationId },
    },
  ];

  let lastError = null;
  for (const requestOptions of attempts) {
    try {
      return await axios.request({
        ...requestOptions,
        headers: { token },
      });
    } catch (error) {
      const status = error?.response?.status;
      lastError = error;
      if (status === 404) {
        // Endpoint may report not found for already-resolved/deleted notifications.
        return { data: { success: true, message: "Notification not found." } };
      }
      if (status && status !== 404 && status !== 405) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Failed to mark notification as read.");
}

async function markAllNotificationsRead(token) {
  const attempts = [
    {
      method: "PUT",
      url: "https://route-posts.routemisr.com/notifications/read-all",
    },
    {
      method: "PATCH",
      url: "https://route-posts.routemisr.com/notifications/read-all",
    },
    {
      method: "POST",
      url: "https://route-posts.routemisr.com/notifications/read-all",
    },
  ];

  let lastError = null;
  for (const requestOptions of attempts) {
    try {
      return await axios.request({
        ...requestOptions,
        headers: { token },
      });
    } catch (error) {
      const status = error?.response?.status;
      lastError = error;
      if (status === 404) {
        return { data: { success: true, message: "No unread notifications." } };
      }
      if (status && status !== 404 && status !== 405) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Failed to mark all notifications as read.");
}

function NotificationTypeIcon({ type }) {
  const lowerType = String(type || "").toLowerCase();

  if (lowerType.includes("follow")) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-user-plus"
        aria-hidden="true"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" x2="19" y1="8" y2="14" />
        <line x1="22" x2="16" y1="11" y2="11" />
      </svg>
    );
  }

  if (lowerType.includes("like")) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-thumbs-up"
        aria-hidden="true"
      >
        <path d="M7 10v12" />
        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
      </svg>
    );
  }

  if (lowerType.includes("share")) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-repeat-2"
        aria-hidden="true"
      >
        <path d="m2 9 3-3 3 3" />
        <path d="M13 18H7a2 2 0 0 1-2-2V6" />
        <path d="m22 15-3 3-3-3" />
        <path d="M11 6h6a2 2 0 0 1 2 2v10" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-message-circle"
      aria-hidden="true"
    >
      <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
    </svg>
  );
}

function NotificationItem({ notification, isMutating, onMarkRead }) {
  const articleClass = notification.isRead
    ? "group relative flex gap-3 rounded-xl border p-3 transition border-slate-200 bg-white hover:bg-slate-50 sm:rounded-2xl sm:p-4"
    : "group relative flex gap-3 rounded-xl border p-3 transition sm:rounded-2xl sm:p-4 border-[#dbeafe] bg-[#edf4ff]";

  const profileLink = notification.actorId ? `/profile/${notification.actorId}` : "/profile";

  return (
    <article className={articleClass}>
      <div className="relative shrink-0">
        <Link to={profileLink} className="block cursor-pointer">
          <img
            alt={notification.actorName}
            className="h-11 w-11 rounded-full object-cover"
            src={notification.actorPhoto}
            onError={(event) => {
              event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
            }}
          />
        </Link>
        <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-white text-[#1877f2]">
          <NotificationTypeIcon type={notification.type} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-1.5 sm:gap-2">
          <p className="text-sm leading-6 text-slate-800">
            <Link to={profileLink} className="font-extrabold hover:text-[#1877f2] hover:underline">
              {notification.actorName}
            </Link>{" "}
            {notification.content}
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-semibold text-slate-500">
              {getRelativeTimeShort(notification.createdAt)}
            </span>
            {!notification.isRead ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-dot text-[#1877f2]"
                aria-hidden="true"
              >
                <circle cx="12.1" cy="12.1" r="1" />
              </svg>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {!notification.isRead ? (
            <button
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs font-bold text-[#1877f2] ring-1 ring-[#dbeafe] transition hover:bg-[#e7f3ff] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => onMarkRead(notification.id)}
              disabled={!notification.id || isMutating}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-check"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {isMutating ? "Marking..." : "Mark as read"}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-check"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Read
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Notifications() {
  const [activeFilter, setActiveFilter] = useState("all");
  const token = localStorage.getItem("User_Token");
  const queryClient = useQueryClient();

  const onlyUnread = activeFilter === "unread";

  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notifications", token, onlyUnread],
    queryFn: () => fetchNotifications(token, onlyUnread),
    enabled: Boolean(token),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const {
    data: unreadCount = 0,
    isLoading: isUnreadCountLoading,
  } = useQuery({
    queryKey: ["notifications-unread-count", token],
    queryFn: () => fetchUnreadCount(token),
    enabled: Boolean(token),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const markOneMutation = useMutation({
    mutationFn: (notificationId) => markNotificationRead(token, notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", token] });
      await queryClient.cancelQueries({
        queryKey: ["notifications-unread-count", token],
      });

      const previousNotificationQueries = queryClient.getQueriesData({
        queryKey: ["notifications", token],
      });
      const previousUnreadCount = queryClient.getQueryData([
        "notifications-unread-count",
        token,
      ]);

      previousNotificationQueries.forEach(([queryKey, list]) => {
        if (!Array.isArray(list)) return;

        const onlyUnreadQuery =
          Array.isArray(queryKey) && queryKey[2] === true;

        const nextList = onlyUnreadQuery
          ? list.filter((item) => item?.id !== notificationId)
          : list.map((item) =>
              item?.id === notificationId ? { ...item, isRead: true } : item
            );

        queryClient.setQueryData(queryKey, nextList);
      });

      queryClient.setQueryData(["notifications-unread-count", token], (current) => {
        const count = Number.isFinite(Number(current)) ? Number(current) : 0;
        return Math.max(0, count - 1);
      });

      return { previousNotificationQueries, previousUnreadCount };
    },
    onError: (_error, _notificationId, context) => {
      if (!context) return;

      context.previousNotificationQueries?.forEach(([queryKey, list]) => {
        queryClient.setQueryData(queryKey, list);
      });

      queryClient.setQueryData(
        ["notifications-unread-count", token],
        context.previousUnreadCount
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", token] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count", token],
      });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(token),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications", token] });
      await queryClient.cancelQueries({
        queryKey: ["notifications-unread-count", token],
      });

      const previousNotificationQueries = queryClient.getQueriesData({
        queryKey: ["notifications", token],
      });
      const previousUnreadCount = queryClient.getQueryData([
        "notifications-unread-count",
        token,
      ]);

      previousNotificationQueries.forEach(([queryKey, list]) => {
        if (!Array.isArray(list)) return;

        const onlyUnreadQuery =
          Array.isArray(queryKey) && queryKey[2] === true;

        const nextList = onlyUnreadQuery
          ? []
          : list.map((item) => ({ ...item, isRead: true }));

        queryClient.setQueryData(queryKey, nextList);
      });

      queryClient.setQueryData(["notifications-unread-count", token], 0);

      return { previousNotificationQueries, previousUnreadCount };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;

      context.previousNotificationQueries?.forEach(([queryKey, list]) => {
        queryClient.setQueryData(queryKey, list);
      });

      queryClient.setQueryData(
        ["notifications-unread-count", token],
        context.previousUnreadCount
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", token] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count", token],
      });
    },
  });

  const errorMessage = useMemo(
    () =>
      extractApiMessage(
        error,
        !token
          ? "You need to login first."
          : "Failed to load notifications."
      ),
    [error, token]
  );

  const actionErrorMessage = useMemo(
    () =>
      extractApiMessage(
        markOneMutation.error || markAllMutation.error,
        "Failed to update notification status."
      ),
    [markAllMutation.error, markOneMutation.error]
  );

  return (
    <div className="mx-auto max-w-7xl px-3 py-3.5">
      <main className="min-w-0">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Notifications</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Realtime updates for likes, comments, shares, and follows.
                </p>
              </div>
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                onClick={() => markAllMutation.mutate()}
                disabled={!token || markAllMutation.isPending || unreadCount <= 0}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-check-check"
                  aria-hidden="true"
                >
                  <path d="M18 6 7 17l-5-5" />
                  <path d="m22 10-7.5 7.5L13 16" />
                </svg>
                {markAllMutation.isPending ? "Marking..." : "Mark all as read"}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <button
                type="button"
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                  activeFilter === "all"
                    ? "bg-[#1877f2] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                onClick={() => setActiveFilter("all")}
              >
                All
              </button>

              <button
                type="button"
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition ${
                  activeFilter === "unread"
                    ? "bg-[#1877f2] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                onClick={() => setActiveFilter("unread")}
              >
                Unread
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeFilter === "unread"
                      ? "bg-white text-[#1877f2]"
                      : "bg-white text-[#1877f2]"
                  }`}
                >
                  {isUnreadCountLoading ? "..." : unreadCount}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-2 p-3 sm:p-4">
            {isLoading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Loading notifications...
              </div>
            ) : null}

            {!isLoading && error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {!isLoading && !error && notifications.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No notifications found.
              </div>
            ) : null}

            {!isLoading && !error
              ? notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id || `${notification.actorName}-${notification.createdAt}`}
                    notification={notification}
                    isMutating={
                      markOneMutation.isPending &&
                      markOneMutation.variables === notification.id
                    }
                    onMarkRead={(notificationId) => markOneMutation.mutate(notificationId)}
                  />
                ))
              : null}

            {markOneMutation.isError || markAllMutation.isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {actionErrorMessage}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
