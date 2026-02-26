import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { useForm } from "react-hook-form";

const DEFAULT_PROFILE_IMAGE =
  "https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png";
const COMMENTS_PAGE_LIMIT = 10;
const REPLIES_PAGE_LIMIT = 10;
const MAX_COMMENT_LENGTH = 500;
const MAX_REPLY_LENGTH = 500;

async function fetchCommentsByPostId(token, postId, page) {
  const res = await axios.request({
    method: "GET",
    url: `https://route-posts.routemisr.com/posts/${postId}/comments`,
    headers: { token },
    params: {
      page,
      limit: COMMENTS_PAGE_LIMIT,
    },
  });

  const rawComments =
    res?.data?.data?.comments ||
    res?.data?.comments ||
    res?.data?.data ||
    [];

  const paginationInfo =
    res?.data?.data?.paginationInfo ||
    res?.data?.paginationInfo ||
    res?.data?.metadata ||
    null;

  return {
    comments: Array.isArray(rawComments) ? rawComments : [],
    page,
    totalPages:
      paginationInfo?.numberOfPages ??
      paginationInfo?.pages ??
      null,
    totalCount:
      paginationInfo?.total ??
      paginationInfo?.count ??
      null,
  };
}

async function fetchRepliesByCommentId(token, postId, commentId, page) {
  const res = await axios.request({
    method: "GET",
    url: `https://route-posts.routemisr.com/posts/${postId}/comments/${commentId}/replies`,
    headers: { token },
    params: {
      page,
      limit: REPLIES_PAGE_LIMIT,
    },
  });

  const rawReplies =
    res?.data?.data?.replies ||
    res?.data?.replies ||
    res?.data?.data ||
    [];

  const paginationInfo =
    res?.data?.data?.paginationInfo ||
    res?.data?.paginationInfo ||
    res?.data?.metadata ||
    null;

  return {
    replies: Array.isArray(rawReplies) ? rawReplies : [],
    page,
    totalPages:
      paginationInfo?.numberOfPages ??
      paginationInfo?.pages ??
      null,
    totalCount:
      paginationInfo?.total ??
      paginationInfo?.count ??
      null,
  };
}

async function createCommentByPostId(token, postId, content) {
  return axios.request({
    method: "POST",
    url: `https://route-posts.routemisr.com/posts/${postId}/comments`,
    headers: { token },
    data: { content },
  });
}

async function createReplyByCommentId(token, postId, commentId, content) {
  return axios.request({
    method: "POST",
    url: `https://route-posts.routemisr.com/posts/${postId}/comments/${commentId}/replies`,
    headers: { token },
    data: { content },
  });
}

async function updateCommentById(token, postId, commentId, content) {
  return axios.request({
    method: "PUT",
    url: `https://route-posts.routemisr.com/posts/${postId}/comments/${commentId}`,
    headers: { token },
    data: { content },
  });
}

async function deleteCommentById(token, postId, commentId) {
  return axios.request({
    method: "DELETE",
    url: `https://route-posts.routemisr.com/posts/${postId}/comments/${commentId}`,
    headers: { token },
  });
}

