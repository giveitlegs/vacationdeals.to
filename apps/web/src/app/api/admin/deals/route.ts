import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, logAdminAction } from "@/lib/admin/auth";

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { dealId, action, newPrice } = await request.json();
    if (!dealId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");

    if (action === "expire") {
      await db.update(schema.deals).set({ isActive: false, updatedAt: new Date() }).where(eq(schema.deals.id, dealId));
      await logAdminAction(admin.id, "deal.expire", "deal", dealId);
    } else if (action === "reactivate") {
      await db.update(schema.deals).set({ isActive: true, updatedAt: new Date() }).where(eq(schema.deals.id, dealId));
      await logAdminAction(admin.id, "deal.reactivate", "deal", dealId);
    } else if (action === "price_override") {
      if (!newPrice || newPrice <= 0) return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      await db.update(schema.deals).set({ price: String(newPrice), updatedAt: new Date() }).where(eq(schema.deals.id, dealId));
      await db.insert(schema.dealPriceHistory).values({ dealId, price: String(newPrice) });
      await logAdminAction(admin.id, "deal.price_override", "deal", dealId, { newPrice });
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/deals] POST", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
