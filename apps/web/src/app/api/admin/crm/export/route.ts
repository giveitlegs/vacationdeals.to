import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, logAdminAction } from "@/lib/admin/auth";

/**
 * GET /api/admin/crm/export  — filter-aware CSV of subscribers.
 *   ?q= &status= &lifecycle= &includeUnsub=1
 * Every export is written to admin_actions (who / how many / filter / when).
 * Unsubscribed leads are excluded unless includeUnsub=1.
 */
export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const status = url.searchParams.get("status") ?? "";
  const lifecycle = url.searchParams.get("lifecycle") ?? "";
  const includeUnsub = url.searchParams.get("includeUnsub") === "1";

  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { desc, and, or, ilike, eq, ne } = await import("drizzle-orm");

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
    if (!includeUnsub) conds.push(ne(schema.subscribers.status, "unsubscribed"));

    const rows = await db
      .select()
      .from(schema.subscribers)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(schema.subscribers.createdAt))
      .limit(100000);

    const cols = [
      "id", "email", "phone", "name", "source", "status", "lifecycle",
      "email_opt_in", "sms_consent", "sms_consent_at", "tags",
      "last_emailed_at", "unsubscribed_at", "created_at", "notes",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : "");

    const lines = rows.map((r) => {
      let emailOptIn: unknown = true;
      try {
        emailOptIn = JSON.parse(r.preferences || "{}").emailOptIn ?? true;
      } catch {
        emailOptIn = true;
      }
      return [
        r.id, r.email, r.phone, r.name, r.source, r.status, r.lifecycle,
        emailOptIn, r.smsConsent, iso(r.smsConsentAt), r.tags,
        iso(r.lastEmailedAt), iso(r.unsubscribedAt), iso(r.createdAt), r.notes,
      ].map(esc).join(",");
    });

    const csv = [cols.join(","), ...lines].join("\r\n");

    await logAdminAction(admin.id, "crm.export", "subscribers", 0, {
      count: rows.length, q, status, lifecycle, includeUnsub,
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    console.error("[admin/crm/export]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
