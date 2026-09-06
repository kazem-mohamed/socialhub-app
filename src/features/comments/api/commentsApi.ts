import { request } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import type { Page } from "@/shared/api/types";
import { COMMENTS_PAGE_LIMIT, REPLIES_PAGE_LIMIT } from "@/shared/config/constants";
import { normalizeCommentPage } from "../model/comment.normalize";
import type { Comment } from "../model/comment.types";

export const commentsApi = {
  async getComments(postId: string, page: number): Promise<Page<Comment>> {
    const data = await request({
      method: "GET",
      url: endpoints.comments.list(postId),
      params: { page, limit: COMMENTS_PAGE_LIMIT },
    });
    return normalizeCommentPage(data, "comment", page);
  },

  async getReplies(postId: string, commentId: string, page: number): Promise<Page<Comment>> {
    const data = await request({
      method: "GET",
      url: endpoints.comments.replies(postId, commentId),
      params: { page, limit: REPLIES_PAGE_LIMIT },
    });
    return normalizeCommentPage(data, "reply", page);
  },

  createComment(postId: string, content: string): Promise<unknown> {
    return request({
      method: "POST",
      url: endpoints.comments.list(postId),
      data: { content },
    });
  },

  createReply(postId: string, commentId: string, content: string): Promise<unknown> {
    return request({
      method: "POST",
      url: endpoints.comments.replies(postId, commentId),
      data: { content },
    });
  },

  updateComment(postId: string, commentId: string, content: string): Promise<unknown> {
    return request({
      method: "PUT",
      url: endpoints.comments.byId(postId, commentId),
      data: { content },
    });
  },

  deleteComment(postId: string, commentId: string): Promise<unknown> {
    return request({
      method: "DELETE",
      url: endpoints.comments.byId(postId, commentId),
    });
  },

  /** Replies use the same like route as their parent comment. */
  toggleLike(postId: string, commentId: string): Promise<unknown> {
    return request({ method: "PUT", url: endpoints.comments.like(postId, commentId) });
  },
};
