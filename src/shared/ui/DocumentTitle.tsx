import { matchPath, useLocation } from "react-router";
import { APP_NAME } from "@/shared/config/constants";

const TITLE_RULES = [
  { path: "/", title: "Home" },
  { path: "/profile", title: "My Profile" },
  { path: "/profile/:userId", title: "Profile" },
  { path: "/settings", title: "Settings" },
  { path: "/notifications", title: "Notifications" },
  { path: "/post/:postId", title: "Post Details" },
  { path: "/auth/login", title: "Login" },
  { path: "/auth/register", title: "Register" },
];

function resolveTitle(pathname: string): string {
  const matched = TITLE_RULES.find((rule) =>
    matchPath({ path: rule.path, end: true }, pathname),
  );
  return `${matched?.title ?? "Not Found"} | ${APP_NAME}`;
}

/**
 * Sets the document title per route.
 *
 * React 19 hoists `<title>` into `<head>` natively, which replaced the
 * `react-helmet` dependency — a package that still uses lifecycles React 19
 * warns about.
 */
export function DocumentTitle() {
  const { pathname } = useLocation();
  return <title>{resolveTitle(pathname)}</title>;
}
