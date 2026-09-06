import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setSessionExpiredHandler } from "@/shared/api/client";
import { tokenStore } from "@/shared/api/tokenStore";
import type { AuthContextValue } from "../model/auth.types";
import { AuthContext } from "./AuthContext";

/**
 * Owns the session.
 *
 * Signing out now also clears the query cache — previously the outgoing user's
 * posts, profile and notifications stayed resident and were served to whoever
 * signed in next.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => tokenStore.get());

  useEffect(() => tokenStore.subscribe(setToken), []);

  const signIn = useCallback((nextToken: string) => {
    tokenStore.set(nextToken);
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    queryClient.clear();
  }, [queryClient]);

  // A 401 from any request ends the session instead of surfacing as a generic
  // "failed to load" message on whichever screen happened to be mounted.
  useEffect(() => {
    setSessionExpiredHandler(signOut);
    return () => setSessionExpiredHandler(() => {});
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({ token, isAuthenticated: Boolean(token), signIn, signOut }),
    [token, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
