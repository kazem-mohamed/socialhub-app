import { MessageCircleIcon, Share2Icon, ThumbsUpIcon } from "@/shared/ui/icons";

interface PostCardActionsProps {
  isLiked: boolean;
  isLikePending: boolean;
  isLikeBusy: boolean;
  isShareBusy: boolean;
  onToggleLike: () => void;
  onToggleComments: () => void;
  onShare: () => void;
}

const BUTTON_CLASS =
  "group/act flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[2px] py-2.5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45";

/** Like / Comment / Share, on the record only. */
export function PostCardActions({
  isLiked,
  isLikePending,
  isLikeBusy,
  isShareBusy,
  onToggleLike,
  onToggleComments,
  onShare,
}: PostCardActionsProps) {
  return (
    <div className="mt-4 flex items-center gap-1 border-t border-rail px-3 py-1.5">
      <button
        type="button"
        onClick={onToggleLike}
        disabled={isLikeBusy}
        aria-pressed={isLiked}
        className={`${BUTTON_CLASS} ${
          isLiked ? "text-verm-ink" : "text-ink-2 hover:bg-recess hover:text-ink"
        }`}
      >
        <ThumbsUpIcon
          size={16}
          className="transition-transform duration-150 ease-out group-active/act:scale-90"
        />
        <span>{isLikePending ? "Liking" : isLiked ? "Liked" : "Like"}</span>
      </button>

      <button
        type="button"
        onClick={onToggleComments}
        className={`${BUTTON_CLASS} text-ink-2 hover:bg-recess hover:text-ink`}
      >
        <MessageCircleIcon size={16} />
        <span>Comment</span>
      </button>

      <button
        type="button"
        onClick={onShare}
        disabled={isShareBusy}
        className={`${BUTTON_CLASS} text-ink-2 hover:bg-recess hover:text-ink`}
      >
        <Share2Icon size={16} />
        <span>{isShareBusy ? "Sharing" : "Share"}</span>
      </button>
    </div>
  );
}
