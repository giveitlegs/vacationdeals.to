/**
 * Dead-man freshness alert — runs daily via cron.
 *
 * The April–July 2026 outage (crontab lost SHELL=/bin/bash, every scraper
 * cron died silently for 2.5 months) went unnoticed because nothing watched
 * whether scraping was still happening. This script is the guardrail:
 *
 * 1. If the newest deals.scraped_at across ALL active deals is older than
 *    STALE_HOURS, the pipeline is dead — email an alert via Resend.
 * 2. Also lists active sources whose newest scrape is older than
 *    SOURCE_STALE_HOURS (informational section in the same email, or logged
 *    when no alert email is needed).
 *
 * Uses the existing Resend account (free tier) — no new cost.
 */

import { db, deals, sources } from "@vacationdeals/db";
import { eq, sql } from "drizzle-orm";

const STALE_HOURS = 26; // waves run every 6h; 26h means >4 missed cycles
const SOURCE_STALE_HOURS = 72;
const ALERT_TO = "giveitlegs@live.com";
const ALERT_FROM = "VacationDeals Monitor <alerts@vacationdeals.to>";

async function sendAlert(subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY not set — cannot send alert email");
    process.exit(2);
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: ALERT_FROM, to: [ALERT_TO], subject, text }),
  });
  if (!res.ok) {
    console.error(`Resend API error ${res.status}: ${await res.text()}`);
    process.exit(2);
  }
  console.log(`Alert email sent to ${ALERT_TO}`);
}

async function main() {
  console.log(`=== Scrape Freshness Check ${new Date().toISOString()} ===`);

  const [global] = await db
    .select({ newest: sql<string>`MAX(${deals.scrapedAt})` })
    .from(deals)
    .where(eq(deals.isActive, true));

  const newest = global?.newest ? new Date(global.newest) : null;
  const ageHours = newest
    ? (Date.now() - newest.getTime()) / 3_600_000
    : Infinity;
  console.log(
    `Newest active-deal scrape: ${newest?.toISOString() ?? "NONE"} (${ageHours.toFixed(1)}h ago)`,
  );

  const staleSources = await db
    .select({
      key: sources.scraperKey,
      status: sources.status,
      newest: sql<string>`MAX(${deals.scrapedAt})`,
    })
    .from(sources)
    .leftJoin(
      deals,
      sql`${deals.sourceId} = ${sources.id} AND ${deals.isActive} = true`,
    )
    .where(eq(sources.status, "active"))
    .groupBy(sources.id)
    .having(
      sql`MAX(${deals.scrapedAt}) IS NULL OR MAX(${deals.scrapedAt}) < now() - interval '${sql.raw(String(SOURCE_STALE_HOURS))} hours'`,
    );

  if (staleSources.length > 0) {
    console.log(`Sources with no fresh deals in ${SOURCE_STALE_HOURS}h:`);
    for (const s of staleSources) {
      console.log(`  - ${s.key} (newest: ${s.newest ?? "never"})`);
    }
  }

  if (ageHours > STALE_HOURS) {
    const staleList = staleSources
      .map((s) => `  - ${s.key} (newest: ${s.newest ?? "never"})`)
      .join("\n");
    await sendAlert(
      "🚨 VacationDeals.to scrapers appear DEAD",
      `No deal has been scraped in ${ageHours.toFixed(1)} hours (threshold ${STALE_HOURS}h).\n` +
        `Newest scrape: ${newest?.toISOString() ?? "NONE"}\n\n` +
        `Likely causes seen before:\n` +
        `  - crontab lost its SHELL=/bin/bash line (April 2026 outage)\n` +
        `  - stale Crawlee request queue (runs report "Stored 0")\n` +
        `  - VPS disk full / PM2 or Postgres down\n\n` +
        `Check: ssh root@72.60.126.82, crontab -l, /var/log/vacdeals-wave*.log\n\n` +
        (staleList ? `Stale sources (>${SOURCE_STALE_HOURS}h):\n${staleList}\n` : ""),
    );
  } else {
    console.log(`OK — pipeline alive (threshold ${STALE_HOURS}h).`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Freshness check failed:", err);
  process.exit(1);
});
