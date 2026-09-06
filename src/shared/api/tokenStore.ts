import { AUTH_TOKEN_STORAGE_KEY } from "@/shared/config/constants";

type Listener = (token: string | null) => void;

const listeners = new Set<Listener>();

/**
 * Single owner of the auth token.
 *
 * Components used to call `localStorage.getItem("User_Token")` during render in
 * eight different files, which meant nothing re-rendered when the token
 * changed. The token now lives here, `AuthProvider` subscribes to it, and the
 * axios interceptor reads it directly — no component touches storage.
 */
export const tokenStore = {
  get(): string | null {
    try {
      return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  set(token: string): void {
    try {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } catch {
      /* storage unavailable (private mode, quota) — keep the in-memory value */
    }
    listeners.forEach((listener) => listener(token));
  },

  clear(): void {
    try {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
      /* nothing to clean up */
    }
    listeners.forEach((listener) => listener(null));
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
