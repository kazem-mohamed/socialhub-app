import { useContext, useEffect, useState } from "react";
import { Link as RouterLink, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Spinner } from "@heroui/react";

const DEFAULT_PROFILE_IMAGE =
  "https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png";

function getValidImageUrl(url) {
  if (typeof url !== "string") return DEFAULT_PROFILE_IMAGE;
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_PROFILE_IMAGE;
  return trimmed;
}

async function fetchCurrentUser(token) {
  const profileEndpoints = [
    "https://route-posts.routemisr.com/users/profile-data",
    "https://route-posts.routemisr.com/users/profile",
  ];

  for (const url of profileEndpoints) {
    try {
      const res = await axios.request({
        method: "GET",
        url,
        headers: { token },
      });

      const user =
        res?.data?.data?.user ||
        res?.data?.user ||
        res?.data?.data ||
        null;

      if (user) return user;
    } catch (error) {
      const status = error?.response?.status;
      if (status && status !== 404) throw error;
    }
  }

  return null;
}
export const AcmeLogo = () => {
  return (
    <img alt="Route Posts" className="h-9 w-9 rounded-xl object-cover" src="/route.png" />
  );
};

export default function Navbar() {
  const { userToken, removeUserToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isManualFeedRefresh, setIsManualFeedRefresh] = useState(false);
  const postsFetchingCount = useIsFetching({ queryKey: ["posts"] });

  const { data: currentUser } = useQuery({
    queryKey: ["navbar-profile", userToken],
    queryFn: () => fetchCurrentUser(userToken),
    enabled: Boolean(userToken),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const displayName = currentUser?.name || currentUser?.username || "User";
  const displayAvatar = getValidImageUrl(
    currentUser?.photo || currentUser?.avatar
  );
  const navLinkBaseClass =
    "relative flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-extrabold transition sm:gap-2 sm:px-3.5";

  const getNavLinkClassName = ({ isActive }) =>
    `${navLinkBaseClass} ${
      isActive
        ? "bg-white text-[#00298d]"
        : "text-slate-600 hover:bg-white/90 hover:text-slate-900"
    }`;

  function logOut() {
    removeUserToken();
    navigate("/auth/login");
  }

  async function handleFeedNavClick(event) {
    const isHomeRoute = location.pathname === "/";
    if (!isHomeRoute || isManualFeedRefresh) return;

    event.preventDefault();
    setIsManualFeedRefresh(true);

    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["posts"] }),
        queryClient.invalidateQueries({ queryKey: ["home-current-user"] }),
      ]);
      await queryClient.refetchQueries({ queryKey: ["posts"], type: "active" });
    } catch {
      setIsManualFeedRefresh(false);
    }
  }

  useEffect(() => {
    if (isManualFeedRefresh && postsFetchingCount === 0) {
      setIsManualFeedRefresh(false);
    }
  }, [isManualFeedRefresh, postsFetchingCount]);

  const isFeedRefreshing = isManualFeedRefresh;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-2 py-1.5 sm:gap-3 sm:px-3">
        <div className="flex items-center gap-3">
<svg viewBox="0 0 36 36"   className="h-9 w-9 rounded-xl object-cover"
 xmlns="http://www.w3.org/2000/svg" fill="none">
  <rect width="36" height="36" rx="10" fill="#00298d"/>
    
  <path d="M11 12C11 12 14 15 18 18C22 21 25 24 25 24"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"/>

  <path d="M25 12C25 12 22 15 18 18C14 21 11 24 11 24"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"/>

  <circle cx="11" cy="12" r="3" fill="white"/>
  <circle cx="25" cy="12" r="3" fill="white"/>
  <circle cx="11" cy="24" r="3" fill="white"/>
  <circle cx="25" cy="24" r="3" fill="white"/>
</svg>
          <p className="hidden text-xl font-extrabold text-[#00298d] sm:block">
            SocialHub
          </p>
        </div>

        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/90 px-1 py-1 sm:px-1.5">
          <NavLink to="/" end className={getNavLinkClassName} onClick={handleFeedNavClick}>
            <span className="relative">
              {isFeedRefreshing ? (
                <Spinner
                  size="sm"
                  variant="gradient"
                  classNames={{
                    circle1: "border-b-[#00298d]",
                    circle2: "border-b-[#00298d]",
                  }}
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
                  <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
              )}
            </span>
            <span className="hidden sm:inline">Feed</span>
            <span className="sr-only sm:hidden">Feed</span>
          </NavLink>

          <NavLink to="/profile" className={getNavLinkClassName}>
            <span className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            <span className="hidden sm:inline">Profile</span>
            <span className="sr-only sm:hidden">Profile</span>
          </NavLink>

          <NavLink to="/notifications" className={getNavLinkClassName}>
            <span className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"></path>
              </svg>
            </span>
            <span className="hidden sm:inline">Notifications</span>
            <span className="sr-only sm:hidden">Notifications</span>
          </NavLink>
        </nav>

        <div className="relative">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button className="flex items-center gap-2 cursor-pointer rounded-full border border-slate-200 bg-slate-50 px-2 py-1.5 transition hover:bg-slate-100">
                <img
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover"
                  src={displayAvatar}
                />
                <span className="hidden max-w-[140px] truncate text-sm font-semibold text-[#00298d] md:block">
                  {displayName}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#00298d]"
                  aria-hidden="true"
                >
                  <path d="M4 5h16"></path>
                  <path d="M4 12h16"></path>
                  <path d="M4 19h16"></path>
                </svg>
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" as={RouterLink} to="/profile">
                Profile
              </DropdownItem>
              <DropdownItem key="my-settings" as={RouterLink} to="/setting">
                My Settings
              </DropdownItem>
              <DropdownItem key="logout" color="danger" onClick={logOut}>
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
