import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin, logAdminAction } from "@/lib/admin/auth";

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { brandId, action } = await request.json();
    if (!brandId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");

    const brand = await db.query.brands.findFirst({ where: eq(schema.brands.id, brandId) });
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

    if (action === "trigger_scrape") {
      await logAdminAction(admin.id, "brand.scrape_requested", "brand", brandId, { slug: brand.slug });
      return NextResponse.json({
        ok: true,
        message: `Scrape logged for ${brand.slug}. Run via VPS: cd /var/www/vacationdeals/apps/scraper && npx tsx src/index.ts --source=${brand.slug}`,
      });
    }

    if (action === "toggle_suppress") {
      const newValue = !brand.isSuppressed;
      await db.update(schema.brands).set({ isSuppressed: newValue, updatedAt: new Date() }).where(eq(schema.brands.id, brandId));
      await logAdminAction(admin.id, "brand.toggle_suppress", "brand", brandId, { slug: brand.slug, isSuppressed: newValue });

      revalidatePath("/brands");
      revalidatePath(`/${brand.slug}`);
      revalidatePath("/deals");
      revalidatePath("/");

      return NextResponse.json({ ok: true, isSuppressed: newValue, message: newValue ? "Brand suppressed" : "Brand unsuppressed" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[admin/brands]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
