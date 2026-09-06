import { useEffect } from "react";
import { CloseIcon } from "./icons";

interface ModalProps {
  title: string;
  onClose: () => void;
  /** Blocks the close affordances while a mutation is in flight. */
  isBusy?: boolean;
  /** Overlay stacking order; matches the values the originals used. */
  zIndexClassName?: string;
  widthClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Rendered below the footer, where the delete dialog shows its error. */
  afterFooter?: React.ReactNode;
}

/**
 * Overlay + titled panel.
 *
 * The panel is a plate: a flat surface behind one hairline, lifted off the
 * page by a real shadow (offset and blur, never a coloured halo) rather
 * than by a rounded card outline. Escape closes it unless a mutation is
 * mid-flight.
 */
export function Modal({
  title,
  onClose,
  isBusy = false,
  zIndexClassName = "z-[70]",
  widthClassName = "max-w-[560px]",
  children,
  footer,
  afterFooter,
}: ModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isBusy, onClose]);

  return (
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center bg-black/75 p-4 backdrop-blur-[2px]`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${widthClassName} overflow-hidden rounded-[3px] border border-rail bg-plate shadow-[0_16px_48px_rgba(0,0,0,.55)]`}
      >
        <div className="flex items-center justify-between border-b border-rail px-4 py-3">
          <h4 className="font-mono text-micro font-medium tracking-[0.2em] text-ink-3 uppercase">
            {title}
          </h4>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[2px] text-ink-3 transition-colors duration-200 hover:bg-recess hover:text-ink disabled:opacity-45"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {children}

        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-rail px-4 py-3">
            {footer}
          </div>
        ) : null}

        {afterFooter}
      </div>
    </div>
  );
}
