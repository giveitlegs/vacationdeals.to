import "server-only";
import { sendEmail } from "./client";
import { makeConfirmToken } from "./confirm-token";
import { signEmail } from "../unsubscribe-token";
import { getFeaturedDeals } from "../queries";

const FROM = process.env.EMAIL_FROM || "VacationDeals.to <hello@vacationdeals.to>";
const SITE_URL = "https://vacationdeals.to";

function escape(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendWelcomeEmail(opts: { email: string; source: string }): Promise<void> {
  const { email, source } = opts;
  const lower = email.toLowerCase();
  const confirmToken = makeConfirmToken(lower);
  const unsubToken = signEmail(lower);
  const confirmUrl = `${SITE_URL}/api/email/confirm?email=${encodeURIComponent(lower)}&t=${confirmToken}`;
  const unsubUrl = `${SITE_URL}/api/email/unsubscribe?email=${encodeURIComponent(lower)}&t=${unsubToken}`;

  const deals = (await getFeaturedDeals(3)) || [];
  const dealsHtml = deals
    .map(
      (d) => `
      <tr><td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
        <a href="${SITE_URL}/deals/${escape(d.slug)}" style="color:#111827;text-decoration:none;font-weight:600;font-size:15px;">${escape(d.title)}</a>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">
          ${escape([d.city, d.state].filter(Boolean).join(", "))} · ${d.durationNights}N/${d.durationDays}D
        </div>
        <div style="font-size:18px;color:#10b981;font-weight:700;margin-top:6px;">$${escape(d.price)}${d.originalPrice ? ` <span style="text-decoration:line-through;color:#9ca3af;font-size:13px;font-weight:400;">$${escape(d.originalPrice)}</span>` : ""}</div>
      </td></tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table cellpadding="0" cellspacing="0" width="100%" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#2563EB;padding:24px;text-align:center;">
          <span style="color:#fff;font-size:24px;font-weight:900;">VacationDeals<span style="color:#FBBF24;">.to</span></span>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <h1 style="margin:0 0 12px;font-size:22px;color:#111827;">One quick step — confirm your email</h1>
          <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 20px;">
            Thanks for opting in. Tap the button below to confirm so we know your address is real, then we'll start sending you the cheapest vacation packages we find.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${confirmUrl}" style="display:inline-block;background:#2563EB;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Confirm my email</a>
          </div>
          <p style="font-size:13px;color:#6b7280;margin:0 0 28px;">If the button doesn't work, copy this link: <br><span style="color:#374151;word-break:break-all;">${escape(confirmUrl)}</span></p>

          <h2 style="margin:32px 0 8px;font-size:17px;color:#111827;">A few of today's lowest-priced deals</h2>
          <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">${dealsHtml}</table>
          <div style="text-align:center;margin:24px 0 0;">
            <a href="${SITE_URL}/deals" style="display:inline-block;color:#2563EB;text-decoration:none;font-weight:600;font-size:14px;">See all 500+ deals →</a>
          </div>
        </td></tr>
        <tr><td style="padding:18px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
          <p style="margin:0 0 6px;">You opted in via <strong>${escape(source)}</strong> at VacationDeals.to.</p>
          <p style="margin:0;"><a href="${unsubUrl}" style="color:#6b7280;">Unsubscribe</a> &middot; <a href="${SITE_URL}/privacy" style="color:#6b7280;">Privacy Policy</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `Thanks for opting in to VacationDeals.to.

Confirm your email by visiting:
${confirmUrl}

Then we'll send the cheapest vacation packages we find.

Unsubscribe: ${unsubUrl}`;

  const result = await sendEmail({
    to: email,
    from: FROM,
    subject: "Confirm your email — VacationDeals.to",
    html,
    text,
  });

  if (!result.ok) {
    console.warn(`[welcome] email failed for ${email}: ${result.error}`);
  }
}
