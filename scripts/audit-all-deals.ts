/**
 * audit-all-deals.ts — fetch every active deal's source URL and compare
 *                     the visible price + nights + title to what we have stored.
 *
 * Generalized from audit-westgate-accuracy.ts. Reads a snapshot JSON
 * (active-deals-snapshot.json) so it can run locally without a DB
 * connection, and writes a per-source-grouped report to reports/.
 *
 * Strategy:
 *   - Plain fetch with a real User-Agent for static-HTML sources.
 *   - JS-heavy sources are flagged "skipped_js" — re-scraping with the
 *     existing Playwright crawlers is the source of truth for them.
 *   - Conservative verdicts: only flag a row when we have HIGH-CONFIDENCE
 *     evidence the DB is wrong (DB price isn't ANY of the prices visible
 *     on the page, AND the page has plausible prices). Generous tolerance
 *     for promotional rotation.
 *   - Per-host rate limit (one request per host at a time, 400ms gap),
 *     parallel across hosts (concurrency=8).
 *
 * Run:
 *   npx tsx scripts/audit-all-deals.ts
 *   npx tsx scripts/audit-all-deals.ts --source=westgate
 *   npx tsx scripts/audit-all-deals.ts --limit=20    # smoke test
 */

import fs from "node:fs";
import path from "node:path";
import { URL as NodeURL } from "node:url";

interface DealRow {
  scraper_key: string;
  id: number;
  title: string;
  price: number;
  nights: number | null;
  url: string;
}

interface AuditRow {
  scraperKey: string;
  dealId: number;
  dbTitle: string;
  dbPrice: number;
  dbNights: number | null;
  url: string;
  pageStatus: number;
  pageTitle: string | null;
  pricesOnPage: number[];
  nightsOnPage: number[];
  verdict:
    | "ok"
    | "price_mismatch"
    | "nights_mismatch"
    | "price_and_nights_mismatch"
    | "no_price_on_page"
    | "unreachable"
    | "login_wall"
    | "skipped_js";
  evidence: { titleSnippet?: string; priceContext?: string; nightsContext?: string; reason?: string };
}

const argv = process.argv.slice(2);
const SRC_FILTER = argv.find((a) => a.startsWith("--source="))?.split("=")[1] ?? null;
const LIMIT = Number(argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? Infinity);
const SNAPSHOT = path.join(process.cwd(), "reports", "active-deals-snapshot.json");
const OUT = path.join(
  process.cwd(),
  "reports",
  `audit-all-deals-${new Date().toISOString().split("T")[0]}.json`,
);

// Sources whose pages need JS rendering — plain fetch returns an empty shell,
// so price/nights would always look "missing" and we'd flag everything. Skip
// these; the existing Playwright-based crawlers re-scrape them on the cron.
const JS_HEAVY = new Set([
  "marriott",
  "discount-vacation",
  "legendary",
  "getawaydealz",
  "monster-vacations",
  "iwanttotravelto",
  "vacation-offer",
  "all-inclusive-promotions",
  "ad-library",
]);

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";

function stripHtml(html: string): { title: string | null; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : null;
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return { title, text };
}

function parsePrices(text: string): number[] {
  // Match $X, $X.XX, $X,XXX, $X,XXX.XX
  const out = new Set<number>();
  for (const m of text.matchAll(/\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|\d+(?:\.\d{2})?)/g)) {
    const raw = m[1].replace(/,/g, "");
    const n = parseFloat(raw);
    // Vacpack-plausible window: $39 floor (matches deal-store.ts), $9999 ceiling.
    if (Number.isFinite(n) && n >= 39 && n <= 9999) out.add(n);
  }
  return [...out];
}

function parseNights(text: string): number[] {
  const out = new Set<number>();
  // "X night", "X-night", "X-Night/Y-Day", etc. Plausible vacpack range 1..14.
  for (const m of text.matchAll(/(\d+)[-\s]?night/gi)) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 14) out.add(n);
  }
  for (const m of text.matchAll(/(\d+)[-\s]?day/gi)) {
    // Days → nights = days - 1 (typical vacpack convention)
    const d = parseInt(m[1], 10);
    if (d >= 2 && d <= 15) out.add(d - 1);
  }
  return [...out];
}

function snippetAround(text: string, needle: string, span = 60): string {
  const idx = text.indexOf(needle);
  if (idx === -1) return "";
  return text.substring(Math.max(0, idx - span), Math.min(text.length, idx + needle.length + span)).trim();
}

