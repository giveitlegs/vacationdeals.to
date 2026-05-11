import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "capital-vacations";
const BASE_URL = "https://capitalvacationspackages.com";

// Each destination page has a "Visit {City} for Only ${PRICE}*" headline.
// The list of properties is rendered as h2 cards under "Resorts" sections.
const DESTINATIONS = [
  { url: "/orlando/", city: "Orlando", state: "FL", country: "US" },
  { url: "/branson/", city: "Branson", state: "MO", country: "US" },
  { url: "/cape-cod/", city: "Cape Cod", state: "MA", country: "US" },
  { url: "/hilton-head/", city: "Hilton Head Island", state: "SC", country: "US" },
  { url: "/maui/", city: "Maui", state: "HI", country: "US" },
  { url: "/minnesotas-breezy-point/", city: "Breezy Point", state: "MN", country: "US" },
  { url: "/myrtle-beach/", city: "Myrtle Beach", state: "SC", country: "US" },
  { url: "/pigeon-forge/", city: "Pigeon Forge", state: "TN", country: "US" },
  { url: "/sedona/", city: "Sedona", state: "AZ", country: "US" },
  { url: "/south-florida/", city: "South Florida", state: "FL", country: "US" },
];

function cleanTitle(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export async function runCapitalVacationsCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 15,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      const dest = (request.userData as { dest?: typeof DESTINATIONS[number] }).dest;
      if (!dest) {
        log.warning(`No destination in userData for ${request.url}`);
        return;
      }

      const bodyText = $("body").text();

      // Extract the promo headline price like "Visit Orlando for Only $199*"
      const headlineMatch = bodyText.match(/Only\s*\$([\d,]+)/i);
      const promoPrice = headlineMatch
        ? parseInt(headlineMatch[1].replace(/,/g, ""), 10)
        : NaN;
      if (!Number.isFinite(promoPrice) || promoPrice < 50) {
        log.warning(`[${dest.city}] No headline price found`);
        return;
      }

      // Retail / "value" price for savings calc — first 4-digit figure in document.
      const valueMatches = Array.from(bodyText.matchAll(/\$([\d,]+)/g))
        .map((m) => parseInt(m[1].replace(/,/g, ""), 10))
        .filter((n) => Number.isFinite(n) && n >= 500);
      const valuePrice = valueMatches.length ? Math.max(...valueMatches) : null;

      // Nights — typically 4D/3N or 5D/4N.
      const nightsMatch = bodyText.match(/(\d+)\s*Nights?/i);
      const nights = nightsMatch ? parseInt(nightsMatch[1], 10) : (dest.city === "Maui" ? 4 : 3);

      // Resort names appear as h2 headings between "What's Required" and "Resort Highlights"
      // — pick h2 elements that look like proper-noun resort names (Title Case, short).
      const resortNames: string[] = [];
      $("h2.gspb_heading").each((_, el) => {
        const t = cleanTitle($(el).text());
        if (!t) return;
        // Skip section labels.
        if (/(What|Visit|Limited|Offer|Gallery|About|Reviews|Highlights|Featured)/i.test(t)) return;
        if (t.length < 4 || t.length > 60) return;
        if (/[$%]/.test(t)) return;
        if (!resortNames.includes(t)) resortNames.push(t);
      });

      if (resortNames.length === 0) {
        // Fallback: one deal per destination using the city as resort name.
        resortNames.push(`${dest.city} Resort`);
      }

      log.info(`[${dest.city}] Resorts: ${resortNames.join(" | ")} @ $${promoPrice}`);
      let stored = 0;

      for (const resortName of resortNames) {
        const url = `${BASE_URL}${dest.url}#${resortName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

        storeDeal(
          {
            title: `${resortName} — ${dest.city} Capital Vacations Preview Package`,
            price: promoPrice,
            originalPrice: valuePrice || undefined,
            durationNights: nights,
            durationDays: nights + 1,
            city: dest.city,
            state: dest.state,
            country: dest.country,
            brandSlug: SOURCE_KEY,
            url,
            resortName,
            inclusions: ["Resort accommodations", "Capital Vacations preview tour required"],
            presentationMinutes: 120,
          },
          SOURCE_KEY,
        );
        stored += 1;
      }

      log.info(`[${dest.city}] Stored ${stored} deals`);
    },
  });

  const requests = DESTINATIONS.map((d) => ({
    url: `${BASE_URL}${d.url}`,
    userData: { dest: d },
  }));
  await crawler.run(requests);
}
