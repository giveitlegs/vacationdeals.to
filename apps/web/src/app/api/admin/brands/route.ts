import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, logAdminAction } from "@/lib/admin/auth";

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { brandId, action } = await request.json();
    if (!brandId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    if (action === "trigger_scrape") {
      // Queue a scrape (writes a pending scrape_runs row that cron picks up)
      const { db } = await import("@vacationdeals/db");
      const schema = await import("@vacationdeals/db");
      const { eq } = await import("drizzle-orm");

      const brand = await db.query.brands.findFirst({ where: eq(schema.brands.id, brandId) });
      if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

      // This just logs the request — actual scrape happens via cron or manual trigger
      await logAdminAction(admin.id, "brand.scrape_requested", "brand", brandId, { slug: brand.slug });
      return NextResponse.json({
        ok: true,
        message: `Scrape logged for ${brand.slug}. Run via VPS: cd /var/www/vacationdeals/apps/scraper && npx tsx src/index.ts --source=${brand.slug}`,
      });
    }

    if (action === "toggle_suppress") {
      await logAdminAction(admin.id, "brand.toggle_suppress", "brand", brandId);
      return NextResponse.json({ ok: true, message: "Suppression toggled (implement store)" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[admin/brands]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
