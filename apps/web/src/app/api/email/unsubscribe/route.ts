import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/email/unsubscribe?email=...
 * Marks subscriber as unsubscribed.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return new NextResponse("Invalid unsubscribe link", { status: 400 });
  }

  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");

    await db.update(schema.subscribers)
      .set({ status: "unsubscribed", unsubscribedAt: new Date() })
      .where(eq(schema.subscribers.email, email));

    return new NextResponse(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;">
      <h1>Unsubscribed</h1>
      <p>${email} has been removed from our email list.</p>
      <p><a href="https://vacationdeals.to">Back to VacationDeals.to</a></p>
    </body></html>`, { headers: { "Content-Type": "text/html" } });
  } catch {
    return new NextResponse("Failed to unsubscribe. Please contact privacy@vacationdeals.to.", { status: 500 });
  }
}
