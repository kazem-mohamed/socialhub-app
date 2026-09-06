import type { UnknownRecord } from "@/shared/api/types";
import {
  firstNumber,
  firstRecord,
  firstString,
  isRecord,
  readPath,
} from "@/shared/lib/records";
import {
  BOOLEAN_VOCABULARY,
  buildHandle,
  getEntityId,
  parseBooleanLike,
  resolveAvatarUrl,
  resolveMediaUrl,
  toCount,
} from "@/shared/lib/values";
import type { DiscoveredUser, User } from "./user.types";

/**
 * The API nests the user under `data.user`, `data.profile`, `user`, `profile`
 * or `data` depending on the route. Every consuming component used to try its
 * own subset of those; the full list is resolved once, here.
 */
export function unwrapUser(payload: unknown): UnknownRecord | null {
  return firstRecord(payload, [
    ["data", "user"],
    ["data", "profile"],
    ["user"],
    ["profile"],
    ["data"],
  ]);
}

const FOLLOW_FLAG_PATHS = [
  ["isFollowing"],
  ["isFollowed"],
  ["followedByMe"],
  ["followedByCurrentUser"],
  ["relationship", "isFollowing"],
  ["relationship", "isFollowed"],
  ["relationship", "followedByMe"],
] as const;

function readFollowFlags(source: unknown): unknown[] {
  return FOLLOW_FLAG_PATHS.map((path) => {
    let current: unknown = source;
    for (const key of path) {
      if (!isRecord(current)) return undefined;
      current = current[key];
    }
    return current;
  });
}

/** True when `viewerId` appears in any of the profile's follower lists. */
function isViewerInFollowers(source: UnknownRecord, viewerId: string | null): boolean {
  if (!viewerId) return false;

  for (const key of ["followers", "followersList", "followersData"] as const) {
    const list = source[key];
    if (!Array.isArray(list)) continue;

    for (const item of list) {
      if (typeof item === "string" && item === viewerId) return true;
      const id = getEntityId(item) ?? getEntityId(isRecord(item) ? item.user : null);
      if (id && id === viewerId) return true;
    }
  }

  return false;
}

/** Resolves the viewer's follow relationship to a profile. */
export function resolveIsFollowing(
  source: UnknownRecord,
  viewerId: string | null,
): boolean {
  for (const flag of readFollowFlags(source)) {
    const parsed = parseBooleanLike(flag, BOOLEAN_VOCABULARY.follow);
    if (parsed !== null) return parsed;
  }
  return isViewerInFollowers(source, viewerId);
}

export function normalizeUser(
  payload: unknown,
  viewerId: string | null = null,
): User | null {
  const source = unwrapUser(payload) ?? (isRecord(payload) ? payload : null);
  if (!source) return null;

  const name =
    firstString(source, [["name"], ["username"]]) ?? "User";

  return {
    id: getEntityId(source),
    name,
    username: firstString(source, [["username"]]) ?? "",
    handle: buildHandle(source.username, source.email, name),
    email: firstString(source, [["email"]]),
    photo: resolveAvatarUrl(source.photo, source.avatar),
    coverPhoto: resolveMediaUrl(
      source.coverPhoto,
      source.cover,
      source.coverImage,
      source.backgroundImage,
    ),
    followersCount:
      toCount(source.followersCount) ||
      toCount(source.followers) ||
      toCount(source.followersTotal),
    followingCount:
      toCount(source.followingCount) ||
      toCount(source.following) ||
      toCount(source.followingTotal),
    bookmarksCount: toCount(source.bookmarksCount) || toCount(source.bookmarks),
    isFollowing: resolveIsFollowing(source, viewerId),
    raw: source,
  };
}

/** Search and suggestion rows arrive wrapped in a variety of envelopes. */
function unwrapDiscoveredUser(candidate: unknown): UnknownRecord | null {
  if (!isRecord(candidate)) return null;

  const nestingKeys = [
    "user",
    "suggestedUser",
    "profile",
    "account",
    "toUser",
    "fromUser",
  ] as const;

  if (getEntityId(candidate)) return candidate;

  for (const key of nestingKeys) {
    const nested = candidate[key];
    if (isRecord(nested) && getEntityId(nested)) return nested;
  }

  for (const key of ["user", "profile", "suggestedUser"] as const) {
    const nested = candidate[key];
    if (isRecord(nested)) return nested;
  }

  return null;
}

export function normalizeDiscoveredUser(candidate: unknown): DiscoveredUser | null {
  const source = unwrapDiscoveredUser(candidate);
  if (!source) return null;

  const id = getEntityId(source) ?? getEntityId(candidate);
  if (!id) return null;

  const rawUsername = firstString(source, [["username"]]) ?? "";
  const username = rawUsername.startsWith("@") ? rawUsername.slice(1) : rawUsername;

  return {
    id,
    name: firstString(source, [["name"], ["username"]]) ?? "User",
    username: username || "user",
    photo: resolveAvatarUrl(source.photo, source.avatar),
    followersCount:
      toCount(source.followersCount) ||
      toCount(source.followersTotal) ||
      toCount(source.totalFollowers) ||
      toCount(source.followers),
    isFollowing:
      resolveIsFollowing(source, null) ||
      (isRecord(candidate) ? resolveIsFollowing(candidate, null) : false),
  };
}

const DISCOVERY_LIST_PATHS = [
  ["data", "data", "suggestions"],
  ["data", "suggestions"],
  ["suggestions"],
  ["data", "data", "users"],
  ["data", "users"],
  ["users"],
  ["data", "data", "items"],
  ["data", "items"],
  ["items"],
  ["data", "data"],
  ["data"],
] as const;

/**
 * Pulls the user list out of a search / suggestions response. A single object
 * is treated as a one-item list, which is how the endpoint answers when only
 * one user matches.
 */
export function extractDiscoveredUsers(payload: unknown): unknown[] {
  for (const path of DISCOVERY_LIST_PATHS) {
    const value = readPath(payload, ...path);
    if (Array.isArray(value)) return value;
    if (isRecord(value)) return [value];
  }
  return [];
}

/** Total page count, under any of the names the API has used for it. */
export function extractTotalPages(payload: unknown): number | null {
  const info = firstRecord(payload, [
    ["data", "data", "paginationInfo"],
    ["data", "paginationInfo"],
    ["paginationInfo"],
    ["data", "metadata"],
    ["metadata"],
  ]);
  if (!info) return null;

  return firstNumber(info, [
    ["numberOfPages"],
    ["pages"],
    ["totalPages"],
    ["total_pages"],
  ]);
}
