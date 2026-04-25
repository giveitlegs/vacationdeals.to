/**
 * Will-It-Hold-Up — analyze any vacation-deal URL.
 *
 * Pipeline:
 *   1. Normalize the URL (strip trailing slashes, query params).
 *   2. Match the host to one of our known brands (or unknown).
 *   3. Look up the URL in our deals table:
 *        - Exact match → return its full deal record + history
 *        - Host match only → return brand-level Reality Index
 *        - No match → return "unknown brand" verdict
 *   4. Run heuristic checks on the URL itself:
 *        - Rotating-promo pattern? (/travel-deal-tuesday/, /memorial-day/, etc.)
 *        - Generic city-numeric pattern? (/orlando-189/)
 *        - Dynamic offer ID pattern?
 *        - Login/signup URL?
 *   5. Compose: HOLD_UP / WORTH_VERIFYING / RED_FLAG with explanation.
 */

import "server-only";
import { getBrandRealityScore } from "./reality-index";

export interface HoldUpResult {
  inputUrl: string;
  normalizedUrl: string;
  hostname: string;
  brand: { slug: string; name: string; type: string } | null;
  matchType: "exact-deal" | "brand-only" | "unknown-brand";
  verdict: "Hold Up" | "Worth Verifying" | "Red Flag" | "Unknown";
  verdictColor: string;
  scoreOverall: number | null;
  // Detail for the result page
  matchedDeal?: {
    title: string;
    price: number;
    nights: number | null;
    pageUrl: string;
    isActive: boolean;
    scrapedAt: Date;
    priceHistoryCount: number;
    minPriceLast30d: number | null;
    maxPriceLast30d: number | null;
  };
  brandReality?: {
    score: number;
    verdict: string;
    oneLine: string;
    activeDeals: number;
  };
  flags: Array<{ severity: "warn" | "info"; message: string }>;
  recommendations: string[];
}

const KNOWN_HOSTS: Record<string, string> = {
  "westgatereservations.com": "westgate",
  "westgateevents.com": "westgate-events",
  "bookvip.com": "bookvip",
  "getawaydealz.com": "getawaydealz",
  "mrgvacationpackages.com": "mrg",
  "monstervacations.com": "monster-vacations",
  "vacationvip.com": "vacationvip",
  "bestvacationdealz.com": "bestvacationdealz",
  "staypromo.com": "staypromo",
  "hiltongrandvacations.com": "hgv",
  "hgv.com": "hgv",
  "bluegreenvacations.com": "bluegreen",
  "clubwyndham.wyndhamdestinations.com": "wyndham",
  "wyndhamdestinations.com": "wyndham",
  "holidayinnclub.com": "holiday-inn",
  "marriottvacationclubs.com": "marriott",
  "hyattvacationclub.com": "hyatt",
  "capitalvacations.com": "capital-vacations",
  "spinnakerresorts.com": "spinnaker",
  "vacationvillagedeals.com": "vacation-village",
  "vacationvillage.com": "vacation-village",
  "departuredepot.com": "departure-depot",
  "las-vegas-timeshare.com": "vegas-timeshare",
  "premiertravelresorts.com": "premier-travel",
  "discountvacationhotels.com": "discount-vacation",
  "legendaryvacationclub.com": "legendary",
  "festiva.com": "festiva",
  "elcidvacationsclub.com": "el-cid",
  "elcid.com": "el-cid",
  "pueblobonito.com": "pueblo-bonito",
  "diviresorts.com": "divi",
  "bpprivilegeclub.com": "bahia-principe",
  "taferresorts.com": "tafer",
  "villagroupresorts.com": "villa-group",
  "sheratonvacationclub.marriott.com": "sheraton-vc",
  "westinvacationclub.marriott.com": "westin-vc",
  "exploriavacations.com": "exploria",
  "massresort.com": "massanutten",
  "margaritavillevcrentals.com": "margaritaville",
  "iwanttotravelto.com": "iwanttotravelto",
  "vacationoffer.com": "vacation-offer",
  "allinclusivepromotions.com": "all-inclusive-promotions",
  "travel.payvibe.com": "payvibe",
  "payvibe.com": "payvibe",
  "timesharepresentationdeals.com": "timeshare-presentation-deals",
};

