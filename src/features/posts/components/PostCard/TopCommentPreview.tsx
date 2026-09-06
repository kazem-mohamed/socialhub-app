import { Avatar } from "@/shared/ui/Avatar";
import { Label } from "@/shared/ui/Label";
import type { PostTopComment } from "../../model/post.types";

interface TopCommentPreviewProps {
  comment: PostTopComment;
  onViewAll: () => void;
}

/** A single comment surfaced under a record in the feed. */
export function TopCommentPreview({ comment, onViewAll }: TopCommentPreviewProps) {
  return (
    <div className="mt-4 border-t border-rail px-5 py-4">
      <Label as="p">Top comment</Label>

      <div className="mt-3 flex items-start gap-3">
        <Avatar
          alt={comment.authorName}
          seed={comment.authorName}
          size={28}
          src={comment.authorPhoto}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{comment.authorName}</p>
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-ink-2">
            {comment.content}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewAll}
        className="mt-3 cursor-pointer font-mono text-micro font-medium tracking-[0.16em] text-ink-3 uppercase transition-colors duration-200 hover:text-verm-ink"
      >
        All comments
      </button>
    </div>
  );
}
