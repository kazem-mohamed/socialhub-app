import type { UnknownRecord } from "@/shared/api/types";

/** True for objects that are neither `null` nor arrays. */
export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads a nested path off an unknown value without throwing.
 * `readPath(res, "data", "user", "name")`
 */
export function readPath(source: unknown, ...path: string[]): unknown {
  let current = source;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

/** First path that resolves to an array. */
export function firstArray(
  source: unknown,
  paths: readonly (readonly string[])[],
): unknown[] {
  for (const path of paths) {
    const value = readPath(source, ...path);
    if (Array.isArray(value)) return value;
  }
  return [];
}

/** First path that resolves to a non-empty string. */
export function firstString(
  source: unknown,
  paths: readonly (readonly string[])[],
): string | null {
  for (const path of paths) {
    const value = readPath(source, ...path);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** First path that resolves to a finite number. */
export function firstNumber(
  source: unknown,
  paths: readonly (readonly string[])[],
): number | null {
  for (const path of paths) {
    const value = readPath(source, ...path);
    const parsed = Number(value);
    if (value !== null && value !== "" && Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** First path that resolves to a record. */
export function firstRecord(
  source: unknown,
  paths: readonly (readonly string[])[],
): UnknownRecord | null {
  for (const path of paths) {
    const value = readPath(source, ...path);
    if (isRecord(value)) return value;
  }
  return null;
}
