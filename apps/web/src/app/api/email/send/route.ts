import { NextRequest, NextResponse } from "next/server";
import { sendEmail, emailTemplate } from "@/lib/email/client";
import { getCurrentAdmin } from "@/lib/admin/auth";

/**
 * POST /api/email/send
 * Admin-only endpoint to send transactional or campaign emails.
 *
 * Body:
 *   { to: string|string[], subject: string, body: string (HTML), ctaText?, ctaUrl? }
 */
export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { to, subject, body, ctaText, ctaUrl, preheader } = await request.json();
    if (!to || !subject || !body) {
      return NextResponse.json({ error: "Missing to/subject/body" }, { status: 400 });
    }

    // Generate unsubscribe token per recipient if needed
    const unsubscribeUrl = `https://vacationdeals.to/api/email/unsubscribe?email=${encodeURIComponent(Array.isArray(to) ? to[0] : to)}`;
    const html = emailTemplate({ title: subject, body, ctaText, ctaUrl, unsubscribeUrl, preheader });

    const result = await sendEmail({ to, subject, html });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