function normalizeUrl(input: string): { url: string; hostname: string } {
  let raw = input.trim();
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) raw = "https://" + raw;
  try {
    const u = new URL(raw);
    // Drop tracking params, normalize trailing slash
    const interestingParams = ["id", "destination", "p"];
    const newSearch = new URLSearchParams();
    for (const [k, v] of u.searchParams) {
      if (interestingParams.includes(k)) newSearch.set(k, v);
    }
    u.search = newSearch.toString();
    let path = u.pathname;
    if (path.length > 1 && path.endsWith("/")) {
      // keep trailing slash for our matching
    }
    return { url: u.origin + path + (u.search ? "?" + u.search : ""), hostname: u.hostname.replace(/^www\./, "") };
  } catch {
    return { url: raw, hostname: "" };
  }
}

function urlFlags(url: string): HoldUpResult["flags"] {
  const flags: HoldUpResult["flags"] = [];
  const lower = url.toLowerCase();

  if (/(memorial-day|cyber-monday|black-friday|labor-day|easter-vacation|halloween|valentine|labor.day)/.test(lower)) {
    flags.push({
      severity: "warn",
      message: "Seasonal-promo URL — content rotates throughout the year, so what's advertised today may not be what the page shows next month.",
    });
  }
  if (/\/travel-deal-tuesday\//.test(lower) || /\/sunshine-day-summer-sale\//.test(lower)) {
    flags.push({
      severity: "warn",
      message: "Rotating weekly/seasonal promo URL — the deal you saw on a third-party site may not match what's on this URL right now.",
    });
  }
  if (/\/specials\/(orlando|branson|vegas|gatlinburg|myrtle-beach)-\d+\//.test(lower)) {
    flags.push({
      severity: "warn",
      message: "Generic city/number URL — these are aggregator landers, not specific package pages. The advertised price is a starting price, not a guaranteed rate.",
    });
  }
  if (/\/(users\/sign_in|users\/login|account\/login|signin)$/.test(lower)) {
    flags.push({
      severity: "warn",
      message: "This is a login URL, not a deal page. Whatever ad pointed you here was misconfigured or out of date.",
    });
  }
  if (/\/(packages|deals|specials|trips|getaways)$/.test(lower)) {
    flags.push({
      severity: "info",
      message: "This is a category/listing page, not a specific package. Pricing is illustrative — confirm the actual booking rate before paying any deposit.",
    });
  }
  return flags;
}

function recommendationsFor(verdict: HoldUpResult["verdict"], brand: HoldUpResult["brand"]): string[] {
  const out: string[] = [];
  switch (verdict) {
    case "Hold Up":
      out.push("This brand has stable inventory and the URL pattern looks specific — reasonable to proceed.");
      out.push("Always confirm the final price + dates by phone before paying any deposit.");
      out.push("Read the deposit forfeiture rules carefully — most brands hold it if you skip the presentation.");
      break;
    case "Worth Verifying":
      out.push("Call the brand directly with the package number and confirm price, dates, and inclusions before paying.");
      out.push("Check our brand page for current price-history data before booking.");
      out.push("Screenshot the offer at the moment you book — pages can change.");
      break;
    case "Red Flag":
      out.push("Do NOT pay a deposit on this URL. The page content can change before your travel dates.");
      out.push("Search for the brand's official page directly and find an equivalent specific package.");
      out.push("If the rate seems too good, search the brand on BBB and your state AG for recent complaints.");
      break;
    case "Unknown":
      out.push("We don't have data on this brand. Check BBB rating + state-AG complaint history before paying anything.");
      out.push("Search Reddit r/timeshare for recent reports.");
      out.push("Never pay more than $49 deposit to a brand you can't independently verify.");
      break;
  }
  if (brand) out.push(`For verified ${brand.name} deals, browse our brand page at /${brand.slug}.`);
  return out;
}

