import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";

const DEFAULT_PROFILE_IMAGE =
  "https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png";
const SUGGESTIONS_LIMIT = 10;

function UsersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-users text-[#1877f2]"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <circle cx="9" cy="7" r="4"></circle>
    </svg>
  );
}

function SearchIcon() {
  return (
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
      className="lucide lucide-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      aria-hidden="true"
    >
      <path d="m21 21-4.34-4.34"></path>
      <circle cx="11" cy="11" r="8"></circle>
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-user-plus"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <line x1="19" x2="19" y1="8" y2="14"></line>
      <line x1="22" x2="16" y1="11" y2="11"></line>
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-arrow-left"
      aria-hidden="true"
    >
      <path d="m12 19-7-7 7-7"></path>
      <path d="M19 12H5"></path>
    </svg>
  );
}

function getEntityId(user) {
  return user?._id || user?.id || user?.userId || null;
}

function getSafeImage(url) {
  if (typeof url !== "string") return DEFAULT_PROFILE_IMAGE;
  const trimmed = url.trim();
  return trimmed || DEFAULT_PROFILE_IMAGE;
}

function getFollowersCount(user) {
  const value =
    user?.followersCount || user?.followersTotal || user?.totalFollowers || user?.followers;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.length;
  return 0;
}

function getUserName(user) {
  const name = typeof user?.name === "string" ? user.name.trim() : "";
  if (name) return name;
  const username = typeof user?.username === "string" ? user.username.trim() : "";
  if (username) return username;
  return "User";
}

function getUserUsername(user) {
  const username = typeof user?.username === "string" ? user.username.trim() : "";
  if (!username) return "user";
  return username.startsWith("@") ? username.slice(1) : username;
}

function extractApiMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.errors?.[0]?.msg ||
    error?.message ||
    fallbackMessage
  );
}

function parseBooleanLike(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value > 0;
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["true", "yes", "followed", "following", "1"].includes(normalized)) return true;
  if (["false", "no", "unfollowed", "not-following", "0"].includes(normalized)) return false;
  return null;
}

function getIsFollowing(user, rawUser) {
  const candidates = [
    rawUser?.isFollowing,
    rawUser?.isFollowed,
    rawUser?.followedByMe,
    rawUser?.followedByCurrentUser,
    rawUser?.relationship?.isFollowing,
    rawUser?.relationship?.isFollowed,
    rawUser?.relationship?.followedByMe,
    user?.isFollowing,
    user?.isFollowed,
    user?.followedByMe,
    user?.followedByCurrentUser,
    user?.relationship?.isFollowing,
    user?.relationship?.isFollowed,
    user?.relationship?.followedByMe,
  ];

  for (const value of candidates) {
    const parsed = parseBooleanLike(value);
    if (parsed !== null) return parsed;
  }

  return false;
}

function extractUsersFromResponse(raw) {
  const candidates = [
    raw?.data?.data?.suggestions,
    raw?.data?.suggestions,
    raw?.suggestions,
    raw?.data?.data?.users,
    raw?.data?.users,
    raw?.users,
    raw?.data?.data?.items,
    raw?.data?.items,
    raw?.items,
    raw?.data?.data,
    raw?.data,
  ];

  for (const item of candidates) {
    if (Array.isArray(item)) return item;
    if (item && typeof item === "object") return [item];
  }

  return [];
}

function extractPaginationInfo(raw) {
  return (
    raw?.data?.data?.paginationInfo ||
    raw?.data?.paginationInfo ||
    raw?.paginationInfo ||
    raw?.data?.metadata ||
    raw?.metadata ||
    null
  );
}

