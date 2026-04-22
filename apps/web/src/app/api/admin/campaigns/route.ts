import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, logAdminAction } from "@/lib/admin/auth";
import { sendEmail } from "@/lib/email/client";

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { action, campaignId, name, subject, htmlBody, textBody, testEmail, scheduledAt } = body;

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq, desc } = await import("drizzle-orm");

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
        html: campaign.htmlBody,
        text: campaign.textBody ?? undefined,
        tags: { campaign_id: String(campaign.id), kind: "test" },
      });

      await logAdminAction(admin.id, "campaign.send_test", "campaign", campaignId, { testEmail, ok: result.ok });

      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
      }
      return NextResponse.json({ ok: true, messageId: result.id });
    }

    if (action === "send_to_subscribers") {
      if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });
      const [campaign] = await db.select().from(schema.emailCampaigns)
        .where(eq(schema.emailCampaigns.id, campaignId)).limit(1);
      if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

      if (campaign.status === "sent") {
        return NextResponse.json({ error: "Already sent" }, { status: 400 });
      }

      // Pull all TCPA-consented email addresses
      const rows = await db.select({ email: schema.consentRecords.email })
        .from(schema.consentRecords);
      const emails = [...new Set(rows.map((r) => r.email).filter((e): e is string => !!e && e.includes("@")))];

      // Mark as sending
      await db.update(schema.emailCampaigns)
        .set({ status: "sending", sentAt: new Date() })
        .where(eq(schema.emailCampaigns.id, campaignId));

      let successCount = 0;
      let failCount = 0;

      // Send in batches of 50 — Resend supports arrays
      const BATCH = 50;
      for (let i = 0; i < emails.length; i += BATCH) {
        const batch = emails.slice(i, i + BATCH);
        const result = await sendEmail({
          to: batch,
          subject: campaign.subject,
          html: campaign.htmlBody,
          text: campaign.textBody ?? undefined,
          tags: { campaign_id: String(campaign.id), kind: "bulk" },
        });
        if (result.ok) successCount += batch.length;
        else failCount += batch.length;

        // Log individual sends for analytics
        for (const email of batch) {
          await db.insert(schema.emailSends).values({
            campaignId: campaign.id,
            email,
            status: result.ok ? "sent" : "bounced",
            providerMessageId: result.id ?? null,
          }).catch(() => {});
        }
      }

      // Mark as sent
      await db.update(schema.emailCampaigns)
        .set({
          status: "sent",
          sentAt: new Date(),
          totalSent: successCount,
        })
        .where(eq(schema.emailCampaigns.id, campaignId));

      await logAdminAction(admin.id, "campaign.send_bulk", "campaign", campaignId, {
        successCount,
        failCount,
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
