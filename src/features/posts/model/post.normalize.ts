import type { UnknownRecord } from "@/shared/api/types";
import { firstArray, firstString, isRecord, readPath } from "@/shared/lib/records";
import {
  anyBooleanLike,
  BOOLEAN_VOCABULARY,
  buildHandle,
  getEntityId,
  resolveAvatarUrl,
  resolveMediaUrl,
  resolveText,
  toCountOf,
} from "@/shared/lib/values";
import type { Post, PostAuthor, PostTopComment } from "./post.types";

/** The author lives under a different key on almost every route. */
function resolveAuthor(source: UnknownRecord, fallback: unknown): PostAuthor {
  const candidates = [
    source.user,
    source.createdBy,
    source.author,
    source.owner,
    fallback,
  ];

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    const hasIdentity =
      candidate.name ||
      candidate.username ||
      candidate.email ||
      candidate.photo ||
      candidate.avatar ||
      getEntityId(candidate);
    if (!hasIdentity) continue;

    const name = firstString(candidate, [["name"]]) ?? "Unknown user";
    return {
      id: getEntityId(candidate),
      name,
      handle: buildHandle(candidate.username, candidate.email, name),
      photo: resolveAvatarUrl(candidate.photo, candidate.avatar),
    };
  }

  return {
    id: null,
    name: "Unknown user",
    handle: "@user",
    photo: resolveAvatarUrl(null),
  };
}

/** Heuristic used to tell a nested post apart from an unrelated nested object. */
function looksLikePost(candidate: unknown): boolean {
  if (!isRecord(candidate)) return false;
  return Boolean(
    getEntityId(candidate) ||
      candidate.body ||
      candidate.image ||
      (Array.isArray(candidate.images) && candidate.images.length > 0) ||
      candidate.createdAt ||
      candidate.user ||
      candidate.author,
  );
}

const EXPLICIT_SHARE_KEYS = [
  ["sharedPost"],
  ["originalPost"],
  ["repostOf"],
  ["sourcePost"],
  ["parentPost"],
  ["shared", "post"],
  ["share", "post"],
  ["shareData", "post"],
] as const;

/**
 * A re-share carries the original post nested inside it. The ambiguous keys
 * (`post`, `postData`, `postId`) are only accepted when the nested id differs
 * from the outer one — otherwise a bookmark envelope would be mistaken for a
 * share of itself.
 */
function findSharedSource(source: UnknownRecord): UnknownRecord | null {
  for (const path of EXPLICIT_SHARE_KEYS) {
    const candidate = readPath(source, ...path);
    if (looksLikePost(candidate)) return candidate as UnknownRecord;
  }

  const outerId = getEntityId(source);
  for (const key of ["post", "postData", "postId"] as const) {
    const candidate = source[key];
    if (!looksLikePost(candidate)) continue;

    const nestedId = getEntityId(candidate);
    if (!nestedId || !outerId || String(nestedId) !== String(outerId)) {
      return candidate as UnknownRecord;
    }
  }

  return null;
}

function resolveTopComment(source: UnknownRecord): PostTopComment | null {
  const comments = source.comments;
  const raw =
    source.topComment ??
    (Array.isArray(comments) && comments.length > 0 ? comments[0] : null);
  if (!isRecord(raw)) return null;

  return {
    authorName:
      firstString(raw, [["commentCreator", "name"], ["user", "name"]]) ?? "Unknown user",
    authorPhoto: resolveAvatarUrl(
      readPath(raw, "commentCreator", "photo"),
      readPath(raw, "user", "photo"),
    ),
    content: firstString(raw, [["content"], ["body"]]) ?? "",
  };
}

const BOOKMARK_FLAG_KEYS = [
  ["__isBookmarked"],
  ["isBookmarked"],
  ["bookmarkedByMe"],
  ["savedByMe"],
  ["isSaved"],
  ["saved"],
  ["bookmark"],
  ["meta", "isBookmarked"],
  ["meta", "savedByMe"],
] as const;

const OWNER_FLAG_KEYS = ["isOwner", "isMine", "ownedByMe", "canEdit", "canDelete"] as const;

/**
 * Turns one raw post into the shape the UI renders.
 *
 * `depth` stops a malformed payload that nests itself from recursing forever.
 */
export function normalizePost(raw: unknown, fallbackAuthor: unknown = null, depth = 0): Post | null {
  if (!isRecord(raw)) return null;

  const id = getEntityId(raw);
  if (!id) return null;

  const sharedSource = depth === 0 ? findSharedSource(raw) : null;

  return {
    id,
    body: resolveText(raw.body),
    image: resolveMediaUrl(
      raw.image,
      Array.isArray(raw.images) ? raw.images[0] : null,
      readPath(raw, "media", "0", "url"),
    ),
    createdAt: firstString(raw, [["createdAt"]]),
    author: resolveAuthor(raw, fallbackAuthor),
    likesCount: toCountOf(raw.likesCount, raw.likes),
    commentsCount: toCountOf(raw.commentsCount, raw.comments),
    sharesCount: toCountOf(raw.sharesCount, raw.shares),
    isLiked: anyBooleanLike([raw.isLiked, raw.likedByMe]),
    isBookmarked: anyBooleanLike(
      BOOKMARK_FLAG_KEYS.map((path) => readPath(raw, ...path)),
      BOOLEAN_VOCABULARY.bookmark,
    ),
    ownerFlag: anyBooleanLike(OWNER_FLAG_KEYS.map((key) => raw[key])),
    ownerId:
      getEntityId(raw.createdBy) ?? getEntityId(raw.owner) ?? getEntityId(raw.creator),
    sharedPost: sharedSource ? normalizePost(sharedSource, null, depth + 1) : null,
    topComment: resolveTopComment(raw),
    raw,
  };
}

