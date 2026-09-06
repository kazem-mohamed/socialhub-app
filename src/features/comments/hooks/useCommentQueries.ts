import { useInfiniteQuery, type GetNextPageParamFunction } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import type { Page } from "@/shared/api/types";
import { COMMENTS_PAGE_LIMIT, REPLIES_PAGE_LIMIT } from "@/shared/config/constants";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { commentsApi } from "../api/commentsApi";
import type { Comment } from "../model/comment.types";

/**
 * Pagination stops when the API reports the last page, or — when it sends no
 * pagination metadata at all — when a page comes back short.
 */
function buildNextPageParam(
  pageSize: number,
): GetNextPageParamFunction<number, Page<Comment>> {
  return (lastPage) => {
    if (typeof lastPage.totalPages === "number") {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    }
    return lastPage.items.length === pageSize ? lastPage.page + 1 : undefined;
  };
}

export function useComments(postId: string) {
  const { isAuthenticated } = useAuth();

  return useInfiniteQuery({
    queryKey: queryKeys.comments.list(postId),
    queryFn: ({ pageParam }) => commentsApi.getComments(postId, pageParam),
    initialPageParam: 1,
    getNextPageParam: buildNextPageParam(COMMENTS_PAGE_LIMIT),
    enabled: isAuthenticated && Boolean(postId),
  });
}

export function useReplies(postId: string, commentId: string, isEnabled: boolean) {
  const { isAuthenticated } = useAuth();

  return useInfiniteQuery({
    queryKey: queryKeys.comments.replies(postId, commentId),
    queryFn: ({ pageParam }) => commentsApi.getReplies(postId, commentId, pageParam),
    initialPageParam: 1,
    getNextPageParam: buildNextPageParam(REPLIES_PAGE_LIMIT),
    enabled: isAuthenticated && isEnabled && Boolean(postId && commentId),
  });
}
