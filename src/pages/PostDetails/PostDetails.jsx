import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PostCard from "../../components/Posts/PostCard";

async function fetchSinglePost(token, id) {
  const res = await axios.request({
    method: "GET",
    url: `https://route-posts.routemisr.com/posts/${id}`,
    headers: { token },
  });

  return (
    res?.data?.data?.post ||
    res?.data?.post ||
    res?.data?.data ||
    null
  );
}

export default function PostDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("User_Token");
  const shouldShowCommentsByDefault = searchParams.get("showComments") === "1";

  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["post-details", id, token],
    queryFn: () => fetchSinglePost(token, id),
    enabled: Boolean(token && id),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 3,
  });

  const errorMessage =
    error?.response?.data?.message ||
    error?.message ||
    (!token ? "You need to login first." : "Failed to load this post.");

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-3.5">
      <main className="min-w-0">
        <div className="mx-auto max-w-3xl space-y-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center cursor-pointer gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-arrow-left"
              aria-hidden="true"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back
          </button>

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Loading post...
            </div>
          ) : null}

          {!isLoading && error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && !error && !post ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Post not found.
            </div>
          ) : null}

          {!isLoading && !error && post ? (
            <PostCard
              post={post}
              showTopComment={false}
              initialCommentsOpen={shouldShowCommentsByDefault}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