function extractTotalPages(raw) {
  const info = extractPaginationInfo(raw);
  const value =
    info?.numberOfPages || info?.pages || info?.totalPages || info?.total_pages || null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function unwrapUserRecord(candidate) {
  if (!candidate || typeof candidate !== "object") return null;

  const possibilities = [
    candidate,
    candidate?.user,
    candidate?.suggestedUser,
    candidate?.profile,
    candidate?.account,
    candidate?.toUser,
    candidate?.fromUser,
  ];

  for (const item of possibilities) {
    if (getEntityId(item)) return item;
  }

  return candidate?.user || candidate?.profile || candidate?.suggestedUser || null;
}

function normalizeUser(rawUser) {
  const user = unwrapUserRecord(rawUser);
  const id = getEntityId(user);
  if (!id) return null;

  return {
    id,
    name: getUserName(user),
    username: getUserUsername(user),
    photo: getSafeImage(user?.photo || user?.avatar),
    followersCount: getFollowersCount(user) || getFollowersCount(rawUser),
    email: user?.email || "",
    isFollowing: getIsFollowing(user, rawUser),
  };
}

async function fetchCurrentUser(token) {
  const endpoints = [
    "https://route-posts.routemisr.com/users/profile-data",
    "https://route-posts.routemisr.com/users/profile",
  ];

  for (const url of endpoints) {
    try {
      const response = await axios.request({
        method: "GET",
        url,
        headers: { token },
      });
      const user =
        response?.data?.data?.user || response?.data?.user || response?.data?.data || null;
      if (user) return user;
    } catch (error) {
      const status = error?.response?.status;
      if (status && status !== 404) throw error;
    }
  }

  return null;
}

async function fetchSuggestionsPage(token, pageParam = 1) {
  const response = await axios.request({
    method: "GET",
    url: "https://route-posts.routemisr.com/users/suggestions",
    headers: {
      token,
      Authorization: `Bearer ${token}`,
    },
    params: {
      limit: SUGGESTIONS_LIMIT,
      page: pageParam,
      skip: (pageParam - 1) * SUGGESTIONS_LIMIT,
      offset: (pageParam - 1) * SUGGESTIONS_LIMIT,
    },
  });

  return {
    items: extractUsersFromResponse(response?.data),
    page: pageParam,
    totalPages: extractTotalPages(response?.data),
    limit: SUGGESTIONS_LIMIT,
  };
}

async function fetchSearchUsersPage(token, pageParam = 1, searchText = "") {
  const response = await axios.request({
    method: "GET",
    url: "https://route-posts.routemisr.com/users/search",
    headers: {
      token,
      Authorization: `Bearer ${token}`,
    },
    params: {
      limit: SUGGESTIONS_LIMIT,
      page: pageParam,
      q: searchText.trim(),
    },
  });

  return {
    items: extractUsersFromResponse(response?.data),
    page: pageParam,
    totalPages: extractTotalPages(response?.data),
    limit: SUGGESTIONS_LIMIT,
  };
}

async function toggleFollowUser(token, userId) {
  return axios.request({
    method: "PUT",
    url: `https://route-posts.routemisr.com/users/${userId}/follow`,
    headers: {
      token,
      Authorization: `Bearer ${token}`,
    },
  });
}

function getNextPageParam(lastPage) {
  if (!lastPage) return undefined;
  if (typeof lastPage.totalPages === "number") {
    return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
  }
  return lastPage.items.length >= lastPage.limit ? lastPage.page + 1 : undefined;
}

function buildUsersFromPages(pages, currentUserId) {
  const usersMap = new Map();

  for (const page of pages || []) {
    const items = Array.isArray(page?.items) ? page.items : [];
    for (const rawItem of items) {
      const normalized = normalizeUser(rawItem);
      if (!normalized) continue;
      if (normalized.id === currentUserId) continue;
      if (usersMap.has(normalized.id)) continue;
      usersMap.set(normalized.id, normalized);
    }
  }

  return Array.from(usersMap.values()).sort((a, b) => b.followersCount - a.followersCount);
}

export default function SearchUser({ mode = "desktop" }) {
  const isMobileMode = mode === "mobile";
  const token = localStorage.getItem("User_Token");
  const [searchValue, setSearchValue] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileAllUsersOpen, setIsMobileAllUsersOpen] = useState(false);
  const [followOverrides, setFollowOverrides] = useState({});
  const [followLoadingById, setFollowLoadingById] = useState({});
  const [followError, setFollowError] = useState("");
  const searchQuery = searchValue.trim();
  const isSearchVisible = !isMobileMode || isMobileOpen || isMobileAllUsersOpen;
  const isSearchMode = isSearchVisible && Boolean(searchQuery);

  useEffect(() => {
    if (!isMobileMode || !isMobileAllUsersOpen) return undefined;

    const bodyStyle = document.body.style;
    const htmlStyle = document.documentElement.style;
    const previousBodyPosition = bodyStyle.position;
    const previousBodyTop = bodyStyle.top;
    const previousBodyLeft = bodyStyle.left;
    const previousBodyRight = bodyStyle.right;
    const previousBodyWidth = bodyStyle.width;
    const previousBodyOverflow = bodyStyle.overflow;
    const previousHtmlOverflow = htmlStyle.overflow;
    const scrollY = window.scrollY;

    bodyStyle.position = "fixed";
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.left = "0";
    bodyStyle.right = "0";
    bodyStyle.width = "100%";
    bodyStyle.overflow = "hidden";
    htmlStyle.overflow = "hidden";

    return () => {
      bodyStyle.position = previousBodyPosition;
      bodyStyle.top = previousBodyTop;
      bodyStyle.left = previousBodyLeft;
      bodyStyle.right = previousBodyRight;
      bodyStyle.width = previousBodyWidth;
      bodyStyle.overflow = previousBodyOverflow;
      htmlStyle.overflow = previousHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isMobileMode, isMobileAllUsersOpen]);

  const { data: currentUser } = useQuery({
    queryKey: ["search-user-current-profile", token],
    queryFn: () => fetchCurrentUser(token),
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const suggestionsQuery = useInfiniteQuery({
    queryKey: ["suggested-users", token, isSearchMode ? "search" : "suggestions", searchQuery],
    queryFn: ({ pageParam }) =>
      isSearchMode
        ? fetchSearchUsersPage(token, pageParam, searchQuery)
        : fetchSuggestionsPage(token, pageParam),
    enabled: Boolean(token),
    initialPageParam: 1,
    getNextPageParam,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const currentUserId = getEntityId(currentUser);
  const pages = suggestionsQuery.data?.pages;
  const users = useMemo(
    () => buildUsersFromPages(Array.isArray(pages) ? pages : [], currentUserId),
    [pages, currentUserId]
  );

  const isLoading = suggestionsQuery.isLoading;
  const isFetching = suggestionsQuery.isFetching;
  const isLoadingMore = suggestionsQuery.isFetchingNextPage;
  const hasMoreUsers = Boolean(suggestionsQuery.hasNextPage);
  const error = suggestionsQuery.error;
  const errorMessage = extractApiMessage(error, "Failed to load suggested users.");

  const followMutation = useMutation({
    mutationFn: ({ userId }) => toggleFollowUser(token, userId),
    onMutate: ({ userId, currentIsFollowing, currentFollowersCount, nextIsFollowing, nextFollowersCount }) => {
      setFollowError("");
      setFollowLoadingById((prev) => ({ ...prev, [userId]: true }));
      setFollowOverrides((prev) => ({
        ...prev,
        [userId]: {
          isFollowing: nextIsFollowing,
          followersCount: nextFollowersCount,
        },
      }));

      return { userId, currentIsFollowing, currentFollowersCount };
    },
    onError: (mutationError, _variables, context) => {
      if (context?.userId) {
        setFollowOverrides((prev) => ({
          ...prev,
          [context.userId]: {
            isFollowing: context.currentIsFollowing,
            followersCount: context.currentFollowersCount,
          },
        }));
      }
      setFollowError(extractApiMessage(mutationError, "Failed to update follow status."));
    },
    onSettled: (_data, _error, variables) => {
      if (!variables?.userId) return;
      setFollowLoadingById((prev) => {
        const next = { ...prev };
        delete next[variables.userId];
        return next;
      });
    },
  });

  function handleFollowToggle(user) {
    if (!token || !user?.id || followLoadingById[user.id]) return;

    const currentOverride = followOverrides[user.id];
    const currentIsFollowing = currentOverride?.isFollowing ?? Boolean(user.isFollowing);
    const currentFollowersCount = currentOverride?.followersCount ?? user.followersCount;
    const nextIsFollowing = !currentIsFollowing;
    const nextFollowersCount = Math.max(
      0,
      currentFollowersCount + (nextIsFollowing ? 1 : -1)
    );

    followMutation.mutate({
      userId: user.id,
      currentIsFollowing,
      currentFollowersCount,
      nextIsFollowing,
      nextFollowersCount,
    });
  }

  const usersList = users.length > 0 ? (
    <div className="space-y-3">
      {users.map((user) => {
        const override = followOverrides[user.id];
        const isFollowing = override?.isFollowing ?? Boolean(user.isFollowing);
        const followersCount = override?.followersCount ?? user.followersCount;
        const isFollowLoading = Boolean(followLoadingById[user.id]);

        return (
          <div key={user.id} className="rounded-xl border border-slate-200 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <Link
                to={`/profile/${user.id}`}
                className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 text-left transition hover:bg-slate-50"
              >
                <img
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover"
                  src={user.photo}
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 hover:underline">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">@{user.username}</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => handleFollowToggle(user)}
                disabled={isFollowLoading}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                  isFollowing
                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    : "bg-[#e7f3ff] text-[#1877f2] hover:bg-[#d8ebff]"
                }`}
              >
                <UserPlusIcon />
                {isFollowLoading ? "Updating..." : isFollowing ? "Unfollow" : "Follow"}
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                {followersCount} followers
              </span>
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
      No users found.
    </div>
  );

  const usersGridList = users.length > 0 ? (
    <div className="grid gap-3 sm:grid-cols-2">
      {users.map((user) => {
        const override = followOverrides[user.id];
        const isFollowing = override?.isFollowing ?? Boolean(user.isFollowing);
        const followersCount = override?.followersCount ?? user.followersCount;
        const isFollowLoading = Boolean(followLoadingById[user.id]);

        return (
          <article key={`grid-${user.id}`} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <Link
                to={`/profile/${user.id}`}
                className="flex min-w-0 items-center gap-3 rounded-lg px-1 py-1 text-left transition hover:bg-slate-50"
              >
                <img
                  alt={user.name}
                  className="h-12 w-12 rounded-full object-cover"
                  src={user.photo}
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 hover:underline">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">@{user.username}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => handleFollowToggle(user)}
                disabled={isFollowLoading}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                  isFollowing
                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    : "bg-[#e7f3ff] text-[#1877f2] hover:bg-[#d8ebff]"
                }`}
              >
                <UserPlusIcon />
                {isFollowLoading ? "Updating..." : isFollowing ? "Unfollow" : "Follow"}
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                {followersCount} followers
              </span>
              <span className="rounded-full bg-[#edf4ff] px-2 py-0.5 text-[#1877f2]">
                1 mutual
              </span>
            </div>
          </article>
        );
      })}
    </div>
  ) : (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
      No users found.
    </div>
  );

  const statusBlocks = (
    <>
      {!token ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
          Login to view suggested users.
        </div>
      ) : null}

      {token && isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
          Loading suggestions...
        </div>
      ) : null}

      {token && !isLoading && error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          {errorMessage}
        </div>
      ) : null}

      {token && !error && followError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          {followError}
        </div>
      ) : null}
    </>
  );

  if (isMobileMode && isMobileAllUsersOpen) {
    return (
      <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#f0f2f5] xl:hidden">
        <div className="mx-auto max-w-7xl px-3 py-3.5">
          <main className="min-w-0">
            <div className="mx-auto max-w-4xl space-y-4">
              <button
                type="button"
                onClick={() => setIsMobileAllUsersOpen(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeftIcon />
                Back to feed
              </button>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UsersIcon />
                    <h1 className="text-xl font-extrabold text-slate-900">All Suggested Friends</h1>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                    {isLoading ? "..." : users.length}
                  </span>
                </div>

                <label className="relative mb-4 block">
                  <SearchIcon />
                  <input
                    placeholder="Search by name or username..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-[#1877f2] focus:bg-white"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                  />
                </label>

                {statusBlocks}

                {token && !isLoading && !error ? (
                  <>
                    {isFetching ? (
                      <p className="mb-2 text-[11px] font-semibold text-slate-500">Refreshing...</p>
                    ) : null}

                    {usersGridList}

                    {hasMoreUsers ? (
                      <button
                        type="button"
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                        onClick={() => suggestionsQuery.fetchNextPage()}
                        disabled={isLoadingMore}
                      >
                        {isLoadingMore ? "Loading..." : "Load more users"}
                      </button>
                    ) : null}
                  </>
                ) : null}
              </section>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (isMobileMode) {
    return (
      <div className="space-y-3 xl:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm"
        >
          <span className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <UsersIcon />
            Suggested Friends
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
              {isLoading ? "..." : users.length}
            </span>
            <span className="text-xs font-bold text-[#1877f2]">
              {isMobileOpen ? "Hide" : "Show"}
            </span>
          </span>
        </button>

        {isMobileOpen ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <label className="relative mb-3 block">
              <SearchIcon />
              <input
                placeholder="Search friends..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[#1877f2] focus:bg-white"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </label>

            {statusBlocks}

            {token && !isLoading && !error ? (
              <>
                {isFetching ? (
                  <p className="mb-2 text-[11px] font-semibold text-slate-500">Refreshing...</p>
                ) : null}
                {usersList}
                <button
                  type="button"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setIsMobileAllUsersOpen(true)}
                >
                  Add more
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <aside className="hidden h-fit xl:sticky xl:top-[84px] xl:block">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UsersIcon />
            <h3 className="text-base font-extrabold text-slate-900">Suggested Friends</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
            {users.length}
          </span>
        </div>

        <div className="mb-3">
          <label className="relative block">
            <SearchIcon />
            <input
              placeholder="Search friends..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[#1877f2] focus:bg-white"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </label>
        </div>

        {statusBlocks}

        {token && !isLoading && !error ? (
          <>
            {isFetching ? (
              <p className="mb-2 text-[11px] font-semibold text-slate-500">Refreshing...</p>
            ) : null}

            {usersList}

            {hasMoreUsers ? (
              <button
                type="button"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                onClick={() => suggestionsQuery.fetchNextPage()}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "View more"}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </aside>
  );
}