async function toggleCommentLike(token, postId, commentId) {
  return axios.request({
    method: "PUT",
    url: `https://route-posts.routemisr.com/posts/${postId}/comments/${commentId}/like`,
    headers: { token },
  });
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

function getValidImageUrl(url) {
  if (typeof url !== "string") return DEFAULT_PROFILE_IMAGE;
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_PROFILE_IMAGE;
  return trimmed;
}

function getValidMediaUrl(url) {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return trimmed;
}

function getEntityId(entity) {
  return entity?._id || entity?.id || null;
}

function getEntityCreatorId(entity) {
  return (
    entity?.replyCreator?._id ||
    entity?.replyCreator?.id ||
    entity?.commentCreator?._id ||
    entity?.commentCreator?.id ||
    entity?.user?._id ||
    entity?.user?.id ||
    entity?.creator?._id ||
    entity?.creator?.id ||
    null
  );
}

function getEntityBody(entity) {
  return entity?.content || entity?.body || "";
}

function getEntityAuthor(entity) {
  return (
    entity?.replyCreator?.name ||
    entity?.commentCreator?.name ||
    entity?.user?.name ||
    entity?.creator?.name ||
    "Unknown user"
  );
}

function getEntityPhoto(entity) {
  return getValidImageUrl(
    entity?.replyCreator?.photo ||
      entity?.commentCreator?.photo ||
      entity?.user?.photo ||
      entity?.creator?.photo
  );
}

function getEntityHandle(entity, fallbackName) {
  const raw =
    entity?.replyCreator?.username ||
    entity?.commentCreator?.username ||
    entity?.user?.username ||
    entity?.creator?.username ||
    entity?.replyCreator?.email?.split("@")?.[0] ||
    entity?.commentCreator?.email?.split("@")?.[0] ||
    fallbackName?.toLowerCase()?.replace(/\s+/g, "");

  if (!raw) return "@user";
  return raw.startsWith("@") ? raw : `@${raw}`;
}

function getEntityDateLabel(dateValue) {
  if (!dateValue) return "now";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "now";

  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;

  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m`;
  if (diffMs < hour * 24) return `${Math.max(1, Math.floor(diffMs / hour))}h`;

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
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

function getNumericCount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

function createOptimisticEntity(content, entityType) {
  const safeContent = typeof content === "string" ? content : "";
  const optimisticId = `temp-${entityType}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const creator = {
    name: "You",
    username: "you",
    photo: DEFAULT_PROFILE_IMAGE,
  };

  if (entityType === "reply") {
    return {
      _id: optimisticId,
      id: optimisticId,
      content: safeContent,
      createdAt: new Date().toISOString(),
      replyCreator: creator,
      likesCount: 0,
      isLiked: false,
      likedByMe: false,
      isOptimistic: true,
    };
  }

  return {
    _id: optimisticId,
    id: optimisticId,
    content: safeContent,
    createdAt: new Date().toISOString(),
    commentCreator: creator,
    likesCount: 0,
    repliesCount: 0,
    isLiked: false,
    likedByMe: false,
    isOptimistic: true,
  };
}

function prependEntityToInfiniteQueryData(oldData, listKey, entity) {
  if (!oldData?.pages || !Array.isArray(oldData.pages)) {
    return {
      pages: [
        {
          [listKey]: [entity],
          page: 1,
          totalPages: 1,
          totalCount: 1,
        },
      ],
      pageParams: [1],
    };
  }

  const firstPage = oldData.pages[0] || {};
  const currentList = Array.isArray(firstPage?.[listKey]) ? firstPage[listKey] : [];
  const currentTotalCount = Number(firstPage?.totalCount);

  return {
    ...oldData,
    pages: [
      {
        ...firstPage,
        [listKey]: [entity, ...currentList],
        totalCount: Number.isFinite(currentTotalCount)
          ? currentTotalCount + 1
          : firstPage?.totalCount,
      },
      ...oldData.pages.slice(1),
    ],
  };
}

function replaceEntityInInfiniteQueryData(oldData, listKey, targetId, nextEntity) {
  if (!oldData?.pages || !targetId) return oldData;

  return {
    ...oldData,
    pages: oldData.pages.map((page) => {
      const list = Array.isArray(page?.[listKey]) ? page[listKey] : null;
      if (!list) return page;

      let didChange = false;
      const nextList = list.map((item) => {
        if (getEntityId(item) !== targetId) return item;
        didChange = true;
        return nextEntity;
      });

      return didChange ? { ...page, [listKey]: nextList } : page;
    }),
  };
}

function patchEntityInInfiniteQueryData(oldData, listKey, targetId, patch) {
  if (!oldData?.pages || !targetId || !patch || typeof patch !== "object") return oldData;

  let didAnyChange = false;
  const nextPages = oldData.pages.map((page) => {
    const list = Array.isArray(page?.[listKey]) ? page[listKey] : null;
    if (!list) return page;

    let didChange = false;
    const nextList = list.map((item) => {
      if (getEntityId(item) !== targetId) return item;
      didChange = true;
      return { ...item, ...patch };
    });

    if (!didChange) return page;
    didAnyChange = true;
    return { ...page, [listKey]: nextList };
  });

  return didAnyChange ? { ...oldData, pages: nextPages } : oldData;
}

function removeEntityFromInfiniteQueryData(oldData, listKey, targetId) {
  if (!oldData?.pages || !targetId) return oldData;

  let removedCount = 0;
  const nextPages = oldData.pages.map((page) => {
    const list = Array.isArray(page?.[listKey]) ? page[listKey] : null;
    if (!list) return page;

    const filteredList = list.filter((item) => {
      const shouldRemove = getEntityId(item) === targetId;
      if (shouldRemove) removedCount += 1;
      return !shouldRemove;
    });

    return filteredList.length !== list.length ? { ...page, [listKey]: filteredList } : page;
  });

  if (removedCount === 0) return oldData;

  const firstPage = nextPages[0];
  const currentTotalCount = Number(firstPage?.totalCount);
  if (firstPage && Number.isFinite(currentTotalCount)) {
    nextPages[0] = {
      ...firstPage,
      totalCount: Math.max(0, currentTotalCount - removedCount),
    };
  }

  return {
    ...oldData,
    pages: nextPages,
  };
}

function updateCommentReplyCountInInfiniteQueryData(oldData, commentId, delta) {
  if (!oldData?.pages || !commentId) return oldData;

  return {
    ...oldData,
    pages: oldData.pages.map((page) => {
      const comments = Array.isArray(page?.comments) ? page.comments : null;
      if (!comments) return page;

      let didChange = false;
      const nextComments = comments.map((comment) => {
        if (getEntityId(comment) !== commentId) return comment;

        const currentRepliesCount = getNumericCount(comment?.repliesCount);
        didChange = true;
        return {
          ...comment,
          repliesCount: Math.max(0, currentRepliesCount + delta),
        };
      });

      return didChange ? { ...page, comments: nextComments } : page;
    }),
  };
}

function extractCreatedEntityFromResponse(responseData, entityType) {
  const keys =
    entityType === "reply"
      ? ["reply", "createdReply", "newReply", "data"]
      : ["comment", "createdComment", "newComment", "data"];

  const containers = [responseData?.data, responseData];

  for (const container of containers) {
    if (!container || typeof container !== "object") continue;

    for (const key of keys) {
      const candidate = container?.[key];
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;

      if (getEntityId(candidate) || candidate?.content || candidate?.body) {
        return candidate;
      }
    }

    if (getEntityId(container) || container?.content || container?.body) {
      return container;
    }
  }

  return null;
}

function mergeOptimisticWithServerEntity(optimisticEntity, serverEntity) {
  if (!optimisticEntity) return serverEntity;
  if (!serverEntity) return optimisticEntity;

  return {
    ...optimisticEntity,
    ...serverEntity,
    _id: serverEntity?._id || serverEntity?.id || optimisticEntity?._id,
    id: serverEntity?.id || serverEntity?._id || optimisticEntity?.id,
    isOptimistic: false,
    isLiked: Boolean(serverEntity?.isLiked || serverEntity?.likedByMe),
    likedByMe: Boolean(serverEntity?.likedByMe || serverEntity?.isLiked),
    likesCount:
      getNumericCount(serverEntity?.likesCount) || getNumericCount(serverEntity?.likes),
  };
}

function ReplyThread({ token, postId, comment, commentTime, currentUserId }) {
  const queryClient = useQueryClient();
  const commentId = getEntityId(comment);
  const commentCreatorId = getEntityCreatorId(comment);
  const isOwnComment =
    Boolean(commentCreatorId) &&
    Boolean(currentUserId) &&
    String(commentCreatorId) === String(currentUserId);
  const commentRepliesQueryKey = ["comment-replies", postId, commentId, token];
  const postCommentsQueryKey = ["post-comments", postId, token];
  const [isReplyFormOpen, setIsReplyFormOpen] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);
  const [replySubmitError, setReplySubmitError] = useState("");
  const [isCommentMenuOpen, setIsCommentMenuOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editingCommentContent, setEditingCommentContent] = useState(getEntityBody(comment));
  const [commentActionError, setCommentActionError] = useState("");
  const commentMenuRef = useRef(null);
  const [commentLikeState, setCommentLikeState] = useState({
    isLiked: Boolean(comment?.isLiked || comment?.likedByMe),
    count: getNumericCount(comment?.likesCount) || getNumericCount(comment?.likes),
  });
  const [commentLikeError, setCommentLikeError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      content: "",
    },
  });

  const commentLikeMutation = useMutation({
    mutationFn: () => toggleCommentLike(token, postId, commentId),
    onMutate: () => {
      setCommentLikeError("");
    },
    onSuccess: (response) => {
      const next = getLikeResultFromResponse(
        response?.data,
        commentLikeState.isLiked,
        commentLikeState.count
      );
      setCommentLikeState(next);
      queryClient.invalidateQueries({
        queryKey: postCommentsQueryKey,
      });
    },
    onError: (error) => {
      setCommentLikeError(extractApiMessage(error, "Failed to update like."));
    },
  });

  const [replyLikeStates, setReplyLikeStates] = useState({});

  const replyLikeMutation = useMutation({
    mutationFn: ({ replyId }) => {
      if (!replyId) throw new Error("Missing reply ID");
      return toggleCommentLike(token, postId, replyId);
    },
    onSuccess: (response, { replyId }) => {
      setReplyLikeStates((prev) => {
        const current = prev[replyId] || { isLiked: false, count: 0 };
        const next = getLikeResultFromResponse(response?.data, current.isLiked, current.count);
        return { ...prev, [replyId]: next };
      });
      queryClient.invalidateQueries({
        queryKey: commentRepliesQueryKey,
      });
    },
  });

  useEffect(() => {
    if (!isEditingComment) {
      setEditingCommentContent(getEntityBody(comment));
    }
  }, [comment?._id, comment?.id, comment?.content, comment?.body, isEditingComment]);

  useEffect(() => {
    if (!isCommentMenuOpen) return undefined;

    function handleOutsideClick(event) {
      if (!commentMenuRef.current) return;
      if (!commentMenuRef.current.contains(event.target)) {
        setIsCommentMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isCommentMenuOpen]);

  const createReplyMutation = useMutation({
    mutationFn: ({ content }) => createReplyByCommentId(token, postId, commentId, content),
    onMutate: async ({ content }) => {
      setReplySubmitError("");
      const optimisticReply = createOptimisticEntity(content, "reply");

      await Promise.all([
        queryClient.cancelQueries({ queryKey: commentRepliesQueryKey }),
        queryClient.cancelQueries({ queryKey: postCommentsQueryKey }),
      ]);

      const previousReplies = queryClient.getQueryData(commentRepliesQueryKey);
      const previousComments = queryClient.getQueryData(postCommentsQueryKey);

      queryClient.setQueryData(commentRepliesQueryKey, (oldData) =>
        prependEntityToInfiniteQueryData(oldData, "replies", optimisticReply)
      );
      queryClient.setQueryData(postCommentsQueryKey, (oldData) =>
        updateCommentReplyCountInInfiniteQueryData(oldData, commentId, 1)
      );

      setIsRepliesOpen(true);

      return {
        optimisticReplyId: getEntityId(optimisticReply),
        optimisticReply,
        previousReplies,
        previousComments,
      };
    },
    onSuccess: (response, _variables, context) => {
      const serverReply = extractCreatedEntityFromResponse(response?.data, "reply");

      if (context?.optimisticReplyId && serverReply) {
        const mergedReply = mergeOptimisticWithServerEntity(
          context.optimisticReply,
          serverReply
        );
        queryClient.setQueryData(commentRepliesQueryKey, (oldData) =>
          replaceEntityInInfiniteQueryData(
            oldData,
            "replies",
            context.optimisticReplyId,
            mergedReply
          )
        );
        return;
      }

      queryClient.invalidateQueries({ queryKey: commentRepliesQueryKey });
      queryClient.invalidateQueries({ queryKey: postCommentsQueryKey });
    },
    onError: (submitError, _variables, context) => {
      if (context && "previousReplies" in context) {
        if (typeof context.previousReplies === "undefined") {
          queryClient.removeQueries({ queryKey: commentRepliesQueryKey, exact: true });
        } else {
          queryClient.setQueryData(commentRepliesQueryKey, context.previousReplies);
        }
      }
      if (context && "previousComments" in context) {
        if (typeof context.previousComments === "undefined") {
          queryClient.removeQueries({ queryKey: postCommentsQueryKey, exact: true });
        } else {
          queryClient.setQueryData(postCommentsQueryKey, context.previousComments);
        }
      }
      setReplySubmitError(extractApiMessage(submitError, "Failed to create reply."));
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ content }) => updateCommentById(token, postId, commentId, content),
    onMutate: async ({ content }) => {
      setCommentActionError("");
      await queryClient.cancelQueries({ queryKey: postCommentsQueryKey });

      const previousComments = queryClient.getQueryData(postCommentsQueryKey);
      queryClient.setQueryData(postCommentsQueryKey, (oldData) =>
        patchEntityInInfiniteQueryData(oldData, "comments", commentId, {
          content,
          body: content,
        })
      );

      return { previousComments };
    },
    onSuccess: (response) => {
      const updatedComment = extractCreatedEntityFromResponse(response?.data, "comment");

      if (updatedComment) {
        queryClient.setQueryData(postCommentsQueryKey, (oldData) =>
          replaceEntityInInfiniteQueryData(oldData, "comments", commentId, {
            ...comment,
            ...updatedComment,
          })
        );
      }

      setIsEditingComment(false);
      setIsCommentMenuOpen(false);
      queryClient.invalidateQueries({ queryKey: postCommentsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["posts", token] });
      queryClient.invalidateQueries({ queryKey: ["post-details", postId, token] });
    },
    onError: (error, _variables, context) => {
      if (context && "previousComments" in context) {
        if (typeof context.previousComments === "undefined") {
          queryClient.removeQueries({ queryKey: postCommentsQueryKey, exact: true });
        } else {
          queryClient.setQueryData(postCommentsQueryKey, context.previousComments);
        }
      }
      setCommentActionError(extractApiMessage(error, "Failed to update comment."));
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: () => deleteCommentById(token, postId, commentId),
    onMutate: async () => {
      setCommentActionError("");
      await Promise.all([
        queryClient.cancelQueries({ queryKey: postCommentsQueryKey }),
        queryClient.cancelQueries({ queryKey: commentRepliesQueryKey }),
      ]);

      const previousComments = queryClient.getQueryData(postCommentsQueryKey);
      const previousReplies = queryClient.getQueryData(commentRepliesQueryKey);

      queryClient.setQueryData(postCommentsQueryKey, (oldData) =>
        removeEntityFromInfiniteQueryData(oldData, "comments", commentId)
      );
      queryClient.removeQueries({ queryKey: commentRepliesQueryKey, exact: true });

      return { previousComments, previousReplies };
    },
    onSuccess: () => {
      setIsDeleteConfirmOpen(false);
      setIsCommentMenuOpen(false);
      queryClient.invalidateQueries({ queryKey: postCommentsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["posts", token] });
      queryClient.invalidateQueries({ queryKey: ["post-details", postId, token] });
    },
    onError: (error, _variables, context) => {
      if (context && "previousComments" in context) {
        if (typeof context.previousComments === "undefined") {
          queryClient.removeQueries({ queryKey: postCommentsQueryKey, exact: true });
        } else {
          queryClient.setQueryData(postCommentsQueryKey, context.previousComments);
        }
      }

      if (context && "previousReplies" in context) {
        if (typeof context.previousReplies === "undefined") {
          queryClient.removeQueries({ queryKey: commentRepliesQueryKey, exact: true });
        } else {
          queryClient.setQueryData(commentRepliesQueryKey, context.previousReplies);
        }
      }

      setCommentActionError(extractApiMessage(error, "Failed to delete comment."));
    },
  });

  function handleReplyLike(replyId) {
    if (!token || !postId || !replyId || replyLikeMutation.isPending) return;
    replyLikeMutation.mutate({ replyId });
  }

  function handleCommentLike() {
    if (!token || !postId || !commentId || commentLikeMutation.isPending) return;
    commentLikeMutation.mutate();
  }

  function handleOpenCommentEdit() {
    setEditingCommentContent(getEntityBody(comment));
    setCommentActionError("");
    setIsEditingComment(true);
    setIsCommentMenuOpen(false);
  }

  function handleCancelCommentEdit() {
    setEditingCommentContent(getEntityBody(comment));
    setIsEditingComment(false);
    setCommentActionError("");
  }

  async function handleSubmitCommentEdit(event) {
    event.preventDefault();
    if (!token || !postId || !commentId || updateCommentMutation.isPending) return;

    const trimmedContent = editingCommentContent.trim();
    if (!trimmedContent) {
      setCommentActionError("Comment is required.");
      return;
    }

    if (trimmedContent.length > MAX_COMMENT_LENGTH) {
      setCommentActionError(`Comment can't exceed ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }

    try {
      await updateCommentMutation.mutateAsync({ content: trimmedContent });
    } catch (mutationError) {
      void mutationError;
    }
  }

  function handleOpenDeleteConfirm() {
    if (!token || !postId || !commentId || deleteCommentMutation.isPending) return;
    setIsCommentMenuOpen(false);
    setCommentActionError("");
    setIsDeleteConfirmOpen(true);
  }

  function handleCloseDeleteConfirm() {
    if (deleteCommentMutation.isPending) return;
    setIsDeleteConfirmOpen(false);
  }

  function handleConfirmDeleteComment() {
    if (!token || !postId || !commentId || deleteCommentMutation.isPending) return;
    deleteCommentMutation.mutate();
  }

  const isCommentActionBusy =
    updateCommentMutation.isPending || deleteCommentMutation.isPending;

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: commentRepliesQueryKey,
    queryFn: ({ pageParam }) =>
      fetchRepliesByCommentId(token, postId, commentId, pageParam),
    initialPageParam: 1,
    enabled: Boolean(isRepliesOpen && token && postId && commentId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
    getNextPageParam: (lastPage) => {
      if (typeof lastPage?.totalPages === "number") {
        return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
      }

      return lastPage?.replies?.length === REPLIES_PAGE_LIMIT
        ? lastPage.page + 1
        : undefined;
    },
  });

  const allReplies = useMemo(
    () => (data?.pages || []).flatMap((page) => page?.replies || []),
    [data]
  );

  const totalRepliesFromApi = data?.pages?.[0]?.totalCount;
  const repliesCount =
    Number.isFinite(totalRepliesFromApi)
      ? totalRepliesFromApi
      : getNumericCount(comment?.repliesCount) || allReplies.length;

  const repliesErrorMessage = extractApiMessage(error, "Failed to load replies.");

  const onSubmitReply = async ({ content }) => {
    if (!token || !commentId) return;

    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    try {
      await createReplyMutation.mutateAsync({ content: trimmedContent });
      reset({ content: "" });
    } catch (mutationError) {
      void mutationError;
    }
  };

  return (
    <div>
      <div className="mt-1.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-400">{commentTime}</span>
          <button
            type="button"
            onClick={handleCommentLike}
            disabled={!token || !postId || !commentId || commentLikeMutation.isPending}
            className={`text-xs font-semibold hover:underline disabled:opacity-60 ${
              commentLikeState.isLiked
                ? "text-[#1877f2]"
                : "text-slate-500 transition hover:text-[#1877f2]"
            }`}
          >
            {commentLikeMutation.isPending ? "Liking..." : `Like (${commentLikeState.count})`}
          </button>
          <button
            type="button"
            onClick={() => setIsReplyFormOpen((prev) => !prev)}
            disabled={!commentId}
            className="text-xs font-semibold transition hover:underline disabled:opacity-60 text-slate-500 hover:text-[#1877f2]"
          >
            {isReplyFormOpen ? "Cancel" : "Reply"}
          </button>
        </div>

        {isOwnComment ? (
          <div className="relative" data-comment-menu-root="true" ref={commentMenuRef}>
            <button
              type="button"
              onClick={() => setIsCommentMenuOpen((prev) => !prev)}
              disabled={isCommentActionBusy}
              className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60"
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
                className="lucide lucide-ellipsis"
                aria-hidden="true"
              >
                <circle cx={12} cy={12} r={1} />
                <circle cx={19} cy={12} r={1} />
                <circle cx={5} cy={12} r={1} />
              </svg>
            </button>

            {isCommentMenuOpen ? (
              <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={handleOpenCommentEdit}
                  disabled={isCommentActionBusy}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
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
                    className="lucide lucide-pencil"
                    aria-hidden="true"
                  >
                    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                    <path d="m15 5 4 4" />
                  </svg>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleOpenDeleteConfirm}
                  disabled={isCommentActionBusy}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                >
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
                    className="lucide lucide-trash2 lucide-trash-2"
                    aria-hidden="true"
                  >
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  {deleteCommentMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-1 px-1">
        <button
          type="button"
          onClick={() => setIsRepliesOpen((prev) => !prev)}
          disabled={!commentId}
          className="text-xs font-semibold text-slate-500 transition hover:text-[#1877f2] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRepliesOpen
            ? "Hide replies"
            : `View replies${repliesCount > 0 ? ` (${repliesCount})` : ""}`}
        </button>
      </div>

      {commentLikeError ? (
        <p className="mt-1 px-1 text-xs font-semibold text-red-600">{commentLikeError}</p>
      ) : null}
      {commentActionError ? (
        <p className="mt-1 px-1 text-xs font-semibold text-red-600">{commentActionError}</p>
      ) : null}

      {isDeleteConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h4 className="text-base font-extrabold text-slate-900">Confirm action</h4>
              <button
                type="button"
                onClick={handleCloseDeleteConfirm}
                disabled={deleteCommentMutation.isPending}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                <h5 className="text-sm font-extrabold text-slate-900">
                  Delete this comment?
                </h5>
                <p className="mt-1 text-sm text-slate-600">
                  This comment will be permanently removed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={handleCloseDeleteConfirm}
                disabled={deleteCommentMutation.isPending}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteComment}
                disabled={deleteCommentMutation.isPending}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deleteCommentMutation.isPending ? "Deleting..." : "Delete comment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditingComment ? (
        <form onSubmit={handleSubmitCommentEdit} className="mt-2 ml-2">
          <div className="rounded-xl border border-slate-200 bg-white px-2 py-2">
            <textarea
              value={editingCommentContent}
              onChange={(event) => setEditingCommentContent(event.target.value)}
              rows={2}
              maxLength={MAX_COMMENT_LENGTH}
              placeholder="Update your comment..."
              disabled={updateCommentMutation.isPending}
              className="max-h-[160px] min-h-[44px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm leading-5 text-slate-800 outline-none ring-[#1877f2]/20 focus:border-[#1877f2] focus:bg-white focus:ring-2 disabled:opacity-60"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelCommentEdit}
                disabled={updateCommentMutation.isPending}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateCommentMutation.isPending}
                className="rounded-full bg-[#1877f2] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:bg-[#9ec5ff]"
              >
                {updateCommentMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {isReplyFormOpen ? (
        <form onSubmit={handleSubmit(onSubmitReply)} className="mt-2 ml-2">
          <div className="rounded-xl border border-slate-200 bg-white px-2 py-2">
            <textarea
              {...register("content", {
                required: "Reply is required.",
                maxLength: {
                  value: MAX_REPLY_LENGTH,
                  message: `Reply can't exceed ${MAX_REPLY_LENGTH} characters.`,
                },
                validate: (value) =>
                  value.trim().length > 0 || "Reply is required.",
              })}
              rows={2}
              placeholder="Write a reply..."
              className="max-h-[160px] min-h-[44px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm leading-5 text-slate-800 outline-none ring-[#1877f2]/20 focus:border-[#1877f2] focus:bg-white focus:ring-2"
            />
            {errors.content?.message ? (
              <p className="mt-1 text-xs font-semibold text-red-600">
                {errors.content.message}
              </p>
            ) : null}
            {replySubmitError ? (
              <p className="mt-1 text-xs font-semibold text-red-600">{replySubmitError}</p>
            ) : null}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={!isValid || isSubmitting || createReplyMutation.isPending}
                className="rounded-full bg-[#1877f2] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:bg-[#9ec5ff]"
              >
                {isSubmitting || createReplyMutation.isPending
                  ? "Sending..."
                  : "Send reply"}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {isRepliesOpen ? (
        <div className="mt-2 space-y-2">
          {isLoading ? (
            <div className="ml-2 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-500">
              Loading replies...
            </div>
          ) : null}

          {!isLoading && error ? (
            <div className="ml-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {repliesErrorMessage}
            </div>
          ) : null}

          {!isLoading && !error && allReplies.length === 0 ? (
            <div className="ml-2 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-500">
              No replies yet.
            </div>
          ) : null}

          {!isLoading && !error
            ? allReplies.map((reply, index) => {
                const replyAuthor = getEntityAuthor(reply);
                const replyHandle = getEntityHandle(reply, replyAuthor);
                const replyTime = getEntityDateLabel(reply?.createdAt);
                const replyBody = getEntityBody(reply);
                const replyImage = getValidMediaUrl(
                  reply?.image ||
                    reply?.replyImage ||
                    reply?.media?.url ||
                    reply?.attachment
                );
                const replyId = getEntityId(reply);
                const replyLikeState = replyLikeStates[replyId] || {
                  isLiked: Boolean(reply?.isLiked || reply?.likedByMe),
                  count: getNumericCount(reply?.likesCount) || getNumericCount(reply?.likes),
                };

                return (
                  <div
                    key={getEntityId(reply) || `${replyAuthor}-${index}`}
                    className="ml-2 flex items-start gap-2"
                  >
                    <img
                      alt={replyAuthor}
                      className="mt-0.5 h-7 w-7 rounded-full object-cover"
                      src={getEntityPhoto(reply)}
                      onError={(event) => {
                        event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="rounded-xl bg-[#f4f6f8] px-3 py-2">
                        <p className="text-xs font-bold text-slate-900">{replyAuthor}</p>
                        <p className="text-[11px] text-slate-500">
                          {replyHandle} | {replyTime}
                        </p>
                        {replyBody ? (
                          <p className="mt-1 whitespace-pre-wrap text-xs text-slate-800">
                            {replyBody}
                          </p>
                        ) : null}
                        {replyImage ? (
                          <img
                            alt="Reply"
                            className="mt-2 max-h-40 w-full rounded-lg object-cover"
                            src={replyImage}
                          />
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-center gap-3 px-1">
                        <button
                          type="button"
                          onClick={() => handleReplyLike(replyId)}
                          disabled={!token || !postId || !replyId || replyLikeMutation.isPending}
                          className={`text-[11px] font-semibold transition hover:underline disabled:cursor-not-allowed disabled:opacity-60 ${
                            replyLikeState.isLiked ? "text-[#1877f2]" : "text-slate-500"
                          }`}
                        >
                          {replyLikeMutation.isPending ? "Liking..." : `Like (${replyLikeState.count})`}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            : null}

          {!isLoading && !error && hasNextPage ? (
            <div className="pt-1 text-left">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="ml-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                {isFetchingNextPage ? "Loading..." : "View more replies"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function CommentsSection({ postId }) {
  const token = localStorage.getItem("User_Token");
  const queryClient = useQueryClient();
  const postCommentsQueryKey = ["post-comments", postId, token];
  const [sortBy, setSortBy] = useState("relevant");
  const [commentSubmitError, setCommentSubmitError] = useState("");

  const { data: currentUser } = useQuery({
    queryKey: ["navbar-profile", token],
    queryFn: () => fetchCurrentUser(token),
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });
  const currentUserName = currentUser?.name || currentUser?.username || "You";
  const currentUserId = getEntityId(currentUser);
  const currentUserAvatar = getValidImageUrl(currentUser?.photo || currentUser?.avatar);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: commentErrors, isValid, isSubmitting },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      content: "",
    },
  });

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: postCommentsQueryKey,
    queryFn: ({ pageParam }) => fetchCommentsByPostId(token, postId, pageParam),
    initialPageParam: 1,
    enabled: Boolean(token && postId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
    getNextPageParam: (lastPage) => {
      if (typeof lastPage?.totalPages === "number") {
        return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
      }

      return lastPage?.comments?.length === COMMENTS_PAGE_LIMIT
        ? lastPage.page + 1
        : undefined;
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: ({ content }) => createCommentByPostId(token, postId, content),
    onMutate: async ({ content }) => {
      setCommentSubmitError("");
      const optimisticComment = createOptimisticEntity(content, "comment");

      await queryClient.cancelQueries({ queryKey: postCommentsQueryKey });

      const previousComments = queryClient.getQueryData(postCommentsQueryKey);
      queryClient.setQueryData(postCommentsQueryKey, (oldData) =>
        prependEntityToInfiniteQueryData(oldData, "comments", optimisticComment)
      );

      return {
        optimisticCommentId: getEntityId(optimisticComment),
        optimisticComment,
        previousComments,
      };
    },
    onSuccess: (response, _variables, context) => {
      const serverComment = extractCreatedEntityFromResponse(response?.data, "comment");

      if (context?.optimisticCommentId && serverComment) {
        const mergedComment = mergeOptimisticWithServerEntity(
          context.optimisticComment,
          serverComment
        );
        queryClient.setQueryData(postCommentsQueryKey, (oldData) =>
          replaceEntityInInfiniteQueryData(
            oldData,
            "comments",
            context.optimisticCommentId,
            mergedComment
          )
        );
        return;
      }

      queryClient.invalidateQueries({ queryKey: postCommentsQueryKey });
    },
    onError: (submitError, _variables, context) => {
      if (context && "previousComments" in context) {
        if (typeof context.previousComments === "undefined") {
          queryClient.removeQueries({ queryKey: postCommentsQueryKey, exact: true });
        } else {
          queryClient.setQueryData(postCommentsQueryKey, context.previousComments);
        }
      }
      setCommentSubmitError(extractApiMessage(submitError, "Failed to create comment."));
    },
  });

  const allComments = useMemo(
    () => (data?.pages || []).flatMap((page) => page?.comments || []),
    [data]
  );

  const sortedComments = useMemo(() => {
    if (sortBy !== "newest") return allComments;

    return [...allComments].sort((a, b) => {
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [allComments, sortBy]);

  const totalCountFromApi = data?.pages?.[0]?.totalCount;
  const commentsBadgeCount = Number.isFinite(totalCountFromApi)
    ? totalCountFromApi
    : sortedComments.length;

  const errorMessage = extractApiMessage(error, "Failed to load comments.");

  const onSubmitComment = async ({ content }) => {
    if (!token || !postId) return;

    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    try {
      await createCommentMutation.mutateAsync({ content: trimmedContent });
      reset({ content: "" });
    } catch (mutationError) {
      void mutationError;
    }
  };

  return (
    <div className="border-t border-slate-200 bg-[#f7f8fa] px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-extrabold tracking-wide text-slate-700">Comments</p>
          <span className="rounded-full bg-[#e7f3ff] px-2 py-0.5 text-[11px] font-bold text-[#1877f2]">
            {commentsBadgeCount}
          </span>
        </div>

        <select
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value);
          }}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none ring-[#1877f2]/20 focus:border-[#1877f2] focus:bg-white focus:ring-2"
        >
          <option value="relevant">Most relevant</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
            Loading comments...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {!isLoading && !error && sortedComments.length > 0
          ? sortedComments.map((comment, index) => {
              const commentAuthor = getEntityAuthor(comment);
              const commentHandle = getEntityHandle(comment, commentAuthor);
              const commentTime = getEntityDateLabel(comment?.createdAt);
              const commentBody = getEntityBody(comment);
              const commentImage = getValidMediaUrl(
                comment?.image ||
                  comment?.commentImage ||
                  comment?.media?.url ||
                  comment?.attachment
              );

              return (
                <div
                  key={getEntityId(comment) || `${commentAuthor}-${index}`}
                  className="relative flex items-start gap-2"
                >
                  <img
                    alt={commentAuthor}
                    className="mt-0.5 h-8 w-8 rounded-full object-cover"
                    src={getEntityPhoto(comment)}
                    onError={(event) => {
                      event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="relative inline-block max-w-full rounded-2xl bg-[#f0f2f5] px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{commentAuthor}</p>
                          <p className="text-xs text-slate-500">
                            {commentHandle} | {commentTime}
                          </p>
                        </div>
                      </div>

                      {commentBody ? (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                          {commentBody}
                        </p>
                      ) : null}

                      {commentImage ? (
                        <img
                          alt="Comment"
                          className="mt-2 max-h-52 w-full rounded-lg object-cover"
                          src={commentImage}
                        />
                      ) : null}
                    </div>

                    <ReplyThread
                      token={token}
                      postId={postId}
                      comment={comment}
                      commentTime={commentTime}
                      currentUserId={currentUserId}
                    />
                  </div>
                </div>
              );
            })
          : null}

        {!isLoading && !error && sortedComments.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
            No comments yet.
          </div>
        ) : null}

        {!isLoading && !error && hasNextPage ? (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            >
              {isFetchingNextPage ? "Loading..." : "View more comments"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <form onSubmit={handleSubmit(onSubmitComment)} className="flex items-start gap-2">
          <img
            alt={currentUserName}
            className="h-9 w-9 rounded-full object-cover"
            src={currentUserAvatar}
            onError={(event) => {
              event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
            }}
          />

          <div className="w-full rounded-2xl border border-slate-200 bg-[#f0f2f5] px-2.5 py-1.5 focus-within:border-[#c7dafc] focus-within:bg-white">
            <textarea
              {...register("content", {
                required: "Comment is required.",
                maxLength: {
                  value: MAX_COMMENT_LENGTH,
                  message: `Comment can't exceed ${MAX_COMMENT_LENGTH} characters.`,
                },
                validate: (value) =>
                  value.trim().length > 0 || "Comment is required.",
              })}
              placeholder="Write a comment..."
              rows={1}
              disabled={!token || isSubmitting || createCommentMutation.isPending}
              className="max-h-[140px] min-h-[40px] w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-5 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-70"
            />

            {commentErrors.content?.message ? (
              <p className="px-2 pb-1 text-xs font-semibold text-red-600">
                {commentErrors.content.message}
              </p>
            ) : null}
            {commentSubmitError ? (
              <p className="px-2 pb-1 text-xs font-semibold text-red-600">
                {commentSubmitError}
              </p>
            ) : null}

            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-full p-2 text-slate-500 transition hover:bg-slate-200 hover:text-emerald-600">
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
                    className="lucide lucide-image"
                    aria-hidden="true"
                  >
                    <rect width={18} height={18} x={3} y={3} rx={2} ry={2} />
                    <circle cx={9} cy={9} r={2} />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  <input accept="image/*" className="hidden" type="file" />
                </label>

                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full p-2 text-slate-500 transition hover:bg-slate-200 hover:text-amber-500"
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
                    className="lucide lucide-smile"
                    aria-hidden="true"
                  >
                    <circle cx={12} cy={12} r={10} />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1={9} x2={9.01} y1={9} y2={9} />
                    <line x1={15} x2={15.01} y1={9} y2={9} />
                  </svg>
                </button>
              </div>

              <button
                type="submit"
                disabled={!token || !isValid || isSubmitting || createCommentMutation.isPending}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-sm transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:bg-[#9ec5ff] disabled:opacity-100"
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
                  className="lucide lucide-send-horizontal"
                  aria-hidden="true"
                >
                  <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" />
                  <path d="M6 12h16" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
