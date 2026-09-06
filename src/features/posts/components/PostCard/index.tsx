import { useState } from "react";
import { getErrorMessage } from "@/shared/api/errors";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { useToast } from "@/shared/ui/toast";
import { CommentsSection } from "@/features/comments/components/CommentsSection";
import {
  useDeletePost,
  useSharePost,
  useTogglePostBookmark,
  useTogglePostLike,
  useUpdatePost,
} from "../../hooks/usePostMutations";
import { useCanManagePost } from "../../hooks/usePostPermissions";
import type { Post } from "../../model/post.types";
import { PostCardActions } from "./PostCardActions";
import { PostCardEditForm } from "./PostCardEditForm";
import { PostCardHeader } from "./PostCardHeader";
import { PostCardStats } from "./PostCardStats";
import { SharedPostPreview } from "./SharedPostPreview";
import { SharePostModal } from "./SharePostModal";
import { TopCommentPreview } from "./TopCommentPreview";

interface PostCardProps {
  post: Post;
  showTopComment?: boolean;
  initialCommentsOpen?: boolean;
  /** Overrides the default comments panel; used by the post details view. */
  children?: React.ReactNode;
  onViewAllComments?: () => void;
}

/**
 * One record in the ruled index.
 *
 * Not a card: no box, no shadow, no fill — records are separated by a single
 * hairline and by air. Everything below the masthead indents past the
 * avatar's gutter, so the page's left edge becomes a column of aura colours.
 *
 * Counters are read straight from the post in the query cache and updated
 * optimistically by the mutation hooks, so this component holds nothing but
 * UI state: which panel is open, and which error to surface.
 */
