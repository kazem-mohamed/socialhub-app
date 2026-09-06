import { useRef, useState } from "react";
import { useOutsideClick } from "@/shared/hooks/useOutsideClick";
import { formatPostDate } from "@/shared/lib/dates";
import { TombstoneLabel } from "@/shared/ui/TombstoneLabel";
import { EllipsisIcon } from "@/shared/ui/icons";
import { routes } from "@/app/router/routes";
import type { Post } from "../../model/post.types";
import { PostCardMenu } from "./PostCardMenu";

interface PostCardHeaderProps {
  post: Post;
  canManage: boolean;
  isBookmarkBusy: boolean;
  onToggleBookmark: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * The record's own label — the same component the wall uses, at record
 * scale, so a work does not change identity when you open it.
 */
export function PostCardHeader({
  post,
  canManage,
  isBookmarkBusy,
  onToggleBookmark,
  onEdit,
  onDelete,
}: PostCardHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(menuRef, () => setIsMenuOpen(false), isMenuOpen);

  const profileHref = post.author.id ? routes.userProfile(post.author.id) : routes.profile;

  function runAndClose(action: () => void) {
    setIsMenuOpen(false);
    action();
  }

  return (
    <TombstoneLabel
      variant="record"
      name={post.author.name}
      handle={post.author.handle}
      photo={post.author.photo}
      date={post.createdAt}
      dateLabel={formatPostDate(post.createdAt)}
      profileHref={profileHref}
      className="px-5 pt-5 pb-4"
      action={
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            aria-label="Record actions"
            className="cursor-pointer rounded-[2px] p-1.5 text-ink-3 transition-colors duration-150 hover:bg-recess hover:text-ink"
          >
            <EllipsisIcon size={18} />
          </button>

          {isMenuOpen ? (
            <PostCardMenu
              isBookmarked={post.isBookmarked}
              isBookmarkBusy={isBookmarkBusy}
              canManage={canManage}
              onToggleBookmark={() => runAndClose(onToggleBookmark)}
              onEdit={() => runAndClose(onEdit)}
              onDelete={() => runAndClose(onDelete)}
            />
          ) : null}
        </div>
      }
    />
  );
}
