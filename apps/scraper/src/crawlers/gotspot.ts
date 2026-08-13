import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "gotspot";
const BASE_URL = "https://thegotspot.com";
// Every Global Solutions, LLC ("The Got Spot" / FamPak preview packages) deal
// lives at a per-merchant numbered slug: /en/deals/global-solutions-llc-<NN>.
// The public /deals index only surfaces the handful of *currently active* deals;
// the full catalog (past + active, e.g. -15, -39, -82, -181, -358, -364, -400)
// is only reachable by walking the id range. A sweep of 1..145 returned live
// pages for ~94% of ids, so we enumerate 1..MAX_DEAL_ID as seeds and skip any
// 404 (id gap) — that captures the entire merchant catalog. Each deal keeps its
// own /global-solutions-llc-<NN> url.
const DEAL_PATH = (id: number) => `${BASE_URL}/en/deals/global-solutions-llc-${id}`;
const MAX_DEAL_ID = 410;

// DOM structure per deal page (verified against live HTML):
//   - title      : h1.deal-title
//   - package $  : .deal-container .price-info .new-price   (e.g. " $29 ")
//   - retail $   : .deal-container .price-info .old-price   (e.g. "$599") -> originalPrice
//   - inclusions : .highlights ul li
//   - description: .vendor-description (FamPak blurb)
//   - image      : img.picture_main (already absolute https /media/ urls)
// The "More great deals" popular-deals block at the bottom ALSO renders
// .price-info .new-price for OTHER merchants — so price/image are scoped to
// .deal-container and we take .first(); .highlights/.vendor-description exist
// only on the main deal.
//
// PRICE-BUG guard: the package price is ALWAYS read from .new-price. Titles and
// highlights routinely dangle "$50 Cash", "$100 Dining Advantage", "$500
// TravCredit" figures — those are inclusions/credits, NEVER the price, and are
// ignored because we never regex a "$" out of the title/highlights for price.
// originalPrice is .old-price and only kept when it exceeds the package price.
// Pure gift-card/credit listings (e.g. "$500 TravCredit Gift Card") are not
// vacpacks and are skipped outright.

