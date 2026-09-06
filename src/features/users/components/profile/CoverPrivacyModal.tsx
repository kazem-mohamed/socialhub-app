import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";

interface CoverPrivacyModalProps {
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

/**
 * Confirmation step before a new cover photo is uploaded.
 *
 * This dialog used to exist mainly to host a privacy dropdown that the
 * upload endpoint ignores. Without it, the step is simply the confirmation
 * it always really was — uploading a cover also posts it, and that is worth
 * saying out loud.
 */
export function CoverPrivacyModal({ isSaving, onCancel, onSave }: CoverPrivacyModalProps) {
  return (
    <Modal
      title="Confirm"
      onClose={onCancel}
      isBusy={isSaving}
      zIndexClassName="z-[90]"
      widthClassName="max-w-[460px]"
      footer={
        <>
          <Button variant="subtle" size="sm" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSave}
            isBusy={isSaving}
            busyLabel="Saving"
          >
            Save cover
          </Button>
        </>
      }
    >
      <div className="p-5">
        <h5 className="text-lg font-bold tracking-[-0.02em] text-ink">Use this cover?</h5>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          It replaces your current cover, and a post about the change appears on your
          profile.
        </p>
      </div>
    </Modal>
  );
}
