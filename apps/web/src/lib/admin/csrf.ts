import type { NextRequest } from "next/server";

/**
 * Lenient same-origin check for admin state-changing requests (CSRF defense).
 * - If Origin is present, it must match the Host.
 * - Else fall back to Referer.
 * - If neither is present (some privacy setups strip both), allow — so we never
 *   break a legitimate same-origin request. Combined with SameSite=strict cookies,
 *   this blocks cross-site forged POSTs without risking the owner's own access.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const host = request.headers.get("host");
  if (!host) return true;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  return true;
}
