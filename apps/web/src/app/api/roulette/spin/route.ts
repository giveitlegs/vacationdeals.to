import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/roulette/spin
 *
 * Returns:
 * - wheelSlices: Array of deals to show on the wheel (12-16 items for visual variety)
 * - winner: The selected deal (weighted random based on admin settings)
 * - winnerIndex: Index of winner in wheelSlices so the wheel can stop on it
 *
 * Body params:
 *   sessionId: string (for tracking)
 *   filter?: "all" | "beach" | "under-150" | "luxury"
 */

interface WheelSlice {
  dealId: number;
  price: number;
  city: string;
  state: string;
  brandName: string;
  brandSlug: string;
  slug: string;
  resortName: string;
  rarity: "common" | "rare" | "legendary";
}

function computeRarity(price: number): "common" | "rare" | "legendary" {
  if (price < 100) return "legendary";
  if (price < 200) return "rare";
  return "common";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sessionId = body.sessionId || "anonymous";
    const filter = body.filter || "all";

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { sql, eq, and, lt, gte } = await import("drizzle-orm");

    // Build filter conditions
    const conditions: ReturnType<typeof eq>[] = [eq(schema.deals.isActive, true)];
    if (filter === "under-150") conditions.push(lt(schema.deals.price, "150"));
    if (filter === "luxury") conditions.push(gte(schema.deals.price, "300"));

    // Fetch candidate deals with brand + destination info
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
        rouletteWeight: schema.rouletteDeals.weight,
        rouletteFeatured: schema.rouletteDeals.isFeatured,
        rouletteExcluded: schema.rouletteDeals.isExcluded,
        rouletteRarity: schema.rouletteDeals.rarity,
      })
      .from(schema.deals)
      .leftJoin(schema.brands, sql`${schema.deals.brandId} = ${schema.brands.id}`)
      .leftJoin(schema.destinations, sql`${schema.deals.destinationId} = ${schema.destinations.id}`)
      .leftJoin(schema.rouletteDeals, sql`${schema.rouletteDeals.dealId} = ${schema.deals.id}`)
      .where(and(...conditions))
      .limit(200);

    // Filter out excluded, filter beach if needed
    const beachCities = ["miami", "myrtle beach", "cocoa beach", "daytona beach", "hilton head", "cancun", "punta cana", "key west", "cabo san lucas"];
    let candidates = rows.filter((r) => !r.rouletteExcluded && r.city);
    if (filter === "beach") {
      candidates = candidates.filter((r) =>
        beachCities.some((c) => r.city?.toLowerCase().includes(c)),
      );
    }

    if (candidates.length === 0) {
      return NextResponse.json({ error: "No deals available for this filter" }, { status: 404 });
    }

    // Build weighted pool (featured = guaranteed include)
    const featured = candidates.filter((c) => c.rouletteFeatured);
    const nonFeatured = candidates.filter((c) => !c.rouletteFeatured);

    // Pick 12 slices for the wheel — mix of features + random others
    const WHEEL_SIZE = 12;
    const slicesToShow: typeof candidates = [];

    // Always include featured (up to 4 of them)
    slicesToShow.push(...featured.slice(0, 4));

    // Fill remaining with random non-featured
    const shuffled = [...nonFeatured].sort(() => Math.random() - 0.5);
    while (slicesToShow.length < WHEEL_SIZE && shuffled.length > 0) {
      slicesToShow.push(shuffled.pop()!);
    }

    // Map to wheel slices
    const wheelSlices: WheelSlice[] = slicesToShow.map((r) => {
      const price = Number(r.price);
      return {
        dealId: r.dealId,
        price,
        city: r.city ?? "Unknown",
        state: r.state ?? "",
        brandName: r.brandName ?? "Unknown",
        brandSlug: r.brandSlug ?? "",
        slug: r.slug,
        resortName: r.resortName ?? r.brandName ?? "Resort",
        rarity: (r.rouletteRarity as "common" | "rare" | "legendary") || computeRarity(price),
      };
    });

    // Weighted random pick for the winner
    const weights = slicesToShow.map((r) => r.rouletteWeight ?? 5);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    let winnerIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        winnerIndex = i;
        break;
      }
    }

    const winner = wheelSlices[winnerIndex];

    // Log the spin (fire-and-forget)
    db.insert(schema.rouletteSpins).values({
      dealId: winner.dealId,
      sessionId,
      userAgent: request.headers.get("user-agent") ?? null,
      rarity: winner.rarity,
    }).then(() => {}).catch(() => {});

    // Increment spin count on the roulette deal record
    db.update(schema.rouletteDeals)
      .set({ spinCount: sql`${schema.rouletteDeals.spinCount} + 1` })
      .where(eq(schema.rouletteDeals.dealId, winner.dealId))
      .then(() => {}).catch(() => {});

    return NextResponse.json({
      wheelSlices,
      winner,
      winnerIndex,
    });
  } catch (e) {
    console.error("[roulette/spin] Failed:", e);
    return NextResponse.json({ error: "Spin failed" }, { status: 500 });
  }
}
