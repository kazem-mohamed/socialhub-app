import React, { useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@heroui/react";
import PostCard from "../../components/Posts/PostCard";
import CommentsSection from "../../components/Posts/CommentsSection";

const DEFAULT_PROFILE_IMAGE =
  "https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png";
const PROFILE_CROP_SIZE = 320;

function getValidImageUrl(url) {
  if (typeof url !== "string") return DEFAULT_PROFILE_IMAGE;
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_PROFILE_IMAGE;
  return trimmed;
}

function getOptionalImageUrl(url) {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  return trimmed;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getProfileCropScale(naturalWidth, naturalHeight, zoom) {
  if (!naturalWidth || !naturalHeight) return 1;
  const baseScale = Math.max(
    PROFILE_CROP_SIZE / naturalWidth,
    PROFILE_CROP_SIZE / naturalHeight
  );
  return baseScale * zoom;
}

function clampProfileOffset(offset, naturalSize, zoom) {
  const naturalWidth = naturalSize?.width || 0;
  const naturalHeight = naturalSize?.height || 0;
  const scale = getProfileCropScale(naturalWidth, naturalHeight, zoom);
  const drawnWidth = naturalWidth * scale;
  const drawnHeight = naturalHeight * scale;
  const maxX = Math.max(0, (drawnWidth - PROFILE_CROP_SIZE) / 2);
  const maxY = Math.max(0, (drawnHeight - PROFILE_CROP_SIZE) / 2);

  return {
    x: clampNumber(offset?.x || 0, -maxX, maxX),
    y: clampNumber(offset?.y || 0, -maxY, maxY),
  };
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load selected image."));
    image.src = src;
  });
}

function getArrayCount(value) {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
}

