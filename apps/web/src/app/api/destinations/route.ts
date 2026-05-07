import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Public destination list. Whitelisted shape — does NOT expose internal
 * id or createdAt timestamp.
 */
export async function GET() {
  const { db } = await import("@vacationdeals/db");
  const { destinations } = await import("@vacationdeals/db");
  const { asc } = await import("drizzle-orm");

  const results = await db
    .select({
      slug: destinations.slug,
      city: destinations.city,
      state: destinations.state,
      region: destinations.region,
      country: destinations.country,
      latitude: destinations.latitude,
      longitude: destinations.longitude,
      imageUrl: destinations.imageUrl,
    })
    .from(destinations)
    .orderBy(asc(destinations.city));
  return NextResponse.json({ destinations: results });
}
