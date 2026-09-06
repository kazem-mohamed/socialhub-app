/**
 * The aura system (docs/brand-guidelines.md §4).
 *
 * Every account resolves to one deterministic colour derived from its
 * handle — nobody else holds it, and it costs zero backend storage. Every
 * generated hue is confined to an 80° arc of the colour wheel anchored at
 * the brand's own Vermilion hue, so no aura can drift to green or neon
 * magenta: ten thousand distinct auras still read as one family.
 *
 * These constants are fixed brand decisions, not implementation details —
 * changing them is a rebrand, not a tweak.
 */
/** The brand's own hue, in degrees — the arc below is anchored here. */
export const VERM_HUE = 14;
const FAM_START = 330;
const FAM_SPAN = 80;

export interface Aura {
  h1: number;
  h2: number;
  sat: number;
  lum: number;
  /** Catalogue number, e.g. "A247". Same hash, same brand spec. */
  code: string;
}

function hash32(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Derives a user's aura from their handle. Same handle, same aura, always. */
export function auraFor(handle: string): Aura {
  const h = hash32(handle.toLowerCase().trim() || "anon");

  const p1 = ((h % 1000) / 1000) * FAM_SPAN; // 0 -> 80
  const p2 = Math.min(FAM_SPAN, p1 + 13 + ((h >>> 11) % 12)); // stays inside the arc

  const h1 = (FAM_START + p1) % 360;
  const h2 = (FAM_START + p2) % 360;

  return {
    h1: Math.round(h1),
    h2: Math.round(h2),
    sat: 68 + ((h >>> 7) % 17), // 68-84%
    lum: 52 + ((h >>> 17) % 6), // 52-57%
    code: String.fromCharCode(65 + (h % 26)) + (100 + ((h >>> 5) % 900)),
  };
}

/**
 * The accession number a person carries. Assigned by their handle, never
 * chosen, never reused — which is the whole premise of the aura, stated as
 * a catalogue would state it.
 */
export function accessionNumber(handle: string): string {
  return `AUR-${auraFor(handle).code}`;
}

/** The single flat hue used for the hairline avatar ring. */
export function auraRingColor(handle: string): string {
  const a = auraFor(handle);
  return `hsl(${a.h1} ${a.sat}% ${a.lum}%)`;
}

/** The two-hue gradient used only for large swatches (never on avatars). */
export function auraGradient(handle: string): string {
  const a = auraFor(handle);
  return `linear-gradient(135deg, hsl(${a.h1} ${a.sat}% ${a.lum}%), hsl(${a.h2} ${a.sat}% ${a.lum - 8}%))`;
}
