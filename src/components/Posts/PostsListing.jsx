import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import PostCard from "./PostCard";
import PostForm from "./postForm";
import SearchUser from "./searchUser";
import FilterPosts from "./filterPosts";

function extractApiMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.errors?.[0]?.msg ||
    error?.message ||
    fallbackMessage
  );
}

function getEntityId(entity) {
  return entity?._id || entity?.id || entity?.userId || null;
}

function extractUser(responseData) {
  return (
    responseData?.data?.user ||
    responseData?.data?.profile ||
    responseData?.user ||
    responseData?.profile ||
    responseData?.data ||
    null
  );
}

function markPostAsSaved(post) {
  if (!post || typeof post !== "object") return null;
  return {
    ...post,
    __isBookmarked: true,
    isBookmarked: true,
  };
}

function normalizeSavedPost(item) {
  if (!item || typeof item !== "object") return null;
  if (item?.post && typeof item.post === "object") return markPostAsSaved(item.post);
  if (item?.postId && typeof item.postId === "object") return markPostAsSaved(item.postId);
  if (item?.postData && typeof item.postData === "object") return markPostAsSaved(item.postData);
  if (item?._id || item?.id) return markPostAsSaved(item);
  return null;
}

function extractPosts(rawResponseData) {
  const candidates = [
    rawResponseData?.data?.posts,
    rawResponseData?.posts,
    rawResponseData?.data?.data?.posts,
    rawResponseData?.data?.data?.items,
    rawResponseData?.data?.items,
    rawResponseData?.data?.data,
    rawResponseData?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function extractSavedPosts(rawResponseData) {
  const candidates = [
    rawResponseData?.data?.bookmarks,
    rawResponseData?.bookmarks,
    rawResponseData?.data?.savedPosts,
    rawResponseData?.savedPosts,
    rawResponseData?.data?.posts,
    rawResponseData?.posts,
    rawResponseData?.data?.data?.bookmarks,
    rawResponseData?.data?.data?.posts,
    rawResponseData?.data?.data,
  ];

  const foundList = candidates.find((candidate) => Array.isArray(candidate));
  if (!Array.isArray(foundList)) return [];

  return foundList.map(normalizeSavedPost).filter(Boolean);
}

async function fetchCurrentUser(token) {
  const response = await axios.request({
    method: "GET",
    url: "https://route-posts.routemisr.com/users/profile-data",
    headers: { token },
  });

  return extractUser(response?.data);
}

async function fetchPostsByFilter({ token, filter, currentUserId }) {
  const headers = {
    token,
    Authorization: `Bearer ${token}`,
  };

  if (filter === "feed") {
    const response = await axios.request({
      method: "GET",
      url: "https://route-posts.routemisr.com/posts/feed",
      headers,
      params: {
        only: "following",
        limit: 10,
      },
    });

    return extractPosts(response?.data);
  }

  if (filter === "my-posts") {
    if (!currentUserId) return [];

    const response = await axios.request({
      method: "GET",
      url: `https://route-posts.routemisr.com/users/${currentUserId}/posts`,
      headers,
      params: { sort: "-createdAt" },
    });

    return extractPosts(response?.data);
  }

  if (filter === "saved") {
    const response = await axios.request({
      method: "GET",
      url: "https://route-posts.routemisr.com/users/bookmarks",
      headers,
      params: { sort: "-createdAt" },
    });

    return extractSavedPosts(response?.data);
  }

  const response = await axios.request({
    method: "GET",
    url: "https://route-posts.routemisr.com/posts",
    headers,
    params: { sort: "-createdAt" },
  });

  return extractPosts(response?.data);
}

export default function PostsListing() {
  const token = localStorage.getItem("User_Token");
  const [activeFilter, setActiveFilter] = useState("feed");

  const { data: currentUser } = useQuery({
    queryKey: ["home-current-user", token],
    queryFn: () => fetchCurrentUser(token),
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const currentUserId = getEntityId(currentUser);
  const isMyPostsFilter = activeFilter === "my-posts";

  const {
    data: posts = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["posts", token, activeFilter, currentUserId],
    queryFn: () =>
      fetchPostsByFilter({
        token,
        filter: activeFilter,
        currentUserId,
      }),
    enabled: Boolean(token) && (!isMyPostsFilter || Boolean(currentUserId)),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: 1000 * 60 * 30 * 24,
    retry: 3,
  });

  const errorMessage =
    extractApiMessage(error, "") ||
    (!token ? "You need to login first." : "Failed to load posts. Please refresh.");

  const currentFeedTitle =
    activeFilter === "feed"
      ? "Feed"
      : activeFilter === "my-posts"
      ? "My Posts"
      : activeFilter === "saved"
      ? "Saved"
      : "Community";

  const emptyMessage =
    activeFilter === "feed"
      ? "No posts from following users yet."
      : activeFilter === "my-posts"
      ? "You have not posted yet."
      : activeFilter === "saved"
      ? "No saved posts found."
      : "No posts found.";

  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#f0f2f5]">
      <div className="mx-auto max-w-7xl px-3 py-5">
        <div className="xl:grid xl:grid-cols-[248px_minmax(0,1fr)_320px] xl:items-start xl:gap-6">
          <FilterPosts activeFilter={activeFilter} onFilterChange={setActiveFilter} />

          <div className="mx-auto w-full max-w-3xl space-y-4 xl:mx-0">
            {token ? <PostForm /> : null}

            {token ? (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-extrabold text-slate-900">{currentFeedTitle}</h2>
                  {isFetching ? (
                    <span className="text-xs font-semibold text-slate-500">Refreshing...</span>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!token ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                You need to login first.
              </div>
            ) : null}

            {isLoading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                Loading posts...
              </div>
            ) : null}

            {!isLoading && error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
                {errorMessage}
              </div>
            ) : null}

            {token && !isLoading && !error && posts.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                {emptyMessage}
              </div>
            ) : null}

            {token && !isLoading && !error
              ? posts.map((post) => <PostCard key={post?._id || post?.id} post={post} />)
              : null}
          </div>

          <SearchUser />
        </div>
      </div>
    </div>
  );
}

