import { DEFAULT_PROFILE_IMAGE } from "@/shared/config/constants";
import { CloseIcon } from "@/shared/ui/icons";

interface ImageViewerModalProps {
  src: string | null | undefined;
  alt: string;
  closeLabel: string;
  /** Falls back to the avatar placeholder when the source fails to load. */
  useAvatarFallback?: boolean;
  onClose: () => void;
}

/** Fullscreen lightbox, shared by the avatar and cover viewers. */
export function ImageViewerModal({
  src,
  alt,
  closeLabel,
  useAvatarFallback = false,
  onClose,
}: ImageViewerModalProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ground/95 p-4 sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-[2px] text-ink-2 transition-colors duration-200 hover:bg-recess hover:text-ink"
        aria-label={closeLabel}
      >
        <CloseIcon size={20} />
      </button>

      <img
        alt={alt}
        className="max-h-full max-w-full object-contain"
        src={src?.trim() || (useAvatarFallback ? DEFAULT_PROFILE_IMAGE : undefined)}
        onError={
          useAvatarFallback
            ? (event) => {
                event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
              }
            : undefined
        }
      />
    </div>
  );
}
