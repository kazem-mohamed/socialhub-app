import type { InfiniteData } from "@tanstack/react-query";
import type { Page } from "@/shared/api/types";
import type { Comment } from "./comment.types";

/**
 * Cached shape of a paginated comment or reply list. The page-param type is
 * left open because these helpers only ever touch `pages`.
 */
export type CommentPages = InfiniteData<Page<Comment>, unknown>;

/**
 * Optimistic-update helpers for paginated comment lists.
 *
 * These used to be four near-identical functions parameterised by a `listKey`
 * string, because comments and replies were cached under different shapes.
 * Both are now `Page<Comment>`, so one set of helpers covers everything.
 */

export function prependComment(
  pages: CommentPages | undefined,
  comment: Comment,
): CommentPages {
  if (!pages?.pages?.length) {
    return {
      pages: [{ items: [comment], page: 1, totalPages: 1, totalCount: 1 }],
      pageParams: [1],
    };
  }

  const [firstPage, ...rest] = pages.pages;
  return {
    ...pages,
    pages: [
      {
        ...firstPage,
        items: [comment, ...firstPage.items],
        totalCount:
          firstPage.totalCount === null ? null : firstPage.totalCount + 1,
      },
      ...rest,
    ],
  };
}

export function replaceComment(
  pages: CommentPages | undefined,
  targetId: string,
  next: Comment,
): CommentPages | undefined {
  if (!pages) return pages;

  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => (item.id === targetId ? next : item)),
    })),
  };
}

export function patchComment(
  pages: CommentPages | undefined,
  targetId: string,
  patch: Partial<Comment>,
): CommentPages | undefined {
  if (!pages) return pages;

  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        item.id === targetId ? { ...item, ...patch } : item,
      ),
    })),
  };
}

export function removeComment(
  pages: CommentPages | undefined,
  targetId: string,
): CommentPages | undefined {
  if (!pages) return pages;

  let removed = 0;
  const nextPages = pages.pages.map((page) => {
    const items = page.items.filter((item) => {
      if (item.id !== targetId) return true;
      removed += 1;
      return false;
    });
    return items.length === page.items.length ? page : { ...page, items };
  });

  if (removed === 0) return pages;

  const [firstPage, ...rest] = nextPages;
  return {
    ...pages,
    pages: [
      {
        ...firstPage,
        totalCount:
          firstPage.totalCount === null
            ? null
            : Math.max(0, firstPage.totalCount - removed),
      },
      ...rest,
    ],
  };
}

/** Keeps a parent comment's reply counter in step with its thread. */
export function adjustReplyCount(
  pages: CommentPages | undefined,
  commentId: string,
  delta: number,
): CommentPages | undefined {
  if (!pages) return pages;

  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        item.id === commentId
          ? { ...item, repliesCount: Math.max(0, item.repliesCount + delta) }
          : item,
      ),
    })),
  };
}

/** Merges the server's version over the optimistic placeholder. */
export function mergeWithServerComment(optimistic: Comment, server: Comment): Comment {
  return { ...optimistic, ...server, isOptimistic: false };
}

/** Flattens every loaded page into one list. */
export function flattenComments(pages: CommentPages | undefined): Comment[] {
  return (pages?.pages ?? []).flatMap((page) => page.items);
}

/** Total from the API when present, otherwise the number loaded so far. */
export function readTotalCount(pages: CommentPages | undefined, loaded: number): number {
  const total = pages?.pages?.[0]?.totalCount;
  return typeof total === "number" ? total : loaded;
}
