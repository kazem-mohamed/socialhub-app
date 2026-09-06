import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usersApi } from "../api/usersApi";

/**
 * The signed-in user — one query for the whole app.
 *
 * This replaces five duplicated `fetchCurrentUser` implementations that ran
 * under four different cache keys (`home-current-user`, `navbar-profile`,
 * `post-form-profile`, `search-user-current-profile`), which meant the home
 * screen requested the same profile four times on first paint.
 */
export function useCurrentUser() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => usersApi.getCurrentUser(),
    enabled: isAuthenticated,
  });
}

/** Just the id, for ownership checks. */
export function useCurrentUserId(): string | null {
  return useCurrentUser().data?.id ?? null;
}
