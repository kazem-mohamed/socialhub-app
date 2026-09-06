import type { UnknownRecord } from "@/shared/api/types";

export type PostsFilter = "feed" | "my-posts" | "community" | "saved";

/** Author summary as rendered on a post card. */
export interface PostAuthor {
  id: string | null;
  name: string;
  handle: string;
  photo: string;
}

/** A post as the UI consumes it — every optional API shape already resolved. */
export interface Post {
  id: string;
  body: string;
  image: string | null;
  createdAt: string | null;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  /** Ownership flags the API sometimes sends instead of matching ids. */
  ownerFlag: boolean;
  ownerId: string | null;
  /** Populated when this post is a re-share of another one. */
  sharedPost: Post | null;
  topComment: PostTopComment | null;
  raw: UnknownRecord;
}

export interface PostTopComment {
  authorName: string;
  authorPhoto: string;
  content: string;
}

export interface CreatePostPayload {
  body: string;
  imageFile: File | null;
}

export interface UpdatePostPayload extends CreatePostPayload {
  postId: string;
}