export function PostCard({
  post,
  showTopComment = true,
  initialCommentsOpen = false,
  children,
  onViewAllComments,
}: PostCardProps) {
  const toast = useToast();
  const [isCommentsOpen, setIsCommentsOpen] = useState(initialCommentsOpen);
  const [isEditing, setIsEditing] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [likeError, setLikeError] = useState("");
  const [bookmarkError, setBookmarkError] = useState("");
  const [shareError, setShareError] = useState("");
  const [editError, setEditError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const canManage = useCanManagePost(post);

  const likeMutation = useTogglePostLike(post);
  const bookmarkMutation = useTogglePostBookmark(post);
  const shareMutation = useSharePost(post);
  const updateMutation = useUpdatePost();
  const deleteMutation = useDeletePost();

  function handleToggleLike() {
    if (likeMutation.isPending) return;
    setLikeError("");
    likeMutation.mutate(undefined, {
      onError: (error) => setLikeError(getErrorMessage(error, "Could not update the like.")),
    });
  }

  function handleToggleBookmark() {
    if (bookmarkMutation.isPending) return;
    setBookmarkError("");
    bookmarkMutation.mutate(undefined, {
      onSuccess: () =>
        toast.push({
          tone: post.isBookmarked ? "note" : "saved",
          title: post.isBookmarked ? "Removed" : "Saved",
          body: post.isBookmarked
            ? "It is no longer in your saved works."
            : "Kept in Saved, visible only to you.",
        }),
      onError: (error) =>
        setBookmarkError(getErrorMessage(error, "Could not update the bookmark.")),
    });
  }

  function handleConfirmShare(caption: string) {
    if (shareMutation.isPending) return;
    setShareError("");
    shareMutation.mutate(caption, {
      onSuccess: () => {
        setIsShareModalOpen(false);
        toast.push({ title: "Shared", body: "It is hanging on your own wall now." });
      },
      onError: (error) => setShareError(getErrorMessage(error, "Could not share the post.")),
    });
  }

  function handleSubmitEdit(body: string) {
    if (!canManage) {
      setEditError("You can only edit your own posts.");
      return;
    }
    if (!body.trim()) {
      setEditError("A post needs text or an image.");
      return;
    }

    setEditError("");
    updateMutation.mutate(
      { postId: post.id, body, imageFile: null },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.push({ title: "Updated", body: "The record now reads as you left it." });
        },
        onError: (error) => setEditError(getErrorMessage(error, "Could not update the post.")),
      },
    );
  }

  function handleConfirmDelete() {
    if (!canManage) {
      setDeleteError("You can only delete your own posts.");
      return;
    }
    if (deleteMutation.isPending) return;

    setDeleteError("");
    deleteMutation.mutate(post.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        toast.push({ title: "Withdrawn", body: "It is off every wall in the collection." });
      },
      onError: (error) => setDeleteError(getErrorMessage(error, "Could not delete the post.")),
    });
  }

  function handleViewAllComments() {
    if (onViewAllComments) {
      onViewAllComments();
      return;
    }
    setIsCommentsOpen(true);
  }

  // A re-share of a post that carries the same image should not render it twice.
  const mainImage = post.image && post.image !== post.sharedPost?.image ? post.image : null;

  return (
    <article>
      <PostCardHeader
        post={post}
        canManage={canManage}
        isBookmarkBusy={bookmarkMutation.isPending}
        onToggleBookmark={handleToggleBookmark}
        onEdit={() => {
          setEditError("");
          setIsEditing(true);
        }}
        onDelete={() => {
          setDeleteError("");
          setIsDeleteDialogOpen(true);
        }}
      />

      <div>
        {isEditing ? (
          <PostCardEditForm
            initialBody={post.body}
            isSaving={updateMutation.isPending}
            error={editError}
            onCancel={() => {
              setIsEditing(false);
              setEditError("");
            }}
            onSubmit={handleSubmitEdit}
            onDismissError={() => setEditError("")}
          />
        ) : post.body ? (
          <p className="px-5 pb-4 text-read leading-relaxed whitespace-pre-wrap text-ink">
            {post.body}
          </p>
        ) : null}

        {!isEditing && mainImage ? (
          <div className="max-h-[620px] overflow-hidden border-y border-rail bg-recess">
            <img
              alt=""
              className="block w-full object-cover"
              src={mainImage}
              loading="lazy"
              style={{ viewTransitionName: `work-${post.id}` }}
            />
          </div>
        ) : null}

        {!isEditing && post.sharedPost ? <SharedPostPreview sharedPost={post.sharedPost} /> : null}

        <PostCardStats
          post={post}
          isLikeBusy={likeMutation.isPending}
          errors={[likeError, bookmarkError, shareError]}
          onToggleLike={handleToggleLike}
          onViewComments={handleViewAllComments}
        />

        <PostCardActions
          isLiked={post.isLiked}
          isLikePending={likeMutation.isPending}
          isLikeBusy={likeMutation.isPending}
          isShareBusy={shareMutation.isPending}
          onToggleLike={handleToggleLike}
          onToggleComments={() => setIsCommentsOpen((open) => !open)}
          onShare={() => {
            setShareError("");
            setIsShareModalOpen(true);
          }}
        />

        {showTopComment && post.topComment && !isCommentsOpen ? (
          <TopCommentPreview comment={post.topComment} onViewAll={handleViewAllComments} />
        ) : null}

        {isCommentsOpen ? (children ?? <CommentsSection postId={post.id} />) : null}
      </div>

      {isShareModalOpen ? (
        <SharePostModal
          previewPost={post.sharedPost ?? post}
          isBusy={shareMutation.isPending}
          error={shareError}
          canShare={Boolean(post.id)}
          onDismissError={() => setShareError("")}
          onConfirm={handleConfirmShare}
          onClose={() => {
            if (shareMutation.isPending) return;
            setIsShareModalOpen(false);
          }}
        />
      ) : null}

      {isDeleteDialogOpen ? (
        <ConfirmDialog
          title="Confirm"
          heading="Delete this post?"
          description="It will be removed from your profile and from every feed. This cannot be undone."
          confirmLabel="Delete post"
          busyLabel="Deleting"
          isBusy={deleteMutation.isPending}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onClose={() => {
            if (deleteMutation.isPending) return;
            setIsDeleteDialogOpen(false);
            setDeleteError("");
          }}
        />
      ) : null}
    </article>
  );
}
