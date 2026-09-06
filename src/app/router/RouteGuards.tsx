import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { routes } from "./routes";

/**
 * Guards now read the session from `AuthProvider` instead of reading
 * `localStorage` during render, so signing out redirects immediately rather
 * than waiting for the next manual navigation.
 */
export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={routes.login} state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/** Keeps signed-in users out of the sign-in and sign-up screens. */
export function RequireGuest() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to={routes.home} replace />;

  return <Outlet />;
}
