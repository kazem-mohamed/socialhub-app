import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { PageFallback } from "@/shared/ui/PageFallback";
import AuthLayout from "@/layouts/AuthLayout";
import MainLayout from "@/layouts/MainLayout";
import { LegacyPostRedirect } from "./LegacyRedirect";
import { RequireAuth, RequireGuest } from "./RouteGuards";
import { routes } from "./routes";

/**
 * Pages are code-split. The app used to ship as a single 1.3 MB bundle in which
 * every authenticated user still downloaded the sign-up form and its date
 * picker.
 */
const HomePage = lazy(() => import("@/pages/HomePage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const PeoplePage = lazy(() => import("@/pages/PeoplePage"));
const PostDetailsPage = lazy(() => import("@/pages/PostDetailsPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function lazyRoute(element: React.ReactNode) {
  return <Suspense fallback={<PageFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: routes.home,
    element: <MainLayout />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: lazyRoute(<HomePage />) },
          { path: "profile", element: lazyRoute(<ProfilePage />) },
          { path: "profile/:userId", element: lazyRoute(<ProfilePage />) },
          { path: "settings", element: lazyRoute(<SettingsPage />) },
          { path: "notifications", element: lazyRoute(<NotificationsPage />) },
          { path: "people", element: lazyRoute(<PeoplePage />) },
          { path: "post/:postId", element: lazyRoute(<PostDetailsPage />) },

          // Kept so links created before the routes were lowercased still work.
          { path: "Setting", element: <Navigate to={routes.settings} replace /> },
          { path: "setting", element: <Navigate to={routes.settings} replace /> },
          { path: "PostDetails/:postId", element: <LegacyPostRedirect /> },
        ],
      },
      // Unknown paths render 404 for everyone, signed in or not.
      { path: "*", element: lazyRoute(<NotFoundPage />) },
    ],
  },
  {
    path: "auth",
    element: <AuthLayout />,
    children: [
      {
        element: <RequireGuest />,
        children: [
          { path: "login", element: lazyRoute(<LoginPage />) },
          { path: "register", element: lazyRoute(<RegisterPage />) },
        ],
      },
    ],
  },
]);
