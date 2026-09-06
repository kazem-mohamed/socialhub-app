import axios from "axios";
import { firstString } from "@/shared/lib/records";

/**
 * A single error shape for the whole app. Every component used to reimplement
 * `extractApiMessage` (eight copies); they now read `error.message`.
 */
export class ApiError extends Error {
  readonly status: number | null;
  readonly payload: unknown;

  constructor(message: string, status: number | null, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }

  /** 401/403 — the session is no longer usable. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/** Pulls the human-readable message out of whatever the API returned. */
export function readApiMessage(payload: unknown): string | null {
  return firstString(payload, [
    ["message"],
    ["error"],
    ["errors", "0", "msg"],
    ["data", "message"],
    ["data", "error"],
  ]);
}

/** Converts any thrown value into an {@link ApiError}. */
export function toApiError(error: unknown, fallback = FALLBACK_MESSAGE): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    const payload: unknown = error.response?.data;
    const status = error.response?.status ?? null;
    return new ApiError(readApiMessage(payload) || error.message || fallback, status, payload);
  }

  if (error instanceof Error) return new ApiError(error.message || fallback, null, null);

  return new ApiError(fallback, null, null);
}

/**
 * Message to render for a failed request. Pass a `fallback` when the surface
 * has a more specific phrasing than the generic one.
 */
export function getErrorMessage(error: unknown, fallback = FALLBACK_MESSAGE): string {
  if (!error) return "";
  return toApiError(error, fallback).message || fallback;
}
