import { firstString } from "@/shared/lib/records";

/**
 * Reads the user id out of the JWT payload.
 *
 * Used only as a stop-gap for ownership checks on the very first paint, before
 * `useCurrentUser` resolves. Never used for authorisation — the server decides
 * that — so decoding without verifying the signature is fine here.
 */
export function readUserIdFromToken(token: string | null): string | null {
  if (!token) return null;

  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;

    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload: unknown = JSON.parse(atob(padded));

    return firstString(payload, [
      ["_id"],
      ["id"],
      ["userId"],
      ["user", "_id"],
      ["user", "id"],
      ["user", "userId"],
    ]);
  } catch {
    return null;
  }
}
