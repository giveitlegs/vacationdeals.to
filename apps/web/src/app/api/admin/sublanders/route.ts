import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin, logAdminAction } from "@/lib/admin/auth";

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { citySlug, modifierSlug, action, customIntroHtml, customMetaTitle, customMetaDescription, sortOrder } = body;

    if (!citySlug || !modifierSlug || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { and, eq } = await import("drizzle-orm");

    const existing = await db
      .select()
      .from(schema.sublanders)
      .where(
        and(
          eq(schema.sublanders.citySlug, citySlug),
          eq(schema.sublanders.modifierSlug, modifierSlug),
        ),
      )
      .limit(1);

    const cleanSlug = `${citySlug}-${modifierSlug}`;

    if (action === "toggle_enable") {
      if (existing.length === 0) {
        await db.insert(schema.sublanders).values({
          citySlug,
          modifierSlug,
          isEnabled: false, // first toggle = disable (default was enabled)
        });
      } else {
        await db
          .update(schema.sublanders)
          .set({ isEnabled: !existing[0].isEnabled, updatedAt: new Date() })
          .where(eq(schema.sublanders.id, existing[0].id));
      }
      await logAdminAction(admin.id, "sublander.toggle_enable", "sublander", existing[0]?.id ?? 0, { citySlug, modifierSlug });
    } else if (action === "update_copy") {
      const payload = {
        customIntroHtml: customIntroHtml ?? null,
        customMetaTitle: customMetaTitle ?? null,
        customMetaDescription: customMetaDescription ?? null,
        updatedAt: new Date(),
      };
      if (existing.length === 0) {
        await db.insert(schema.sublanders).values({
          citySlug,
          modifierSlug,
          ...payload,
        });
      } else {
        await db
          .update(schema.sublanders)
          .set(payload)
          .where(eq(schema.sublanders.id, existing[0].id));
      }
      await logAdminAction(admin.id, "sublander.update_copy", "sublander", existing[0]?.id ?? 0, { citySlug, modifierSlug });
    } else if (action === "update_order") {
      if (typeof sortOrder !== "number") {
        return NextResponse.json({ error: "sortOrder required" }, { status: 400 });
      }
      if (existing.length === 0) {
        await db.insert(schema.sublanders).values({ citySlug, modifierSlug, sortOrder });
      } else {
        await db
          .update(schema.sublanders)
          .set({ sortOrder, updatedAt: new Date() })
          .where(eq(schema.sublanders.id, existing[0].id));
      }
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    // Revalidate the affected pages so changes are immediately visible
    revalidatePath(`/${cleanSlug}`);
    revalidatePath(`/${citySlug}`);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/sublanders] POST", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
