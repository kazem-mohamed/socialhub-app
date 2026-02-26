import React from "react";
import { Helmet } from "react-helmet";
import { matchPath, useLocation } from "react-router-dom";

const APP_NAME = "SocialHub";

const titleRules = [
  { path: "/", title: "Home" },
  { path: "/profile", title: "My Profile" },
  { path: "/profile/:userId", title: "Profile" },
  { path: "/Setting", title: "Settings" },
  { path: "/notifications", title: "Notifications" },
  { path: "/PostDetails/:id", title: "Post Details" },
  { path: "/auth/login", title: "Login" },
  { path: "/auth/register", title: "Register" },
  { path: "*", title: "Not Found" },
];

function resolveTitle(pathname) {
  const matchedRule = titleRules.find((rule) =>
    rule.path === "*"
      ? true
      : matchPath({ path: rule.path, end: true }, pathname)
  );

  const pageTitle = matchedRule?.title || "Social App";
  return `${pageTitle} | ${APP_NAME}`;
}

export default function PageTitle() {
  const { pathname } = useLocation();

  return (
    <Helmet>
      <title>{resolveTitle(pathname)}</title>
    </Helmet>
  );
}