function formatPostDate(dateValue) {
  if (!dateValue) return "Unknown date";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
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

function extractUser(rawResponseData) {
  return (
    rawResponseData?.data?.user ||
    rawResponseData?.data?.profile ||
    rawResponseData?.user ||
    rawResponseData?.profile ||
    rawResponseData?.data ||
    null
  );
}

function extractPosts(rawResponseData) {
  const posts =
    rawResponseData?.data?.posts ||
    rawResponseData?.posts ||
    rawResponseData?.data?.userPosts ||
    rawResponseData?.userPosts ||
    rawResponseData?.data;
  return Array.isArray(posts) ? posts : [];
}

function getUserId(user) {
  return user?._id || user?.id || user?.userId || null;
}

function getUserHandle(user) {
  const raw =
    user?.username ||
    user?.email?.split("@")?.[0] ||
    user?.name?.toLowerCase()?.replace(/\s+/g, "");
  if (!raw) return "@user";
  return raw.startsWith("@") ? raw : `@${raw}`;
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

function hasUserInList(list, targetUserId) {
  if (!Array.isArray(list) || !targetUserId) return false;

  for (const item of list) {
    if (typeof item === "string" && item === targetUserId) return true;
    const id =
      item?._id ||
      item?.id ||
      item?.userId ||
      item?.user?._id ||
      item?.user?.id ||
      item?.user?.userId;
    if (id && id === targetUserId) return true;
  }

  return false;
}

function getIsFollowingProfile(user, currentUserId) {
  const candidates = [
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

  const followerLists = [user?.followers, user?.followersList, user?.followersData];
  for (const list of followerLists) {
    if (hasUserInList(list, currentUserId)) return true;
  }

  return false;
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
  if (!item) return null;
  if (item?.post && typeof item.post === "object") return markPostAsSaved(item.post);
  if (item?.postId && typeof item.postId === "object") return markPostAsSaved(item.postId);
  if (item?.postData && typeof item.postData === "object") return markPostAsSaved(item.postData);
  if (item?._id || item?.id) return markPostAsSaved(item);
  return null;
}

function extractSavedPosts(user) {
  const rawSaved =
    user?.bookmarks ||
    user?.savedPosts ||
    user?.bookmarkedPosts ||
    user?.saved ||
    user?.favorites ||
    [];

  if (!Array.isArray(rawSaved)) return [];

  return rawSaved.map(normalizeSavedPost).filter(Boolean);
}

async function fetchMyProfile(token) {
  const response = await axios.request({
    method: "GET",
    url: "https://route-posts.routemisr.com/users/profile-data",
    headers: { token },
  });

  return extractUser(response?.data);
}

async function fetchUserProfile(token, userId) {
  const response = await axios.request({
    method: "GET",
    url: `https://route-posts.routemisr.com/users/${userId}/profile`,
    headers: { token },
  });

  return extractUser(response?.data);
}

async function fetchUserPosts(token, userId) {
  const response = await axios.request({
    method: "GET",
    url: `https://route-posts.routemisr.com/users/${userId}/posts`,
    headers: { token },
    params: { sort: "-createdAt" },
  });

  return extractPosts(response?.data);
}

async function uploadProfilePhoto(token, file) {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await axios.request({
    method: "PUT",
    url: "https://route-posts.routemisr.com/users/upload-photo",
    data: formData,
    headers: {
      Authorization: `Bearer ${token}`,
      token,
    },
  });

  return extractUser(response?.data);
}

async function uploadCoverPhoto(token, file) {
  const formData = new FormData();
  formData.append("cover", file);

  const response = await axios.request({
    method: "PUT",
    url: "https://route-posts.routemisr.com/users/upload-cover",
    data: formData,
    headers: {
      Authorization: `Bearer ${token}`,
      token,
    },
  });

  return extractUser(response?.data);
}

async function toggleFollowUser(token, userId) {
  return axios.request({
    method: "PUT",
    url: `https://route-posts.routemisr.com/users/${userId}/follow`,
    headers: {
      Authorization: `Bearer ${token}`,
      token,
    },
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || "");
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

function ProfilePostCard({ post, fallbackUser }) {
  const postId = post?._id || post?.id || "";
  const author = post?.user || fallbackUser || {};
  const authorName = author?.name || "Unknown user";
  const authorPhoto = getValidImageUrl(author?.photo || author?.avatar);
  const authorHandle = getUserHandle(author);
  const body =
    typeof post?.body === "string" && post?.body !== "undefined" ? post.body : "";
  const postImage = post?.image || post?.images?.[0] || null;
  const likesCount = getArrayCount(post?.likesCount) || getArrayCount(post?.likes);
  const sharesCount = getArrayCount(post?.sharesCount) || getArrayCount(post?.shares);
  const commentsCount =
    getArrayCount(post?.commentsCount) || getArrayCount(post?.comments);
  const isSavedPost = Boolean(
    post?.__isBookmarked || post?.isBookmarked || post?.savedByMe || post?.isSaved || post?.saved
  );
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_6px_rgba(15,23,42,.05)] transition hover:shadow-sm">
      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <img
              alt={authorName}
              className="h-10 w-10 rounded-full object-cover"
              src={authorPhoto}
              onError={(event) => {
                event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
              }}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-slate-900">{authorName}</p>
              <p className="truncate text-xs font-semibold text-slate-500">{authorHandle}</p>
              {isSavedPost ? (
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#1877f2]">
                  Saved
                </p>
              ) : null}
            </div>
          </div>

          <Link
            to={`/PostDetails/${postId}`}
            className="rounded-md px-2 py-1 text-xs font-bold text-[#1877f2] transition hover:bg-[#e7f3ff]"
          >
            View details
          </Link>
        </div>

        {body ? (
          <div className="pt-3">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800">
              {body}
            </p>
          </div>
        ) : null}
      </div>

      {postImage ? (
        <div className="border-y border-slate-200 bg-slate-950/95">
          <button type="button" className="group relative flex w-full cursor-zoom-in items-center justify-center">
            <img
              alt="post"
              className="max-h-[560px] w-auto max-w-full object-contain"
              src={postImage}
            />
            <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <span className="inline-flex items-center gap-2 font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-thumbs-up text-[#1877f2]"
              aria-hidden="true"
            >
              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
              <path d="M7 10v12" />
            </svg>
            {likesCount} likes
          </span>
          <span className="inline-flex items-center gap-2 font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-repeat2 lucide-repeat-2 text-[#1877f2]"
              aria-hidden="true"
            >
              <path d="m2 9 3-3 3 3" />
              <path d="M13 18H7a2 2 0 0 1-2-2V6" />
              <path d="m22 15-3 3-3-3" />
              <path d="M11 6h6a2 2 0 0 1 2 2v10" />
            </svg>
            {sharesCount} shares
          </span>
          <button
            type="button"
            onClick={() => {
              if (!postId) return;
              setIsCommentsOpen(true);
            }}
            className="inline-flex cursor-pointer items-center gap-2 font-semibold transition hover:text-[#1877f2]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-message-circle text-[#1877f2]"
              aria-hidden="true"
            >
              <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
            </svg>
            {commentsCount} comments
          </button>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
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
            className="lucide lucide-clock3 lucide-clock-3"
            aria-hidden="true"
          >
            <path d="M12 6v6h4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          {formatPostDate(post?.createdAt)}
        </span>
      </div>

      {isCommentsOpen ? <CommentsSection postId={postId} /> : null}
    </article>
  );
}

export default function Profile() {
  const { userId: routeUserId } = useParams();
  const token = localStorage.getItem("User_Token");
  const [activeTab, setActiveTab] = useState("posts");
  const [coverPreview, setCoverPreview] = useState({ profileKey: "", url: "" });
  const [removedCoverByProfileKey, setRemovedCoverByProfileKey] = useState({});
  const [profilePreview, setProfilePreview] = useState({ profileKey: "", url: "" });
  const [pendingCoverFile, setPendingCoverFile] = useState(null);
  const [isCoverPrivacyModalOpen, setIsCoverPrivacyModalOpen] = useState(false);
  const [coverPrivacy, setCoverPrivacy] = useState("public");
  const [isCoverViewerOpen, setIsCoverViewerOpen] = useState(false);
  const [coverViewerUrl, setCoverViewerUrl] = useState("");
  const [pendingProfileFile, setPendingProfileFile] = useState(null);
  const [isProfilePhotoModalOpen, setIsProfilePhotoModalOpen] = useState(false);
  const [profilePhotoPrivacy, setProfilePhotoPrivacy] = useState("public");
  const [profilePhotoModalUrl, setProfilePhotoModalUrl] = useState("");
  const [isProfilePhotoViewerOpen, setIsProfilePhotoViewerOpen] = useState(false);
  const [profilePhotoViewerUrl, setProfilePhotoViewerUrl] = useState("");
  const [profilePhotoZoom, setProfilePhotoZoom] = useState(1);
  const [profilePhotoOffset, setProfilePhotoOffset] = useState({ x: 0, y: 0 });
  const [profilePhotoNaturalSize, setProfilePhotoNaturalSize] = useState({
    width: 0,
    height: 0,
  });
  const [uploadFeedback, setUploadFeedback] = useState(null);
  const [followOverrides, setFollowOverrides] = useState({});
  const [followError, setFollowError] = useState("");
  const profileDragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const queryClient = useQueryClient();

  const {
    data: myProfile,
    isLoading: isMyProfileLoading,
    error: myProfileError,
  } = useQuery({
    queryKey: ["my-profile-data", token],
    queryFn: () => fetchMyProfile(token),
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const myUserId = getUserId(myProfile);
  const isOtherProfile = Boolean(routeUserId && routeUserId !== myUserId);
  const activeUserId = routeUserId || myUserId;
  const currentProfileKey = activeUserId || routeUserId || "me";
  const canEditProfile = Boolean(token && !isOtherProfile);

  const uploadPhotoMutation = useMutation({
    mutationFn: ({ file }) => uploadProfilePhoto(token, file),
    onSuccess: async (_updatedUser, variables) => {
      setUploadFeedback({
        profileKey: variables?.profileKey || "",
        type: "success",
        message: "Profile photo updated successfully.",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-profile-data"] }),
        queryClient.invalidateQueries({ queryKey: ["profile-by-id"] }),
        queryClient.invalidateQueries({ queryKey: ["navbar-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["post-form-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["search-user-current-profile"] }),
      ]);
    },
    onError: (error, variables) => {
      setProfilePreview({ profileKey: "", url: "" });
      setUploadFeedback({
        profileKey: variables?.profileKey || "",
        type: "error",
        message: extractApiMessage(error, "Failed to update profile photo."),
      });
    },
  });

  const uploadCoverMutation = useMutation({
    mutationFn: ({ file }) => uploadCoverPhoto(token, file),
    onSuccess: async (_updatedUser, variables) => {
      if (variables?.previewUrl) {
        setCoverPreview({
          profileKey: variables?.profileKey || "",
          url: variables.previewUrl,
        });
      }
      setRemovedCoverByProfileKey((prev) => ({
        ...prev,
        [variables?.profileKey || ""]: false,
      }));

      setUploadFeedback({
        profileKey: variables?.profileKey || "",
        type: "success",
        message: "Cover photo updated successfully.",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-profile-data"] }),
        queryClient.invalidateQueries({ queryKey: ["profile-by-id"] }),
      ]);
    },
    onError: (error, variables) => {
      const status = error?.response?.status;
      const statusLabel = status ? ` (HTTP ${status})` : "";
      setUploadFeedback({
        profileKey: variables?.profileKey || "",
        type: "error",
        message: extractApiMessage(
          error,
          `Failed to update cover photo${statusLabel}.`
        ),
      });
    },
  });

  const {
    data: selectedUserProfile,
    isLoading: isSelectedProfileLoading,
    error: selectedProfileError,
  } = useQuery({
    queryKey: ["profile-by-id", routeUserId, token],
    queryFn: () => fetchUserProfile(token, routeUserId),
    enabled: Boolean(token && routeUserId && routeUserId !== myUserId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const profile = isOtherProfile ? selectedUserProfile : myProfile;

  const {
    data: userPosts = [],
    isLoading: isPostsLoading,
    error: postsError,
  } = useQuery({
    queryKey: ["profile-posts", activeUserId, token],
    queryFn: () => fetchUserPosts(token, activeUserId),
    enabled: Boolean(token && activeUserId),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const savedPosts = useMemo(() => extractSavedPosts(profile), [profile]);

  const displayName = profile?.name || profile?.username || "User";
  const displayHandle = getUserHandle(profile);
  const displayEmail = profile?.email || "No email available";
  const activeProfilePreview =
    profilePreview?.profileKey === currentProfileKey ? profilePreview?.url : "";
  const displayAvatar = getValidImageUrl(
    activeProfilePreview || profile?.photo || profile?.avatar
  );
  const activeCoverPreview =
    coverPreview?.profileKey === currentProfileKey ? coverPreview?.url : "";
  const serverCover = getOptionalImageUrl(
    profile?.coverPhoto ||
      profile?.cover ||
      profile?.coverImage ||
      profile?.backgroundImage
  );
  const isCoverRemovedForCurrentProfile = Boolean(
    removedCoverByProfileKey?.[currentProfileKey]
  );
  const displayCover = isCoverRemovedForCurrentProfile
    ? activeCoverPreview || ""
    : activeCoverPreview || serverCover;
  const followersCount =
    getArrayCount(profile?.followersCount) ||
    getArrayCount(profile?.followers) ||
    getArrayCount(profile?.followersTotal);
  const followingCount =
    getArrayCount(profile?.followingCount) ||
    getArrayCount(profile?.following) ||
    getArrayCount(profile?.followingTotal);
  const bookmarksCount =
    getArrayCount(profile?.bookmarksCount) ||
    getArrayCount(profile?.bookmarks) ||
    getArrayCount(savedPosts);
  const postsCount = getArrayCount(userPosts);
  const selectedPosts = activeTab === "saved" ? savedPosts : userPosts;

  const isProfileLoading =
    isMyProfileLoading || (isOtherProfile && isSelectedProfileLoading);
  const profileError = isOtherProfile ? selectedProfileError : myProfileError;

  const profileErrorMessage = extractApiMessage(
    profileError,
    !token ? "You need to login first." : "Failed to load profile."
  );
  const postsErrorMessage = extractApiMessage(postsError, "Failed to load posts.");
  const isUploadingImage = uploadPhotoMutation.isPending;
  const isCoverUpdating = uploadCoverMutation.isPending;
  const profileCropScale = getProfileCropScale(
    profilePhotoNaturalSize.width,
    profilePhotoNaturalSize.height,
    profilePhotoZoom
  );
  const activeUploadFeedback =
    uploadFeedback?.profileKey === currentProfileKey ? uploadFeedback : null;
  const otherProfileId = isOtherProfile ? getUserId(profile) : null;
  const otherProfileBaseFollowState = isOtherProfile
    ? getIsFollowingProfile(profile, myUserId)
    : false;
  const otherProfileFollowOverride = otherProfileId ? followOverrides[otherProfileId] : null;
  const isFollowingOtherProfile =
    otherProfileFollowOverride?.isFollowing ?? otherProfileBaseFollowState;
  const otherProfileFollowersCount =
    otherProfileFollowOverride?.followersCount ?? followersCount;

  const followMutation = useMutation({
    mutationFn: ({ userId }) => toggleFollowUser(token, userId),
    onMutate: ({ userId, nextIsFollowing, nextFollowersCount }) => {
      setFollowError("");
      setFollowOverrides((prev) => ({
        ...prev,
        [userId]: {
          isFollowing: nextIsFollowing,
          followersCount: nextFollowersCount,
        },
      }));
    },
    onError: (error, variables) => {
      if (variables?.userId) {
        setFollowOverrides((prev) => ({
          ...prev,
          [variables.userId]: {
            isFollowing: variables.currentIsFollowing,
            followersCount: variables.currentFollowersCount,
          },
        }));
      }
      setFollowError(extractApiMessage(error, "Failed to update follow status."));
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-profile-data"] }),
        queryClient.invalidateQueries({ queryKey: ["profile-by-id", routeUserId, token] }),
        queryClient.invalidateQueries({ queryKey: ["suggested-users", token] }),
      ]);
    },
  });
  const isFollowUpdating =
    followMutation.isPending && followMutation.variables?.userId === otherProfileId;

  function handleOpenProfilePhotoViewer() {
    setProfilePhotoViewerUrl(displayAvatar);
    setIsProfilePhotoViewerOpen(true);
  }

  function handleCloseProfilePhotoViewer() {
    setIsProfilePhotoViewerOpen(false);
    setProfilePhotoViewerUrl("");
  }

  function handleOpenCoverViewer() {
    if (!displayCover) return;
    setCoverViewerUrl(displayCover);
    setIsCoverViewerOpen(true);
  }

  function handleCloseCoverViewer() {
    setIsCoverViewerOpen(false);
    setCoverViewerUrl("");
  }

  function handleRemoveCover() {
    if (!canEditProfile || isCoverUpdating) return;
    setCoverPreview({ profileKey: currentProfileKey, url: "" });
    setRemovedCoverByProfileKey((prev) => ({
      ...prev,
      [currentProfileKey]: true,
    }));
    setUploadFeedback({
      profileKey: currentProfileKey,
      type: "success",
      message: "Cover photo removed successfully.",
    });
  }

  function handleOtherProfileFollowToggle() {
    if (!token || !otherProfileId || isFollowUpdating) return;

    const currentIsFollowing = Boolean(isFollowingOtherProfile);
    const currentFollowersCount = otherProfileFollowersCount;
    const nextIsFollowing = !currentIsFollowing;
    const nextFollowersCount = Math.max(
      0,
      currentFollowersCount + (nextIsFollowing ? 1 : -1)
    );

    followMutation.mutate({
      userId: otherProfileId,
      currentIsFollowing,
      currentFollowersCount,
      nextIsFollowing,
      nextFollowersCount,
    });
  }

  async function handleCoverImageUpload(event) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) return;
    if (!selectedFile.type?.startsWith("image/")) {
      setUploadFeedback({
        profileKey: currentProfileKey,
        type: "error",
        message: "Please choose a valid image file.",
      });
      return;
    }

    if (!canEditProfile || !token) {
      setUploadFeedback({
        profileKey: currentProfileKey,
        type: "error",
        message: "You can only update images on your own profile.",
      });
      return;
    }

    setUploadFeedback(null);
    setRemovedCoverByProfileKey((prev) => ({
      ...prev,
      [currentProfileKey]: false,
    }));
    setPendingCoverFile(selectedFile);
    setCoverPrivacy("public");
    setIsCoverPrivacyModalOpen(true);
  }

  function handleCancelCoverPrivacy() {
    if (isCoverUpdating) return;
    setPendingCoverFile(null);
    setIsCoverPrivacyModalOpen(false);
  }

  async function handleSaveCoverPrivacy() {
    if (!pendingCoverFile || !canEditProfile || !token) return;

    let previewUrl = "";
    try {
      const preview = await readFileAsDataUrl(pendingCoverFile);
      previewUrl = typeof preview === "string" ? preview : "";
    } catch {
      previewUrl = "";
    }

    uploadCoverMutation.mutate({
      file: pendingCoverFile,
      profileKey: currentProfileKey,
      previewUrl,
    });
    setPendingCoverFile(null);
    setIsCoverPrivacyModalOpen(false);
  }

  async function handleProfilePhotoUpload(event) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) return;
    if (!selectedFile.type?.startsWith("image/")) {
      setUploadFeedback({
        profileKey: currentProfileKey,
        type: "error",
        message: "Please choose a valid image file.",
      });
      return;
    }

    if (!canEditProfile || !token) {
      setUploadFeedback({
        profileKey: currentProfileKey,
        type: "error",
        message: "You can only update images on your own profile.",
      });
      return;
    }

    setUploadFeedback(null);
    try {
      const preview = await readFileAsDataUrl(selectedFile);
      const previewUrl = typeof preview === "string" ? preview : "";
      if (!previewUrl) {
        throw new Error("Failed to preview selected profile photo.");
      }
      setPendingProfileFile(selectedFile);
      setProfilePhotoModalUrl(previewUrl);
      setProfilePhotoNaturalSize({ width: 0, height: 0 });
      setProfilePhotoZoom(1);
      setProfilePhotoOffset({ x: 0, y: 0 });
      setProfilePhotoPrivacy("public");
      setIsProfilePhotoModalOpen(true);
    } catch {
      setUploadFeedback({
        profileKey: currentProfileKey,
        type: "error",
        message: "Failed to preview selected profile photo.",
      });
    }
  }

  function handleCancelProfilePhotoModal() {
    if (isUploadingImage) return;
    setIsProfilePhotoModalOpen(false);
    setPendingProfileFile(null);
    setProfilePhotoModalUrl("");
    setProfilePhotoNaturalSize({ width: 0, height: 0 });
    setProfilePhotoOffset({ x: 0, y: 0 });
    setProfilePhotoZoom(1);
    setProfilePhotoPrivacy("public");
  }

  function handleProfilePhotoPointerDown(event) {
    if (!profilePhotoNaturalSize.width || !profilePhotoNaturalSize.height) return;
    profileDragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: profilePhotoOffset.x,
      originY: profilePhotoOffset.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleProfilePhotoPointerMove(event) {
    if (!profileDragRef.current.dragging) return;
    const deltaX = event.clientX - profileDragRef.current.startX;
    const deltaY = event.clientY - profileDragRef.current.startY;
    setProfilePhotoOffset(
      clampProfileOffset(
        {
          x: profileDragRef.current.originX + deltaX,
          y: profileDragRef.current.originY + deltaY,
        },
        profilePhotoNaturalSize,
        profilePhotoZoom
      )
    );
  }

  function handleProfilePhotoPointerUp(event) {
    profileDragRef.current.dragging = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  function handleProfilePhotoZoomChange(event) {
    const nextZoom = clampNumber(Number(event.target.value) || 1, 1, 3);
    setProfilePhotoZoom(nextZoom);
    setProfilePhotoOffset((currentOffset) =>
      clampProfileOffset(currentOffset, profilePhotoNaturalSize, nextZoom)
    );
  }

  function handleProfileImageLoad(event) {
    const nextNaturalSize = {
      width: event.currentTarget.naturalWidth || 0,
      height: event.currentTarget.naturalHeight || 0,
    };
    setProfilePhotoNaturalSize(nextNaturalSize);
    setProfilePhotoOffset((currentOffset) =>
      clampProfileOffset(currentOffset, nextNaturalSize, profilePhotoZoom)
    );
  }

  async function createCroppedProfilePhotoPayload() {
    if (!profilePhotoModalUrl || !pendingProfileFile) {
      throw new Error("No profile image selected.");
    }

    const image = await loadImageElement(profilePhotoModalUrl);
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    const scale = getProfileCropScale(naturalWidth, naturalHeight, profilePhotoZoom);
    const drawnWidth = naturalWidth * scale;
    const drawnHeight = naturalHeight * scale;
    const left = PROFILE_CROP_SIZE / 2 - drawnWidth / 2 + profilePhotoOffset.x;
    const top = PROFILE_CROP_SIZE / 2 - drawnHeight / 2 + profilePhotoOffset.y;

    const rawSourceX = -left / scale;
    const rawSourceY = -top / scale;
    const sourceWidth = PROFILE_CROP_SIZE / scale;
    const sourceHeight = PROFILE_CROP_SIZE / scale;
    const sourceX = clampNumber(rawSourceX, 0, Math.max(0, naturalWidth - sourceWidth));
    const sourceY = clampNumber(rawSourceY, 0, Math.max(0, naturalHeight - sourceHeight));

    const canvas = document.createElement("canvas");
    canvas.width = PROFILE_CROP_SIZE;
    canvas.height = PROFILE_CROP_SIZE;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to initialize image editor.");
    }

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      PROFILE_CROP_SIZE,
      PROFILE_CROP_SIZE
    );

    const previewUrl = canvas.toDataURL("image/jpeg", 0.92);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (createdBlob) => {
          if (createdBlob) {
            resolve(createdBlob);
            return;
          }
          reject(new Error("Failed to export cropped profile photo."));
        },
        "image/jpeg",
        0.92
      );
    });

    const baseName =
      pendingProfileFile.name?.replace(/\.[^/.]+$/, "") || "profile-photo";
    const file = new File([blob], `${baseName}-cropped.jpg`, {
      type: "image/jpeg",
    });

    return { file, previewUrl };
  }

  async function handleSaveProfilePhoto() {
    if (!pendingProfileFile || isUploadingImage) return;

    try {
      const { file, previewUrl } = await createCroppedProfilePhotoPayload();
      setProfilePreview({ profileKey: currentProfileKey, url: previewUrl });
      setIsProfilePhotoModalOpen(false);
      setPendingProfileFile(null);
      setProfilePhotoModalUrl("");
      uploadPhotoMutation.mutate({
        file,
        profileKey: currentProfileKey,
        privacy: profilePhotoPrivacy,
      });
    } catch (error) {
      setUploadFeedback({
        profileKey: currentProfileKey,
        type: "error",
        message: extractApiMessage(error, "Failed to prepare profile photo."),
      });
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-3.5">
      <main className="min-w-0">
        <div className="space-y-5 sm:space-y-6">
          {isProfileLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Loading profile...
            </div>
          ) : null}

          {!isProfileLoading && profileError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
              {profileErrorMessage}
            </div>
          ) : null}

          {!isProfileLoading && !profileError && profile ? (
            <>
              {isOtherProfile ? (
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div
                    className="h-48 bg-[linear-gradient(112deg,#0f172a_0%,#1e3a5f_36%,#2b5178_72%,#5f8fb8_100%)]"
                    style={
                      displayCover
                        ? {
                            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.35)), url("${displayCover}")`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  />
                  <div className="relative -mt-14 px-3 pb-5 sm:px-5">
                    <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-white/70 bg-white/95 p-4">
                      <div className="flex items-end gap-3">
                        <img
                          alt={displayName}
                          className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-sm sm:h-24 sm:w-24"
                          src={displayAvatar}
                          onError={(event) => {
                            event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                          }}
                        />
                        <div>
                          <p className="text-xl font-black text-slate-900 sm:text-2xl">
                            {displayName}
                          </p>
                          <p className="text-sm font-semibold text-slate-500 sm:text-base">
                            {displayHandle}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {otherProfileFollowersCount} followers
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleOtherProfileFollowToggle}
                        disabled={isFollowUpdating}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-extrabold transition sm:w-auto disabled:cursor-not-allowed disabled:opacity-70 ${
                          isFollowingOtherProfile
                            ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                            : "border-[#cde1ff] bg-[#e7f3ff] text-[#1877f2] hover:bg-[#d8ebff]"
                        }`}
                      >
                        {isFollowingOtherProfile ? (
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
                            className="lucide lucide-check"
                            aria-hidden="true"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        ) : (
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
                            className="lucide lucide-user-plus"
                            aria-hidden="true"
                          >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="19" x2="19" y1="8" y2="14" />
                            <line x1="22" x2="16" y1="11" y2="11" />
                          </svg>
                        )}
                        {isFollowUpdating
                          ? "Updating..."
                          : isFollowingOtherProfile
                            ? "Following"
                            : "Follow"}
                      </button>
                    </div>

                    {followError ? (
                      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                        {followError}
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {!isOtherProfile ? (
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,.06)] sm:rounded-[28px]">
                <div className="group/cover relative h-44 bg-[linear-gradient(112deg,#0f172a_0%,#1e3a5f_36%,#2b5178_72%,#5f8fb8_100%)] sm:h-52 lg:h-60">
                  {displayCover ? (
                    <img
                      src={displayCover}
                      alt={`${displayName} cover`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_24%,rgba(255,255,255,.14)_0%,rgba(255,255,255,0)_36%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_12%,rgba(186,230,253,.22)_0%,rgba(186,230,253,0)_44%)]" />
                  <div className="absolute -left-16 top-10 h-36 w-36 rounded-full bg-white/8 blur-3xl" />
                  <div className="absolute right-8 top-6 h-48 w-48 rounded-full bg-[#c7e6ff]/10 blur-3xl" />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent" />

                  {canEditProfile ? (
                    <div className="pointer-events-none absolute right-2 top-2 z-10 flex max-w-[90%] flex-wrap items-center justify-end gap-1.5 opacity-100 transition duration-200 sm:right-3 sm:top-3 sm:max-w-none sm:gap-2 sm:opacity-0 sm:group-hover/cover:opacity-100 sm:group-focus-within/cover:opacity-100">
                      {displayCover ? (
                        <>
                          <button
                            type="button"
                            onClick={handleOpenCoverViewer}
                            className="pointer-events-auto inline-flex items-center gap-1 rounded-lg bg-black/45 px-2 py-1 text-[11px] font-bold text-white backdrop-blur transition hover:bg-black/60 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
                          >
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
                              className="lucide lucide-expand"
                              aria-hidden="true"
                            >
                              <path d="m15 15 6 6" />
                              <path d="m15 9 6-6" />
                              <path d="M21 16v5h-5" />
                              <path d="M21 8V3h-5" />
                              <path d="M3 16v5h5" />
                              <path d="m3 21 6-6" />
                              <path d="M3 8V3h5" />
                              <path d="M9 9 3 3" />
                            </svg>
                            View cover
                          </button>
                          <label className="pointer-events-auto inline-flex cursor-pointer items-center gap-1 rounded-lg bg-black/45 px-2 py-1 text-[11px] font-bold text-white backdrop-blur transition hover:bg-black/60 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
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
                              className="lucide lucide-camera"
                              aria-hidden="true"
                            >
                              <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
                              <circle cx="12" cy="13" r="3" />
                            </svg>
                            {isCoverUpdating ? "Updating..." : "Change cover"}
                            <input
                              accept="image/*"
                              className="hidden"
                              type="file"
                              disabled={isCoverUpdating}
                              onChange={handleCoverImageUpload}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveCover}
                            disabled={isCoverUpdating}
                            className="pointer-events-auto inline-flex items-center gap-1 rounded-lg bg-black/45 px-2 py-1 text-[11px] font-bold text-white backdrop-blur transition hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
                          >
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
                              className="lucide lucide-trash2 lucide-trash-2"
                              aria-hidden="true"
                            >
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                              <path d="M3 6h18" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Remove
                          </button>
                        </>
                      ) : (
                        <label className="pointer-events-auto inline-flex cursor-pointer items-center gap-1 rounded-lg bg-black/45 px-2 py-1 text-[11px] font-bold text-white backdrop-blur transition hover:bg-black/60 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
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
                            className="lucide lucide-camera"
                            aria-hidden="true"
                          >
                            <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
                            <circle cx="12" cy="13" r="3" />
                          </svg>
                          {isCoverUpdating ? "Updating..." : "Add cover"}
                          <input
                            accept="image/*"
                            className="hidden"
                            type="file"
                            disabled={isCoverUpdating}
                            onChange={handleCoverImageUpload}
                          />
                        </label>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="relative -mt-12 px-3 pb-5 sm:-mt-16 sm:px-8 sm:pb-6">
                  <div className="rounded-3xl border border-white/60 bg-white/92 p-5 backdrop-blur-xl sm:p-7">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-end gap-4">
                          <div className="group/avatar relative shrink-0">
                            <button type="button" className="cursor-zoom-in rounded-full">
                              <img
                                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md ring-2 ring-[#dbeafe]"
                                src={displayAvatar}
                                alt={displayName}
                                onError={(event) => {
                                  event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                                }}
                              />
                            </button>
                            {isUploadingImage ? (
                              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2 py-0.5 text-[10px] font-bold text-[#1d4ed8]">
                                Uploading...
                              </div>
                            ) : null}
                            <button
                              type="button"
                              onClick={handleOpenProfilePhotoViewer}
                              className="absolute bottom-1 left-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-[#1877f2] opacity-100 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:bg-slate-50 sm:opacity-0 sm:group-hover/avatar:opacity-100 sm:group-focus-within/avatar:opacity-100"
                              title="View profile photo"
                              aria-label="View profile photo"
                            >
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
                                className="lucide lucide-expand"
                                aria-hidden="true"
                              >
                                <path d="m15 15 6 6" />
                                <path d="m15 9 6-6" />
                                <path d="M21 16v5h-5" />
                                <path d="M21 8V3h-5" />
                                <path d="M3 16v5h5" />
                                <path d="m3 21 6-6" />
                                <path d="M3 8V3h5" />
                                <path d="M9 9 3 3" />
                              </svg>
                            </button>
                            {canEditProfile ? (
                              <label className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#1877f2] text-white opacity-100 shadow-sm transition duration-200 hover:bg-[#166fe5] sm:opacity-0 sm:group-hover/avatar:opacity-100 sm:group-focus-within/avatar:opacity-100">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="17"
                                  height="17"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="lucide lucide-camera"
                                  aria-hidden="true"
                                >
                                  <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
                                  <circle cx="12" cy="13" r="3" />
                                </svg>
                                <input
                                  accept="image/*"
                                  className="hidden"
                                  type="file"
                                  disabled={isUploadingImage}
                                  onChange={handleProfilePhotoUpload}
                                />
                              </label>
                            ) : null}
                          </div>

                          <div className="min-w-0 pb-1">
                            <h2 className="truncate text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
                              {displayName}
                            </h2>
                            <p className="mt-1 text-lg font-semibold text-slate-500 sm:text-xl">
                              {displayHandle}
                            </p>
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d7e7ff] bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#0b57d0]">
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
                                className="lucide lucide-users"
                                aria-hidden="true"
                              >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <path d="M16 3.128a4 4 0 0 1 0 7.744" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <circle cx="9" cy="7" r="4" />
                              </svg>
                              SocialHub member
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid w-full grid-cols-3 gap-2 lg:w-[520px]">
                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center sm:px-4 sm:py-4">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">
                            Followers
                          </p>
                          <p className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
                            {followersCount}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center sm:px-4 sm:py-4">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">
                            Following
                          </p>
                          <p className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
                            {followingCount}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center sm:px-4 sm:py-4">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">
                            Bookmarks
                          </p>
                          <p className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
                            {bookmarksCount}
                          </p>
                        </div>
                      </div>
                    </div>

                    {activeUploadFeedback?.message ? (
                      <div className="mt-4">
                        <Alert
                          color={activeUploadFeedback.type === "error" ? "danger" : "success"}
                          description={activeUploadFeedback.message}
                          isVisible={Boolean(activeUploadFeedback?.message)}
                          title={
                            activeUploadFeedback.type === "error"
                              ? "Upload Failed"
                              : "Success Notification"
                          }
                          variant="faded"
                          onClose={() => setUploadFeedback(null)}
                        />
                      </div>
                    ) : null}

                    <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-sm font-extrabold text-slate-800">About</h3>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                          <p className="flex items-center gap-2">
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
                              className="lucide lucide-mail text-slate-500"
                              aria-hidden="true"
                            >
                              <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
                              <rect x="2" y="4" width="20" height="16" rx="2" />
                            </svg>
                            {displayEmail}
                          </p>
                          <p className="flex items-center gap-2">
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
                              className="lucide lucide-users text-slate-500"
                              aria-hidden="true"
                            >
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <path d="M16 3.128a4 4 0 0 1 0 7.744" />
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                              <circle cx="9" cy="7" r="4" />
                            </svg>
                            Active on SocialHub
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <div className="rounded-2xl border border-[#dbeafe] bg-[#f6faff] px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#1f4f96]">
                            My posts
                          </p>
                          <p className="mt-1 text-2xl font-black text-slate-900">{postsCount}</p>
                        </div>
                        <div className="rounded-2xl border border-[#dbeafe] bg-[#f6faff] px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#1f4f96]">
                            Saved posts
                          </p>
                          <p className="mt-1 text-2xl font-black text-slate-900">
                            {savedPosts.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </section>
              ) : null}

              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="grid w-full grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1.5 sm:inline-flex sm:w-auto sm:gap-0">
                    <button
                      onClick={() => setActiveTab("posts")}
                      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                        activeTab === "posts"
                          ? "bg-white text-[#1877f2] shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
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
                        className="lucide lucide-file-text"
                        aria-hidden="true"
                      >
                        <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
                        <path d="M14 2v5a1 1 0 0 0 1 1h5" />
                        <path d="M10 9H8" />
                        <path d="M16 13H8" />
                        <path d="M16 17H8" />
                      </svg>
                      My Posts
                    </button>

                    <button
                      onClick={() => setActiveTab("saved")}
                      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                        activeTab === "saved"
                          ? "bg-white text-[#1877f2] shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
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
                        className="lucide lucide-bookmark"
                        aria-hidden="true"
                      >
                        <path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z" />
                      </svg>
                      Saved
                    </button>
                  </div>

                  <span className="rounded-full bg-[#e7f3ff] px-3 py-1 text-xs font-bold text-[#1877f2]">
                    {selectedPosts.length}
                  </span>
                </div>

                {activeTab === "posts" && isPostsLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                    Loading posts...
                  </div>
                ) : null}

                {activeTab === "posts" && !isPostsLoading && postsError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
                    {postsErrorMessage}
                  </div>
                ) : null}

                <div className="space-y-3">
                  {selectedPosts.length > 0 ? (
                    selectedPosts.map((post, index) => {
                      const cardKey = post?._id || post?.id || `profile-post-${index}`;
                      const normalizedPost =
                        post?.user || !profile
                          ? post
                          : {
                              ...post,
                              user: profile,
                            };

                      return (
                        <PostCard
                          key={cardKey}
                          post={normalizedPost}
                          fallbackUser={profile}
                          showTopComment={false}
                        />
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                      {activeTab === "saved"
                        ? "No saved posts found."
                        : "No posts found for this user."}
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>

      {isProfilePhotoViewerOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 sm:p-8">
          <button
            type="button"
            onClick={handleCloseProfilePhotoViewer}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close profile photo preview"
          >
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
              className="lucide lucide-x"
              aria-hidden="true"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>

          <img
            alt={`${displayName} profile photo`}
            className="max-h-full max-w-full object-contain"
            src={profilePhotoViewerUrl || displayAvatar}
            onError={(event) => {
              event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
            }}
          />
        </div>
      ) : null}

      {isCoverViewerOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 sm:p-8">
          <button
            type="button"
            onClick={handleCloseCoverViewer}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close cover photo preview"
          >
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
              className="lucide lucide-x"
              aria-hidden="true"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>

          <img
            alt={`${displayName} cover photo`}
            className="max-h-full max-w-full object-contain"
            src={coverViewerUrl || displayCover}
          />
        </div>
      ) : null}

      {isCoverPrivacyModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-extrabold text-slate-900">Cover post privacy</h3>
            <p className="mt-1 text-sm text-slate-500">
              Choose who can see the post generated for your new cover photo.
            </p>
            <div className="mt-4">
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#1877f2]"
                value={coverPrivacy}
                onChange={(event) => setCoverPrivacy(event.target.value)}
                disabled={isCoverUpdating}
              >
                <option value="public">Public</option>
                <option value="following">Followers</option>
                <option value="only_me">Only me</option>
              </select>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                onClick={handleCancelCoverPrivacy}
                disabled={isCoverUpdating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-lg bg-[#1877f2] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleSaveCoverPrivacy}
                disabled={isCoverUpdating || !pendingCoverFile}
              >
                {isCoverUpdating ? "Saving..." : "Save cover"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isProfilePhotoModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-[560px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5">
            <div className="mb-3">
              <h3 className="text-lg font-extrabold text-slate-900">Adjust profile photo</h3>
              <p className="text-sm text-slate-500">
                Drag to reposition and use zoom for perfect framing.
              </p>
            </div>

            <div className="mx-auto w-full max-w-[340px] overflow-x-auto pb-1">
              <div
                className="relative h-[320px] w-[320px] touch-none overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200"
                onPointerDown={handleProfilePhotoPointerDown}
                onPointerMove={handleProfilePhotoPointerMove}
                onPointerUp={handleProfilePhotoPointerUp}
                onPointerCancel={handleProfilePhotoPointerUp}
              >
                {profilePhotoModalUrl ? (
                  <img
                    alt="Crop preview"
                    draggable={false}
                    src={profilePhotoModalUrl}
                    onLoad={handleProfileImageLoad}
                    className="pointer-events-none absolute left-1/2 top-1/2 select-none"
                    style={{
                      width: `${profilePhotoNaturalSize.width || PROFILE_CROP_SIZE}px`,
                      height: `${profilePhotoNaturalSize.height || PROFILE_CROP_SIZE}px`,
                      maxWidth: "none",
                      maxHeight: "none",
                      transform: `translate(calc(-50% + ${profilePhotoOffset.x}px), calc(-50% + ${profilePhotoOffset.y}px)) scale(${profileCropScale})`,
                      transformOrigin: "center center",
                    }}
                  />
                ) : null}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Zoom</span>
                <span>{profilePhotoZoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={profilePhotoZoom}
                onChange={handleProfilePhotoZoomChange}
                disabled={isUploadingImage}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#1877f2]"
              />
            </div>

            <div className="mt-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                Post privacy
              </p>
              <select
                value={profilePhotoPrivacy}
                onChange={(event) => setProfilePhotoPrivacy(event.target.value)}
                disabled={isUploadingImage}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#1877f2]"
              >
                <option value="public">Public</option>
                <option value="following">Followers</option>
                <option value="only_me">Only me</option>
              </select>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelProfilePhotoModal}
                disabled={isUploadingImage}
                className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfilePhoto}
                disabled={isUploadingImage || !pendingProfileFile}
                className="inline-flex items-center rounded-lg bg-[#1877f2] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploadingImage ? "Saving..." : "Save photo"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