function parsePrice(text: string): number {
  const m = text.match(/\$([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : NaN;
}

function validPrice(price: number): boolean {
  // FamPak preview packages run as low as $10 (Costa Rica) up to ~$299 (Cancun).
  return Number.isFinite(price) && price >= 10 && price <= 5000;
}

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&rsquo;/g, "’")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// US state (full name -> USPS abbr) for the leading "City, State" title shape.
const US_STATES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY",
};

// Foreign region/place -> ISO country code.
const COUNTRY_BY_REGION: Record<string, string> = {
  mexico: "MX", jamaica: "JM", bahamas: "BS", "the bahamas": "BS",
  "dominican republic": "DO", "costa rica": "CR", aruba: "AW",
  "cayman islands": "KY", "grand cayman": "KY", belize: "BZ", "puerto rico": "PR",
  "st lucia": "LC", "saint lucia": "LC", curacao: "CW", "turks and caicos": "TC",
};

// No-comma place names -> [city, state?, country].
const PLACE_OVERRIDES: Record<string, [string, string | undefined, string]> = {
  "las vegas": ["Las Vegas", "NV", "US"],
  "smoky mountains national park": ["Gatlinburg", "TN", "US"],
  "great smoky mountains": ["Gatlinburg", "TN", "US"],
  "smoky mountains": ["Gatlinburg", "TN", "US"],
  "myrtle beach": ["Myrtle Beach", "SC", "US"],
  gatlinburg: ["Gatlinburg", "TN", "US"],
  branson: ["Branson", "MO", "US"],
  williamsburg: ["Williamsburg", "VA", "US"],
  "costa rica": ["Playa Hermosa", undefined, "CR"],
  "cayman islands": ["Grand Cayman", undefined, "KY"],
};

function resolveRegion(regionRaw: string): { state?: string; country: string } {
  const words = regionRaw.split(/\s+/).filter(Boolean);
  for (const n of [3, 2, 1]) {
    const cand = words.slice(0, n).join(" ").toLowerCase();
    if (US_STATES[cand]) return { state: US_STATES[cand], country: "US" };
    if (COUNTRY_BY_REGION[cand]) return { state: undefined, country: COUNTRY_BY_REGION[cand] };
  }
  return { state: undefined, country: "US" };
}

function parseLocation(title: string): { city: string; state?: string; country: string } {
  // Location = the prefix before duration / marketing keywords.
  let loc = title
    .split(/\b\d+\s*Days?\b|\b\d+\s*Nights?\b|\bAll[- ]?Inclusive\b|\bVacation\b|\bGetaway\b|\bPackage\b|\bJust\b|\bNow\b|\s+at\s|\$/i)[0]
    .replace(/[-–—,\s]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  // A leading "City, State" shape.
  if (loc && !/^\d/.test(loc) && loc.includes(",")) {
    const [cityRaw, ...rest] = loc.split(",");
    const { state, country } = resolveRegion(rest.join(",").trim());
    return { city: titleCase(cityRaw), state, country };
  }

  // Single place with no comma (e.g. "Costa Rica", "Las Vegas Vacation").
  if (loc && !/^\d/.test(loc)) {
    const key = loc.toLowerCase();
    if (PLACE_OVERRIDES[key]) {
      const [c, s, co] = PLACE_OVERRIDES[key];
      return { city: c, state: s, country: co };
    }
    if (COUNTRY_BY_REGION[key]) return { city: titleCase(loc), country: COUNTRY_BY_REGION[key] };
    return { city: titleCase(loc), country: "US" };
  }

  // Title starts with the duration (e.g. "6 Days, 5 Nights at CAYMAN ISLANDS ...")
  // — scan the whole title for any known place, longest key first.
  const lower = title.toLowerCase();
  const keys = [...Object.keys(PLACE_OVERRIDES), ...Object.keys(COUNTRY_BY_REGION)].sort(
    (a, b) => b.length - a.length,
  );
  for (const key of keys) {
    if (lower.includes(key)) {
      if (PLACE_OVERRIDES[key]) {
        const [c, s, co] = PLACE_OVERRIDES[key];
        return { city: c, state: s, country: co };
      }
      return { city: titleCase(key), country: COUNTRY_BY_REGION[key] };
    }
  }
  // Last resort: the place named after "at ".
  const atMatch = title.match(/\bat\s+([A-Za-z][A-Za-z .'&-]+?)(?:\s+(?:Resort|Club|Hotel|Inn|Suites|Plus|w\/|\+|Just|Now)\b|$)/i);
  if (atMatch) return { city: titleCase(atMatch[1]), country: "US" };
  return { city: "Unknown", country: "US" };
}

function parseDuration(text: string): { durationDays: number; durationNights: number } {
  const dn = text.match(/(\d+)\s*Days?\s*[,/&\s-]*\s*(\d+)\s*Nights?/i);
  if (dn) return { durationDays: parseInt(dn[1], 10), durationNights: parseInt(dn[2], 10) };
  const nd = text.match(/(\d+)\s*Nights?\s*[,/&\s-]*\s*(\d+)\s*Days?/i);
  if (nd) return { durationNights: parseInt(nd[1], 10), durationDays: parseInt(nd[2], 10) };
  // Typical FamPak preview package when the page omits an explicit split.
  return { durationDays: 3, durationNights: 2 };
}

export async function runGotspotCrawler() {
  const seeds = Array.from({ length: MAX_DEAL_ID }, (_, i) => DEAL_PATH(i + 1));

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: MAX_DEAL_ID + 20,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    preNavigationHooks: [
      async (_ctx, gotOptions) => {
        gotOptions.headers = {
          ...(gotOptions.headers || {}),
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        };
      },
    ],
    async requestHandler({ request, $, log }) {
      const pending: Promise<unknown>[] = [];

      const title = decodeEntities($("h1.deal-title").first().text());
      if (!title) {
        // Empty body / non-deal page (id gap that still returned 200).
        return;
      }

      // Skip pure gift-card / travel-credit listings — not vacpacks. (The "$X"
      // in these titles is the card face value, the classic price-bug trap.)
      if (/gift\s*card|travcredit|trav\s*credit|gift\s*certificate|gift\s*voucher/i.test(title)) {
        log.info(`[${SOURCE_KEY}] Skipping non-vacpack (gift card): "${title}"`);
        return;
      }

      // Scope price to the main deal container — the popular-deals block also
      // renders .price-info .new-price for other merchants.
      const $main = $(".deal-container").first();
      const $priceInfo = ($main.find(".price-info").first().length
        ? $main.find(".price-info").first()
        : $(".price-info").first());
      const price = parsePrice($priceInfo.find(".new-price").first().text());

      if (!validPrice(price)) {
        // DOM-verified only: no on-page package price -> don't publish.
        log.info(`[${SOURCE_KEY}] Skipping "${title}" — no valid on-page price`);
        return;
      }

      const rack = parsePrice(
        $priceInfo.find(".old-price").first().text() ||
          $main.find(".deal-value").first().text(),
      );
      const originalPrice = validPrice(rack) && rack > price ? rack : undefined;

      const inclusions = $main
        .find(".highlights ul li")
        .map((_, li) => decodeEntities($(li).text()))
        .get()
        .filter((l) => l && l.length > 2);

      const descRaw = decodeEntities(
        $main.find(".vendor-description").first().text().replace(/^\s*Description\s*/i, ""),
      );
      const description = descRaw ? descRaw.slice(0, 500) : undefined;

      // Duration: title first, then highlights, then description.
      const { durationDays, durationNights } = parseDuration(
        `${title} ${inclusions.join(" ")} ${descRaw}`,
      );

      const { city, state, country } = parseLocation(title);

      // Resort name = the "... at {Resort}" phrase.
      const resortMatch = title.match(
        /\bat\s+([A-Za-z][A-Za-z0-9 .'&-]+?)(?:\s+(?:Plus|With|w\/|\+|Just|Now|for|-|and\s+\$)|$)/i,
      );
      const resortName = resortMatch ? titleCase(resortMatch[1]).slice(0, 120) : undefined;

      const img =
        $main.find("img.picture_main").first().attr("src") ||
        $main.find('img[src*="/media/"]').first().attr("src") ||
        $('img.picture_main').first().attr("src");
      const imageUrl = img
        ? img.startsWith("http")
          ? img
          : `${BASE_URL}${img.startsWith("/") ? "" : "/"}${img}`
        : undefined;

      pending.push(
        storeDeal(
          {
            title: `${title} — ${durationDays} Days / ${durationNights} Nights Vacation Package`,
            price,
            originalPrice,
            durationNights,
            durationDays,
            description,
            resortName,
            url: request.url,
            imageUrl,
            inclusions: inclusions.length ? inclusions : undefined,
            requirements: ["Resort preview / vacation-membership presentation required"],
            presentationMinutes: 120,
            city,
            state,
            country,
            brandSlug: SOURCE_KEY,
          },
          SOURCE_KEY,
        ),
      );

      await Promise.all(pending);
      log.info(`[${SOURCE_KEY}] Stored "${title}" ($${price}${originalPrice ? ` was $${originalPrice}` : ""}) — ${city}`);
    },
    failedRequestHandler({ request, log }) {
      // Most failures are 404 id-gaps in the merchant sequence — expected.
      log.warning(`[${SOURCE_KEY}] Request failed (likely id gap): ${request.url}`);
    },
  });

  await crawler.run(seeds);
}
