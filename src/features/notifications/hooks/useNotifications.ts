import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { notificationsApi } from "../api/notificationsApi";
import type { AppNotification } from "../model/notification.types";

const NOTIFICATIONS_STALE_TIME = 1000 * 60;
const UNREAD_COUNT_STALE_TIME = 1000 * 30;

export function useNotifications(onlyUnread: boolean) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.notifications.list(onlyUnread),
    queryFn: () => notificationsApi.getNotifications(onlyUnread),
    enabled: isAuthenticated,
    staleTime: NOTIFICATIONS_STALE_TIME,
  });
}

export function useUnreadNotificationCount() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: isAuthenticated,
    staleTime: UNREAD_COUNT_STALE_TIME,
  });
}

/**
 * Optimistically flips notifications to read across every cached list variant,
 * with a snapshot rollback if the request fails.
 */
function useOptimisticReadMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<void>,
  markLocally: (notifications: AppNotification[], variables: TVariables) => AppNotification[],
  nextUnreadCount: (current: number, variables: TVariables) => number,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousLists = queryClient.getQueriesData<AppNotification[]>({
        queryKey: queryKeys.notifications.all,
      });
      const previousCount = queryClient.getQueryData<number>(
        queryKeys.notifications.unreadCount(),
      );

      queryClient.setQueriesData<AppNotification[]>(
        { queryKey: queryKeys.notifications.all },
        (cached) => (Array.isArray(cached) ? markLocally(cached, variables) : cached),
      );
      queryClient.setQueryData<number>(queryKeys.notifications.unreadCount(), (current) =>
        nextUnreadCount(current ?? 0, variables),
      );

      return { previousLists, previousCount };
    },

    onError: (_error, _variables, context) => {
      context?.previousLists.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
      queryClient.setQueryData(queryKeys.notifications.unreadCount(), context?.previousCount);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkNotificationRead() {
  return useOptimisticReadMutation<string>(
    (notificationId) => notificationsApi.markAsRead(notificationId),
    (notifications, notificationId) =>
      notifications.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item,
      ),
    (current) => Math.max(0, current - 1),
  );
}

export function useMarkAllNotificationsRead() {
  return useOptimisticReadMutation<void>(
    () => notificationsApi.markAllAsRead(),
    (notifications) => notifications.map((item) => ({ ...item, isRead: true })),
    () => 0,
  );
}
