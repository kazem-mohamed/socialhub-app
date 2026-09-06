import { useState } from "react";
import { MAX_SHARE_CAPTION_LENGTH } from "@/shared/config/constants";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Textarea } from "@/shared/ui/Textarea";
import type { Post } from "../../model/post.types";

interface SharePostModalProps {
  /** The post rendered in the preview — the original when re-sharing a share. */
  previewPost: Post;
  isBusy: boolean;
  error: string;
  canShare: boolean;
  onDismissError: () => void;
  onConfirm: (caption: string) => void;
  onClose: () => void;
}

export function SharePostModal({
  previewPost,
  isBusy,
  error,
  canShare,
  onDismissError,
  onConfirm,
  onClose,
}: SharePostModalProps) {
  const [caption, setCaption] = useState("");

  return (
    <Modal
      title="Share post"
      onClose={onClose}
      isBusy={isBusy}
      footer={
        <>
          <Button variant="subtle" size="sm" onClick={onClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onConfirm(caption)}
            disabled={!canShare}
            isBusy={isBusy}
            busyLabel="Sharing"
          >
            Share
          </Button>
        </>
      }
    >
      <div className="space-y-5 p-4">
        <Textarea
          label="Caption"
          showLabel
          placeholder="Add something, or share it as it is."
          rows={3}
          autoFocus
          maxLength={MAX_SHARE_CAPTION_LENGTH}
          showCount
          value={caption}
          error={error}
          onChange={(event) => {
            setCaption(event.target.value);
            if (error) onDismissError();
          }}
        />

        <div className="border-l border-rail pl-4">
          <div className="flex items-center gap-2.5">
            <Avatar
              alt={previewPost.author.name}
              seed={previewPost.author.handle}
              size={28}
              src={previewPost.author.photo}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {previewPost.author.name}
              </p>
              <p className="truncate font-mono text-micro tracking-[0.06em] text-ink-3">
                {previewPost.author.handle}
              </p>
            </div>
          </div>

          {previewPost.body ? (
            <p className="mt-2.5 line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap text-ink-2">
              {previewPost.body}
            </p>
          ) : null}

          {previewPost.image ? (
            <img
              alt=""
              className="mt-2.5 max-h-[200px] w-full rounded-[2px] border border-rail object-cover"
              src={previewPost.image}
            />
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
