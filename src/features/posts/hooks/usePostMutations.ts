import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { postsApi } from "../api/postsApi";
import { patchPostInCache, readPostFromCache } from "../model/post.cache";
import {
  resolveBookmarkResult,
  resolveLikeResult,
  resolveShareCount,
} from "../model/post.normalize";
import type { CreatePostPayload, Post, UpdatePostPayload } from "../model/post.types";

/** Invalidates every posts list plus the profile lists that mirror them. */
function useInvalidatePosts() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  };
}

export function useCreatePost() {
  const invalidatePosts = useInvalidatePosts();

  return useMutation({
    mutationFn: (payload: CreatePostPayload) => postsApi.createPost(payload),
    onSuccess: invalidatePosts,
  });
}

export function useUpdatePost() {
  const invalidatePosts = useInvalidatePosts();

  return useMutation({
    mutationFn: (payload: UpdatePostPayload) => postsApi.updatePost(payload),
    onSuccess: invalidatePosts,
  });
}

export function useDeletePost() {
  const invalidatePosts = useInvalidatePosts();

  return useMutation({
    mutationFn: (postId: string) => postsApi.deletePost(postId),
    onSuccess: invalidatePosts,
  });
}

/**
 * Like toggle with an immediate cache write and rollback on failure.
 *
 * The counter previously lived in component state fed by a per-card
 * `["post-likes", postId]` query — ten extra requests for a ten-post feed. The
 * count now comes from the post payload and is kept current here.
 */
export function useTogglePostLike(post: Post) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => postsApi.toggleLike(post.id),
    onMutate: () => {
      const previous = readPostFromCache(queryClient, post.id) ?? post;
      patchPostInCache(queryClient, post.id, {
        isLiked: !previous.isLiked,
        likesCount: Math.max(0, previous.likesCount + (previous.isLiked ? -1 : 1)),
      });
      return { previous };
    },
    onSuccess: (payload, _variables, context) => {
      const previous = context?.previous ?? post;
      const result = resolveLikeResult(payload, previous.isLiked, previous.likesCount);
      patchPostInCache(queryClient, post.id, {
        isLiked: result.isLiked,
        likesCount: result.count,
      });
    },
    onError: (_error, _variables, context) => {
      if (!context?.previous) return;
      patchPostInCache(queryClient, post.id, {
        isLiked: context.previous.isLiked,
        likesCount: context.previous.likesCount,
      });
    },
  });
}

export function useTogglePostBookmark(post: Post) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => postsApi.toggleBookmark(post.id),
    onMutate: () => {
      const previous = readPostFromCache(queryClient, post.id) ?? post;
      patchPostInCache(queryClient, post.id, { isBookmarked: !previous.isBookmarked });
      return { previous };
    },
    onSuccess: (payload, _variables, context) => {
      const wasBookmarked = context?.previous.isBookmarked ?? post.isBookmarked;
      patchPostInCache(queryClient, post.id, {
        isBookmarked: resolveBookmarkResult(payload, wasBookmarked),
      });
      // The saved list itself has to be refetched — a post may have joined or
      // left it.
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.list("saved", null) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: (_error, _variables, context) => {
      if (!context?.previous) return;
      patchPostInCache(queryClient, post.id, {
        isBookmarked: context.previous.isBookmarked,
      });
    },
  });
}

export function useSharePost(post: Post) {
  const queryClient = useQueryClient();
  const invalidatePosts = useInvalidatePosts();

  return useMutation({
    mutationFn: (caption: string) => postsApi.sharePost(post.id, caption),
    onSuccess: (payload) => {
      const current = readPostFromCache(queryClient, post.id) ?? post;
      patchPostInCache(queryClient, post.id, {
        sharesCount: resolveShareCount(payload, current.sharesCount),
      });
      invalidatePosts();
    },
  });
}
