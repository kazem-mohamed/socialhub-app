import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  title: string;
  heading: string;
  description: string;
  confirmLabel: string;
  busyLabel: string;
  isBusy: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Destructive-action confirmation.
 *
 * No warning-triangle badge: the vermilion rule down the left edge is the
 * system's own signal that something is at stake, and the heading says
 * plainly what will happen. An icon in a tinted circle would be decoration
 * on top of a sentence that already carries the weight.
 */
export function ConfirmDialog({
  title,
  heading,
  description,
  confirmLabel,
  busyLabel,
  isBusy,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      isBusy={isBusy}
      zIndexClassName="z-[90]"
      widthClassName="max-w-[460px]"
      footer={
        <>
          <Button variant="subtle" size="sm" onClick={onClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
            isBusy={isBusy}
            busyLabel={busyLabel}
          >
            {confirmLabel}
          </Button>
        </>
      }
      afterFooter={
        error ? (
          <p
            role="alert"
            className="border-t border-rail px-4 py-3 font-mono text-micro tracking-[0.1em] text-verm-ink"
          >
            {error}
          </p>
        ) : null
      }
    >
      <div className="border-l border-verm p-5 pl-[19px]">
        <h5 className="text-lg font-bold tracking-[-0.02em] text-ink">{heading}</h5>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{description}</p>
      </div>
    </Modal>
  );
}
