import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/ads/track
 * Body: { brand: string, position: string, path?: string }
 *
 * Records that a UTM-matched prospect banner was rendered for the given
 * brand. Hashes the visitor's IP (privacy-respectful) so we can still
 * count unique viewers without storing raw IPs.
 *
 * Called by AdSlot.tsx when a prospect-tagged banner shows up.
 * Always returns 204 — never blocks rendering.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { brand?: string; position?: string; path?: string };
    if (!body?.brand) return new NextResponse(null, { status: 204 });

    const ipHeader =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ip = ipHeader.split(",")[0].trim();
    const ipHash = crypto.createHash("sha256").update(ip + "|vacationdeals-salt").digest("hex").slice(0, 32);

    const { db } = await import("@vacationdeals/db");
    const { prospectClicks } = await import("@vacationdeals/db");
    await db.insert(prospectClicks).values({
      prospectBrandSlug: body.brand.slice(0, 100),
      ipHash,
      userAgent: (req.headers.get("user-agent") ?? "").slice(0, 500) || null,
      referer: (req.headers.get("referer") ?? "").slice(0, 500) || null,
      pagePath: (body.path ?? "").slice(0, 500) || null,
      bannerPosition: (body.position ?? "").slice(0, 50) || null,
    });
  } catch (err) {
    // Never let tracking break the page
    console.error("[/api/ads/track] error:", err);
  }
  return new NextResponse(null, { status: 204 });
}