function detectLoginWall(text: string, status: number): boolean {
  if (status >= 400) return false;
  const lower = text.toLowerCase().slice(0, 6000);
  const loginHits =
    (lower.includes("sign in") ? 1 : 0) +
    (lower.includes("log in") ? 1 : 0) +
    (lower.includes("forgot password") ? 1 : 0) +
    (lower.includes("create account") ? 1 : 0) +
    (lower.includes("forgot your password") ? 1 : 0);
  const hasPrice = /\$\s*\d{2,4}/.test(lower);
  return loginHits >= 2 && !hasPrice;
}

async function fetchPage(url: string): Promise<{ status: number; html: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      // 15s per-request budget
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();
    return { status: res.status, html };
  } catch {
    return { status: 0, html: "" };
  }
}

function classify(row: DealRow, page: { status: number; html: string }): AuditRow {
  const base: AuditRow = {
    scraperKey: row.scraper_key,
    dealId: row.id,
    dbTitle: row.title,
    dbPrice: row.price,
    dbNights: row.nights,
    url: row.url,
    pageStatus: page.status,
    pageTitle: null,
    pricesOnPage: [],
    nightsOnPage: [],
    verdict: "ok",
    evidence: {},
  };

  if (JS_HEAVY.has(row.scraper_key)) {
    base.verdict = "skipped_js";
    base.evidence.reason = "JS-rendered source — trust Playwright re-scrape";
    return base;
  }

  if (page.status === 0 || page.status >= 400) {
    base.verdict = "unreachable";
    base.evidence.reason = page.status === 0 ? "fetch failed (network/timeout)" : `HTTP ${page.status}`;
    return base;
  }

  const { title, text } = stripHtml(page.html);
  base.pageTitle = title;

  if (detectLoginWall(text, page.status)) {
    base.verdict = "login_wall";
    base.evidence.reason = "page looks like a login wall (no price, multiple sign-in cues)";
    return base;
  }

  // Focus on the head of the page where the listing surfaces price/nights.
  // We ALSO scan the full body (capped at 60KB) because some templates push
  // pricing further down (sticky CTA, accordion).
  const head = text.slice(0, 8000);
  const body = text.slice(0, 60000);
  base.pricesOnPage = parsePrices(body);
  base.nightsOnPage = parseNights(head);

  // ── Verdict ──────────────────────────────────────────────────────────────
  if (base.pricesOnPage.length === 0) {
    base.verdict = "no_price_on_page";
    base.evidence.titleSnippet = title?.slice(0, 200);
    base.evidence.reason = "no $ amount in $39-$9999 window found on page";
    return base;
  }

  // Tolerance: DB price matches if within $5 OR within 5% of any on-page price.
  const priceMatches = base.pricesOnPage.some((p) => {
    const diff = Math.abs(p - row.price);
    return diff <= 5 || diff / row.price <= 0.05;
  });

  // Nights tolerance: exact match (3 vs 4 nights is a real bug, not noise).
  // If page has no nights data, do NOT flag (some pages just don't show it).
  const nightsMatches =
    row.nights == null ||
    base.nightsOnPage.length === 0 ||
    base.nightsOnPage.includes(row.nights);

  if (!priceMatches && !nightsMatches) {
    base.verdict = "price_and_nights_mismatch";
  } else if (!priceMatches) {
    base.verdict = "price_mismatch";
  } else if (!nightsMatches) {
    base.verdict = "nights_mismatch";
  }

  if (base.verdict !== "ok") {
    base.evidence.titleSnippet = title?.slice(0, 200);
    if (!priceMatches) {
      const closest = [...base.pricesOnPage].sort((a, b) => Math.abs(a - row.price) - Math.abs(b - row.price))[0];
      base.evidence.priceContext = `db=${row.price}  page candidates=${base.pricesOnPage.slice(0, 8).join(", ")}  closest=${closest}`;
    }
    if (!nightsMatches) {
      base.evidence.nightsContext = `db=${row.nights}  page candidates=${base.nightsOnPage.slice(0, 6).join(", ")}`;
    }
  }
  return base;
}

// ── Per-host rate limiting ──────────────────────────────────────────────────
const hostLast: Map<string, number> = new Map();
const HOST_GAP_MS = 400;

