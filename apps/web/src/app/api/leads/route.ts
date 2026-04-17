import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/leads
 * Stores email/SMS opt-ins with full TCPA consent records.
 * Body: { email, phone?, source, tcpaConsent, termsConsent, consentText }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, source, tcpaConsent, termsConsent, consentText } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!tcpaConsent || !termsConsent) {
      return NextResponse.json({ error: "Consent checkboxes required" }, { status: 400 });
    }

    // Get IP address from headers
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");

    // Store the lead
    await db.insert(schema.dataInquiries).values({
      name: body.name || "Opt-In Lead",
      email,
      company: phone || null, // repurpose company field for phone temporarily
      inquiryType: source || "roulette_optin",
      message: phone ? `Phone: ${phone}` : null,
      status: "new",
    });

    // Store TCPA consent record (immutable audit trail)
    await db.insert(schema.consentRecords).values({
      email,
      phone: phone || null,
      ipAddress,
      userAgent,
      formSource: source || "roulette_optin",
      consentText: consentText || "I agree to the Terms & Conditions and Privacy Policy, and consent to receive promotional emails and SMS messages. Consent is not a condition of any purchase.",
      tcpaConsent: true,
      termsConsent: true,
      doubleOptInConfirmed: false, // will be set true after confirmation
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[leads] Failed:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
