import { useState } from "react";
import { MAX_POST_BODY_LENGTH } from "@/shared/config/constants";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Textarea";

interface PostCardEditFormProps {
  initialBody: string;
  isSaving: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (body: string) => void;
  onDismissError: () => void;
}

/** Inline body editor shown in place of the post text. */
export function PostCardEditForm({
  initialBody,
  isSaving,
  error,
  onCancel,
  onSubmit,
  onDismissError,
}: PostCardEditFormProps) {
  const [body, setBody] = useState(initialBody);

  return (
    <form
      className="px-5 pb-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(body);
      }}
    >
      <Textarea
        label="Edit post"
        rows={4}
        autoFocus
        maxLength={MAX_POST_BODY_LENGTH}
        showCount
        value={body}
        error={error}
        onChange={(event) => {
          setBody(event.target.value);
          if (error) onDismissError();
        }}
      />

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="subtle" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          isBusy={isSaving}
          busyLabel="Saving"
        >
          Save
        </Button>
      </div>
    </form>
  );
}
