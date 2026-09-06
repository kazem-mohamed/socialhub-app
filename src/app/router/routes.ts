/**
 * Route paths in one place.
 *
 * The originals were inconsistently cased (`/Setting`, `/PostDetails/:id`) and
 * the navbar linked to `/setting`, which matched nothing and fell through to the
 * 404 route. Paths are lowercase now, with redirects from the old spellings so
 * existing links keep working.
 */
export const routes = {
  home: "/",
  profile: "/profile",
  userProfile: (userId: string) => `/profile/${userId}`,
  settings: "/settings",
  notifications: "/notifications",
  people: "/people",
  postDetails: (postId: string) => `/post/${postId}`,
  login: "/auth/login",
  register: "/auth/register",
} as const;

export const routePatterns = {
  home: "/",
  profile: "profile",
  userProfile: "profile/:userId",
  settings: "settings",
  notifications: "notifications",
  people: "people",
  postDetails: "post/:postId",
  login: "login",
  register: "register",
  notFound: "*",
} as const;

/** Old paths kept alive as redirects. */
export const legacyRedirects = [
  { from: "Setting", to: routes.settings },
  { from: "setting", to: routes.settings },
  { from: "PostDetails/:postId", to: "/post" },
] as const;
