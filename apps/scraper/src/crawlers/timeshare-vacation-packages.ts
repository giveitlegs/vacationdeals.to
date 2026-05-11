import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "timeshare-vacation-packages";
const BASE_URL = "https://www.timesharevacationpackages.com";

// Each destination index page lists resort cards with this DOM shape:
//   <h3 class="el-title uk-h4 ...">RESORT NAME</h3>
//   <h2>$XXX PER FAMILY</h2>   (the headline price)
// The cards are sibling sections inside .el-item or .uk-card wrappers.
const DESTINATIONS = [
  { url: "/orlando-timeshare-promotions", city: "Orlando", state: "FL", country: "US" },
  { url: "/las-vegas-nevada-timeshare-promotions", city: "Las Vegas", state: "NV", country: "US" },
  { url: "/branson-missouri-timeshare-promotions", city: "Branson", state: "MO", country: "US" },
  { url: "/williamsburg-virginia-timeshare-promotions", city: "Williamsburg", state: "VA", country: "US" },
  { url: "/gatlinburg-tennessee-timeshare-promotions", city: "Gatlinburg", state: "TN", country: "US" },
  { url: "/myrtle-beach-south-carolina-timeshare-promotions", city: "Myrtle Beach", state: "SC", country: "US" },
  { url: "/hilton-head-island-timeshare-promotions", city: "Hilton Head Island", state: "SC", country: "US" },
  { url: "/daytona-beach-florida-timeshare-promotions", city: "Daytona Beach", state: "FL", country: "US" },
  { url: "/cancun-all-inclusive-timeshare-promotions", city: "Cancun", state: "QR", country: "MX" },
  { url: "/cabo-san-lucas-all-inclusive-timeshare-promotions", city: "Cabo San Lucas", state: "BCS", country: "MX" },
  { url: "/puerto-vallarta-all-inclusive-timeshare-promotions", city: "Puerto Vallarta", state: "JA", country: "MX" },
  { url: "/punta-cana-dominican-republic-all-inclusive-timeshare-promotions", city: "Punta Cana", state: "La Altagracia", country: "DO" },
  { url: "/montego-bay-jamaica-all-inclusive-timeshare-promotions", city: "Montego Bay", state: "", country: "JM" },
  { url: "/aruba-all-inclusive-timeshare-promotions", city: "Oranjestad", state: "", country: "AW" },
  { url: "/costa-rica-all-inclusive-timeshare-promotions", city: "Costa Rica", state: "", country: "CR" },
];

// Per-page generic destination card titles (links to other destinations,
// not resort cards). Excluded so they don't become deals.
const NAV_PATTERNS = [
  /^(cancun|cabo|punta cana|puerto vallarta|aruba|jamaica|costa rica|curacao|loreto|montego bay|hilton head|gatlinburg|orlando|las vegas|daytona beach|branson|myrtle beach|williamsburg|historic williamsburg)(\s*[,-]|\s+(mexico|nevada|florida|tennessee|south carolina|north carolina|virginia|missouri|island|dominican republic))?\s*$/i,
  /^islands of\b/i,
];

function cleanTitle(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export async function runTimeshareVacationPackagesCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 30,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      const dest = (request.userData as { dest?: typeof DESTINATIONS[number] }).dest;
      if (!dest) {
        log.warning(`No destination in userData for ${request.url}`);
        return;
      }

      // Match both layouts: Orlando-style (uk-h4) and Vegas/Caribbean-style (uk-card-title)
      const titles = $("h3.el-title.uk-h4, h3.el-title.uk-card-title");
      log.info(`[${dest.city}] Found ${titles.length} resort cards`);
      let stored = 0;

      titles.each((_, el) => {
        const titleEl = $(el);
        const resortName = cleanTitle(titleEl.text());
        if (!resortName) return;

        // Filter out navigation cards (other destinations linked from the page).
        if (NAV_PATTERNS.some((re) => re.test(resortName))) return;

        // Walk up to the card container, then find the price h2 within it.
        const card = titleEl.closest("li, .el-item, .uk-grid > div, .uk-card").first();
        const container = card.length ? card : titleEl.parent().parent();

        // Find the h2 that contains the price phrase. Prefer "$XXX PER FAMILY".
        let priceText = "";
        container.find("h2").each((__, h) => {
          const t = $(h).text();
          if (/\$[\d,]+\s*PER\s+FAMILY/i.test(t) && !priceText) {
            priceText = t;
          }
        });

        if (!priceText) {
          // Fallback: take the smallest plausible $XXX in container (the headline
          // package price is usually the lowest, gift-card values are higher).
          // Exclude $200 (matches the common "$200 Visa gift card" inclusion).
          const all = Array.from(container.text().matchAll(/\$([\d,]+)/g))
            .map((m) => parseInt(m[1].replace(/,/g, ""), 10))
            .filter((n) => Number.isFinite(n) && n >= 50 && n !== 200);
          if (all.length) priceText = `$${Math.min(...all)}`;
        }

        const priceMatch = priceText.match(/\$([\d,]+)/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ""), 10) : NaN;
        if (!Number.isFinite(price) || price < 50) {
          log.warning(`[${dest.city}] Skipping "${resortName}" — no valid price (got "${priceText}")`);
          return;
        }

        // Look for "$200 Visa" or similar gift card mentions.
        const giftMatch = container.text().match(/\$(\d+)\s*(?:Visa|gift card|cash card)/i);
        const giftCard = giftMatch ? `$${giftMatch[1]} Visa gift card` : null;

        // Look for nights mention.
        const nightsMatch = container.text().match(/(\d+)\s*nights?/i);
        const nights = nightsMatch ? parseInt(nightsMatch[1], 10) : 3;

        // Build a unique URL using the resort's detail-page anchor or a synthetic slug.
        const detailHref = container.find("a[href*='timeshare-promotions/']").first().attr("href");
        const url = detailHref
          ? detailHref.startsWith("http") ? detailHref : `${BASE_URL}${detailHref.startsWith("/") ? "" : "/"}${detailHref}`
          : `${BASE_URL}${dest.url}#${resortName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

        const imageUrl = container.find("img").first().attr("src") || container.find("img").first().attr("data-src");

        storeDeal(
          {
            title: `${cleanTitle(resortName)} — ${dest.city} Timeshare Preview Package`,
            price,
            durationNights: nights,
            durationDays: nights + 1,
            city: dest.city,
            state: dest.state,
            country: dest.country,
            brandSlug: SOURCE_KEY,
            url,
            resortName: cleanTitle(resortName),
            imageUrl: imageUrl ? (imageUrl.startsWith("http") ? imageUrl : `${BASE_URL}${imageUrl}`) : undefined,
            inclusions: giftCard ? [giftCard, "Resort accommodations"] : ["Resort accommodations"],
            presentationMinutes: 120,
          },
          SOURCE_KEY,
        );
        stored += 1;
      });

      log.info(`[${dest.city}] Stored ${stored} deals`);
    },
  });

  const requests = DESTINATIONS.map((d) => ({
    url: `${BASE_URL}${d.url}`,
    userData: { dest: d },
  }));
  await crawler.run(requests);
}
