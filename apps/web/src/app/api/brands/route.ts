import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Public brand list. Whitelisted shape — does NOT expose internal id,
 * isSuppressed (admin curation flag), or audit timestamps.
 */
export async function GET() {
  const { db } = await import("@vacationdeals/db");
  const { brands } = await import("@vacationdeals/db");
  const { asc, eq } = await import("drizzle-orm");

  const results = await db
    .select({
      slug: brands.slug,
      name: brands.name,
      logoUrl: brands.logoUrl,
      website: brands.website,
      type: brands.type,
      description: brands.description,
    })
    .from(brands)
    .where(eq(brands.isSuppressed, false))
    .orderBy(asc(brands.name));
  return NextResponse.json({ brands: results });
}
