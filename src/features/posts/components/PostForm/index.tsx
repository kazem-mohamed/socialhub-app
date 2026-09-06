import { useState } from "react";
import { getErrorMessage } from "@/shared/api/errors";
import { useImagePreview } from "@/shared/hooks/useImagePreview";
import { MAX_POST_BODY_LENGTH } from "@/shared/config/constants";
import { accessionNumber, auraRingColor } from "@/shared/lib/aura";
import { Button } from "@/shared/ui/Button";
import { Plate } from "@/shared/ui/Plate";
import { CloseIcon, ImageIcon } from "@/shared/ui/icons";
import { useToast } from "@/shared/ui/toast";
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser";
import { useCreatePost } from "../../hooks/usePostMutations";
import { postDraftSchema } from "../../model/post.schemas";

/**
 * The blank plate.
 *
 * An empty mount at the head of the wall, already bearing your colour chip
 * and your catalogue number — so what you are about to write visibly
 * belongs to the same collection before you have written it.
 */
export function PostForm() {
  const { data: currentUser } = useCurrentUser();
  const createPost = useCreatePost();
  const image = useImagePreview();

  const toast = useToast();
  const [body, setBody] = useState("");
  const [submitError, setSubmitError] = useState("");

  const displayName = currentUser?.name ?? "You";
  const handle = currentUser?.handle ?? displayName;
  const canPost = body.trim().length > 0 || image.file !== null;
  const remaining = MAX_POST_BODY_LENGTH - body.length;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validation = postDraftSchema.safeParse({ body, imageFile: image.file });
    if (!validation.success) {
      setSubmitError(validation.error.issues[0]?.message ?? "This post cannot be sent.");
      return;
    }

    setSubmitError("");

    createPost.mutate(
      { body: validation.data.body ?? "", imageFile: validation.data.imageFile },
      {
        onSuccess: () => {
          setBody("");
          image.clear();
          toast.push({ title: "Hung", body: "It is at the head of the wall." });
        },
        onError: (error) => setSubmitError(getErrorMessage(error, "Could not post that.")),
      },
    );
  }

  return (
    <Plate as="section" isBleedOnMobile className="overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="p-4">
          <label htmlFor="composer" className="sr-only">
            Write a post
          </label>
          <textarea
            id="composer"
            rows={3}
            value={body}
            maxLength={MAX_POST_BODY_LENGTH}
            onChange={(event) => {
              setBody(event.target.value);
              if (submitError) setSubmitError("");
            }}
            placeholder="Say something worth hanging."
            className="w-full resize-none bg-transparent text-read leading-relaxed text-ink outline-none placeholder:text-ink-3"
          />

          {image.previewUrl ? (
            <div className="relative mt-3 overflow-hidden rounded-[2px] border border-rail">
              <img
                alt="Selected attachment"
                className="block max-h-72 w-full object-cover"
                src={image.previewUrl}
              />
              <button
                type="button"
                onClick={image.clear}
                aria-label="Remove selected image"
                className="absolute top-2 right-2 cursor-pointer rounded-[2px] bg-ground/80 p-1.5 text-ink backdrop-blur-sm transition-colors duration-150 hover:bg-ground"
              >
                <CloseIcon size={14} />
              </button>
            </div>
          ) : null}

          {submitError ? (
            <p role="alert" className="mt-3 font-mono text-micro text-verm-ink">
              {submitError}
            </p>
          ) : null}
        </div>

        {/* The label this plate will carry once it is hung. */}
        <div className="flex items-center gap-3 border-t border-rail px-4 py-2.5">
          <span
            aria-hidden="true"
            className="h-5 w-1.5 shrink-0 rounded-[1px]"
            style={{ background: auraRingColor(handle) }}
          />
          <span className="truncate font-mono text-micro text-ink-3 tabular-nums">
            {accessionNumber(handle)}
          </span>

          <label className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-[2px] px-2 py-1.5 font-mono text-micro font-medium tracking-[0.12em] text-ink-3 uppercase transition-colors duration-150 hover:bg-recess hover:text-ink">
            <ImageIcon size={14} />
            <span>Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                // Reset so re-picking the same file still fires.
                event.target.value = "";
                if (!file) return;
                image.select(file);
                setSubmitError("");
              }}
              className="sr-only"
            />
          </label>

          {body.length > 0 ? (
            <span
              className={`font-mono text-micro tabular-nums ${
                remaining < 100 ? "text-verm-ink" : "text-ink-3"
              }`}
            >
              {remaining}
            </span>
          ) : null}

          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={!canPost}
            isBusy={createPost.isPending}
            busyLabel="Hanging"
          >
            Post
          </Button>
        </div>
      </form>
    </Plate>
  );
}
