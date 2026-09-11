/**
 * One-time backfill: migrate existing opt-ins from consent_records into the
 * `subscribers` source-of-truth table (Phase 0, 2026-09-10).
 *
 * consent_records already has clean email + phone columns (the phone-in-`company`
 * hack was only in data_inquiries), so this is a straight map, deduped by email,
 * preserving each subscriber's original opt-in date. Idempotent: existing
 * subscribers (by email) are skipped, so it is safe to re-run.
 *
 * Run from apps/scraper (which has tsx + the @vacationdeals/db symlink):
 *   cd /var/www/vacationdeals/apps/scraper && set -a && source /var/www/vacationdeals/.env && set +a \
 *     && ./node_modules/.bin/tsx /var/www/vacationdeals/scripts/backfill-subscribers.ts
 */
import { db } from "@vacationdeals/db";
import * as schema from "@vacationdeals/db";
import { desc } from "drizzle-orm";
import { randomBytes } from "node:crypto";

async function main() {
  const consents = await db
    .select()
    .from(schema.consentRecords)
    .orderBy(desc(schema.consentRecords.consentedAt));

  // Dedupe by email; keep the most-recent consent, but carry a phone from any row.
  const byEmail = new Map<string, (typeof consents)[number]>();
  for (const c of consents) {
    const email = (c.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) continue;
    const existing = byEmail.get(email);
    if (!existing) {
      byEmail.set(email, { ...c, email });
    } else if (!existing.phone && c.phone) {
      existing.phone = c.phone;
    }
  }

  let inserted = 0;
  let skipped = 0;
  for (const [email, c] of byEmail) {
    const phone = c.phone || null;
    const smsConsent = !!phone && !!c.tcpaConsent;
    const res = await db
      .insert(schema.subscribers)
      .values({
        email,
        phone,
        name: null,
        source: c.formSource || "backfill",
        status: "active",
        smsConsent,
        smsConsentAt: smsConsent ? c.consentedAt : null,
        lifecycle: "new",
        unsubscribeToken: randomBytes(24).toString("hex"),
        preferences: JSON.stringify({ emailOptIn: true, smsOptIn: smsConsent, dealAlerts: true }),
        createdAt: c.consentedAt || new Date(),
      })
      .onConflictDoNothing({ target: schema.subscribers.email })
      .returning({ id: schema.subscribers.id });
    if (res.length) inserted++;
    else skipped++;
  }

  console.log(
    `Backfill complete. unique emails: ${byEmail.size} | inserted: ${inserted} | skipped(existing): ${skipped}`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error("[backfill-subscribers] failed:", e);
  process.exit(1);
});
