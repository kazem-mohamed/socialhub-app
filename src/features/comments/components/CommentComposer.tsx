import { useForm } from "react-hook-form";
import { MAX_COMMENT_LENGTH } from "@/shared/config/constants";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";

interface CommentComposerProps {
  authorName: string;
  authorPhoto: string | null | undefined;
  authorHandle: string;
  isDisabled: boolean;
  isSubmitting: boolean;
  submitError: string;
  onSubmit: (content: string) => Promise<void>;
}

interface ComposerValues {
  content: string;
}

/**
 * The "write a comment" row.
 *
 * The old version carried an image picker wired to nothing and an emoji
 * button that did nothing; the comments endpoint takes text only. Both are
 * gone rather than restyled.
 */
export function CommentComposer({
  authorName,
  authorPhoto,
  authorHandle,
  isDisabled,
  isSubmitting,
  submitError,
  onSubmit,
}: CommentComposerProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ComposerValues>({
    mode: "onChange",
    defaultValues: { content: "" },
  });

  async function submit({ content }: ComposerValues) {
    const trimmed = content.trim();
    if (!trimmed) return;

    await onSubmit(trimmed);
    reset({ content: "" });
  }

  const message = errors.content?.message || submitError;

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex items-start gap-3 border-t border-rail pt-4"
    >
      <Avatar alt={authorName} seed={authorHandle} size={32} src={authorPhoto} />

      <div className="min-w-0 flex-1">
        <label htmlFor="comment-composer" className="sr-only">
          Write a comment
        </label>
        <textarea
          id="comment-composer"
          {...register("content", {
            required: "Write something first.",
            maxLength: {
              value: MAX_COMMENT_LENGTH,
              message: `Keep it under ${MAX_COMMENT_LENGTH} characters.`,
            },
            validate: (value) => value.trim().length > 0 || "Write something first.",
          })}
          placeholder={isDisabled ? "Sign in to comment" : "Add a comment"}
          rows={1}
          disabled={isDisabled || isSubmitting}
          className="max-h-[140px] min-h-[38px] w-full resize-none border-b border-rail bg-transparent pb-2 text-base leading-relaxed text-ink outline-none transition-colors duration-300 placeholder:text-ink-3 focus:border-verm disabled:cursor-not-allowed disabled:opacity-55"
        />

        {message ? (
          <p role="alert" className="mt-2 font-mono text-micro tracking-[0.1em] text-verm-ink">
            {message}
          </p>
        ) : null}

        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            disabled={isDisabled || !isValid}
            isBusy={isSubmitting}
            busyLabel="Sending"
          >
            Comment
          </Button>
        </div>
      </div>
    </form>
  );
}