export async function checkUrl(rawUrl: string): Promise<HoldUpResult> {
  const { url: normalizedUrl, hostname } = normalizeUrl(rawUrl);
  const brandSlug = KNOWN_HOSTS[hostname] || null;

  let brand: HoldUpResult["brand"] = null;
  let brandReality: HoldUpResult["brandReality"];
  let matchedDeal: HoldUpResult["matchedDeal"];
  let matchType: HoldUpResult["matchType"] = "unknown-brand";
  let scoreOverall: number | null = null;

  if (brandSlug) {
    const score = await getBrandRealityScore(brandSlug);
    if (score) {
      brand = { slug: score.brandSlug, name: score.brandName, type: score.brandType };
      brandReality = {
        score: score.scoreOverall,
        verdict: score.verdict,
        oneLine: score.oneLine,
        activeDeals: score.activeDeals,
      };
      scoreOverall = score.scoreOverall;
      matchType = "brand-only";
    }
  }

  // Try exact-URL match in our DB
  try {
    const { db } = await import("@vacationdeals/db");
    const { sql } = await import("drizzle-orm");
    const matches = await db.execute(sql`
      SELECT
        d.id,
        d.title,
        d.price::float AS price,
        d.duration_nights AS nights,
        d.url AS page_url,
        d.is_active,
        d.scraped_at,
        (SELECT COUNT(*) FROM deal_price_history h WHERE h.deal_id = d.id)::int AS history_count,
        (SELECT MIN(h.price)::float FROM deal_price_history h WHERE h.deal_id = d.id AND h.scraped_at > NOW() - INTERVAL '30 days') AS min_30,
        (SELECT MAX(h.price)::float FROM deal_price_history h WHERE h.deal_id = d.id AND h.scraped_at > NOW() - INTERVAL '30 days') AS max_30
      FROM deals d
      WHERE d.url = ${normalizedUrl}
         OR d.url = ${rawUrl.trim()}
      LIMIT 1
    `);
    type Row = {
      id: number;
      title: string;
      price: number;
      nights: number;
      page_url: string;
      is_active: boolean;
      scraped_at: Date | string;
      history_count: number;
      min_30: number | null;
      max_30: number | null;
    };
    const rows = (Array.isArray(matches) ? matches : ((matches as { rows?: Row[] }).rows ?? [])) as Row[];
    if (rows.length > 0) {
      const r = rows[0];
      matchedDeal = {
        title: r.title,
        price: r.price,
        nights: r.nights,
        pageUrl: r.page_url,
        isActive: r.is_active,
        scrapedAt: typeof r.scraped_at === "string" ? new Date(r.scraped_at) : r.scraped_at,
        priceHistoryCount: r.history_count,
        minPriceLast30d: r.min_30,
        maxPriceLast30d: r.max_30,
      };
      matchType = "exact-deal";
    }
  } catch {
    // ignore — brand-only fallback
  }

  const flags = urlFlags(normalizedUrl);

  // ── Verdict logic ────────────────────────────────────────────────────────
  let verdict: HoldUpResult["verdict"] = "Unknown";
  let verdictColor = "#6b7280";
  const hasWarnFlag = flags.some((f) => f.severity === "warn");

  if (matchType === "exact-deal" && matchedDeal) {
    if (!matchedDeal.isActive) {
      verdict = "Red Flag";
      verdictColor = "#dc2626";
    } else if (hasWarnFlag) {
      verdict = "Worth Verifying";
      verdictColor = "#d97706";
    } else if (scoreOverall != null && scoreOverall >= 75) {
      verdict = "Hold Up";
      verdictColor = "#059669";
    } else if (scoreOverall != null && scoreOverall >= 55) {
      verdict = "Worth Verifying";
      verdictColor = "#d97706";
    } else {
      verdict = "Worth Verifying";
      verdictColor = "#d97706";
    }
  } else if (matchType === "brand-only") {
    if (hasWarnFlag) {
      verdict = "Red Flag";
      verdictColor = "#dc2626";
    } else if (scoreOverall != null && scoreOverall >= 75) {
      verdict = "Hold Up";
      verdictColor = "#059669";
    } else if (scoreOverall != null && scoreOverall >= 55) {
      verdict = "Worth Verifying";
      verdictColor = "#d97706";
    } else {
      verdict = "Red Flag";
      verdictColor = "#dc2626";
    }
  } else {
    verdict = "Unknown";
    verdictColor = "#6b7280";
  }

  return {
    inputUrl: rawUrl,
    normalizedUrl,
    hostname,
    brand,
    matchType,
    verdict,
    verdictColor,
    scoreOverall,
    matchedDeal,
    brandReality,
    flags,
    recommendations: recommendationsFor(verdict, brand),
  };
}
