import { QueryClient } from "@tanstack/react-query";
import { GC_TIME, STALE_TIME } from "@/shared/config/constants";
import { ApiError } from "./errors";

/**
 * Cache defaults were previously repeated on all 19 `useQuery` call sites, with
 * drifting values. They are declared once here; individual queries only
 * override what genuinely differs.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME.medium,
      gcTime: GC_TIME,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Retrying an expired session or a missing resource only delays the
        // error the user needs to see.
        if (error instanceof ApiError && (error.isAuthError || error.isNotFound)) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
