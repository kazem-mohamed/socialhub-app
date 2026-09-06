import { useState } from "react";
import { Link } from "react-router";
import { getErrorMessage } from "@/shared/api/errors";
import { formatPostDate } from "@/shared/lib/dates";
import { Plate } from "@/shared/ui/Plate";
import { TombstoneLabel } from "@/shared/ui/TombstoneLabel";
import { routes } from "@/app/router/routes";
import { useTogglePostBookmark, useTogglePostLike } from "../hooks/usePostMutations";
import type { Post } from "../model/post.types";

interface WorkPlateProps {
  post: Post;
  /** Wall position, used only to vary the typographic treatment. */
  index?: number;
}

const ACTION_CLASS =
  "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-[2px] px-3 font-mono text-micro tabular-nums transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-0 sm:px-2 sm:py-1.5";

/**
 * A work, hung.
 *
 * The label sits at the head of the plate rather than beneath it: on a wall
 * you read the card after the painting, but in a feed you need to know
 * whose voice you are reading before you start reading it.
 *
 * A post with no image is not a lesser plate — its text is set larger and
 * becomes the work, which is what lets this design survive an API whose
 * images are unpredictable or missing.
 */
export function WorkPlate({ post, index = 0 }: WorkPlateProps) {
  const [actionError, setActionError] = useState("");

  const likeMutation = useTogglePostLike(post);
  const bookmarkMutation = useTogglePostBookmark(post);

  const image = post.image && post.image !== post.sharedPost?.image ? post.image : null;
  const href = routes.postDetails(post.id);
  const profileHref = post.author.id ? routes.userProfile(post.author.id) : routes.profile;

  // With no image the writing is the work, so it is set to be read as one.
  const isTextWork = !image && Boolean(post.body);
  const emphasis = isTextWork && post.body.length < 180 && index % 3 === 0;

  function handleLike() {
    if (likeMutation.isPending) return;
    setActionError("");
    likeMutation.mutate(undefined, {
      onError: (error) => setActionError(getErrorMessage(error, "Could not update that like.")),
    });
  }

  function handleBookmark() {
    if (bookmarkMutation.isPending) return;
    setActionError("");
    bookmarkMutation.mutate(undefined, {
      onError: (error) => setActionError(getErrorMessage(error, "Could not save that.")),
    });
  }

  return (
    <Plate as="article" isInteractive isBleedOnMobile className="group/work overflow-hidden">
      <TombstoneLabel
        name={post.author.name}
        handle={post.author.handle}
        photo={post.author.photo}
        date={post.createdAt}
        dateLabel={formatPostDate(post.createdAt)}
        profileHref={profileHref}
        className="px-4 pt-4 pb-3"
      />

      <Link
        to={href}
        viewTransition
        className="block focus-visible:outline-none"
        aria-label={`Open the post by ${post.author.name}`}
      >
        {post.body ? (
          <p
            className={[
              "px-4 whitespace-pre-wrap text-ink",
              image ? "pb-4" : "pb-5",
              emphasis
                ? "text-lg leading-snug font-medium tracking-[-0.015em]"
                : "text-read leading-relaxed",
              image ? "line-clamp-4" : "line-clamp-[14]",
            ].join(" ")}
          >
            {post.body}
          </p>
        ) : null}

        {image ? (
          <div className="overflow-hidden border-y border-rail bg-recess">
            <img
              src={image}
              alt=""
              loading="lazy"
              style={{ viewTransitionName: `work-${post.id}` }}
              className="block w-full object-cover transition-transform duration-[420ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover/work:scale-[1.025]"
            />
          </div>
        ) : null}
      </Link>

      <div
        className={`flex items-center gap-1 px-3 py-2 ${image ? "" : "border-t border-rail"}`}
      >
        <button
          type="button"
          onClick={handleLike}
          disabled={likeMutation.isPending}
          aria-pressed={post.isLiked}
          aria-label={post.isLiked ? "Remove like" : "Like"}
          className={`${ACTION_CLASS} ${
            post.isLiked ? "text-verm-ink" : "text-ink-3 hover:text-ink"
          }`}
        >
          <HeartGlyph filled={post.isLiked} />
          {post.likesCount > 0 ? post.likesCount : ""}
        </button>

        <Link
          to={`${href}?showComments=1`}
          viewTransition
          aria-label="Comments"
          className={`${ACTION_CLASS} text-ink-3 hover:text-ink`}
        >
          <CommentGlyph />
          {post.commentsCount > 0 ? post.commentsCount : ""}
        </Link>

        <button
          type="button"
          onClick={handleBookmark}
          disabled={bookmarkMutation.isPending}
          aria-pressed={post.isBookmarked}
          aria-label={post.isBookmarked ? "Remove from saved" : "Save"}
          className={`${ACTION_CLASS} ml-auto ${
            post.isBookmarked ? "text-gold-ink" : "text-ink-3 hover:text-ink"
          }`}
        >
          <BookmarkGlyph filled={post.isBookmarked} />
        </button>
      </div>

      {actionError ? (
        <p
          role="alert"
          className="border-t border-rail px-4 py-2 font-mono text-micro text-verm-ink"
        >
          {actionError}
        </p>
      ) : null}
    </Plate>
  );
}

/* Icons are drawn here at one weight so the plate never mixes stroke
   widths with the rest of the system. */
function HeartGlyph({ filled }: { filled: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="transition-transform duration-150 ease-out active:scale-90"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function CommentGlyph() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.2A8.38 8.38 0 0 1 4 11.5 8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" />
    </svg>
  );
}

function BookmarkGlyph({ filled }: { filled: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
