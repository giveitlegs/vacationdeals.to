import { NextRequest, NextResponse } from "next/server";
import { notifyFormSubmission } from "@/lib/email/notify";

/**
 * POST /api/leads
 * Stores email/SMS opt-ins with full TCPA consent records.
 * Body: { email, phone?, source, tcpaConsent, termsConsent, consentText }
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone : null;
  const source = typeof body.source === "string" ? body.source : null;
  const tcpaConsent = body.tcpaConsent === true || body.tcpaConsent === "true";
  const termsConsent = body.termsConsent === true || body.termsConsent === "true";
  const consentText = typeof body.consentText === "string" ? body.consentText : null;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (!tcpaConsent || !termsConsent) {
    return NextResponse.json({ error: "Consent checkboxes required" }, { status: 400 });
  }

  try {

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
      name: typeof body.name === "string" ? body.name : "Opt-In Lead",
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

    notifyFormSubmission({
      formName: "Lead opt-in",
      data: {
        email,
        phone: phone || "",
        source: source || "(not provided)",
        ip: ipAddress,
        userAgent: userAgent.slice(0, 200),
        consent: tcpaConsent && termsConsent ? "TCPA + Terms accepted" : "incomplete",
      },
    }).catch((err) => console.warn("[leads] notify failed:", err));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[leads] Failed:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
