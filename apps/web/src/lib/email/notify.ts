import { sendEmail } from "./client";

const NOTIFY_TO = process.env.NOTIFY_EMAIL || "giveitlegs@live.com";
const NOTIFY_FROM = process.env.EMAIL_FROM || "VacationDeals.to <hello@vacationdeals.to>";

function escape(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function rows(record: Record<string, unknown>): string {
  return Object.entries(record)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;background:#f9fafb;font-weight:600;border:1px solid #e5e7eb;">${escape(k)}</td><td style="padding:6px 12px;border:1px solid #e5e7eb;">${escape(v)}</td></tr>`,
    )
    .join("");
}

export async function notifyFormSubmission(opts: {
  formName: string;
  data: Record<string, unknown>;
}): Promise<void> {
  const { formName, data } = opts;
  const html = `<h2 style="margin:0 0 12px;font-family:sans-serif;">New ${escape(formName)} submission</h2>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">${rows(data)}</table>
<p style="margin-top:18px;font-size:12px;color:#6b7280;">VacationDeals.to · ${new Date().toISOString()}</p>`;

  const result = await sendEmail({
    to: NOTIFY_TO,
    from: NOTIFY_FROM,
    subject: `[VacationDeals.to] ${formName} — ${data.email || data.name || "new submission"}`,
    html,
  });

  if (!result.ok) {
    console.warn(`[notify] ${formName} email failed: ${result.error}`);
  }
}
