import axios, { type AxiosRequestConfig } from "axios";
import { env } from "@/shared/config/env";
import { toApiError } from "./errors";
import { tokenStore } from "./tokenStore";

/** Routes that legitimately answer 401 without the session being expired. */
const PUBLIC_AUTH_PATHS = ["/users/signin", "/users/signup"];

type SessionExpiredHandler = () => void;

let onSessionExpired: SessionExpiredHandler = () => {};

/**
 * Registered once by `AuthProvider` so a 401 anywhere in the app clears the
 * session and the query cache instead of surfacing "Failed to load posts".
 */
export function setSessionExpiredHandler(handler: SessionExpiredHandler): void {
  onSessionExpired = handler;
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    // The API accepts either header depending on the route; sending both keeps
    // every endpoint working behind a single client.
    config.headers.set("token", token);
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);

    const requestUrl = axios.isAxiosError(error) ? (error.config?.url ?? "") : "";
    const isPublicAuthRoute = PUBLIC_AUTH_PATHS.some((path) => requestUrl.includes(path));

    if (apiError.status === 401 && !isPublicAuthRoute && tokenStore.get()) {
      onSessionExpired();
    }

    return Promise.reject(apiError);
  },
);

/** Performs a request and returns the response body, already unwrapped. */
export async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}
