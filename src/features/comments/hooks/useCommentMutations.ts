import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { commentsApi } from "../api/commentsApi";
import {
  adjustReplyCount,
  mergeWithServerComment,
  patchComment,
  prependComment,
  removeComment,
  replaceComment,
  type CommentPages,
} from "../model/comment.cache";
import {
  createOptimisticComment,
  extractWrittenComment,
  resolveCommentLikeResult,
} from "../model/comment.normalize";
import type { Comment, CommentKind } from "../model/comment.types";

interface WriteContext {
  optimisticId: string;
  optimistic: Comment;
  previousList: CommentPages | undefined;
  previousParent: CommentPages | undefined;
}

/**
 * Creating a comment or a reply.
 *
 * Both flows are identical apart from which cache entry receives the new item
 * and whether a parent counter needs bumping, so they share one hook instead of
 * the two 90-line duplicates they were.
 */
export function useCreateComment(
  postId: string,
  kind: CommentKind,
  parentCommentId: string | null,
  authorName: string,
) {
  const queryClient = useQueryClient();

  const listKey =
    kind === "reply"
      ? queryKeys.comments.replies(postId, parentCommentId ?? undefined)
      : queryKeys.comments.list(postId);
  const parentKey = queryKeys.comments.list(postId);
  const hasParentCounter = kind === "reply" && Boolean(parentCommentId);

  return useMutation({
    mutationFn: (content: string) =>
      kind === "reply"
        ? commentsApi.createReply(postId, parentCommentId as string, content)
        : commentsApi.createComment(postId, content),

    onMutate: async (content): Promise<WriteContext> => {
      const optimistic = createOptimisticComment(content, authorName);

      await queryClient.cancelQueries({ queryKey: listKey });
      if (hasParentCounter) await queryClient.cancelQueries({ queryKey: parentKey });

      const previousList = queryClient.getQueryData<CommentPages>(listKey);
      const previousParent = hasParentCounter
        ? queryClient.getQueryData<CommentPages>(parentKey)
        : undefined;

      queryClient.setQueryData<CommentPages>(listKey, (pages) =>
        prependComment(pages, optimistic),
      );

      if (hasParentCounter) {
        queryClient.setQueryData<CommentPages>(parentKey, (pages) =>
          adjustReplyCount(pages, parentCommentId as string, 1),
        );
      }

      return {
        optimisticId: optimistic.id,
        optimistic,
        previousList,
        previousParent,
      };
    },

    onSuccess: (payload, _content, context) => {
      const server = extractWrittenComment(payload, kind);

      if (server) {
        queryClient.setQueryData<CommentPages>(listKey, (pages) =>
          replaceComment(
            pages,
            context.optimisticId,
            mergeWithServerComment(context.optimistic, server),
          ),
        );
        return;
      }

      void queryClient.invalidateQueries({ queryKey: listKey });
      if (hasParentCounter) void queryClient.invalidateQueries({ queryKey: parentKey });
    },

    onError: (_error, _content, context) => {
      if (!context) return;
      queryClient.setQueryData(listKey, context.previousList);
      if (hasParentCounter) queryClient.setQueryData(parentKey, context.previousParent);
    },
  });
}

export function useUpdateComment(postId: string, commentId: string) {
  const queryClient = useQueryClient();
  const listKey = queryKeys.comments.list(postId);

  return useMutation({
    mutationFn: (content: string) => commentsApi.updateComment(postId, commentId, content),

    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<CommentPages>(listKey);
      queryClient.setQueryData<CommentPages>(listKey, (pages) =>
        patchComment(pages, commentId, { content }),
      );
      return { previous };
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listKey });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
    },

    onError: (_error, _content, context) => {
      queryClient.setQueryData(listKey, context?.previous);
    },
  });
}

export function useDeleteComment(postId: string, commentId: string) {
  const queryClient = useQueryClient();
  const listKey = queryKeys.comments.list(postId);
  const repliesKey = queryKeys.comments.replies(postId, commentId);

  return useMutation({
    mutationFn: () => commentsApi.deleteComment(postId, commentId),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<CommentPages>(listKey);

      queryClient.setQueryData<CommentPages>(listKey, (pages) =>
        removeComment(pages, commentId),
      );
      queryClient.removeQueries({ queryKey: repliesKey, exact: true });

      return { previous };
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listKey });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
    },

    onError: (_error, _variables, context) => {
      queryClient.setQueryData(listKey, context?.previous);
    },
  });
}

/**
 * Like toggle for a comment or a reply.
 *
 * `listKey` points at whichever cache holds the entity, so the same hook serves
 * both levels of the thread.
 */
export function useToggleCommentLike(
  postId: string,
  comment: Comment,
  listKey: readonly unknown[],
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => commentsApi.toggleLike(postId, comment.id),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<CommentPages>(listKey);

      queryClient.setQueryData<CommentPages>(listKey, (pages) =>
        patchComment(pages, comment.id, {
          isLiked: !comment.isLiked,
          likesCount: Math.max(0, comment.likesCount + (comment.isLiked ? -1 : 1)),
        }),
      );

      return { previous };
    },

    onSuccess: (payload) => {
      const result = resolveCommentLikeResult(
        payload,
        comment.isLiked,
        comment.likesCount,
      );
      queryClient.setQueryData<CommentPages>(listKey, (pages) =>
        patchComment(pages, comment.id, {
          isLiked: result.isLiked,
          likesCount: result.count,
        }),
      );
    },

    onError: (_error, _variables, context) => {
      queryClient.setQueryData(listKey, context?.previous);
    },
  });
}
