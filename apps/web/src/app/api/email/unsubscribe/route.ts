import { NextRequest, NextResponse } from "next/server";
import { unsubscribeSecret, verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

/**
 * GET /api/email/unsubscribe?email=...&t=<hmac>
 * Marks subscriber as unsubscribed.
 *
 * `t` is an HMAC-SHA256 of the email keyed by UNSUBSCRIBE_SECRET (or
 * PAYLOAD_SECRET as fallback) — required to prevent random-stranger
 * unsubscribe enumeration. Old links without `t` are accepted but
 * never echo the email into HTML; the response just confirms generically.
 */

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;"
      : c === "<" ? "&lt;"
      : c === ">" ? "&gt;"
      : c === '"' ? "&quot;"
      : "&#39;",
  );
}

function isPlausibleEmail(s: string): boolean {
  if (s.length > 254) return false;
  return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(s);
}

const HTML_OK = (msg: string) =>
  `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;">
    <h1>Unsubscribed</h1>
    <p>${msg}</p>
    <p><a href="https://vacationdeals.to">Back to VacationDeals.to</a></p>
  </body></html>`;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
  const token = url.searchParams.get("t");

  // Validate email shape FIRST — never let a malformed string reach the DB
  // or the HTML renderer.
  if (!email || !isPlausibleEmail(email)) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  }

  // Token check (required when secret is configured). Tokenless links from
  // legacy email batches still work — but we don't echo the email back.
  const tokenValid = verifyUnsubscribeToken(email, token);
  const secretConfigured = !!unsubscribeSecret();
  if (secretConfigured && !tokenValid) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  }

  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");

    await db.update(schema.subscribers)
      .set({ status: "unsubscribed", unsubscribedAt: new Date() })
      .where(eq(schema.subscribers.email, email));

    // Echo only when the token validated — and even then HTML-escape.
    const safeEcho = tokenValid ? escapeHtml(email) : "Your address";
    return new NextResponse(HTML_OK(`${safeEcho} has been removed from our email list.`), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return new NextResponse("Failed to unsubscribe. Please contact privacy@vacationdeals.to.", { status: 500 });
  }
}
