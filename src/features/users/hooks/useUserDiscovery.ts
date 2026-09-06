import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { STALE_TIME } from "@/shared/config/constants";
import type { Page } from "@/shared/api/types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usersApi } from "../api/usersApi";
import { normalizeDiscoveredUser } from "../model/user.normalize";
import type { DiscoveredUser } from "../model/user.types";
import { useCurrentUser } from "./useCurrentUser";

function getNextPageParam(lastPage: Page<unknown>): number | undefined {
  if (typeof lastPage.totalPages === "number") {
    return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
  }
  return lastPage.items.length > 0 ? lastPage.page + 1 : undefined;
}

/**
 * Suggested users, or search results when a term is entered.
 *
 * Pages are de-duplicated by id, the signed-in user is filtered out, and the
 * result is ordered by follower count — the same rules the panel applied
 * inline, now testable in isolation.
 */
export function useUserDiscovery(searchTerm: string, isEnabled: boolean) {
  const { isAuthenticated } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const trimmedTerm = searchTerm.trim();
  const mode = isEnabled && trimmedTerm ? "search" : "suggestions";

  const query = useInfiniteQuery({
    queryKey: queryKeys.users.discovery(mode, trimmedTerm),
    queryFn: ({ pageParam }) => usersApi.getDiscoveryPage(mode, pageParam, trimmedTerm),
    initialPageParam: 1,
    getNextPageParam,
    enabled: isAuthenticated,
    staleTime: STALE_TIME.short,
    retry: 1,
  });

  const currentUserId = currentUser?.id ?? null;
  const users: DiscoveredUser[] = [];
  const seen = new Set<string>();

  for (const page of query.data?.pages ?? []) {
    for (const item of page.items) {
      const user = normalizeDiscoveredUser(item);
      if (!user || user.id === currentUserId || seen.has(user.id)) continue;
      seen.add(user.id);
      users.push(user);
    }
  }

  users.sort((a, b) => b.followersCount - a.followersCount);

  return { ...query, users };
}
