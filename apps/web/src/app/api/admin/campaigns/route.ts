import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, logAdminAction } from "@/lib/admin/auth";
import { isSameOrigin } from "@/lib/admin/csrf";
import { sendEmail } from "@/lib/email/client";
import { signEmail } from "@/lib/unsubscribe-token";

const SITE_URL = "https://vacationdeals.to";

// CAN-SPAM: every bulk email must carry a working unsubscribe link. We append a
// per-recipient footer (with their signed token) to the admin-authored HTML.
function withUnsubFooter(html: string, email: string): string {
  const token = signEmail(email);
  const unsubUrl = `${SITE_URL}/api/email/unsubscribe?email=${encodeURIComponent(email)}&t=${token}`;
  return `${html}
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
      You're receiving this because you opted in at VacationDeals.to.
      &middot; <a href="${unsubUrl}" style="color:#6b7280;">Unsubscribe</a>
      &middot; <a href="${SITE_URL}/privacy" style="color:#6b7280;">Privacy Policy</a>
    </div>`;
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  try {
    const body = await request.json();
    const { action, campaignId, name, subject, htmlBody, textBody, testEmail, scheduledAt, segment } = body;

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq, and } = await import("drizzle-orm");

    // Eligible recipients = active subscribers, email opt-in not explicitly false,
    // optionally narrowed by lifecycle/source. Unsubscribed/bounced ALWAYS excluded.
    const selectRecipients = async (
      seg?: { lifecycle?: string; source?: string },
    ): Promise<Array<{ id: number; email: string }>> => {
      const conds = [eq(schema.subscribers.status, "active")];
      if (seg?.lifecycle) conds.push(eq(schema.subscribers.lifecycle, seg.lifecycle));
      if (seg?.source) conds.push(eq(schema.subscribers.source, seg.source));
      const rows = await db.select({
        id: schema.subscribers.id,
        email: schema.subscribers.email,
        preferences: schema.subscribers.preferences,
      }).from(schema.subscribers).where(and(...conds)).limit(100000);
      const seen = new Set<string>();
      const out: Array<{ id: number; email: string }> = [];
      for (const r of rows) {
        const email = (r.email || "").trim().toLowerCase();
        if (!email || !email.includes("@") || seen.has(email)) continue;
        let emailOptIn = true;
        try { emailOptIn = JSON.parse(r.preferences || "{}").emailOptIn !== false; } catch { emailOptIn = true; }
        if (!emailOptIn) continue;
        seen.add(email);
        out.push({ id: r.id, email });
      }
      return out;
    };

    if (action === "create") {
      if (!name || !subject || !htmlBody) {
        return NextResponse.json({ error: "name, subject, htmlBody required" }, { status: 400 });
      }
      const [row] = await db.insert(schema.emailCampaigns).values({
        name,
        subject,
        htmlBody,
        textBody: textBody ?? null,
        status: "draft",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdByAdminId: admin.id,
      }).returning({ id: schema.emailCampaigns.id });
      await logAdminAction(admin.id, "campaign.create", "campaign", row.id, { name });
      return NextResponse.json({ ok: true, id: row.id });
    }

    if (action === "send_test") {
      if (!campaignId || !testEmail) {
        return NextResponse.json({ error: "campaignId + testEmail required" }, { status: 400 });
      }
      const [campaign] = await db.select().from(schema.emailCampaigns)
        .where(eq(schema.emailCampaigns.id, campaignId)).limit(1);
      if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

      const result = await sendEmail({
        to: testEmail,
        subject: `[TEST] ${campaign.subject}`,
        html: withUnsubFooter(campaign.htmlBody, testEmail),
        text: campaign.textBody ?? undefined,
        tags: { campaign_id: String(campaign.id), kind: "test" },
      });
      await logAdminAction(admin.id, "campaign.send_test", "campaign", campaignId, { testEmail, ok: result.ok });
      if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, messageId: result.id });
    }

    // Preview the recipient count for the current segment (no send).
    if (action === "count") {
      const recips = await selectRecipients(segment);
      return NextResponse.json({ ok: true, count: recips.length });
    }

    if (action === "send_to_subscribers") {
      if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });
      const [campaign] = await db.select().from(schema.emailCampaigns)
        .where(eq(schema.emailCampaigns.id, campaignId)).limit(1);
      if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      if (campaign.status === "sent" || campaign.status === "sending") {
        return NextResponse.json({ error: `Campaign already ${campaign.status}` }, { status: 400 });
      }

      const recipients = await selectRecipients(segment);
      if (recipients.length === 0) {
        return NextResponse.json({ error: "No eligible active subscribers for this segment" }, { status: 400 });
      }

      await db.update(schema.emailCampaigns)
        .set({ status: "sending" }).where(eq(schema.emailCampaigns.id, campaignId));

      let successCount = 0;
      let failCount = 0;
      // Send INDIVIDUALLY (never a shared To: — recipients must not see each other),
      // each with its own unsubscribe link. Fine at current list size; move to a
      // queue if the list grows into the thousands.
      for (const sub of recipients) {
        const result = await sendEmail({
          to: sub.email,
          subject: campaign.subject,
          html: withUnsubFooter(campaign.htmlBody, sub.email),
          text: campaign.textBody ?? undefined,
          tags: { campaign_id: String(campaign.id), kind: "bulk" },
        });
        if (result.ok) successCount++; else failCount++;
        await db.insert(schema.emailSends).values({
          campaignId: campaign.id,
          subscriberId: sub.id,
          email: sub.email,
          status: result.ok ? "sent" : "bounced",
          providerMessageId: result.id ?? null,
        }).catch(() => {});
        if (result.ok) {
          await db.update(schema.subscribers)
            .set({ lastEmailedAt: new Date() })
            .where(eq(schema.subscribers.id, sub.id)).catch(() => {});
        }
      }

      await db.update(schema.emailCampaigns)
        .set({ status: "sent", sentAt: new Date(), totalSent: successCount, totalBounced: failCount })
        .where(eq(schema.emailCampaigns.id, campaignId));
      await logAdminAction(admin.id, "campaign.send_bulk", "campaign", campaignId, {
        successCount, failCount, segment: segment ?? null,
      });
      return NextResponse.json({ ok: true, successCount, failCount });
    }

    if (action === "delete") {
      if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });
      await db.delete(schema.emailCampaigns).where(eq(schema.emailCampaigns.id, campaignId));
      await logAdminAction(admin.id, "campaign.delete", "campaign", campaignId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[admin/campaigns]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
