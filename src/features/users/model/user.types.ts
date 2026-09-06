import type { UnknownRecord } from "@/shared/api/types";

/** A user as the rest of the app consumes it. */
export interface User {
  id: string | null;
  name: string;
  username: string;
  handle: string;
  email: string | null;
  photo: string;
  coverPhoto: string | null;
  followersCount: number;
  followingCount: number;
  bookmarksCount: number;
  isFollowing: boolean;
  /** Untouched payload, for the few fields no screen has needed to model yet. */
  raw: UnknownRecord;
}

/** A user row in the search / suggestions panel. */
export interface DiscoveredUser {
  id: string;
  name: string;
  username: string;
  photo: string;
  followersCount: number;
  isFollowing: boolean;
}