const POST_LIST_PATHS = [
  ["data", "posts"],
  ["posts"],
  ["data", "data", "posts"],
  ["data", "data", "items"],
  ["data", "items"],
  ["data", "userPosts"],
  ["userPosts"],
  ["data", "data"],
  ["data"],
] as const;

export function normalizePostList(payload: unknown, fallbackAuthor: unknown = null): Post[] {
  return firstArray(payload, POST_LIST_PATHS)
    .map((item) => normalizePost(item, fallbackAuthor))
    .filter((post): post is Post => post !== null);
}

/** Bookmark rows wrap the post one level deeper than the feed does. */
function unwrapBookmarkedPost(item: unknown): unknown {
  if (!isRecord(item)) return null;

  for (const key of ["post", "postId", "postData"] as const) {
    const nested = item[key];
    if (isRecord(nested)) return nested;
  }

  return getEntityId(item) ? item : null;
}

export function normalizeSavedPostList(payload: unknown): Post[] {
  const listPaths = [
    ["data", "bookmarks"],
    ["bookmarks"],
    ["data", "savedPosts"],
    ["savedPosts"],
    ["data", "posts"],
    ["posts"],
    ["data", "data", "bookmarks"],
    ["data", "data", "posts"],
    ["data", "data"],
  ] as const;

  return firstArray(payload, listPaths)
    .map((item) => normalizePost(unwrapBookmarkedPost(item)))
    .filter((post): post is Post => post !== null)
    // These came from the bookmarks endpoint, so they are saved by definition
    // even when the payload omits the flag.
    .map((post) => ({ ...post, isBookmarked: true }));
}

/** Saved posts embedded in a profile payload rather than fetched separately. */
export function extractSavedPostsFromProfile(profile: UnknownRecord | null): Post[] {
  if (!profile) return [];

  for (const key of [
    "bookmarks",
    "savedPosts",
    "bookmarkedPosts",
    "saved",
    "favorites",
  ] as const) {
    const list = profile[key];
    if (!Array.isArray(list)) continue;

    return list
      .map((item) => normalizePost(unwrapBookmarkedPost(item)))
      .filter((post): post is Post => post !== null)
      .map((post) => ({ ...post, isBookmarked: true }));
  }

  return [];
}

/** Single post from a detail response. */
export function normalizeSinglePost(payload: unknown): Post | null {
  const candidates = [
    readPath(payload, "data", "post"),
    readPath(payload, "post"),
    readPath(payload, "data"),
  ];

  for (const candidate of candidates) {
    const post = normalizePost(candidate);
    if (post) return post;
  }
  return null;
}

/**
 * The like endpoint answers with a message rather than a state, so the next
 * value is inferred from the wording and falls back to a local toggle.
 */
export function resolveLikeResult(
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

  const countFromApi =
    readPath(payload, "data", "likesCount") ??
    readPath(payload, "likesCount") ??
    readPath(payload, "data", "count") ??
    (Array.isArray(readPath(payload, "data", "likes"))
      ? (readPath(payload, "data", "likes") as unknown[]).length
      : null) ??
    (Array.isArray(readPath(payload, "likes"))
      ? (readPath(payload, "likes") as unknown[]).length
      : null);

  const safeCount = Number.isFinite(currentCount) ? currentCount : 0;
  const computed = isLiked
    ? safeCount + (wasLiked ? 0 : 1)
    : Math.max(0, safeCount - (wasLiked ? 1 : 0));

  const parsed = Number(countFromApi);
  return {
    isLiked,
    count: countFromApi !== null && Number.isFinite(parsed) ? parsed : computed,
  };
}

/** Same inference problem, for the bookmark endpoint. */
export function resolveBookmarkResult(payload: unknown, wasBookmarked: boolean): boolean {
  const flags = [
    readPath(payload, "data", "isBookmarked"),
    readPath(payload, "isBookmarked"),
    readPath(payload, "data", "bookmarked"),
    readPath(payload, "bookmarked"),
    readPath(payload, "data", "saved"),
    readPath(payload, "saved"),
    readPath(payload, "data", "isSaved"),
    readPath(payload, "isSaved"),
  ];

  for (const flag of flags) {
    if (flag === undefined || flag === null) continue;
    const parsed = anyBooleanLike([flag], BOOLEAN_VOCABULARY.bookmark);
    return parsed;
  }

  const message = String(firstString(payload, [["message"]]) ?? "").toLowerCase();
  if (
    message.includes("unsave") ||
    message.includes("un save") ||
    message.includes("unbookmark") ||
    message.includes("remove bookmark")
  ) {
    return false;
  }
  if (message.includes("save") || message.includes("bookmark")) return true;

  return !wasBookmarked;
}

/** Share count after a successful share. */
export function resolveShareCount(payload: unknown, currentCount: number): number {
  const countFromApi =
    readPath(payload, "data", "sharesCount") ??
    readPath(payload, "sharesCount") ??
    readPath(payload, "data", "count") ??
    (Array.isArray(readPath(payload, "data", "shares"))
      ? (readPath(payload, "data", "shares") as unknown[]).length
      : null) ??
    (Array.isArray(readPath(payload, "shares"))
      ? (readPath(payload, "shares") as unknown[]).length
      : null);

  const parsed = Number(countFromApi);
  if (countFromApi !== null && countFromApi !== undefined && Number.isFinite(parsed)) {
    return parsed;
  }

  const message = String(firstString(payload, [["message"]]) ?? "").toLowerCase();
  const safeCount = Number.isFinite(currentCount) ? currentCount : 0;
  if (message.includes("unshare") || message.includes("remove")) {
    return Math.max(0, safeCount - 1);
  }
  return safeCount + 1;
}
