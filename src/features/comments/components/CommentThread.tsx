import { useMemo, useRef, useState } from "react";
import { getErrorMessage } from "@/shared/api/errors";
import { queryKeys } from "@/shared/api/queryKeys";
import { useOutsideClick } from "@/shared/hooks/useOutsideClick";
import { isSameEntity } from "@/shared/lib/values";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { EllipsisIcon, PencilIcon, TrashIcon } from "@/shared/ui/icons";
import {
  useCreateComment,
  useDeleteComment,
  useToggleCommentLike,
  useUpdateComment,
} from "../hooks/useCommentMutations";
import { useReplies } from "../hooks/useCommentQueries";
import { flattenComments, readTotalCount } from "../model/comment.cache";
import type { Comment } from "../model/comment.types";
import { CommentEditForm } from "./CommentEditForm";
import { ReplyComposer } from "./ReplyComposer";
import { ReplyList } from "./ReplyList";

interface CommentThreadProps {
  postId: string;
  comment: Comment;
  currentUserId: string | null;
  currentUserName: string;
}

const ACTION_CLASS =
  "cursor-pointer font-mono text-micro font-medium uppercase tracking-[0.14em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45";

/**
 * One comment's action row, owner menu, edit form and reply thread.
 *
 * The replies query only runs once the thread is expanded, so a page of ten
 * comments does not fire ten reply requests on mount.
 */
export function CommentThread({
  postId,
  comment,
  currentUserId,
  currentUserName,
}: CommentThreadProps) {
  const [isReplyFormOpen, setIsReplyFormOpen] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [replyError, setReplyError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(menuRef, () => setIsMenuOpen(false), isMenuOpen);

  const isOwnComment = isSameEntity(comment.authorId, currentUserId);

  const likeMutation = useToggleCommentLike(postId, comment, queryKeys.comments.list(postId));
  const updateMutation = useUpdateComment(postId, comment.id);
  const deleteMutation = useDeleteComment(postId, comment.id);
  const createReply = useCreateComment(postId, "reply", comment.id, currentUserName);

  const repliesQuery = useReplies(postId, comment.id, isRepliesOpen);
  const replies = useMemo(() => flattenComments(repliesQuery.data), [repliesQuery.data]);
  const repliesCount = readTotalCount(repliesQuery.data, comment.repliesCount || replies.length);

  const isBusy = updateMutation.isPending || deleteMutation.isPending;

  function handleSubmitEdit(content: string) {
    const trimmed = content.trim();
    if (!trimmed) {
      setActionError("Write something first.");
      return;
    }

    setActionError("");
    updateMutation.mutate(trimmed, {
      onSuccess: () => {
        setIsEditing(false);
        setIsMenuOpen(false);
      },
      onError: (error) => setActionError(getErrorMessage(error, "Could not save that change.")),
    });
  }

  function handleConfirmDelete() {
    setActionError("");
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setIsMenuOpen(false);
      },
      onError: (error) => setActionError(getErrorMessage(error, "Could not delete that comment.")),
    });
  }

  async function handleSubmitReply(content: string) {
    setReplyError("");
    setIsRepliesOpen(true);

    try {
      await createReply.mutateAsync(content);
      setIsReplyFormOpen(false);
    } catch (error) {
      setReplyError(getErrorMessage(error, "Could not post that reply."));
    }
  }

  return (
    <div>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending || comment.isOptimistic}
            aria-pressed={comment.isLiked}
            className={`${ACTION_CLASS} tabular-nums ${
              comment.isLiked ? "text-verm-ink" : "text-ink-3 hover:text-ink"
            }`}
          >
            {likeMutation.isPending ? "Liking" : `Like ${comment.likesCount || ""}`}
          </button>

          <button
            type="button"
            onClick={() => setIsReplyFormOpen((open) => !open)}
            className={`${ACTION_CLASS} text-ink-3 hover:text-ink`}
          >
            {isReplyFormOpen ? "Cancel" : "Reply"}
          </button>

          {repliesCount > 0 || isRepliesOpen ? (
            <button
              type="button"
              onClick={() => setIsRepliesOpen((open) => !open)}
              className={`${ACTION_CLASS} tabular-nums text-ink-3 hover:text-ink`}
            >
              {isRepliesOpen ? "Hide replies" : `${repliesCount} replies`}
            </button>
          ) : null}
        </div>

        {isOwnComment ? (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              disabled={isBusy}
              aria-expanded={isMenuOpen}
              aria-label="Comment actions"
              className="cursor-pointer p-1 text-ink-3 transition-colors duration-200 hover:text-ink disabled:opacity-45"
            >
              <EllipsisIcon size={15} />
            </button>

            {isMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-[3px] border border-rail bg-plate shadow-[0_16px_48px_rgba(0,0,0,.55)]"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionError("");
                    setIsEditing(true);
                    setIsMenuOpen(false);
                  }}
                  disabled={isBusy}
                  className={`${ACTION_CLASS} flex w-full items-center gap-2 px-3 py-2.5 text-left text-ink-2 hover:bg-recess hover:text-ink`}
                >
                  <PencilIcon size={13} />
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionError("");
                    setIsDeleteDialogOpen(true);
                    setIsMenuOpen(false);
                  }}
                  disabled={isBusy}
                  className={`${ACTION_CLASS} flex w-full items-center gap-2 border-t border-rail px-3 py-2.5 text-left text-verm-ink hover:bg-verm hover:text-on-verm`}
                >
                  <TrashIcon size={13} />
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {actionError ? (
        <p role="alert" className="mt-2 font-mono text-micro tracking-[0.1em] text-verm-ink">
          {actionError}
        </p>
      ) : null}

      {isDeleteDialogOpen ? (
        <ConfirmDialog
          title="Confirm"
          heading="Delete this comment?"
          description="It will be removed for everyone. This cannot be undone."
          confirmLabel="Delete comment"
          busyLabel="Deleting"
          isBusy={deleteMutation.isPending}
          onConfirm={handleConfirmDelete}
          onClose={() => {
            if (deleteMutation.isPending) return;
            setIsDeleteDialogOpen(false);
          }}
        />
      ) : null}

      {isEditing ? (
        <CommentEditForm
          initialContent={comment.content}
          isSaving={updateMutation.isPending}
          onCancel={() => {
            setIsEditing(false);
            setActionError("");
          }}
          onSubmit={handleSubmitEdit}
        />
      ) : null}

      {isReplyFormOpen ? (
        <ReplyComposer
          isSubmitting={createReply.isPending}
          submitError={replyError}
          onSubmit={handleSubmitReply}
        />
      ) : null}

      {isRepliesOpen ? (
        <ReplyList
          postId={postId}
          parentCommentId={comment.id}
          replies={replies}
          isLoading={repliesQuery.isLoading}
          error={repliesQuery.error}
          hasNextPage={repliesQuery.hasNextPage}
          isFetchingNextPage={repliesQuery.isFetchingNextPage}
          onLoadMore={() => void repliesQuery.fetchNextPage()}
        />
      ) : null}
    </div>
  );
}
