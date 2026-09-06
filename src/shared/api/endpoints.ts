/**
 * Every API path in one place. Paths are relative — the host comes from the
 * axios instance's `baseURL`.
 */
export const endpoints = {
  auth: {
    signIn: "/users/signin",
    signUp: "/users/signup",
    changePassword: "/users/change-password",
  },
  users: {
    me: "/users/profile-data",
    meFallback: "/users/profile",
    profile: (userId: string) => `/users/${userId}/profile`,
    posts: (userId: string) => `/users/${userId}/posts`,
    follow: (userId: string) => `/users/${userId}/follow`,
    bookmarks: "/users/bookmarks",
    suggestions: "/users/suggestions",
    search: "/users/search",
    uploadPhoto: "/users/upload-photo",
    uploadCover: "/users/upload-cover",
  },
  posts: {
    list: "/posts",
    feed: "/posts/feed",
    create: "/posts",
    byId: (postId: string) => `/posts/${postId}`,
    like: (postId: string) => `/posts/${postId}/like`,
    bookmark: (postId: string) => `/posts/${postId}/bookmark`,
    share: (postId: string) => `/posts/${postId}/share`,
  },
  comments: {
    list: (postId: string) => `/posts/${postId}/comments`,
    byId: (postId: string, commentId: string) => `/posts/${postId}/comments/${commentId}`,
    like: (postId: string, commentId: string) =>
      `/posts/${postId}/comments/${commentId}/like`,
    replies: (postId: string, commentId: string) =>
      `/posts/${postId}/comments/${commentId}/replies`,
  },
  notifications: {
    list: "/notifications",
    unreadCount: "/notifications/unread-count",
    read: (notificationId: string) => `/notifications/${notificationId}/read`,
    readBulk: "/notifications/read",
    readAll: "/notifications/read-all",
  },
} as const;
