import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/roulette/click
 * Logs a click-through on a roulette winner (for conversion tracking)
 */
export async function POST(request: NextRequest) {
  try {
    const { dealId, sessionId } = await request.json();
    if (!dealId) return NextResponse.json({ error: "Missing dealId" }, { status: 400 });

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq, sql, desc, and } = await import("drizzle-orm");

    // Mark the most recent spin for this session+deal as clicked
    if (sessionId) {
      const recentSpin = await db
        .select({ id: schema.rouletteSpins.id })
        .from(schema.rouletteSpins)
        .where(and(eq(schema.rouletteSpins.sessionId, sessionId), eq(schema.rouletteSpins.dealId, dealId)))
        .orderBy(desc(schema.rouletteSpins.spunAt))
        .limit(1);
      if (recentSpin.length > 0) {
        await db.update(schema.rouletteSpins).set({ clicked: true }).where(eq(schema.rouletteSpins.id, recentSpin[0].id));
      }
    }

    // Increment click count on the roulette_deals record
    await db.update(schema.rouletteDeals)
      .set({ clickCount: sql`${schema.rouletteDeals.clickCount} + 1` })
      .where(eq(schema.rouletteDeals.dealId, dealId));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[roulette/click] Failed:", e);
    return NextResponse.json({ error: "Click tracking failed" }, { status: 500 });
  }
}
