/**
 * Deal Health Check — runs daily via cron
 *
 * 1. Marks deals past their expiresAt date as inactive
 * 2. HEAD-requests all active deal URLs, marks 404/410s as inactive
 *    (NOT 403 — Akamai/Cloudflare bot-blocks return 403 for pages that load
 *    fine in a real browser; killing on 403 would wipe Holiday Inn et al.)
 * 3. Deactivates deals whose URL redirects to a different root domain
 *    (seen: timesharepresentationdeals.com now 301s to a pet-clinic site)
 * 4. For event sites (westgateevents.com), GETs the body and deactivates
 *    deals marked "Sold Out" or "This event has passed"
 * 5. Logs results
 */

import { db } from "@vacationdeals/db";
import { deals } from "@vacationdeals/db";
import { eq, and, lt, isNotNull } from "drizzle-orm";

const RATE_LIMIT_MS = 500; // 2 requests/second

// Domains whose pages report per-event availability in the body.
const EVENT_BODY_CHECK_HOSTS = ["westgateevents.com"];
const DEAD_BODY_PATTERNS =
  /sold\s*out!?|this\s+event\s+has\s+passed|event\s+has\s+ended/i;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Registrable root domain, good enough for our sources (foo.bar.com -> bar.com). */
function rootDomain(hostname: string): string {
  const parts = hostname.replace(/^www\./, "").split(".");
  return parts.slice(-2).join(".");
}

async function checkUrlHealth(
  url: string,
): Promise<{ status: number; finalUrl: string }> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    return { status: response.status, finalUrl: response.url || url };
  } catch (err) {
    // DNS failure means the host itself is gone (seen: loreto/cancun
    // .villadelpalmar.com subdomains stopped resolving) — that IS dead.
    const code = (err as { cause?: { code?: string } })?.cause?.code;
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
      return { status: -2, finalUrl: url };
    }
    return { status: -1, finalUrl: url }; // timeout/reset — assume alive
  }
}

async function fetchBodyText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function main() {
  console.log("=== Deal Health Check ===");
  console.log(`Started at ${new Date().toISOString()}`);

  // Step 1: Deactivate deals past their expiresAt date
  const now = new Date();
  const expiredResult = await db
    .update(deals)
    .set({ isActive: false, updatedAt: now })
    .where(
      and(
        eq(deals.isActive, true),
        isNotNull(deals.expiresAt),
        lt(deals.expiresAt, now),
      ),
    )
    .returning({ id: deals.id, title: deals.title });

  console.log(`\nStep 1: ${expiredResult.length} deals expired by date`);
  for (const d of expiredResult) {
    console.log(`  [expired] ${d.title}`);
  }

  // Step 1b: Zombie sweep — deals whose crawler hasn't re-verified them in
  // 21 days are stale-priced and untrustworthy even if their URL still 200s
  // (QA 2026-07-22 found 10 "active" deals unscraped since April/May: their
  // crawlers moved to new URLs and the old rows lingered active forever).
  const STALE_DAYS = 21;
  const staleCutoff = new Date(now.getTime() - STALE_DAYS * 24 * 3600 * 1000);
  const staleResult = await db
    .update(deals)
    .set({ isActive: false, updatedAt: now })
    .where(
      and(
        eq(deals.isActive, true),
        lt(deals.scrapedAt, staleCutoff),
      ),
    )
    .returning({ id: deals.id, title: deals.title });
  console.log(`\nStep 1b: ${staleResult.length} zombie deals (unscraped >${STALE_DAYS}d) deactivated`);
  for (const d of staleResult) {
    console.log(`  [zombie] ${d.title}`);
  }

  // Step 2: Check active deal URLs for 404s
  const activeDeals = await db
    .select({ id: deals.id, title: deals.title, url: deals.url, slug: deals.slug })
    .from(deals)
    .where(eq(deals.isActive, true));

  console.log(`\nStep 2: Checking ${activeDeals.length} active deal URLs...`);

  let deactivated = 0;
  let checked = 0;
  const dead: string[] = [];

  for (const deal of activeDeals) {
    const { status, finalUrl } = await checkUrlHealth(deal.url);
    checked++;

    let deadReason: string | null = null;

    if (status === 404 || status === 410) {
      deadReason = `HTTP ${status}`;
    } else if (status === -2) {
      deadReason = "DNS: host no longer resolves";
    }

    // Domain-repurpose check: redirect landed on a different root domain.
    if (!deadReason && status > 0 && status < 400) {
      try {
        const fromHost = rootDomain(new URL(deal.url).hostname);
        const toHost = rootDomain(new URL(finalUrl).hostname);
        if (fromHost !== toHost) {
          deadReason = `redirects off-domain to ${toHost}`;
        }
      } catch {
        /* unparseable URL — leave alone */
      }
    }

    // Event-body check: page is alive but the event is sold out / passed.
    if (!deadReason && status > 0 && status < 400) {
      try {
        const host = new URL(deal.url).hostname.replace(/^www\./, "");
        if (EVENT_BODY_CHECK_HOSTS.includes(rootDomain(host))) {
          const body = await fetchBodyText(deal.url);
          if (body && DEAD_BODY_PATTERNS.test(body)) {
            deadReason = "sold out / event passed";
          }
        }
      } catch {
        /* leave alone */
      }
    }

    if (deadReason) {
      await db
        .update(deals)
        .set({ isActive: false, updatedAt: now })
        .where(eq(deals.id, deal.id));
      deactivated++;
      dead.push(`${deal.title} (${deadReason})`);
      console.log(`  [dead: ${deadReason}] ${deal.title}`);
    }

    if (checked % 50 === 0) {
      console.log(`  ... checked ${checked}/${activeDeals.length}`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log(`\n=== Health Check Complete ===`);
  console.log(`Checked: ${checked} URLs`);
  console.log(`Expired by date: ${expiredResult.length}`);
  console.log(`Dead URLs (404/410/403): ${deactivated}`);
  console.log(`Still active: ${checked - deactivated}`);

  if (dead.length > 0) {
    console.log(`\nDeactivated deals:`);
    dead.forEach((d) => console.log(`  - ${d}`));
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Health check failed:", err);
  process.exit(1);
});
