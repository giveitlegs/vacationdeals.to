import type { NextRequest } from "next/server";

/**
 * Fail-closed same-origin check for admin state-changing requests (CSRF defense).
 * - Host must be present.
 * - Prefer Origin; fall back to Referer; whichever is present must match Host.
 * - If NEITHER Origin nor Referer is present, reject. Modern browsers always send
 *   Origin on POST (and Referer on same-origin navigations/fetches), so a real
 *   admin request is never blocked, while a forged/cross-site request with a
 *   stripped or mismatched origin is. The login endpoint has no session (so no
 *   SameSite protection yet) — failing closed here is what actually protects it.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const host = request.headers.get("host");
  if (!host) return false;

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

  return false;
}
