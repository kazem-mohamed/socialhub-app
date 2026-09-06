import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usersApi } from "../api/usersApi";
import type { User } from "../model/user.types";

/**
 * Resolves the profile a route is pointing at.
 *
 * `/profile` shows the signed-in user (already cached by `useCurrentUser`),
 * `/profile/:userId` fetches that user — but only when the id is someone else's,
 * which is the guard the page used to do inline.
 */
export function useUserProfile(routeUserId: string | undefined, currentUser: User | null) {
  const { isAuthenticated } = useAuth();
  const currentUserId = currentUser?.id ?? null;
  const isOtherProfile = Boolean(routeUserId && routeUserId !== currentUserId);

  const query = useQuery({
    queryKey: queryKeys.users.profile(routeUserId),
    queryFn: () => usersApi.getUserProfile(routeUserId as string, currentUserId),
    enabled: isAuthenticated && isOtherProfile,
  });

  return {
    profile: isOtherProfile ? (query.data ?? null) : currentUser,
    isOtherProfile,
    activeUserId: routeUserId ?? currentUserId,
    isLoading: isOtherProfile && query.isLoading,
    error: isOtherProfile ? query.error : null,
  };
}
