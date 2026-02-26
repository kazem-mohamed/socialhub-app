import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@heroui/react";
import CommentsSection from "./CommentsSection";
import { z } from "zod";

const DEFAULT_PROFILE_IMAGE =
  "https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png";

async function fetchPostLikes(token, postId) {
  const res = await axios.request({
    method: "GET",
    url: `https://route-posts.routemisr.com/posts/${postId}/likes`,
    headers: { token },
  });

  const rawLikes = res?.data?.data?.likes || res?.data?.likes || res?.data?.data || [];
  const likesCountFromApi =
    res?.data?.data?.likesCount ??
    res?.data?.likesCount ??
    res?.data?.data?.count ??
    (Array.isArray(rawLikes) ? rawLikes.length : null);

  return {
    likes: Array.isArray(rawLikes) ? rawLikes : [],
    likesCount: Number.isFinite(Number(likesCountFromApi))
      ? Number(likesCountFromApi)
      : null,
  };
}

async function togglePostLike(token, postId) {
  return axios.request({
    method: "PUT",
    url: `https://route-posts.routemisr.com/posts/${postId}/like`,
    headers: { token },
  });
}

async function togglePostBookmark(token, postId) {
  return axios.request({
    method: "PUT",
    url: `https://route-posts.routemisr.com/posts/${postId}/bookmark`,
    headers: {
      token,
      Authorization: `Bearer ${token}`,
    },
  });
}

