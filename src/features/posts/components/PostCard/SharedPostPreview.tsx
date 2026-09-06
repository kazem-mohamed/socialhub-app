import { Link } from "react-router";
import { formatDateTime, formatRelativeShort } from "@/shared/lib/dates";
import { Avatar } from "@/shared/ui/Avatar";
import { routes } from "@/app/router/routes";
import type { Post } from "../../model/post.types";

interface SharedPostPreviewProps {
  sharedPost: Post;
}

/**
 * The original post embedded inside a re-share.
 *
 * A nested card would be a card inside a card. Instead the quoted record is
 * marked the way a printed page marks a quotation: indented behind a single
 * rule on its left edge, at a smaller scale than the text quoting it.
 */
export function SharedPostPreview({ sharedPost }: SharedPostPreviewProps) {
  const profileLink = sharedPost.author.id ? `/profile/${sharedPost.author.id}` : "/profile";

  return (
    <div className="mx-5 mb-1 border-l-2 border-l-rail pl-4">
      <div className="flex items-center justify-between gap-3">
        <Link className="flex min-w-0 items-center gap-2.5" to={profileLink}>
          <Avatar
            alt={sharedPost.author.name}
            seed={sharedPost.author.handle}
            size={28}
            src={sharedPost.author.photo}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{sharedPost.author.name}</p>
            <p className="truncate font-mono text-micro tracking-[0.06em] text-ink-3">
              {sharedPost.author.handle}
            </p>
          </div>
        </Link>

        <time
          dateTime={sharedPost.createdAt ?? undefined}
          title={formatDateTime(sharedPost.createdAt)}
          className="shrink-0 font-mono text-micro tracking-[0.1em] text-ink-3 tabular-nums"
        >
          {formatRelativeShort(sharedPost.createdAt)}
        </time>
      </div>

      {sharedPost.body ? (
        <p className="mt-3 text-base leading-relaxed whitespace-pre-wrap text-ink-2">
          {sharedPost.body}
        </p>
      ) : null}

      {sharedPost.image ? (
        <div className="mt-3 max-h-[420px] overflow-hidden rounded-[2px] border border-rail">
          <img alt="" className="w-full object-cover" src={sharedPost.image} loading="lazy" />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-micro tracking-[0.1em] text-ink-3 uppercase tabular-nums">
        <span>{sharedPost.likesCount} likes</span>
        <span>{sharedPost.commentsCount} comments</span>
        <Link
          className="ml-auto transition-colors duration-200 hover:text-verm-ink"
          to={routes.postDetails(sharedPost.id)}
        >
          Open original
        </Link>
      </div>
    </div>
  );
}
