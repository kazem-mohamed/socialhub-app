import type { UnknownRecord } from "@/shared/api/types";

/** A comment or a reply — both share the same shape. */
export interface Comment {
  id: string;
  content: string;
  createdAt: string | null;
  authorId: string | null;
  authorName: string;
  authorPhoto: string;
  authorHandle: string;
  likesCount: number;
  isLiked: boolean;
  repliesCount: number;
  /** True while a locally-created entity awaits its server response. */
  isOptimistic: boolean;
  raw: UnknownRecord | null;
}

export type CommentKind = "comment" | "reply";
