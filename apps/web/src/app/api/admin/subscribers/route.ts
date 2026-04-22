import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, logAdminAction } from "@/lib/admin/auth";

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";
  const search = url.searchParams.get("q")?.toLowerCase() ?? "";

  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { desc } = await import("drizzle-orm");

    const consents = await db.select().from(schema.consentRecords).orderBy(desc(schema.consentRecords.consentedAt)).limit(5000);
    const inquiries = await db.select().from(schema.dataInquiries).orderBy(desc(schema.dataInquiries.createdAt)).limit(5000);

    // Unified rows — same output schema for both sources
    type Row = {
      email: string;
      phone?: string;
      name?: string;
      source: string;
      created: string;
      tcpa: boolean;
    };
    const rows: Row[] = [];
    for (const c of consents) {
      rows.push({
        email: c.email || "",
        phone: c.phone || "",
        name: "",
        source: c.formSource || "roulette",
        created: c.consentedAt ? new Date(c.consentedAt).toISOString() : "",
        tcpa: c.tcpaConsent ?? true,
      });
    }
    for (const i of inquiries) {
      rows.push({
        email: i.email || "",
        phone: "",
        name: i.name || i.company || "",
        source: i.inquiryType || "b2b_inquiry",
        created: i.createdAt ? new Date(i.createdAt).toISOString() : "",
        tcpa: false,
      });
    }

    const filtered = search
      ? rows.filter((r) => (r.email + r.phone + r.name + r.source).toLowerCase().includes(search))
      : rows;

    if (format === "csv") {
      const header = "email,phone,name,source,created,tcpa_consent";
      const lines = filtered.map((r) =>
        [r.email, r.phone, r.name, r.source, r.created, r.tcpa].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
      );
      const csv = [header, ...lines].join("\n");
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    await logAdminAction(admin.id, "subscribers.list", "subscribers", 0, { count: filtered.length, format });
    return NextResponse.json({ rows: filtered, count: filtered.length });
  } catch (e) {
    console.error("[admin/subscribers] GET", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { action, email } = await request.json();
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");

    if (action === "unsubscribe") {
      if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
      await db.delete(schema.consentRecords).where(eq(schema.consentRecords.email, email));
      await db.delete(schema.dataInquiries).where(eq(schema.dataInquiries.email, email));
      await logAdminAction(admin.id, "subscriber.unsubscribe", "subscriber", 0, { email });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[admin/subscribers] POST", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