async function politeFetch(url: string): Promise<{ status: number; html: string }> {
  let host = "unknown";
  try {
    host = new NodeURL(url).hostname;
  } catch {}
  const last = hostLast.get(host) ?? 0;
  const wait = Math.max(0, last + HOST_GAP_MS - Date.now());
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  hostLast.set(host, Date.now());
  return fetchPage(url);
}

// Concurrency-limited mapper across deals (bounded across all hosts; per-host
// rate-limit is enforced separately above).
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, i: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (true) {
        const i = cursor++;
        if (i >= items.length) return;
        out[i] = await fn(items[i], i);
        done++;
        onProgress?.(done, items.length);
      }
    }),
  );
  return out;
}

async function main() {
  if (!fs.existsSync(SNAPSHOT)) {
    console.error(`Snapshot not found: ${SNAPSHOT}`);
    console.error("Pull from VPS first (see comment in audit script).");
    process.exit(1);
  }
  const allRows: DealRow[] = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));
  let rows = allRows;
  if (SRC_FILTER) rows = rows.filter((r) => r.scraper_key === SRC_FILTER);
  if (Number.isFinite(LIMIT)) rows = rows.slice(0, LIMIT);

  console.log(`Auditing ${rows.length} deals${SRC_FILTER ? ` (source=${SRC_FILTER})` : ""}...`);

  const start = Date.now();
  const results = await mapWithConcurrency(
    rows,
    8,
    async (r) => {
      const page = await politeFetch(r.url);
      return classify(r, page);
    },
    (done, total) => {
      if (done % 25 === 0 || done === total) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        process.stdout.write(`  ${done}/${total} (${elapsed}s)\n`);
      }
    },
  );

  // Per-source rollup
  const bySource: Record<
    string,
    {
      total: number;
      ok: number;
      priceMismatch: number;
      nightsMismatch: number;
      both: number;
      noPrice: number;
      unreachable: number;
      loginWall: number;
      skippedJs: number;
    }
  > = {};
  for (const r of results) {
    const s = (bySource[r.scraperKey] ||= {
      total: 0,
      ok: 0,
      priceMismatch: 0,
      nightsMismatch: 0,
      both: 0,
      noPrice: 0,
      unreachable: 0,
      loginWall: 0,
      skippedJs: 0,
    });
    s.total++;
    if (r.verdict === "ok") s.ok++;
    else if (r.verdict === "price_mismatch") s.priceMismatch++;
    else if (r.verdict === "nights_mismatch") s.nightsMismatch++;
    else if (r.verdict === "price_and_nights_mismatch") s.both++;
    else if (r.verdict === "no_price_on_page") s.noPrice++;
    else if (r.verdict === "unreachable") s.unreachable++;
    else if (r.verdict === "login_wall") s.loginWall++;
    else if (r.verdict === "skipped_js") s.skippedJs++;
  }

  const summary = {
    runAt: new Date().toISOString(),
    totalAudited: results.length,
    bySource,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ summary, rows: results }, null, 2));
  console.log(`\nReport: ${OUT}`);
  console.log("\nPer-source summary:");
  const sourceKeys = Object.keys(bySource).sort();
  console.log(
    `  ${"source".padEnd(28)} ${"tot".padStart(4)} ${"ok".padStart(4)} ${"prc!".padStart(5)} ${"nts!".padStart(5)} ${"both".padStart(5)} ${"noP".padStart(4)} ${"4xx".padStart(4)} ${"login".padStart(5)} ${"jsSk".padStart(5)}`,
  );
  for (const k of sourceKeys) {
    const s = bySource[k];
    console.log(
      `  ${k.padEnd(28)} ${String(s.total).padStart(4)} ${String(s.ok).padStart(4)} ${String(s.priceMismatch).padStart(5)} ${String(s.nightsMismatch).padStart(5)} ${String(s.both).padStart(5)} ${String(s.noPrice).padStart(4)} ${String(s.unreachable).padStart(4)} ${String(s.loginWall).padStart(5)} ${String(s.skippedJs).padStart(5)}`,
    );
  }

  // High-confidence problems (price or both mismatch)
  const realBugs = results.filter(
    (r) => r.verdict === "price_mismatch" || r.verdict === "price_and_nights_mismatch" || r.verdict === "login_wall",
  );
  console.log(`\nTop ${Math.min(20, realBugs.length)} high-confidence problems:`);
  for (const r of realBugs.slice(0, 20)) {
    console.log(`  [${r.scraperKey}] #${r.dealId} ${r.verdict}  ${r.evidence.priceContext ?? r.evidence.reason}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
