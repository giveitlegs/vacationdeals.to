import { NextRequest, NextResponse } from "next/server";

/**
 * Admin API for Resort Roulette
 * Protected by PAYLOAD_SECRET bearer token.
 *
 * GET  /api/admin/roulette      — List all deals with roulette settings
 * POST /api/admin/roulette      — Update a deal's roulette settings
 *   body: { dealId, weight?, isFeatured?, isExcluded?, rarity? }
 */

function checkAuth(request: NextRequest): boolean {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
    || new URL(request.url).searchParams.get("key");
  return token === process.env.PAYLOAD_SECRET;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { sql, eq, desc } = await import("drizzle-orm");

    const rows = await db
      .select({
        dealId: schema.deals.id,
        title: schema.deals.title,
        price: schema.deals.price,
        slug: schema.deals.slug,
        city: schema.destinations.city,
        brandName: schema.brands.name,
        weight: schema.rouletteDeals.weight,
        isFeatured: schema.rouletteDeals.isFeatured,
        isExcluded: schema.rouletteDeals.isExcluded,
        rarity: schema.rouletteDeals.rarity,
        spinCount: schema.rouletteDeals.spinCount,
        clickCount: schema.rouletteDeals.clickCount,
      })
      .from(schema.deals)
      .leftJoin(schema.brands, sql`${schema.deals.brandId} = ${schema.brands.id}`)
      .leftJoin(schema.destinations, sql`${schema.deals.destinationId} = ${schema.destinations.id}`)
      .leftJoin(schema.rouletteDeals, sql`${schema.rouletteDeals.dealId} = ${schema.deals.id}`)
      .where(eq(schema.deals.isActive, true))
      .orderBy(desc(schema.deals.scrapedAt))
      .limit(500);

    return NextResponse.json({ deals: rows });
  } catch (e) {
    console.error("[admin/roulette] GET failed:", e);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { dealId, weight, isFeatured, isExcluded, rarity } = body;
    if (!dealId) return NextResponse.json({ error: "Missing dealId" }, { status: 400 });

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");

    // Upsert: check if record exists
    const existing = await db.select().from(schema.rouletteDeals)
      .where(eq(schema.rouletteDeals.dealId, dealId))
      .limit(1);

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof weight === "number") updates.weight = weight;
    if (typeof isFeatured === "boolean") updates.isFeatured = isFeatured;
    if (typeof isExcluded === "boolean") updates.isExcluded = isExcluded;
    if (typeof rarity === "string") updates.rarity = rarity;

    if (existing.length > 0) {
      await db.update(schema.rouletteDeals).set(updates).where(eq(schema.rouletteDeals.dealId, dealId));
    } else {
      await db.insert(schema.rouletteDeals).values({
        dealId,
        weight: weight ?? 5,
        isFeatured: isFeatured ?? false,
        isExcluded: isExcluded ?? false,
        rarity: rarity ?? "common",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/roulette] POST failed:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
