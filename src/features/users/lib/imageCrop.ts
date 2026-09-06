export const PROFILE_CROP_SIZE = 320;

export interface Size {
  width: number;
  height: number;
}

export interface Offset {
  x: number;
  y: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Scale that covers the crop square, multiplied by the user's zoom. */
export function getCropScale(size: Size, zoom: number): number {
  if (!size.width || !size.height) return 1;
  const cover = Math.max(
    PROFILE_CROP_SIZE / size.width,
    PROFILE_CROP_SIZE / size.height,
  );
  return cover * zoom;
}

/** Keeps the drag offset within the bounds of the scaled image. */
export function clampOffset(offset: Offset, size: Size, zoom: number): Offset {
  const scale = getCropScale(size, zoom);
  const maxX = Math.max(0, (size.width * scale - PROFILE_CROP_SIZE) / 2);
  const maxY = Math.max(0, (size.height * scale - PROFILE_CROP_SIZE) / 2);

  return {
    x: clamp(offset.x || 0, -maxX, maxX),
    y: clamp(offset.y || 0, -maxY, maxY),
  };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load selected image."));
    image.src = src;
  });
}

export interface CropResult {
  file: File;
  previewUrl: string;
}

/**
 * Renders the visible portion of the crop frame to a square JPEG.
 *
 * Extracted from the profile page so the geometry is separable from the React
 * state that drives it.
 */
export async function cropToSquare(
  sourceUrl: string,
  sourceFile: File,
  zoom: number,
  offset: Offset,
): Promise<CropResult> {
  const image = await loadImage(sourceUrl);
  const natural: Size = {
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
  };

  const scale = getCropScale(natural, zoom);
  const drawnWidth = natural.width * scale;
  const drawnHeight = natural.height * scale;
  const left = PROFILE_CROP_SIZE / 2 - drawnWidth / 2 + offset.x;
  const top = PROFILE_CROP_SIZE / 2 - drawnHeight / 2 + offset.y;

  const sourceWidth = PROFILE_CROP_SIZE / scale;
  const sourceHeight = PROFILE_CROP_SIZE / scale;
  const sourceX = clamp(-left / scale, 0, Math.max(0, natural.width - sourceWidth));
  const sourceY = clamp(-top / scale, 0, Math.max(0, natural.height - sourceHeight));

  const canvas = document.createElement("canvas");
  canvas.width = PROFILE_CROP_SIZE;
  canvas.height = PROFILE_CROP_SIZE;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Failed to initialize image editor.");

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    PROFILE_CROP_SIZE,
    PROFILE_CROP_SIZE,
  );

  const previewUrl = canvas.toDataURL("image/jpeg", 0.92);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (created) =>
        created
          ? resolve(created)
          : reject(new Error("Failed to export cropped profile photo.")),
      "image/jpeg",
      0.92,
    );
  });

  const baseName = sourceFile.name.replace(/\.[^/.]+$/, "") || "profile-photo";
  return {
    file: new File([blob], `${baseName}-cropped.jpg`, { type: "image/jpeg" }),
    previewUrl,
  };
}
