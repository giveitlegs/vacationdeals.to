import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { notifyFormSubmission } from "@/lib/email/notify";
import { sendWelcomeEmail } from "@/lib/email/welcome";
import { rateLimit } from "@/lib/rate-limit";

// Optional Cloudflare Turnstile. Active only when TURNSTILE_SECRET is set; until
// then the honeypot + rate-limit carry the load (no keys required).
async function turnstileOk(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return true; // not configured → skip
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token || "", remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false; // fail closed when a token is expected
  }
}

/**
 * POST /api/leads
 * Popup opt-in capture.
 *
 * Source of truth = the `subscribers` table (Phase 0, 2026-09-10). Every opt-in
 * ALSO appends an immutable `consent_records` row (TCPA audit trail — never mutated).
 * SMS consent is recorded separately and ONLY counts when a phone is present AND the
 * SMS box was explicitly ticked (TCPA — email opt-in never implies SMS).
 *
 * Body: { email, phone?, name?, source, tcpaConsent, termsConsent, smsConsent?, consentText }
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;
  const source = typeof body.source === "string" ? body.source : "popup";
  const tcpaConsent = body.tcpaConsent === true || body.tcpaConsent === "true";
  const termsConsent = body.termsConsent === true || body.termsConsent === "true";
  // SMS opt-in only counts with a phone present AND an explicit SMS checkbox.
  const smsConsent = !!phone && (body.smsConsent === true || body.smsConsent === "true");
  const consentText = typeof body.consentText === "string" ? body.consentText : null;
  const hpUrl = typeof body.hpUrl === "string" ? body.hpUrl.trim() : "";
  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";

  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // ── Abuse controls (bots hit public forms hard) ──
  // 1. Honeypot: a real user never fills hp_url. Pretend success, store nothing.
  if (hpUrl) return NextResponse.json({ ok: true });
  // 2. Per-IP rate limit: 5 opt-ins / 10 min.
  if (!rateLimit(`leads:${ipAddress}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests — try again shortly." }, { status: 429 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!tcpaConsent || !termsConsent) {
    return NextResponse.json({ error: "Consent checkboxes required" }, { status: 400 });
  }
  // 3. Turnstile (only enforced when TURNSTILE_SECRET is configured).
  if (!(await turnstileOk(turnstileToken, ipAddress))) {
    return NextResponse.json({ error: "Verification failed — please retry." }, { status: 400 });
  }

  try {

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { sql } = await import("drizzle-orm");

    // ── Upsert the subscriber (source of truth) ──
    await db.insert(schema.subscribers).values({
      email,
      phone,
      name,
      source,
      status: "active",
      smsConsent,
      smsConsentAt: smsConsent ? new Date() : null,
      unsubscribeToken: randomBytes(24).toString("hex"),
      preferences: JSON.stringify({ emailOptIn: true, smsOptIn: smsConsent, dealAlerts: true }),
    }).onConflictDoUpdate({
      target: schema.subscribers.email,
      set: {
        // Backfill phone/name only when newly provided; upgrade SMS consent if newly granted;
        // re-activate anyone who had unsubscribed and is opting back in.
        phone: sql`COALESCE(EXCLUDED.phone, ${schema.subscribers.phone})`,
        name: sql`COALESCE(EXCLUDED.name, ${schema.subscribers.name})`,
        smsConsent: sql`${schema.subscribers.smsConsent} OR EXCLUDED.sms_consent`,
        smsConsentAt: sql`COALESCE(${schema.subscribers.smsConsentAt}, EXCLUDED.sms_consent_at)`,
        status: sql`CASE WHEN ${schema.subscribers.status} = 'unsubscribed' THEN 'active' ELSE ${schema.subscribers.status} END`,
      },
    });

    // ── Append immutable consent record (TCPA audit trail) ──
    await db.insert(schema.consentRecords).values({
      email,
      phone,
      ipAddress,
      userAgent,
      formSource: source,
      consentText: consentText
        || `I agree to the Terms & Conditions and Privacy Policy, and consent to receive promotional emails${smsConsent ? " and SMS messages" : ""}. Consent is not a condition of any purchase.`,
      tcpaConsent: true,
      termsConsent: true,
      doubleOptInConfirmed: false,
    });

    notifyFormSubmission({
      formName: "Lead opt-in",
      data: {
        email,
        phone: phone || "",
        name: name || "",
        source,
        smsConsent: smsConsent ? "yes" : "no",
        ip: ipAddress,
        userAgent: userAgent.slice(0, 200),
      },
    }).catch((err) => console.warn("[leads] notify failed:", err));

    sendWelcomeEmail({ email, source }).catch((err) =>
      console.warn("[leads] welcome failed:", err),
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[leads] Failed:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
