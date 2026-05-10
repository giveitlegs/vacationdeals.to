import { NextRequest, NextResponse } from "next/server";
import { verifyConfirmToken } from "@/lib/email/confirm-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function html(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:80px auto;background:#fff;border-radius:12px;padding:40px;text-align:center;">
    <div style="font-size:22px;font-weight:900;color:#2563EB;margin-bottom:24px;">VacationDeals<span style="color:#FBBF24;">.to</span></div>
    <h1 style="margin:0 0 16px;font-size:22px;color:#111827;">${title}</h1>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px;">${body}</p>
    <a href="https://vacationdeals.to/deals" style="display:inline-block;background:#2563EB;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Browse all deals</a>
  </div>
</body></html>`;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
  const token = url.searchParams.get("t");

  if (!email || !email.includes("@")) {
    return new NextResponse(html("Invalid link", "This confirmation link is missing the email address."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!verifyConfirmToken(email, token)) {
    return new NextResponse(html("Link expired", "This confirmation link has expired or is invalid. If you still want updates, opt in again at vacationdeals.to."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");

    await db
      .update(schema.consentRecords)
      .set({ doubleOptInConfirmed: true })
      .where(eq(schema.consentRecords.email, email));

    return new NextResponse(
      html(
        "You're confirmed",
        "Thanks — your email is verified. You'll start getting our lowest-priced vacation deals shortly.",
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  } catch (e) {
    console.error("[confirm] update failed:", e);
    return new NextResponse(html("Something went wrong", "We couldn't confirm your email right now. Try the link again in a moment."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
