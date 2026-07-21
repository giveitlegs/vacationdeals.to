import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "great-resort-vacations";
const BASE_URL = "https://greatresortvacations.com";

// greatresortvacations.com is WordPress + Elementor (verified 2026-07-20).
// Two DOM shapes on the homepage carry real prices:
//   1. Evergreen weekly deals — Elementor image-boxes:
//      h3.elementor-image-box-title a  → destination + deal-page link
//      p.elementor-image-box-description → "$155/Week" / "2-Bedroom $1045/Week"
//      (the "Snapshot Deals" teaser box has a long sentence description and is
//      rejected by the anchored WEEK_RE)
//   2. Rotating snapshot deals — Premium-blog cards:
//      h2.premium-blog-entry-title a + p.premium-blog-post-content containing
//      "7 NIGHTS FOR $483 Kissimmee, Florida..." (cruise/roundup posts skipped)
const WEEK_RE = /^\s*(?:([\w-]+)\s+)?\$([\d,]+)\s*\/\s*week\s*$/i;
const NIGHTS_FOR_RE = /(\d+)\s*NIGHTS?\s*FOR(?:\s*ONLY)?\s*\$([\d,]+)/i;
const CITY_REGION_RE =
  /([A-Z][A-Za-z .']{2,28}?)(?:\s*\(Orlando\))?,\s*(Florida|California|Utah|Nevada|Arizona|Texas|Missouri|Tennessee|South Carolina|Hawaii|Colorado|Brazil|Mexico)/;

const REGION_MAP: Record<string, { state?: string; country?: string }> = {
  florida: { state: "FL" },
  california: { state: "CA" },
  utah: { state: "UT" },
  nevada: { state: "NV" },
  arizona: { state: "AZ" },
  texas: { state: "TX" },
  missouri: { state: "MO" },
  tennessee: { state: "TN" },
  "south carolina": { state: "SC" },
  hawaii: { state: "HI" },
  colorado: { state: "CO" },
  brazil: { country: "BR" },
  mexico: { country: "MX" },
};

// Image-box titles are destination-ish; map the knowns to real city/state.
const KNOWN_PLACES: Record<string, { city: string; state?: string; country?: string; resort?: string }> = {
  "palm desert": { city: "Palm Desert", state: "CA", resort: "Desert Breezes Resort" },
  "wolf creek": { city: "Eden", state: "UT", resort: "Wolf Creek Resort" },
  anaheim: { city: "Anaheim", state: "CA", resort: "Dolphin's Cove Resort" },
  kissimmee: { city: "Kissimmee", state: "FL" },
  cancun: { city: "Cancun", country: "MX" },
};

export async function runGreatResortVacationsCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 3,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);
      let stored = 0;

      // ── 1. Evergreen $X/Week image-box cards ──────────────────────────────
      $("h3.elementor-image-box-title a").each((_, el) => {
        const link = $(el);
        const name = link.text().replace(/\s+/g, " ").trim();
        const desc = link
          .closest(".elementor-image-box-content")
          .find("p.elementor-image-box-description")
          .first()
          .text()
          .replace(/\s+/g, " ")
          .trim();
        const m = desc.match(WEEK_RE);
        if (!name || !m) return;

        const price = parseInt(m[2].replace(/,/g, ""), 10);
        if (!Number.isFinite(price) || price < 39 || price > 5000) return;

        const place = KNOWN_PLACES[name.toLowerCase()] ?? { city: name };
        const unit = m[1] ? `${m[1]} ` : "";
        const url = link.attr("href") ?? `${BASE_URL}/#${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        const imageUrl = link
          .closest(".elementor-image-box-wrapper")
          .find("figure.elementor-image-box-img img")
          .first()
          .attr("src");

        storeDeal(
          {
            title: `${place.city} ${unit}Resort Week — 7 Nights from $${price}`,
            price,
            durationNights: 7,
            durationDays: 8,
            city: place.city,
            state: place.state,
            country: place.country ?? "US",
            brandSlug: SOURCE_KEY,
            url,
            resortName: place.resort,
            imageUrl,
            inclusions: ["Full resort week accommodations"],
            presentationMinutes: 90,
            requirements: ["Attend a 90-minute vacation club preview"],
          },
          SOURCE_KEY,
        );
        stored++;
      });

      // ── 2. Rotating "N NIGHTS FOR $X" snapshot blog cards ─────────────────
      $("h2.premium-blog-entry-title a").each((_, el) => {
        const link = $(el);
        const title = link.text().replace(/\s+/g, " ").trim();
        if (!title || /cruise|last call/i.test(title)) return;

        const container = link.closest(".premium-blog-content-wrapper").parent();
        const content = container
          .find("p.premium-blog-post-content")
          .first()
          .text()
          .replace(/\s+/g, " ")
          .trim();

        const dealMatch = content.match(NIGHTS_FOR_RE);
        if (!dealMatch) return;
        const nights = parseInt(dealMatch[1], 10);
        const price = parseInt(dealMatch[2].replace(/,/g, ""), 10);
        if (!Number.isFinite(price) || price < 39 || price > 5000) return;
        if (!Number.isFinite(nights) || nights < 1 || nights > 21) return;

        // Destination must be verifiable as "City, Region" in the card text.
        // Title first (cleanest, e.g. "Foz do Iguacu, Brazil – 7 Nights for
        // $404"); content as fallback, minus the "Recent Deals" prefix that
        // otherwise bleeds into the lazy city capture.
        const cityMatch =
          title.match(CITY_REGION_RE) ||
          content.replace(/^Recent Deals\s*/i, "").match(CITY_REGION_RE);
        if (!cityMatch) return;
        const city = cityMatch[1].trim();
        const region = REGION_MAP[cityMatch[2].toLowerCase()] ?? {};

        const url = link.attr("href");
        if (!url) return;

        storeDeal(
          {
            title: `${city} Snapshot Deal — ${nights} Nights for $${price}`,
            price,
            durationNights: nights,
            durationDays: nights + 1,
            city,
            state: region.state,
            country: region.country ?? "US",
            brandSlug: SOURCE_KEY,
            url,
            inclusions: ["Full resort accommodations"],
            presentationMinutes: 90,
            requirements: ["Attend a 90-minute vacation club preview"],
          },
          SOURCE_KEY,
        );
        stored++;
      });

      if (stored === 0) {
        log.warning(`[${SOURCE_KEY}] 0 verifiable deals found — storing nothing`);
      } else {
        log.info(`[${SOURCE_KEY}] Stored ${stored} deals`);
      }
    },
  });

  await crawler.run([BASE_URL]);
}
