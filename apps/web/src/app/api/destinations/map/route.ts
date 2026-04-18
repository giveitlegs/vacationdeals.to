import { NextResponse } from "next/server";

/**
 * GET /api/destinations/map
 * Returns all destinations with coordinates + deal counts for the map.
 */
export async function GET() {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { sql, eq, and, isNotNull, count, min } = await import("drizzle-orm");

    const rows = await db
      .select({
        city: schema.destinations.city,
        slug: schema.destinations.slug,
        state: schema.destinations.state,
        country: schema.destinations.country,
        lat: schema.destinations.latitude,
        lng: schema.destinations.longitude,
        deals: count(schema.deals.id),
        cheapest: min(schema.deals.price),
      })
      .from(schema.destinations)
      .leftJoin(schema.deals, sql`${schema.deals.destinationId} = ${schema.destinations.id} AND ${schema.deals.isActive} = true`)
      .where(and(
        isNotNull(schema.destinations.latitude),
        isNotNull(schema.destinations.longitude),
      ))
      .groupBy(schema.destinations.id)
      .orderBy(sql`count(${schema.deals.id}) DESC`);

    const pins = rows
      .filter((r) => r.deals > 0 && r.lat && r.lng)
      .map((r) => ({
        city: r.city,
        slug: r.slug,
        state: r.state ?? "",
        country: r.country ?? "US",
        lat: Number(r.lat),
        lng: Number(r.lng),
        deals: r.deals,
        cheapest: r.cheapest ? Number(r.cheapest) : null,
      }));

    return NextResponse.json({ pins }, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate" },
    });
  } catch (e) {
    console.error("[map] Failed:", e);
    return NextResponse.json({ pins: [] }, { status: 500 });
  }
}
