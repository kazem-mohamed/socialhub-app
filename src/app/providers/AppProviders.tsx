import { HeroUIProvider } from "@heroui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared/api/queryClient";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { FetchRule } from "@/shared/ui/FetchRule";
import { ToastProvider } from "@/shared/ui/toast";
import { AuthProvider } from "@/features/auth/context/AuthProvider";

/**
 * Provider stack for the whole app.
 *
 * `AuthProvider` sits inside `QueryClientProvider` because signing out clears
 * the query cache, and the error boundary wraps everything so a render failure
 * cannot blank the page.
 *
 * `FetchRule` lives inside the query provider (it reads the in-flight count)
 * and `ToastProvider` wraps the tree so any screen can raise a condition
 * note without threading callbacks through.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <HeroUIProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <FetchRule />
              {children}
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HeroUIProvider>
    </ErrorBoundary>
  );
}
