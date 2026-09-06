import type { PostsFilter } from "@/features/posts/model/post.types";

/**
 * Central key factory.
 *
 * The old code wrote keys inline and had to hand-maintain invalidation lists
 * (five keys for the same current-user query). Keys are hierarchical here, so
 * invalidating `queryKeys.posts.all` covers every posts query at once.
 *
 * The auth token is deliberately NOT part of any key: it is an ambient concern
 * of the axios instance, and the cache is cleared outright on sign-out.
 */
export const queryKeys = {
  users: {
    all: ["users"] as const,
    me: () => [...queryKeys.users.all, "me"] as const,
    profile: (userId: string | undefined) =>
      [...queryKeys.users.all, "profile", userId ?? null] as const,
    posts: (userId: string | undefined) =>
      [...queryKeys.users.all, "posts", userId ?? null] as const,
    discovery: (mode: "search" | "suggestions", term: string) =>
      [...queryKeys.users.all, "discovery", mode, term] as const,
  },
  posts: {
    all: ["posts"] as const,
    list: (filter: PostsFilter, userId: string | null) =>
      [...queryKeys.posts.all, "list", filter, userId] as const,
    detail: (postId: string | undefined) =>
      [...queryKeys.posts.all, "detail", postId ?? null] as const,
  },
  comments: {
    all: ["comments"] as const,
    list: (postId: string | undefined) =>
      [...queryKeys.comments.all, "list", postId ?? null] as const,
    replies: (postId: string | undefined, commentId: string | undefined) =>
      [...queryKeys.comments.all, "replies", postId ?? null, commentId ?? null] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (onlyUnread: boolean) =>
      [...queryKeys.notifications.all, "list", onlyUnread] as const,
    unreadCount: () => [...queryKeys.notifications.all, "unread-count"] as const,
  },
} as const;
