import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin, logAdminAction } from "@/lib/admin/auth";

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { action, id, name, position, htmlContent, imageUrl, linkUrl, isActive, sortOrder } = body;

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");

    if (action === "create") {
      if (!name || !position) return NextResponse.json({ error: "name + position required" }, { status: 400 });
      const [row] = await db.insert(schema.adBanners).values({
        name,
        position,
        htmlContent: htmlContent ?? null,
        imageUrl: imageUrl ?? null,
        linkUrl: linkUrl ?? null,
        isActive: isActive !== false,
        sortOrder: sortOrder ?? 0,
      }).returning({ id: schema.adBanners.id });
      await logAdminAction(admin.id, "banner.create", "banner", row.id, { name, position });
    } else if (action === "update") {
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (name != null) update.name = name;
      if (position != null) update.position = position;
      if (htmlContent !== undefined) update.htmlContent = htmlContent;
      if (imageUrl !== undefined) update.imageUrl = imageUrl;
      if (linkUrl !== undefined) update.linkUrl = linkUrl;
      if (isActive != null) update.isActive = isActive;
      if (sortOrder != null) update.sortOrder = sortOrder;
      await db.update(schema.adBanners).set(update).where(eq(schema.adBanners.id, id));
      await logAdminAction(admin.id, "banner.update", "banner", id, update);
    } else if (action === "delete") {
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      await db.delete(schema.adBanners).where(eq(schema.adBanners.id, id));
      await logAdminAction(admin.id, "banner.delete", "banner", id);
    } else if (action === "toggle_active") {
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const existing = await db.select().from(schema.adBanners).where(eq(schema.adBanners.id, id)).limit(1);
      if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await db.update(schema.adBanners)
        .set({ isActive: !existing[0].isActive, updatedAt: new Date() })
        .where(eq(schema.adBanners.id, id));
      await logAdminAction(admin.id, "banner.toggle_active", "banner", id);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/banners]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
