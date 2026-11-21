import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, logAdminAction } from "@/lib/admin/auth";
import { isSameOrigin } from "@/lib/admin/csrf";
import { sendEmail } from "@/lib/email/client";

/**
 * POST /api/admin/leads — inbox actions on a lead submission:
 *   { action: "reply", id, subject, body }  → email the lead from contact@, log the
 *       reply in lead_responses, flip status to "replied".
 *   { action: "status", id, value }         → set status (new|contacted|replied|closed).
 *
 * Guarded exactly like the other admin mutations: session required + same-origin CSRF.
 * The listing itself is read by the /admin/leads server component (no GET here).
 */

const FROM = process.env.LEADS_FROM || "VacationDeals.to <contact@vacationdeals.to>";
const REPLY_TO = process.env.LEADS_REPLY_TO || "contact@vacationdeals.to";
const STATUSES = ["new", "contacted", "replied", "closed"];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  let payload: { action?: string; id?: number; subject?: string; body?: string; value?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, id } = payload;
  if (!id || typeof id !== "number") {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");

    const [lead] = await db
      .select()
      .from(schema.leadSubmissions)
      .where(eq(schema.leadSubmissions.id, id))
      .limit(1);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    if (action === "status") {
      const value = payload.value ?? "";
      if (!STATUSES.includes(value)) {
        return NextResponse.json({ error: "bad status" }, { status: 400 });
      }
      await db
        .update(schema.leadSubmissions)
        .set({ status: value })
        .where(eq(schema.leadSubmissions.id, id));
      await logAdminAction(admin.id, "lead.status", "lead_submission", id, { value });
      return NextResponse.json({ ok: true });
    }

    if (action === "reply") {
      const subject = (payload.subject ?? "").trim().slice(0, 500);
      const body = (payload.body ?? "").trim().slice(0, 20000);
      if (!subject || !body) {
        return NextResponse.json({ error: "subject and body required" }, { status: 400 });
      }

      const htmlBody = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#111827;max-width:600px;">${escapeHtml(
        body,
      ).replace(/\n/g, "<br>")}<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"><p style="font-size:12px;color:#6b7280;">VacationDeals.to &middot; Reply to this email to reach us at ${REPLY_TO}.</p></div>`;

      const result = await sendEmail({
        to: lead.subscriberEmail,
        subject,
        html: htmlBody,
        text: body,
        from: FROM,
        replyTo: REPLY_TO,
      });

      if (!result.ok) {
        return NextResponse.json(
          { error: result.error || "Email send failed" },
          { status: 502 },
        );
      }

      await db.insert(schema.leadResponses).values({
        leadSubmissionId: id,
        adminUserId: admin.id,
        toEmail: lead.subscriberEmail,
        subject,
        body,
        providerMessageId: result.id ?? null,
      });
      await db
        .update(schema.leadSubmissions)
        .set({ status: "replied" })
        .where(eq(schema.leadSubmissions.id, id));
      await logAdminAction(admin.id, "lead.reply", "lead_submission", id, {
        to: lead.subscriberEmail,
        subject,
      });
      return NextResponse.json({ ok: true, id: result.id });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[admin/leads] POST", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
