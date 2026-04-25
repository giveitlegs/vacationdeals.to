import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/ads?position=<slot>&utm_content=<value>
 *
 * Returns the banner to render for a given slot. Selection rules:
 *
 *   1. If utm_content is provided AND a banner exists with utm_content_match
 *      = that exact value AND is_active, return it. (Sales-prospecting
 *      banners — visible only when the prospect uses their tagged link.)
 *
 *   2. Otherwise return the active banner for the slot with NULL
 *      utm_content_match, ordered by sort_order then id (newest wins on tie).
 *
 *   3. If nothing matches, return { banner: null }.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const position = searchParams.get("position");
  const utmContent = searchParams.get("utm_content");

  if (!position) {
    return NextResponse.json({ banner: null }, { status: 400 });
  }

  try {
    const { db } = await import("@vacationdeals/db");
    const { adBanners } = await import("@vacationdeals/db");
    const { and, eq, sql } = await import("drizzle-orm");

    // 1. UTM-matched prospect banner (highest priority)
    if (utmContent) {
      const prospect = await db
        .select()
        .from(adBanners)
        .where(
          and(
            eq(adBanners.position, position),
            eq(adBanners.utmContentMatch, utmContent),
            eq(adBanners.isActive, true),
          ),
        )
        .limit(1);
      if (prospect.length > 0) {
        return NextResponse.json({ banner: prospect[0] });
      }
    }

    // 2. Default active banner for this slot (no utm match required)
    const defaults = await db
      .select()
      .from(adBanners)
      .where(
        and(
          eq(adBanners.position, position),
          eq(adBanners.isActive, true),
          sql`${adBanners.utmContentMatch} IS NULL`,
        ),
      )
      .orderBy(sql`${adBanners.sortOrder} ASC NULLS LAST, ${adBanners.id} DESC`)
      .limit(1);

    return NextResponse.json({ banner: defaults[0] ?? null });
  } catch (err) {
    console.error("[/api/ads] error:", err);
    return NextResponse.json({ banner: null }, { status: 500 });
  }
}
