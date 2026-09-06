import { useRef, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import {
  clamp,
  clampOffset,
  getCropScale,
  PROFILE_CROP_SIZE,
  type Offset,
  type Size,
} from "../../lib/imageCrop";

interface ProfilePhotoEditorModalProps {
  imageUrl: string;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (zoom: number, offset: Offset) => void;
}

/**
 * Drag-and-zoom cropper for the profile photo.
 *
 * Owns only the framing state; the geometry lives in `lib/imageCrop` and the
 * upload in `useUploadProfilePhoto`. The privacy dropdown that used to sit
 * below the slider is gone — the endpoint has no privacy field, so it only
 * ever set an expectation the product could not keep.
 */
export function ProfilePhotoEditorModal({
  imageUrl,
  isSaving,
  onCancel,
  onSave,
}: ProfilePhotoEditorModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<Size>({ width: 0, height: 0 });

  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const scale = getCropScale(naturalSize, zoom);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!naturalSize.width || !naturalSize.height) return;
    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.dragging) return;
    setOffset(
      clampOffset(
        {
          x: dragRef.current.originX + (event.clientX - dragRef.current.startX),
          y: dragRef.current.originY + (event.clientY - dragRef.current.startY),
        },
        naturalSize,
        zoom,
      ),
    );
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current.dragging = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleZoomChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextZoom = clamp(Number(event.target.value) || 1, 1, 3);
    setZoom(nextZoom);
    setOffset((current) => clampOffset(current, naturalSize, nextZoom));
  }

  function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const nextSize: Size = {
      width: event.currentTarget.naturalWidth || 0,
      height: event.currentTarget.naturalHeight || 0,
    };
    setNaturalSize(nextSize);
    setOffset((current) => clampOffset(current, nextSize, zoom));
  }

  return (
    <Modal
      title="Adjust photo"
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
            onClick={() => onSave(zoom, offset)}
            isBusy={isSaving}
            busyLabel="Saving"
          >
            Save photo
          </Button>
        </>
      }
    >
      <div className="p-5">
        <p className="text-sm leading-relaxed text-ink-2">
          Drag to reposition. The circle is what everyone else sees.
        </p>

        <div className="mt-5 flex justify-center">
          <div
            className="relative h-[280px] w-[280px] touch-none overflow-hidden rounded-full bg-recess ring-1 ring-line"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {imageUrl ? (
              <img
                alt="Crop preview"
                draggable={false}
                src={imageUrl}
                onLoad={handleImageLoad}
                className="pointer-events-none absolute top-1/2 left-1/2 cursor-grab select-none"
                style={{
                  width: `${naturalSize.width || PROFILE_CROP_SIZE}px`,
                  height: `${naturalSize.height || PROFILE_CROP_SIZE}px`,
                  maxWidth: "none",
                  maxHeight: "none",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
                  transformOrigin: "center center",
                }}
              />
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between font-mono text-micro font-medium tracking-[0.16em] text-ink-3 uppercase">
            <label htmlFor="zoom">Zoom</label>
            <span className="tabular-nums">{zoom.toFixed(2)}×</span>
          </div>
          <input
            id="zoom"
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={handleZoomChange}
            disabled={isSaving}
            className="mt-3 w-full"
          />
        </div>
      </div>
    </Modal>
  );
}
