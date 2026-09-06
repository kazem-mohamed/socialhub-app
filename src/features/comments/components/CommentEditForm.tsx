import { useState } from "react";
import { MAX_COMMENT_LENGTH } from "@/shared/config/constants";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Textarea";

interface CommentEditFormProps {
  initialContent: string;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (content: string) => void;
}

export function CommentEditForm({
  initialContent,
  isSaving,
  onCancel,
  onSubmit,
}: CommentEditFormProps) {
  const [content, setContent] = useState(initialContent);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(content);
      }}
      className="mt-3"
    >
      <Textarea
        label="Edit comment"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={2}
        autoFocus
        maxLength={MAX_COMMENT_LENGTH}
        showCount
        disabled={isSaving}
      />

      <div className="mt-2.5 flex justify-end gap-2">
        <Button variant="subtle" size="sm" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" isBusy={isSaving} busyLabel="Saving">
          Save
        </Button>
      </div>
    </form>
  );
}
