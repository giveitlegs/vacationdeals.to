/**
 * Email client using Resend.
 * Set RESEND_API_KEY in .env to enable.
 *
 * Resend is dev-friendly: https://resend.com
 * Pricing: 3,000 free emails/month, then $0.10 per 1k
 */

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: Record<string, string>;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — email not sent");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const fromAddress = opts.from || process.env.EMAIL_FROM || "VacationDeals.to <hello@vacationdeals.to>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        reply_to: opts.replyTo,
        tags: opts.tags ? Object.entries(opts.tags).map(([name, value]) => ({ name, value })) : undefined,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { ok: false, error: `HTTP ${res.status}: ${errorText.slice(0, 200)}` };
    }

    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Generate an HTML email wrapper matching VacationDeals.to branding.
 */
export function emailTemplate(opts: {
  preheader?: string;
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  unsubscribeUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${opts.preheader}</div>` : ""}
  <table cellpadding="0" cellspacing="0" width="100%" style="background:#f3f4f6;padding:40px 20px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#2563EB;padding:24px;text-align:center;">
          <span style="color:#fff;font-size:24px;font-weight:900;">VacationDeals<span style="color:#FBBF24;">.to</span></span>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#111827;">${opts.title}</h1>
          <div style="font-size:15px;line-height:1.6;color:#374151;">${opts.body}</div>
          ${opts.ctaText && opts.ctaUrl ? `
            <div style="margin:28px 0;text-align:center;">
              <a href="${opts.ctaUrl}" style="display:inline-block;background:#2563EB;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">${opts.ctaText}</a>
            </div>
          ` : ""}
        </td></tr>
        <tr><td style="padding:20px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
          <p style="margin:0 0 8px;">You&apos;re receiving this because you opted in at VacationDeals.to.</p>
          <p style="margin:0;"><a href="${opts.unsubscribeUrl}" style="color:#6b7280;">Unsubscribe</a> &middot; <a href="https://vacationdeals.to/privacy" style="color:#6b7280;">Privacy Policy</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
