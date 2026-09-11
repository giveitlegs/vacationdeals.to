import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, logAdminAction } from "@/lib/admin/auth";
import { isSameOrigin } from "@/lib/admin/csrf";

/**
 * GET /api/admin/crm  — list subscribers (source of truth), filterable.
 *   ?q= &status= &lifecycle=
 * POST /api/admin/crm — per-lead actions: unsubscribe (flag only, keeps the
 *   immutable consent audit), reactivate, lifecycle, notes.
 */
export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const status = url.searchParams.get("status") ?? "";
  const lifecycle = url.searchParams.get("lifecycle") ?? "";

  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { desc, and, or, ilike, eq } = await import("drizzle-orm");

    const conds = [];
    if (q) {
      conds.push(
        or(
          ilike(schema.subscribers.email, `%${q}%`),
          ilike(schema.subscribers.phone, `%${q}%`),
          ilike(schema.subscribers.name, `%${q}%`),
          ilike(schema.subscribers.source, `%${q}%`),
        ),
      );
    }
    if (status) conds.push(eq(schema.subscribers.status, status));
    if (lifecycle) conds.push(eq(schema.subscribers.lifecycle, lifecycle));

    const rows = await db
      .select()
      .from(schema.subscribers)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(schema.subscribers.createdAt))
      .limit(2000);

    return NextResponse.json({ rows, count: rows.length });
  } catch (e) {
    console.error("[admin/crm] GET", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  try {
    const { action, id, value } = (await request.json()) as {
      action?: string;
      id?: number;
      value?: string;
    };
    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");

    switch (action) {
      case "unsubscribe":
        // Status flag ONLY — consent_records is an immutable audit trail, never deleted.
        await db
          .update(schema.subscribers)
          .set({ status: "unsubscribed", unsubscribedAt: new Date() })
          .where(eq(schema.subscribers.id, id));
        await logAdminAction(admin.id, "crm.unsubscribe", "subscriber", id);
        return NextResponse.json({ ok: true });

      case "reactivate":
        await db
          .update(schema.subscribers)
          .set({ status: "active", unsubscribedAt: null })
          .where(eq(schema.subscribers.id, id));
        await logAdminAction(admin.id, "crm.reactivate", "subscriber", id);
        return NextResponse.json({ ok: true });

      case "lifecycle": {
        const allowed = ["new", "engaged", "customer", "dormant"];
        if (!value || !allowed.includes(value)) {
          return NextResponse.json({ error: "bad value" }, { status: 400 });
        }
        await db
          .update(schema.subscribers)
          .set({ lifecycle: value })
          .where(eq(schema.subscribers.id, id));
        await logAdminAction(admin.id, "crm.lifecycle", "subscriber", id, { value });
        return NextResponse.json({ ok: true });
      }

      case "notes":
        await db
          .update(schema.subscribers)
          .set({ notes: String(value ?? "").slice(0, 5000) })
          .where(eq(schema.subscribers.id, id));
        await logAdminAction(admin.id, "crm.notes", "subscriber", id);
        return NextResponse.json({ ok: true });

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("[admin/crm] POST", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