async function sharePostById(token, postId, shareText = "") {
  const trimmedShareText = typeof shareText === "string" ? shareText.trim() : "";
  const payload = trimmedShareText ? { body: trimmedShareText } : {};

  return axios.request({
    method: "POST",
    url: `https://route-posts.routemisr.com/posts/${postId}/share`,
    headers: {
      token,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: payload,
  });
}

const updatePostSchema = z
  .object({
    body: z.string().optional(),
    imageFile: z.custom(
      (value) =>
        value === null ||
        value === undefined ||
        (typeof File !== "undefined" && value instanceof File),
      "Please select a valid image file."
    ),
  })
  .refine((data) => Boolean(data?.body?.trim()) || data?.imageFile, {
    message: "Post cannot be empty. Add text or upload an image.",
    path: ["body"],
  })
  .refine(
    (data) =>
      !data?.imageFile ||
      (typeof File !== "undefined" &&
        data.imageFile instanceof File &&
        data.imageFile.type.startsWith("image/")),
    {
      message: "Only image files are allowed.",
      path: ["imageFile"],
    }
  );

async function updatePostById(token, postId, payload) {
  const formData = new FormData();
  const trimmedBody = payload?.body?.trim() || "";

  if (trimmedBody) {
    formData.append("body", trimmedBody);
  }

  if (payload?.imageFile && typeof File !== "undefined" && payload.imageFile instanceof File) {
    formData.append("image", payload.imageFile);
  }

  return axios.request({
    method: "PUT",
    url: `https://route-posts.routemisr.com/posts/${postId}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: formData,
  });
}

async function deletePostById(token, postId) {
  return axios.request({
    method: "DELETE",
    url: `https://route-posts.routemisr.com/posts/${postId}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function getRelativeTimeShort(dateValue) {
  if (!dateValue) return "now";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "now";

  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m`;
  if (diffMs < day) return `${Math.max(1, Math.floor(diffMs / hour))}h`;
  return `${Math.max(1, Math.floor(diffMs / day))}d`;
}

function getFormattedDate(dateValue) {
  if (!dateValue) return "Unknown date";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
}

function getCount(value) {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
}

function getEntityId(entity) {
  if (typeof entity === "string") {
    const trimmed = entity.trim();
    return trimmed || null;
  }
  if (typeof entity === "number" && Number.isFinite(entity)) {
    return String(entity);
  }
  return entity?._id || entity?.id || entity?.userId || null;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getUserObject(candidate) {
  if (!isPlainObject(candidate)) return null;

  const directCandidates = [candidate, candidate?.user, candidate?.profile, candidate?.author];
  for (const item of directCandidates) {
    if (!isPlainObject(item)) continue;
    if (
      item?.name ||
      item?.username ||
      item?.email ||
      item?.photo ||
      item?.avatar ||
      getEntityId(item)
    ) {
      return item;
    }
  }

  return null;
}

function looksLikePost(candidate) {
  if (!isPlainObject(candidate)) return false;

  return Boolean(
    getEntityId(candidate) ||
      candidate?.body ||
      candidate?.image ||
      (Array.isArray(candidate?.images) && candidate.images.length > 0) ||
      candidate?.createdAt ||
      candidate?.user ||
      candidate?.author
  );
}

function getPostBody(post) {
  if (typeof post?.body !== "string") return "";
  if (post.body === "undefined") return "";
  return post.body;
}

function getPostImage(post) {
  return post?.image || post?.images?.[0] || post?.media?.[0]?.url || null;
}

function getSharedSourcePost(post) {
  if (!isPlainObject(post)) return null;

  const explicitCandidates = [
    post?.sharedPost,
    post?.originalPost,
    post?.repostOf,
    post?.sourcePost,
    post?.parentPost,
    post?.shared?.post,
    post?.share?.post,
    post?.shareData?.post,
  ];

  for (const candidate of explicitCandidates) {
    if (looksLikePost(candidate)) return candidate;
  }

  const currentPostId = getEntityId(post);
  const fallbackCandidates = [post?.post, post?.postData, post?.postId];
  for (const candidate of fallbackCandidates) {
    if (!looksLikePost(candidate)) continue;

    const nestedId = getEntityId(candidate);
    if (!nestedId || !currentPostId || String(nestedId) !== String(currentPostId)) {
      return candidate;
    }
  }

  return null;
}

async function fetchCurrentUser(token) {
  const res = await axios.request({
    method: "GET",
    url: "https://route-posts.routemisr.com/users/profile-data",
    headers: { token },
  });

  return (
    res?.data?.data?.user ||
    res?.data?.user ||
    res?.data?.data ||
    null
  );
}

function getCurrentUserIdFromToken(token) {
  if (!token || typeof token !== "string") return null;

  try {
    const payloadPart = token.split(".")?.[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const decodedPayload = JSON.parse(atob(padded));
    return (
      decodedPayload?._id ||
      decodedPayload?.id ||
      decodedPayload?.userId ||
      decodedPayload?.user?._id ||
      decodedPayload?.user?.id ||
      decodedPayload?.user?.userId ||
      null
    );
  } catch {
    return null;
  }
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
  if (["true", "yes", "saved", "bookmarked", "1"].includes(normalized)) return true;
  if (["false", "no", "unsaved", "unbookmarked", "0"].includes(normalized)) return false;
  return null;
}

function getInitialBookmarkState(post) {
  const candidates = [
    post?.__isBookmarked,
    post?.isBookmarked,
    post?.bookmarkedByMe,
    post?.savedByMe,
    post?.isSaved,
    post?.saved,
    post?.bookmark,
    post?.meta?.isBookmarked,
    post?.meta?.savedByMe,
  ];

  for (const value of candidates) {
    const parsed = parseBooleanLike(value);
    if (parsed !== null) return parsed;
  }

  return false;
}

function getLikeResultFromResponse(responseData, currentLikeState, currentCount) {
  const message = String(responseData?.message || "").toLowerCase();
  let nextIsLiked = !currentLikeState;

  if (message.includes("unlike") || message.includes("removed") || message.includes("delete")) {
    nextIsLiked = false;
  } else if (message.includes("like")) {
    nextIsLiked = true;
  }

  const countFromApi =
    responseData?.data?.likesCount ??
    responseData?.likesCount ??
    responseData?.data?.count ??
    (Array.isArray(responseData?.data?.likes) ? responseData.data.likes.length : null) ??
    (Array.isArray(responseData?.likes) ? responseData.likes.length : null);

  const safeCurrentCount = Number.isFinite(currentCount) ? currentCount : 0;
  const computedCount = nextIsLiked
    ? safeCurrentCount + (currentLikeState ? 0 : 1)
    : Math.max(0, safeCurrentCount - (currentLikeState ? 1 : 0));

  return {
    isLiked: nextIsLiked,
    count: Number.isFinite(Number(countFromApi)) ? Number(countFromApi) : computedCount,
  };
}

function getBookmarkResultFromResponse(responseData, currentBookmarkState) {
  const responseCandidates = [
    responseData?.data?.isBookmarked,
    responseData?.isBookmarked,
    responseData?.data?.bookmarked,
    responseData?.bookmarked,
    responseData?.data?.saved,
    responseData?.saved,
    responseData?.data?.isSaved,
    responseData?.isSaved,
  ];

  for (const value of responseCandidates) {
    const parsed = parseBooleanLike(value);
    if (parsed !== null) {
      return parsed;
    }
  }

  const message = String(responseData?.message || "").toLowerCase();
  if (
    message.includes("unsave") ||
    message.includes("un save") ||
    message.includes("unbookmark") ||
    message.includes("remove bookmark")
  ) {
    return false;
  }
  if (
    message.includes("saved") ||
    message.includes("save") ||
    message.includes("bookmarked") ||
    message.includes("bookmark")
  ) {
    return true;
  }

  return !currentBookmarkState;
}

function getShareCountFromResponse(responseData, currentCount) {
  const countFromApi =
    responseData?.data?.sharesCount ??
    responseData?.sharesCount ??
    responseData?.data?.count ??
    (Array.isArray(responseData?.data?.shares) ? responseData.data.shares.length : null) ??
    (Array.isArray(responseData?.shares) ? responseData.shares.length : null);

  if (Number.isFinite(Number(countFromApi))) {
    return Number(countFromApi);
  }

  const message = String(responseData?.message || "").toLowerCase();
  const safeCurrentCount = Number.isFinite(currentCount) ? currentCount : 0;
  if (message.includes("unshare") || message.includes("remove")) {
    return Math.max(0, safeCurrentCount - 1);
  }
  return safeCurrentCount + 1;
}

function getValidImageUrl(url) {
  if (typeof url !== "string") return DEFAULT_PROFILE_IMAGE;
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_PROFILE_IMAGE;
  return trimmed;
}

function getUserHandle(user, authorName) {
  const raw =
    user?.username ||
    user?.email?.split("@")?.[0] ||
    authorName?.toLowerCase()?.replace(/\s+/g, "");

  if (!raw) return "@user";
  return raw.startsWith("@") ? raw : `@${raw}`;
}

function getTopComment(post) {
  const topComment =
    post?.topComment ||
    (Array.isArray(post?.comments) && post.comments.length > 0
      ? post.comments[0]
      : null);
  if (!topComment) return null;

  return {
    authorName:
      topComment?.commentCreator?.name ||
      topComment?.user?.name ||
      "Unknown user",
    authorPhoto: getValidImageUrl(
      topComment?.commentCreator?.photo || topComment?.user?.photo
    ),
    content: topComment?.content || topComment?.body || "",
  };
}

function EarthIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-earth"
      aria-hidden="true"
    >
      <path d="M21.54 15H17a2 2 0 0 0-2 2v4.54" />
      <path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17" />
      <path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" />
      <circle cx={12} cy={12} r={10} />
    </svg>
  );
}

export default function PostCard({
  post,
  fallbackUser = null,
  showTopComment = true,
  onViewAllComments,
  initialCommentsOpen = false,
  children,
}) {
  const token = localStorage.getItem("User_Token");
  const queryClient = useQueryClient();
  const currentUserIdFromToken = useMemo(() => getCurrentUserIdFromToken(token), [token]);
  const { data: currentUser } = useQuery({
    queryKey: ["home-current-user", token],
    queryFn: () => fetchCurrentUser(token),
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });
  const currentUserId = getEntityId(currentUser) || currentUserIdFromToken;
  const postAuthor =
    getUserObject(post?.user) ||
    getUserObject(post?.createdBy) ||
    getUserObject(post?.author) ||
    getUserObject(post?.owner) ||
    getUserObject(fallbackUser) ||
    {};
  const sharedSourcePost = getSharedSourcePost(post);
  const sharedAuthor =
    getUserObject(sharedSourcePost?.user) ||
    getUserObject(sharedSourcePost?.createdBy) ||
    getUserObject(sharedSourcePost?.author) ||
    getUserObject(sharedSourcePost?.owner) ||
    {};
  const authorName = postAuthor?.name || "Unknown user";
  const authorPhoto = getValidImageUrl(postAuthor?.photo || postAuthor?.avatar);
  const authorHandle = getUserHandle(postAuthor, authorName);
  const authorId = getEntityId(postAuthor) || getEntityId(post?.createdBy);
  const postOwnerId = authorId || getEntityId(post?.owner) || getEntityId(post?.creator);
  const ownerFlags = [
    post?.isOwner,
    post?.isMine,
    post?.ownedByMe,
    post?.canEdit,
    post?.canDelete,
  ];
  const canManagePost =
    (Boolean(currentUserId) &&
      Boolean(postOwnerId) &&
      String(currentUserId) === String(postOwnerId)) ||
    ownerFlags.some((flag) => parseBooleanLike(flag) === true);
  const profileLink = authorId ? `/profile/${authorId}` : "/profile";
  const postId = post?._id || post?.id || "";
  const postDetailsLink = `/PostDetails/${postId}`;
  const body = getPostBody(post);
  const postImage = getPostImage(post);
  const isSharedPost = Boolean(sharedSourcePost);
  const sharedPostBody = getPostBody(sharedSourcePost);
  const sharedPostImage = getPostImage(sharedSourcePost);
  const sharedAuthorName = sharedAuthor?.name || "Unknown user";
  const sharedAuthorPhoto = getValidImageUrl(sharedAuthor?.photo || sharedAuthor?.avatar);
  const sharedAuthorHandle = getUserHandle(sharedAuthor, sharedAuthorName);
  const sharedAuthorId = getEntityId(sharedAuthor);
  const sharedProfileLink = sharedAuthorId ? `/profile/${sharedAuthorId}` : "/profile";
  const sharedPostId = getEntityId(sharedSourcePost);
  const sharedPostDetailsLink = sharedPostId
    ? `/PostDetails/${sharedPostId}`
    : postDetailsLink;
  const sharedPostLikesCount =
    getCount(sharedSourcePost?.likesCount) || getCount(sharedSourcePost?.likes);
  const sharedPostCommentsCount =
    getCount(sharedSourcePost?.commentsCount) || getCount(sharedSourcePost?.comments);
  const sharedPostSharesCount =
    getCount(sharedSourcePost?.sharesCount) || getCount(sharedSourcePost?.shares);
  const sharedCreatedAtShort = getRelativeTimeShort(sharedSourcePost?.createdAt);
  const sharedCreatedAtFull = getFormattedDate(sharedSourcePost?.createdAt);
  const sharePreviewPost = sharedSourcePost || post;
  const sharePreviewAuthor = isSharedPost ? sharedAuthor : postAuthor;
  const sharePreviewName = sharePreviewAuthor?.name || "Unknown user";
  const sharePreviewPhoto = getValidImageUrl(
    sharePreviewAuthor?.photo || sharePreviewAuthor?.avatar
  );
  const sharePreviewHandle = getUserHandle(sharePreviewAuthor, sharePreviewName);
  const sharePreviewBody = getPostBody(sharePreviewPost);
  const sharePreviewImage = getPostImage(sharePreviewPost);
  const shouldRenderMainPostImage =
    !isSharedPost || !sharedPostImage || postImage !== sharedPostImage;
  const likesCountFromPost = getCount(post?.likesCount) || getCount(post?.likes);
  const [postLikeState, setPostLikeState] = useState({
    isLiked: Boolean(post?.isLiked || post?.likedByMe),
    count: likesCountFromPost,
  });
  const [postLikeError, setPostLikeError] = useState("");
  const [postBookmarkState, setPostBookmarkState] = useState({
    isBookmarked: getInitialBookmarkState(post),
  });
  const [postBookmarkError, setPostBookmarkError] = useState("");
  const [bookmarkAlertState, setBookmarkAlertState] = useState({
    isVisible: false,
    color: "success",
    title: "",
    description: "",
  });
  const [postActionAlertState, setPostActionAlertState] = useState({
    isVisible: false,
    color: "success",
    title: "",
    description: "",
  });
  const sharesCountFromPost = getCount(post?.sharesCount) || getCount(post?.shares);
  const [postShareState, setPostShareState] = useState({
    count: sharesCountFromPost,
  });
  const [postShareError, setPostShareError] = useState("");
  const comments = Array.isArray(post?.comments) ? post.comments : [];
  const commentsCount = getCount(post?.commentsCount) || comments.length;
  const topComment = getTopComment(post);
  const createdAtShort = getRelativeTimeShort(post?.createdAt);
  const createdAtFull = getFormattedDate(post?.createdAt);
  const [isCommentsOpen, setIsCommentsOpen] = useState(Boolean(initialCommentsOpen));
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCaption, setShareCaption] = useState("");
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editBody, setEditBody] = useState(body || "");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editPreviewImage, setEditPreviewImage] = useState(postImage || "");
  const [editPostError, setEditPostError] = useState("");
  const [deletePostError, setDeletePostError] = useState("");
  const postMenuRef = useRef(null);
  const editFileInputRef = useRef(null);

  const {
    data: likesData,
    isLoading: isPostLikesLoading,
  } = useQuery({
    queryKey: ["post-likes", postId, token],
    queryFn: () => fetchPostLikes(token, postId),
    enabled: Boolean(token && postId),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const postLikesCount = useMemo(() => {
    if (Number.isFinite(postLikeState.count)) return postLikeState.count;
    if (Number.isFinite(likesData?.likesCount)) return likesData.likesCount;
    return likesCountFromPost;
  }, [likesCountFromPost, likesData?.likesCount, postLikeState.count]);

  const postSharesCount = Number.isFinite(postShareState.count)
    ? postShareState.count
    : sharesCountFromPost;

  const postLikeMutation = useMutation({
    mutationFn: () => togglePostLike(token, postId),
    onMutate: () => {
      setPostLikeError("");
    },
    onSuccess: (response) => {
      const next = getLikeResultFromResponse(
        response?.data,
        postLikeState.isLiked,
        postLikesCount
      );
      setPostLikeState(next);
      queryClient.invalidateQueries({
        queryKey: ["post-likes", postId, token],
      });
      queryClient.invalidateQueries({
        queryKey: ["posts", token],
      });
      queryClient.invalidateQueries({
        queryKey: ["post-details", postId, token],
      });
    },
    onError: (error) => {
      setPostLikeError(extractApiMessage(error, "Failed to update like."));
    },
  });
  const isPostLikeBusy = isPostLikesLoading || postLikeMutation.isPending;

  const postBookmarkMutation = useMutation({
    mutationFn: () => togglePostBookmark(token, postId),
    onMutate: () => {
      setPostBookmarkError("");
    },
    onSuccess: (response) => {
      const nextIsBookmarked = getBookmarkResultFromResponse(
        response?.data,
        postBookmarkState.isBookmarked
      );
      setPostBookmarkState({ isBookmarked: nextIsBookmarked });
      setBookmarkAlertState({
        isVisible: true,
        color: nextIsBookmarked ? "success" : "warning",
        title: nextIsBookmarked ? "Post Saved" : "Post Unsaved",
        description: nextIsBookmarked
          ? "This post was added to your saved posts."
          : "This post was removed from your saved posts.",
      });
      queryClient.invalidateQueries({
        queryKey: ["posts", token],
      });
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["post-details", postId, token],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-profile-data", token],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile-by-id"],
      });
      queryClient.invalidateQueries({
        queryKey: ["home-current-user", token],
      });
    },
    onError: (error) => {
      setPostBookmarkError(extractApiMessage(error, "Failed to update bookmark."));
    },
  });
  const isPostBookmarkBusy = postBookmarkMutation.isPending;

  const postShareMutation = useMutation({
    mutationFn: (shareText) => sharePostById(token, postId, shareText),
    onMutate: () => {
      setPostShareError("");
    },
    onSuccess: (response) => {
      setPostShareState({
        count: getShareCountFromResponse(response?.data, postSharesCount),
      });
      setPostActionAlertState({
        isVisible: true,
        color: "success",
        title: "Success Notification",
        description: response?.data?.message || "Post shared successfully.",
      });
      setIsShareModalOpen(false);
      setShareCaption("");
      queryClient.invalidateQueries({
        queryKey: ["posts", token],
      });
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile-posts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-profile-data"],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile-by-id"],
      });
      queryClient.invalidateQueries({
        queryKey: ["post-details", postId, token],
      });
    },
    onError: (error) => {
      setPostShareError(extractApiMessage(error, "Failed to share post."));
    },
  });
  const isPostShareBusy = postShareMutation.isPending;

  const updatePostMutation = useMutation({
    mutationFn: ({ body: nextBody, imageFile: nextImageFile }) =>
      updatePostById(token, postId, {
        body: nextBody,
        imageFile: nextImageFile,
      }),
    onMutate: () => {
      setEditPostError("");
    },
    onSuccess: () => {
      setIsEditingPost(false);
      setEditImageFile(null);
      setPostActionAlertState({
        isVisible: true,
        color: "success",
        title: "Success Notification",
        description: "Post updated successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["posts", token],
      });
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["post-details", postId, token],
      });
    },
    onError: (error) => {
      setEditPostError(extractApiMessage(error, "Failed to update post."));
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: () => deletePostById(token, postId),
    onMutate: () => {
      setDeletePostError("");
    },
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      setIsPostMenuOpen(false);
      setPostActionAlertState({
        isVisible: true,
        color: "success",
        title: "Success Notification",
        description: "Post deleted successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["posts", token],
      });
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["post-details", postId, token],
      });
    },
    onError: (error) => {
      setDeletePostError(extractApiMessage(error, "Failed to delete post."));
    },
  });

  function handleViewAllCommentsClick() {
    if (typeof onViewAllComments === "function") {
      onViewAllComments();
      return;
    }

    if (!postId) return;
    setIsCommentsOpen(true);
  }

  function handlePostLike() {
    if (!token || !postId || postLikeMutation.isPending) return;
    postLikeMutation.mutate();
  }

  function handlePostBookmark() {
    if (!token || !postId || postBookmarkMutation.isPending) return;
    setIsPostMenuOpen(false);
    postBookmarkMutation.mutate();
  }

  function handleCommentButtonClick() {
    if (!postId) return;
    setIsCommentsOpen((currentState) => !currentState);
  }

  function handlePostShare() {
    if (!token) {
      setPostShareError("You need to login first.");
      return;
    }
    if (!postId || postShareMutation.isPending) return;

    setPostShareError("");
    setIsShareModalOpen(true);
  }

  function handleCloseShareModal() {
    if (isPostShareBusy) return;
    setIsShareModalOpen(false);
    setShareCaption("");
  }

  function handleConfirmSharePost() {
    if (!token) {
      setPostShareError("You need to login first.");
      return;
    }
    if (!postId || isPostShareBusy) return;

    postShareMutation.mutate(shareCaption);
  }

  function handleEditPostClick() {
    if (!canManagePost) {
      setIsPostMenuOpen(false);
      return;
    }
    setEditBody(body || "");
    setEditImageFile(null);
    setEditPreviewImage(postImage || "");
    setEditPostError("");
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
    setIsEditingPost(true);
    setIsPostMenuOpen(false);
  }

  function handleEditImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      editPreviewImage &&
      typeof editPreviewImage === "string" &&
      editPreviewImage.startsWith("blob:")
    ) {
      URL.revokeObjectURL(editPreviewImage);
    }

    setEditImageFile(file);
    setEditPreviewImage(URL.createObjectURL(file));
    setEditPostError("");
  }

  function handleRemoveEditImage() {
    if (
      editPreviewImage &&
      typeof editPreviewImage === "string" &&
      editPreviewImage.startsWith("blob:")
    ) {
      URL.revokeObjectURL(editPreviewImage);
    }

    setEditImageFile(null);
    setEditPreviewImage(postImage || "");
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  }

  function handleCancelEdit() {
    if (
      editPreviewImage &&
      typeof editPreviewImage === "string" &&
      editPreviewImage.startsWith("blob:")
    ) {
      URL.revokeObjectURL(editPreviewImage);
    }

    setIsEditingPost(false);
    setEditBody(body || "");
    setEditImageFile(null);
    setEditPreviewImage(postImage || "");
    setEditPostError("");
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  }

  function handleUpdatePostSubmit(event) {
    event.preventDefault();
    if (!canManagePost) {
      setEditPostError("You can only edit your own posts.");
      return;
    }
    if (!token) {
      setEditPostError("You need to login first.");
      return;
    }
    if (!postId) {
      setEditPostError("Missing post id.");
      return;
    }

    const parsed = updatePostSchema.safeParse({
      body: editBody,
      imageFile: editImageFile,
    });

    if (!parsed.success) {
      setEditPostError(parsed.error.issues[0]?.message || "Invalid post data.");
      return;
    }

    updatePostMutation.mutate(parsed.data);
  }

  function handleDeletePostClick() {
    if (!canManagePost) {
      setIsPostMenuOpen(false);
      return;
    }
    setIsDeleteModalOpen(true);
    setDeletePostError("");
    setIsPostMenuOpen(false);
  }

  function handleCloseDeleteModal() {
    if (deletePostMutation.isPending) return;
    setIsDeleteModalOpen(false);
    setDeletePostError("");
  }

  function handleConfirmDeletePost() {
    if (!canManagePost) {
      setDeletePostError("You can only delete your own posts.");
      return;
    }
    if (!token) {
      setDeletePostError("You need to login first.");
      return;
    }
    if (!postId) {
      setDeletePostError("Missing post id.");
      return;
    }
    if (deletePostMutation.isPending) return;
    deletePostMutation.mutate();
  }

  useEffect(() => {
    if (!canManagePost) {
      setIsEditingPost(false);
      setIsDeleteModalOpen(false);
    }
  }, [canManagePost]);

  useEffect(() => {
    setPostBookmarkState({
      isBookmarked: getInitialBookmarkState(post),
    });
  }, [
    postId,
    post?.isBookmarked,
    post?.bookmarkedByMe,
    post?.savedByMe,
    post?.isSaved,
    post?.saved,
    post?.bookmark,
    post?.meta?.isBookmarked,
    post?.meta?.savedByMe,
  ]);

  useEffect(() => {
    setPostShareState({
      count: sharesCountFromPost,
    });
  }, [postId, post?.sharesCount, post?.shares, sharesCountFromPost]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!postMenuRef.current?.contains(event.target)) {
        setIsPostMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsPostMenuOpen(false);
        setIsDeleteModalOpen(false);
        if (!isPostShareBusy) {
          setIsShareModalOpen(false);
          setShareCaption("");
        }
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isPostShareBusy]);

  useEffect(() => {
    return () => {
      if (
        editPreviewImage &&
        typeof editPreviewImage === "string" &&
        editPreviewImage.startsWith("blob:")
      ) {
        URL.revokeObjectURL(editPreviewImage);
      }
    };
  }, [editPreviewImage]);

  return (
    <article className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-4">
        {postActionAlertState.isVisible ? (
          <div className="mb-3">
            <Alert
              color={postActionAlertState.color}
              description={postActionAlertState.description}
              isVisible={postActionAlertState.isVisible}
              title={postActionAlertState.title}
              variant="faded"
              onClose={() =>
                setPostActionAlertState((prev) => ({ ...prev, isVisible: false }))
              }
            />
          </div>
        ) : null}

        {bookmarkAlertState.isVisible ? (
          <div className="mb-3">
            <Alert
              color={bookmarkAlertState.color}
              description={bookmarkAlertState.description}
              isVisible={bookmarkAlertState.isVisible}
              title={bookmarkAlertState.title}
              variant="faded"
              onClose={() =>
                setBookmarkAlertState((prev) => ({ ...prev, isVisible: false }))
              }
            />
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <Link className="shrink-0" to={profileLink}>
            <img
              alt={authorName}
              className="h-11 w-11 rounded-full object-cover"
              src={authorPhoto}
              onError={(event) => {
                event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
              }}
            />
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              className="truncate text-sm font-bold text-slate-900 hover:underline"
              to={profileLink}
            >
              {authorName}
            </Link>
            <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
              {authorHandle} |{" "}
              <button
                type="button"
                className="rounded px-0.5 py-0.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 hover:underline"
                title={createdAtFull}
              >
                {createdAtShort}
              </button>
              <span className="mx-1">|</span>
              <span className="inline-flex items-center gap-1">
                <EarthIcon />
                Public
              </span>
            </div>
            {postBookmarkState.isBookmarked ? (
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#1877f2]">
                Saved
              </p>
            ) : null}
          </div>

          <div className="relative" ref={postMenuRef}>
            <button
              type="button"
              onClick={() => setIsPostMenuOpen((currentState) => !currentState)}
              aria-expanded={isPostMenuOpen}
              aria-label="Open post actions menu"
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-ellipsis"
                aria-hidden="true"
              >
                <circle cx={12} cy={12} r={1} />
                <circle cx={19} cy={12} r={1} />
                <circle cx={5} cy={12} r={1} />
              </svg>
            </button>

            {isPostMenuOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={handlePostBookmark}
                  disabled={!token || !postId || isPostBookmarkBusy}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${
                    postBookmarkState.isBookmarked ? "text-[#1877f2]" : "text-slate-700"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={15}
                    height={15}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-bookmark"
                    aria-hidden="true"
                  >
                    <path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z" />
                  </svg>
                  {isPostBookmarkBusy
                    ? "Saving..."
                    : postBookmarkState.isBookmarked
                    ? "Unsave post"
                    : "Save post"}
                </button>
                {canManagePost ? (
                  <button
                    type="button"
                    onClick={handleEditPostClick}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={15}
                      height={15}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-pencil"
                      aria-hidden="true"
                    >
                      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                      <path d="m15 5 4 4" />
                    </svg>
                    Edit post
                  </button>
                ) : null}
                {canManagePost ? (
                  <button
                    type="button"
                    onClick={handleDeletePostClick}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={15}
                      height={15}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-trash2 lucide-trash-2"
                      aria-hidden="true"
                    >
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete post
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {isEditingPost ? (
          <form className="mt-3" onSubmit={handleUpdatePostSubmit}>
            <textarea
              maxLength={5000}
              value={editBody}
              onChange={(event) => {
                setEditBody(event.target.value);
                if (editPostError) setEditPostError("");
              }}
              className="min-h-[110px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-[#1877f2]/20 focus:border-[#1877f2] focus:ring-2"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatePostMutation.isPending}
                className="rounded-full bg-[#1877f2] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#166fe5] disabled:opacity-60"
              >
                {updatePostMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
            {editPostError ? (
              <p className="mt-2 text-xs font-semibold text-red-600">{editPostError}</p>
            ) : null}
          </form>
        ) : body ? (
          <div className="mt-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-900">{body}</p>
          </div>
        ) : null}
      </div>

      {!isEditingPost && postImage && shouldRenderMainPostImage ? (
        <div className="max-h-[620px] overflow-hidden border-y border-slate-200">
          <button type="button" className="group relative block w-full cursor-zoom-in">
            <img alt="post" className="w-full object-cover" src={postImage} />
            <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
          </button>
        </div>
      ) : null}

      {!isEditingPost && isSharedPost ? (
        <div className="mx-4 mb-3 rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5">
            <Link className="flex min-w-0 items-center gap-2" to={sharedProfileLink}>
              <img
                alt={sharedAuthorName}
                className="h-8 w-8 rounded-full object-cover"
                src={sharedAuthorPhoto}
                onError={(event) => {
                  event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                }}
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900">{sharedAuthorName}</p>
                <p className="truncate text-[11px] font-semibold text-slate-500">
                  {sharedAuthorHandle}
                </p>
              </div>
            </Link>
            <button
              type="button"
              className="rounded px-1 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
              title={sharedCreatedAtFull}
            >
              {sharedCreatedAtShort}
            </button>
          </div>

          {sharedPostBody ? (
            <div className="px-3 py-2.5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                {sharedPostBody}
              </p>
            </div>
          ) : null}

          {sharedPostImage ? (
            <div className="max-h-[520px] overflow-hidden border-y border-slate-200 bg-slate-200/40">
              <img alt="shared post" className="w-full object-cover" src={sharedPostImage} />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold">{sharedPostLikesCount} likes</span>
              <span className="font-semibold">{sharedPostCommentsCount} comments</span>
              <span className="font-semibold">{sharedPostSharesCount} shares</span>
            </div>
            <Link
              className="rounded-md px-2 py-1 font-bold text-[#1877f2] transition hover:bg-[#e7f3ff]"
              to={sharedPostDetailsLink}
            >
              Open original
            </Link>
          </div>
        </div>
      ) : null}

      <div className="px-4 pb-2 pt-3 text-sm text-slate-500">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1877f2] text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-thumbs-up"
                aria-hidden="true"
              >
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
                <path d="M7 10v12" />
              </svg>
            </span>
            <button
              type="button"
              onClick={handlePostLike}
              disabled={!token || !postId || isPostLikeBusy}
              className={`cursor-pointer font-semibold transition hover:text-[#1877f2] hover:underline disabled:cursor-not-allowed disabled:opacity-60 ${
                postLikeState.isLiked ? "text-[#1877f2]" : ""
              }`}
            >
              {postLikesCount} likes
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-3 sm:text-sm">
            <span className="inline-flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={13}
                height={13}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-repeat-2"
                aria-hidden="true"
              >
                <path d="m2 9 3-3 3 3" />
                <path d="M13 18H7a2 2 0 0 1-2-2V6" />
                <path d="m22 15-3 3-3-3" />
                <path d="M11 6h6a2 2 0 0 1 2 2v10" />
              </svg>
              {postSharesCount} shares
            </span>
            <button
              type="button"
              onClick={handleViewAllCommentsClick}
              className="font-semibold transition hover:text-[#1877f2] hover:underline"
            >
              {commentsCount} comments
            </button>
            <Link
              to={postDetailsLink}
              className="rounded-md px-2 py-1 text-xs font-bold text-[#1877f2] hover:bg-[#e7f3ff]"
            >
              View details
            </Link>
          </div>
        </div>
        {postLikeError ? (
          <p className="mt-1 text-xs font-semibold text-red-600">{postLikeError}</p>
        ) : null}
        {postBookmarkError ? (
          <p className="mt-1 text-xs font-semibold text-red-600">{postBookmarkError}</p>
        ) : null}
        {postShareError ? (
          <p className="mt-1 text-xs font-semibold text-red-600">{postShareError}</p>
        ) : null}
      </div>

      <div className="mx-4 border-t border-slate-200" />

      <div className="grid grid-cols-3 gap-1 p-1">
        <button
          type="button"
          onClick={handlePostLike}
          disabled={!token || !postId || isPostLikeBusy}
          className={`cursor-pointer flex items-center justify-center gap-1.5 rounded-md p-2 text-xs font-semibold transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:text-sm ${
            postLikeState.isLiked ? "text-[#1877f2]" : "text-slate-600"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-thumbs-up"
            aria-hidden="true"
          >
            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
            <path d="M7 10v12" />
          </svg>
          <span>{postLikeMutation.isPending ? "Liking..." : "Like"}</span>
        </button>

        <button
          type="button"
          onClick={handleCommentButtonClick}
          className="cursor-pointer flex items-center justify-center gap-1.5 rounded-md p-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 sm:gap-2 sm:text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-message-circle"
            aria-hidden="true"
          >
            <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
          </svg>
          <span>Comment</span>
        </button>

        <button
          type="button"
          onClick={handlePostShare}
          disabled={!token || !postId || isPostShareBusy}
          className={`cursor-pointer flex items-center justify-center gap-1.5 rounded-md p-2 text-xs font-semibold transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:text-sm ${
            isPostShareBusy ? "text-[#1877f2]" : "text-slate-600"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-share-2"
            aria-hidden="true"
          >
            <circle cx={18} cy={5} r={3} />
            <circle cx={6} cy={12} r={3} />
            <circle cx={18} cy={19} r={3} />
            <line x1={8.59} x2={15.42} y1={13.51} y2={17.49} />
            <line x1={15.41} x2={8.59} y1={6.51} y2={10.49} />
          </svg>
          <span>{isPostShareBusy ? "Sharing..." : "Share"}</span>
        </button>
      </div>

      {showTopComment && topComment ? (
        <div className="mx-4 mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Top Comment
          </p>
          <div className="flex items-start gap-2">
            <img
              alt={topComment.authorName}
              className="h-8 w-8 rounded-full object-cover"
              src={topComment.authorPhoto}
              onError={(event) => {
                event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
              }}
            />
            <div className="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2">
              <p className="truncate text-xs font-bold text-slate-900">
                {topComment.authorName}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">
                {topComment.content}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleViewAllCommentsClick}
            className="mt-2 text-xs font-bold text-[#1877f2] hover:underline"
          >
            View all comments
          </button>
        </div>
      ) : null}

      {isShareModalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/65 p-4">
          <div className="w-full max-w-[560px] rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h4 className="text-base font-extrabold text-slate-900">Share post</h4>
              <button
                type="button"
                onClick={handleCloseShareModal}
                disabled={isPostShareBusy}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60"
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
                  className="lucide lucide-x"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 p-4">
              <textarea
                placeholder="Say something about this..."
                rows={3}
                maxLength={500}
                value={shareCaption}
                onChange={(event) => {
                  setShareCaption(event.target.value);
                  if (postShareError) setPostShareError("");
                }}
                className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/20"
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <img
                    alt={sharePreviewName}
                    className="h-8 w-8 rounded-full object-cover"
                    src={sharePreviewPhoto}
                    onError={(event) => {
                      event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                    }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{sharePreviewName}</p>
                    <p className="truncate text-xs font-semibold text-slate-500">
                      {sharePreviewHandle}
                    </p>
                  </div>
                </div>

                {sharePreviewBody ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                    {sharePreviewBody}
                  </p>
                ) : null}

                {sharePreviewImage ? (
                  <img
                    alt="post preview"
                    className="mt-2 max-h-[220px] w-full rounded-lg object-cover"
                    src={sharePreviewImage}
                  />
                ) : null}
              </div>

              {postShareError ? (
                <p className="text-xs font-semibold text-red-600">{postShareError}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={handleCloseShareModal}
                disabled={isPostShareBusy}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSharePost}
                disabled={isPostShareBusy || !postId || !token}
                className="inline-flex items-center rounded-lg bg-[#1877f2] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPostShareBusy ? "Sharing..." : "Share now"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h4 className="text-base font-extrabold text-slate-900">Confirm action</h4>
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
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
                  className="lucide lucide-x"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-start gap-3 p-4">
              <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-triangle-alert"
                  aria-hidden="true"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </div>

              <div>
                <h5 className="text-sm font-extrabold text-slate-900">Delete this post?</h5>
                <p className="mt-1 text-sm text-slate-600">
                  This post will be permanently removed from your profile and feed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deletePostMutation.isPending}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePost}
                disabled={deletePostMutation.isPending}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deletePostMutation.isPending ? "Deleting..." : "Delete post"}
              </button>
            </div>

            {deletePostError ? (
              <p className="px-4 pb-3 text-xs font-semibold text-rose-600">{deletePostError}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {isCommentsOpen ? children || <CommentsSection postId={postId} /> : null}
    </article>
  );
}
