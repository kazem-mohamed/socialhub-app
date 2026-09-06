import { Link } from "react-router";
import { routes } from "@/app/router/routes";
import type { Post } from "../../model/post.types";

interface PostCardStatsProps {
  post: Post;
  isLikeBusy: boolean;
  errors: string[];
  onToggleLike: () => void;
  onViewComments: () => void;
}

/**
 * The record's figures.
 *
 * A catalogue states quantities plainly, in the same tabular mono every
 * other number in the system uses, so a changing count never shifts the row.
 */
export function PostCardStats({
  post,
  isLikeBusy,
  errors,
  onToggleLike,
  onViewComments,
}: PostCardStatsProps) {
  const visibleErrors = errors.filter(Boolean);

  return (
    <div className="px-5 pt-4">
      <dl className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Figure
          label={post.likesCount === 1 ? "like" : "likes"}
          value={post.likesCount}
          isActive={post.isLiked}
          isBusy={isLikeBusy}
          onClick={onToggleLike}
        />
        <Figure
          label={post.commentsCount === 1 ? "comment" : "comments"}
          value={post.commentsCount}
          onClick={onViewComments}
        />
        <Figure
          label={post.sharesCount === 1 ? "share" : "shares"}
          value={post.sharesCount}
        />

        <Link
          to={routes.postDetails(post.id)}
          viewTransition
          className="ml-auto font-mono text-micro tracking-[0.12em] text-ink-3 uppercase transition-colors duration-150 hover:text-verm-ink"
        >
          Full record
        </Link>
      </dl>

      {visibleErrors.map((message) => (
        <p key={message} role="alert" className="mt-2 font-mono text-micro text-verm-ink">
          {message}
        </p>
      ))}
    </div>
  );
}

function Figure({
  label,
  value,
  isActive = false,
  isBusy = false,
  onClick,
}: {
  label: string;
  value: number;
  isActive?: boolean;
  isBusy?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <dd className="font-mono text-base leading-none font-semibold tabular-nums">{value}</dd>
      <dt className="mt-1 font-mono text-micro tracking-[0.12em] uppercase">{label}</dt>
    </>
  );

  if (!onClick) {
    return <div className="text-ink-3">{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isBusy}
      aria-pressed={isActive ? true : undefined}
      className={`cursor-pointer text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${
        isActive ? "text-verm-ink" : "text-ink-3 hover:text-ink"
      }`}
    >
      {body}
    </button>
  );
}
