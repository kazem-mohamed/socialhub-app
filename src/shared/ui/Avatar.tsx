import { DEFAULT_PROFILE_IMAGE } from "@/shared/config/constants";
import { auraRingColor } from "@/shared/lib/aura";

interface AvatarProps {
  /** Empty or missing values fall back to the placeholder. */
  src: string | null | undefined;
  alt: string;
  /** Handle/username this person's aura ring is derived from — see shared/lib/aura.ts. */
  seed: string;
  /** Square size in pixels. Default 40. */
  size?: number;
  className?: string;
}

/**
 * `<img>` that falls back to the placeholder both when the source is
 * missing and when it fails to load, ringed in the person's own
 * deterministic aura colour (docs/brand-guidelines.md §4) — a single
 * hairline, never a filled or blurred shape.
 */
export function Avatar({ src, alt, seed, size = 40, className }: AvatarProps) {
  const ring = auraRingColor(seed);

  return (
    <img
      alt={alt}
      className={`inline-block flex-none rounded-full bg-recess object-cover${className ? ` ${className}` : ""}`}
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 0 1.5px var(--plate), 0 0 0 2.5px ${ring}`,
      }}
      src={src?.trim() || DEFAULT_PROFILE_IMAGE}
      onError={(event) => {
        event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
      }}
    />
  );
}
