/** Storage key the auth token has always been persisted under. */
export const AUTH_TOKEN_STORAGE_KEY = "User_Token";

/** Placeholder rendered whenever a user has no photo, or the photo fails to load. */
export const DEFAULT_PROFILE_IMAGE =
  "https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png";

export const APP_NAME = "Aura";

export const COMMENTS_PAGE_LIMIT = 10;
export const REPLIES_PAGE_LIMIT = 10;
export const SUGGESTIONS_PAGE_LIMIT = 10;
export const FEED_PAGE_LIMIT = 10;

export const MAX_COMMENT_LENGTH = 500;
export const MAX_SHARE_CAPTION_LENGTH = 500;
export const MAX_POST_BODY_LENGTH = 5000;

/** Shared TanStack Query cache windows, in milliseconds. */
export const STALE_TIME = {
  short: 1000 * 60 * 3,
  medium: 1000 * 60 * 5,
} as const;

export const GC_TIME = 1000 * 60 * 30;
