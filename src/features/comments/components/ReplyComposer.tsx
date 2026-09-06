import { useForm } from "react-hook-form";
import { MAX_COMMENT_LENGTH } from "@/shared/config/constants";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Textarea";

interface ReplyComposerProps {
  isSubmitting: boolean;
  submitError: string;
  onSubmit: (content: string) => Promise<void>;
}

interface ReplyValues {
  content: string;
}

export function ReplyComposer({ isSubmitting, submitError, onSubmit }: ReplyComposerProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ReplyValues>({
    mode: "onChange",
    defaultValues: { content: "" },
  });

  async function submit({ content }: ReplyValues) {
    const trimmed = content.trim();
    if (!trimmed) return;

    await onSubmit(trimmed);
    reset({ content: "" });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="mt-3">
      <Textarea
        label="Write a reply"
        {...register("content", {
          required: "Write something first.",
          maxLength: {
            value: MAX_COMMENT_LENGTH,
            message: `Keep it under ${MAX_COMMENT_LENGTH} characters.`,
          },
          validate: (value) => value.trim().length > 0 || "Write something first.",
        })}
        rows={2}
        autoFocus
        placeholder="Reply"
        error={errors.content?.message || submitError}
      />

      <div className="mt-2.5 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          type="submit"
          disabled={!isValid}
          isBusy={isSubmitting}
          busyLabel="Sending"
        >
          Reply
        </Button>
      </div>
    </form>
  );
}
