import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/roulette/deals
 * Returns 12 random deal slices for pre-loading the wheel before spin.
 * Query: ?filter=all|beach|under-150|luxury
 */
export async function GET(request: NextRequest) {
  try {
    const filter = new URL(request.url).searchParams.get("filter") || "all";

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { sql, eq, and, lt, gte } = await import("drizzle-orm");

    const conditions: ReturnType<typeof eq>[] = [eq(schema.deals.isActive, true)];
    if (filter === "under-150") conditions.push(lt(schema.deals.price, "150"));
    if (filter === "luxury") conditions.push(gte(schema.deals.price, "300"));

    const rows = await db
      .select({
        dealId: schema.deals.id,
        price: schema.deals.price,
        city: schema.destinations.city,
        state: schema.destinations.state,
        brandName: schema.brands.name,
        brandSlug: schema.brands.slug,
        slug: schema.deals.slug,
        resortName: schema.deals.resortName,
      })
      .from(schema.deals)
      .leftJoin(schema.brands, sql`${schema.deals.brandId} = ${schema.brands.id}`)
      .leftJoin(schema.destinations, sql`${schema.deals.destinationId} = ${schema.destinations.id}`)
      .where(and(...conditions))
      .limit(200);

    const beachCities = ["miami", "myrtle beach", "cocoa beach", "daytona beach", "hilton head", "cancun", "punta cana", "key west", "cabo san lucas"];
    let candidates = rows.filter((r) => r.city);
    if (filter === "beach") {
      candidates = candidates.filter((r) =>
        beachCities.some((c) => r.city?.toLowerCase().includes(c)),
      );
    }

    // Pick 12 random
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const slices = shuffled.slice(0, 12).map((r) => {
      const price = Number(r.price);
      return {
        dealId: r.dealId,
        price,
        city: r.city ?? "Resort",
        state: r.state ?? "",
        brandName: r.brandName ?? "Unknown",
        brandSlug: r.brandSlug ?? "",
        slug: r.slug,
        resortName: r.resortName ?? r.brandName ?? "Resort",
        rarity: price < 100 ? "legendary" : price < 200 ? "rare" : "common",
      };
    });

    return NextResponse.json({ slices });
  } catch (e) {
    console.error("[roulette/deals] Failed:", e);
    return NextResponse.json({ slices: [] }, { status: 500 });
  }
}
