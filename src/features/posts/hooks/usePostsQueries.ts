import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { STALE_TIME } from "@/shared/config/constants";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { postsApi } from "../api/postsApi";
import type { PostsFilter } from "../model/post.types";

/**
 * The filtered post list behind the home feed.
 *
 * `my-posts` needs the signed-in user's id, so the query stays disabled until
 * `useCurrentUser` has resolved it rather than firing a request that would 404.
 */
export function usePosts(filter: PostsFilter, currentUserId: string | null) {
  const { isAuthenticated } = useAuth();
  const needsUserId = filter === "my-posts";

  return useQuery({
    queryKey: queryKeys.posts.list(filter, needsUserId ? currentUserId : null),
    queryFn: () => postsApi.getPosts(filter, currentUserId),
    enabled: isAuthenticated && (!needsUserId || Boolean(currentUserId)),
  });
}

export function usePost(postId: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.posts.detail(postId),
    queryFn: () => postsApi.getPostById(postId as string),
    enabled: isAuthenticated && Boolean(postId),
  });
}

export function useUserPosts(userId: string | null | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.users.posts(userId ?? undefined),
    queryFn: () => postsApi.getUserPosts(userId as string),
    enabled: isAuthenticated && Boolean(userId),
    staleTime: STALE_TIME.short,
  });
}
