import "server-only";
import crypto from "node:crypto";

/**
 * HMAC-signed token attached to email-unsubscribe links so we can verify
 * the request came from a legitimate email we sent (not a random
 * stranger trying to unsubscribe somebody else's address).
 *
 * Used by:
 *   - /api/email/unsubscribe/route.ts on the verify side
 *   - email-sending code on the sign side (include `&t=<token>` in
 *     unsubscribe links)
 *
 * The secret is `UNSUBSCRIBE_SECRET` if set, falling back to the
 * existing `PAYLOAD_SECRET` so legacy infra keeps working without a
 * separate env var.
 */

export function unsubscribeSecret(): string {
  return process.env.UNSUBSCRIBE_SECRET || process.env.PAYLOAD_SECRET || "";
}

export function signEmail(email: string): string {
  const secret = unsubscribeSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(email).digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string | null): boolean {
  const expected = signEmail(email);
  if (!expected || !token) return false;
  if (token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
