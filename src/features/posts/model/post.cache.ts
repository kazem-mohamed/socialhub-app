import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import type { Post } from "./post.types";

type PostPatch = Partial<Pick<Post, "isLiked" | "likesCount" | "isBookmarked" | "sharesCount" | "commentsCount" | "body" | "image">>;

function patchPost(post: Post, postId: string, patch: PostPatch): Post {
  if (post.id === postId) return { ...post, ...patch };

  // A re-share renders the original's counters, so it has to be patched too.
  if (post.sharedPost && post.sharedPost.id === postId) {
    return { ...post, sharedPost: { ...post.sharedPost, ...patch } };
  }

  return post;
}

function patchCached(cached: unknown, postId: string, patch: PostPatch): unknown {
  if (Array.isArray(cached)) {
    return (cached as Post[]).map((post) => patchPost(post, postId, patch));
  }
  if (cached && typeof cached === "object" && "id" in cached) {
    return patchPost(cached as Post, postId, patch);
  }
  return cached;
}

/**
 * Applies a patch to one post everywhere it is cached — every feed variant, the
 * detail view, and any profile's post list.
 *
 * This is what replaces the old approach of copying server counters into
 * component `useState` and re-syncing them from a `useEffect`, which is where
 * all eight `set-state-in-effect` lint errors came from.
 */
export function patchPostInCache(
  queryClient: QueryClient,
  postId: string,
  patch: PostPatch,
): void {
  queryClient.setQueriesData({ queryKey: queryKeys.posts.all }, (cached: unknown) =>
    patchCached(cached, postId, patch),
  );
  queryClient.setQueriesData({ queryKey: queryKeys.users.all }, (cached: unknown) =>
    Array.isArray(cached) ? patchCached(cached, postId, patch) : cached,
  );
}

/** Reads the currently cached version of a post, from wherever it is held. */
export function readPostFromCache(
  queryClient: QueryClient,
  postId: string,
): Post | null {
  const detail = queryClient.getQueryData<Post | null>(queryKeys.posts.detail(postId));
  if (detail) return detail;

  for (const [, cached] of queryClient.getQueriesData({ queryKey: queryKeys.posts.all })) {
    if (!Array.isArray(cached)) continue;
    const found = (cached as Post[]).find((post) => post.id === postId);
    if (found) return found;
  }

  return null;
}
