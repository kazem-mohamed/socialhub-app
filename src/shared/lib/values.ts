import { DEFAULT_PROFILE_IMAGE } from "@/shared/config/constants";
import { isRecord } from "./records";

/**
 * The API represents entity ids as `_id`, `id` or `userId` depending on the
 * route. This was reimplemented in four different files; it lives here now.
 */
export function getEntityId(entity: unknown): string | null {
  if (typeof entity === "string") return entity.trim() || null;
  if (typeof entity === "number" && Number.isFinite(entity)) return String(entity);
  if (!isRecord(entity)) return null;

  for (const key of ["_id", "id", "userId"] as const) {
    const value = entity[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

/** True when both ids are present and equal. Never true for two unknowns. */
export function isSameEntity(a: unknown, b: unknown): boolean {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
}

/**
 * Counts arrive either as an array to measure or as a pre-computed number.
 * Anything else counts as zero.
 */
export function toCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
}

/** First of `value`/`fallback` that yields a non-zero count. */
export function toCountOf(value: unknown, fallback: unknown): number {
  return toCount(value) || toCount(fallback);
}

/**
 * Word lists the API uses to express a boolean as a string. They differ per
 * domain, so callers pass the vocabulary that applies to the field they read.
 */
export const BOOLEAN_VOCABULARY = {
  bookmark: {
    truthy: ["saved", "bookmarked"],
    falsy: ["unsaved", "unbookmarked"],
  },
  follow: {
    truthy: ["followed", "following"],
    falsy: ["unfollowed", "not-following"],
  },
  plain: { truthy: [], falsy: [] },
} as const;

type BooleanVocabulary = {
  readonly truthy: readonly string[];
  readonly falsy: readonly string[];
};

/**
 * The API expresses booleans as `true`, `1`, `"yes"`, `"saved"` and friends.
 * Returns `null` when the value carries no boolean meaning at all, so callers
 * can fall through to the next candidate.
 */
export function parseBooleanLike(
  value: unknown,
  vocabulary: BooleanVocabulary = BOOLEAN_VOCABULARY.plain,
): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value > 0;
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["true", "yes", "1", ...vocabulary.truthy].includes(normalized)) return true;
  if (["false", "no", "0", ...vocabulary.falsy].includes(normalized)) return false;
  return null;
}

/** First candidate that carries boolean meaning, else `false`. */
export function anyBooleanLike(
  candidates: readonly unknown[],
  vocabulary: BooleanVocabulary = BOOLEAN_VOCABULARY.plain,
): boolean {
  for (const candidate of candidates) {
    const parsed = parseBooleanLike(candidate, vocabulary);
    if (parsed !== null) return parsed;
  }
  return false;
}

/** An avatar URL that is always renderable. */
export function resolveAvatarUrl(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return DEFAULT_PROFILE_IMAGE;
}

/** A media URL, or `null` when there is nothing to render. */
export function resolveMediaUrl(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}

/**
 * Post bodies occasionally arrive as the literal string "undefined" from the
 * API; treat that as empty rather than rendering it.
 */
export function resolveText(value: unknown): string {
  if (typeof value !== "string") return "";
  if (value === "undefined") return "";
  return value;
}

/** `@handle` derived from a username, an email local-part, or a display name. */
export function buildHandle(
  username: unknown,
  email: unknown,
  displayName: unknown,
): string {
  const fromUsername = typeof username === "string" ? username.trim() : "";
  const fromEmail =
    typeof email === "string" ? (email.split("@")[0] ?? "").trim() : "";
  const fromName =
    typeof displayName === "string"
      ? displayName.toLowerCase().replace(/\s+/g, "")
      : "";

  const raw = fromUsername || fromEmail || fromName;
  if (!raw) return "@user";
  return raw.startsWith("@") ? raw : `@${raw}`;
}
