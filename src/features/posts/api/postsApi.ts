import { request } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import { FEED_PAGE_LIMIT } from "@/shared/config/constants";
import {
  normalizePostList,
  normalizeSavedPostList,
  normalizeSinglePost,
} from "../model/post.normalize";
import type { CreatePostPayload, Post, PostsFilter, UpdatePostPayload } from "../model/post.types";

function toPostFormData(payload: CreatePostPayload): FormData {
  const formData = new FormData();
  const body = payload.body.trim();

  if (body) formData.append("body", body);
  if (payload.imageFile) formData.append("image", payload.imageFile);

  return formData;
}

export const postsApi = {
  /** Feed, community, own posts or bookmarks — one call site per filter. */
  async getPosts(filter: PostsFilter, currentUserId: string | null): Promise<Post[]> {
    if (filter === "feed") {
      const data = await request({
        method: "GET",
        url: endpoints.posts.feed,
        params: { only: "following", limit: FEED_PAGE_LIMIT },
      });
      return normalizePostList(data);
    }

    if (filter === "my-posts") {
      if (!currentUserId) return [];
      const data = await request({
        method: "GET",
        url: endpoints.users.posts(currentUserId),
        params: { sort: "-createdAt" },
      });
      return normalizePostList(data);
    }

    if (filter === "saved") {
      const data = await request({
        method: "GET",
        url: endpoints.users.bookmarks,
        params: { sort: "-createdAt" },
      });
      return normalizeSavedPostList(data);
    }

    const data = await request({
      method: "GET",
      url: endpoints.posts.list,
      params: { sort: "-createdAt" },
    });
    return normalizePostList(data);
  },

  async getPostById(postId: string): Promise<Post | null> {
    const data = await request({ method: "GET", url: endpoints.posts.byId(postId) });
    return normalizeSinglePost(data);
  },

  async getUserPosts(userId: string): Promise<Post[]> {
    const data = await request({
      method: "GET",
      url: endpoints.users.posts(userId),
      params: { sort: "-createdAt" },
    });
    return normalizePostList(data);
  },

  createPost(payload: CreatePostPayload): Promise<unknown> {
    return request({
      method: "POST",
      url: endpoints.posts.create,
      data: toPostFormData(payload),
    });
  },

  updatePost({ postId, ...payload }: UpdatePostPayload): Promise<unknown> {
    return request({
      method: "PUT",
      url: endpoints.posts.byId(postId),
      data: toPostFormData(payload),
    });
  },

  deletePost(postId: string): Promise<unknown> {
    return request({ method: "DELETE", url: endpoints.posts.byId(postId) });
  },

  toggleLike(postId: string): Promise<unknown> {
    return request({ method: "PUT", url: endpoints.posts.like(postId) });
  },

  toggleBookmark(postId: string): Promise<unknown> {
    return request({ method: "PUT", url: endpoints.posts.bookmark(postId) });
  },

  sharePost(postId: string, caption: string): Promise<unknown> {
    const trimmed = caption.trim();
    return request({
      method: "POST",
      url: endpoints.posts.share(postId),
      headers: { "Content-Type": "application/json" },
      data: trimmed ? { body: trimmed } : {},
    });
  },
};
