import { DEFAULT_PROFILE_IMAGE } from "@/shared/config/constants";
import { firstArray, firstNumber, firstRecord, firstString, isRecord } from "@/shared/lib/records";
import {
  anyBooleanLike,
  buildHandle,
  getEntityId,
  resolveAvatarUrl,
  toCountOf,
} from "@/shared/lib/values";
import type { Page } from "@/shared/api/types";
import type { Comment, CommentKind } from "./comment.types";

/** The author key differs between comments (`commentCreator`) and replies. */
const CREATOR_KEYS = ["replyCreator", "commentCreator", "user", "creator"] as const;

function findCreator(raw: unknown) {
  return firstRecord(
    raw,
    CREATOR_KEYS.map((key) => [key]),
  );
}

export function normalizeComment(raw: unknown): Comment | null {
  if (!isRecord(raw)) return null;

  const id = getEntityId(raw);
  if (!id) return null;

  const creator = findCreator(raw);
  const authorName = firstString(creator, [["name"]]) ?? "Unknown user";

  return {
    id,
    content: firstString(raw, [["content"], ["body"]]) ?? "",
    createdAt: firstString(raw, [["createdAt"]]),
    authorId: getEntityId(creator),
    authorName,
    authorPhoto: resolveAvatarUrl(creator?.photo),
    authorHandle: buildHandle(creator?.username, creator?.email, authorName),
    likesCount: toCountOf(raw.likesCount, raw.likes),
    isLiked: anyBooleanLike([raw.isLiked, raw.likedByMe]),
    repliesCount: toCountOf(raw.repliesCount, raw.replies),
    isOptimistic: raw.isOptimistic === true,
    raw,
  };
}

function extractPaginationInfo(payload: unknown) {
  return firstRecord(payload, [
    ["data", "paginationInfo"],
    ["paginationInfo"],
    ["metadata"],
  ]);
}

/** Turns a comments or replies response into a typed page. */
export function normalizeCommentPage(
  payload: unknown,
  kind: CommentKind,
  page: number,
): Page<Comment> {
  const listKey = kind === "reply" ? "replies" : "comments";
  const info = extractPaginationInfo(payload);

  return {
    items: firstArray(payload, [["data", listKey], [listKey], ["data"]])
      .map(normalizeComment)
      .filter((comment): comment is Comment => comment !== null),
    page,
    totalPages: firstNumber(info, [["numberOfPages"], ["pages"]]),
    totalCount: firstNumber(info, [["total"], ["count"]]),
  };
}

/** Locates the entity the API echoed back after a create or update. */
export function extractWrittenComment(payload: unknown, kind: CommentKind): Comment | null {
  const keys =
    kind === "reply"
      ? ["reply", "createdReply", "newReply", "data"]
      : ["comment", "createdComment", "newComment", "data"];

  for (const container of [
    isRecord(payload) ? payload.data : null,
    payload,
  ]) {
    if (!isRecord(container)) continue;

    for (const key of keys) {
      const candidate = container[key];
      if (!isRecord(candidate)) continue;
      if (getEntityId(candidate) || candidate.content || candidate.body) {
        return normalizeComment(candidate);
      }
    }

    if (getEntityId(container) || container.content || container.body) {
      return normalizeComment(container);
    }
  }

  return null;
}

/** Placeholder rendered immediately while the request is in flight. */
export function createOptimisticComment(content: string, authorName: string): Comment {
  const id = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    content,
    createdAt: new Date().toISOString(),
    authorId: null,
    authorName,
    authorPhoto: DEFAULT_PROFILE_IMAGE,
    authorHandle: "@you",
    likesCount: 0,
    isLiked: false,
    repliesCount: 0,
    isOptimistic: true,
    raw: null,
  };
}

/** Same inference the post like endpoint needs — the API returns a message. */
export function resolveCommentLikeResult(
  payload: unknown,
  wasLiked: boolean,
  currentCount: number,
): { isLiked: boolean; count: number } {
  const message = String(firstString(payload, [["message"]]) ?? "").toLowerCase();

  let isLiked = !wasLiked;
  if (message.includes("unlike") || message.includes("removed") || message.includes("delete")) {
    isLiked = false;
  } else if (message.includes("like")) {
    isLiked = true;
  }

  const countFromApi = firstNumber(payload, [
    ["data", "likesCount"],
    ["likesCount"],
    ["data", "count"],
  ]);

  const safeCount = Number.isFinite(currentCount) ? currentCount : 0;
  const computed = isLiked
    ? safeCount + (wasLiked ? 0 : 1)
    : Math.max(0, safeCount - (wasLiked ? 1 : 0));

  return { isLiked, count: countFromApi ?? computed };
}
