import { BookmarkIcon, PencilIcon, TrashIcon } from "@/shared/ui/icons";

interface PostCardMenuProps {
  isBookmarked: boolean;
  isBookmarkBusy: boolean;
  canManage: boolean;
  onToggleBookmark: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45";

/** Dropdown behind the record's ellipsis. */
export function PostCardMenu({
  isBookmarked,
  isBookmarkBusy,
  canManage,
  onToggleBookmark,
  onEdit,
  onDelete,
}: PostCardMenuProps) {
  return (
    <div
      role="menu"
      className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-[3px] border border-rail bg-plate shadow-[var(--plate-shadow-lifted)]"
    >
      <button
        type="button"
        role="menuitem"
        onClick={onToggleBookmark}
        disabled={isBookmarkBusy}
        className={`${ITEM_CLASS} ${
          isBookmarked ? "text-gold-ink hover:bg-recess" : "text-ink-2 hover:bg-recess hover:text-ink"
        }`}
      >
        <BookmarkIcon size={15} />
        {isBookmarkBusy ? "Saving" : isBookmarked ? "Remove from saved" : "Save"}
      </button>

      {canManage ? (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={onEdit}
            className={`${ITEM_CLASS} border-t border-rail text-ink-2 hover:bg-recess hover:text-ink`}
          >
            <PencilIcon size={15} />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onDelete}
            className={`${ITEM_CLASS} border-t border-rail text-verm-ink hover:bg-verm hover:text-on-verm`}
          >
            <TrashIcon size={15} />
            Withdraw
          </button>
        </>
      ) : null}
    </div>
  );
}
