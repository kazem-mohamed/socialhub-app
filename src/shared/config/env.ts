/**
 * Runtime configuration.
 *
 * The API base URL used to be hardcoded in 11 different files. It now lives
 * here and can be overridden per environment with `VITE_API_BASE_URL`, while
 * defaulting to the host the app has always shipped against.
 */
const DEFAULT_API_BASE_URL = "https://route-posts.routemisr.com";

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL,
  isDev: import.meta.env.DEV,
} as const;
