import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Festiva Hospitality Group crawler (festiva.com).
 *
 * Festiva manages 21 resorts under the "Festiva Adventure Club" brand
 * across unique US/Caribbean destinations: Asheville, Cape Cod,
 * Wisconsin Dells, Ocean City, Park City, etc.
 *
 * Site structure:
 *   - /adventure-club — lists all resorts with name, location, description,
 *     image (hosted on rhsinc.imgix.net), and "View Resort" links
 *   - Individual resort pages at /{Resort-Name} with full details
 *   - Images: https://rhsinc.imgix.net/{code}/gallery/{file}.jpg
 *   - No direct pricing on the listing — resort pages may have rates
 *   - RTX Getaways inventory on separate rtx.travel platform
 *
 * Resorts (from /adventure-club):
 *   Atlantic Beach (NC), Atrium Beach Resort (St Maarten),
 *   Coconut Malorie (Ocean City MD), Coconut Palms (New Smyrna Beach FL),
 *   Los Lagos (Hot Springs Village AR), Ocean Club (N Myrtle Beach SC),
 *   Ocean Gate (St Augustine FL), Palm Beach Resort (Orange Beach AL),
 *   Park Plaza (Park City UT), Rangeley Lake (Rangeley ME),
 *   Sea Mystique (Garden City SC), Shores (Orange Beach AL),
 *   Southcape (Mashpee/Cape Cod MA), Tamarack (Wisconsin Dells WI)
 *
 * Strategy:
 *   1. Crawl /adventure-club for the resort listing
 *   2. Parse resort cards for name, location, image, link
 *   3. Crawl individual resort pages for rates/details
 *   4. Create deal entries per resort (Festiva typically offers
 *      promotional stays for attending timeshare presentations)
 */

const BASE_URL = "https://festiva.com";

// ── Known resorts with their destinations ───────────────────────────────────

const KNOWN_RESORTS: Array<{
  slug: string;
  name: string;
  city: string;
  state: string;
  country: string;
  region: string;
}> = [
  { slug: "Atlantic-Beach", name: "Atlantic Beach Resort", city: "Atlantic Beach", state: "NC", country: "US", region: "Southeast" },
  { slug: "The-Atrium-Beach-Resort-and-Spa-Sint-Maarten", name: "The Atrium Beach Resort & Spa", city: "Simpson Bay", state: "St Maarten", country: "St Maarten", region: "Caribbean" },
  { slug: "Coconut-Malorie-Resort-Ocean-City", name: "Coconut Malorie Resort", city: "Ocean City", state: "MD", country: "US", region: "Mid-Atlantic" },
  { slug: "Coconut-Palms-Beach-Resort-II", name: "Coconut Palms Beach Resort II", city: "New Smyrna Beach", state: "FL", country: "US", region: "Southeast" },
  { slug: "Los-Lagos-at-Hot-Springs-Village", name: "Los Lagos at Hot Springs Village", city: "Hot Springs Village", state: "AR", country: "US", region: "South" },
  { slug: "Ocean-Club", name: "Ocean Club", city: "North Myrtle Beach", state: "SC", country: "US", region: "Southeast" },
  { slug: "Ocean-Gate-Resort", name: "Ocean Gate Resort", city: "St. Augustine", state: "FL", country: "US", region: "Southeast" },
  { slug: "Palm-Beach-Resort", name: "Palm Beach Resort", city: "Orange Beach", state: "AL", country: "US", region: "South" },
  { slug: "Park-Plaza-Resort---Park-City-Ascend-Collection-Hotel", name: "Park Plaza Resort", city: "Park City", state: "UT", country: "US", region: "West" },
  { slug: "Rangeley-Lake-Resort", name: "Rangeley Lake Resort", city: "Rangeley", state: "ME", country: "US", region: "Northeast" },
  { slug: "Sea-Mystique", name: "Sea Mystique", city: "Garden City", state: "SC", country: "US", region: "Southeast" },
  { slug: "Shores", name: "Shores Resort", city: "Orange Beach", state: "AL", country: "US", region: "South" },
  { slug: "Southcape-Resort-and-Club", name: "Southcape Resort & Club", city: "Mashpee", state: "MA", country: "US", region: "Northeast" },
  { slug: "Tamarack-Resort", name: "Tamarack Resort", city: "Wisconsin Dells", state: "WI", country: "US", region: "Midwest" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseNights(text: string): { nights: number; days: number } | null {
  let m = text.match(/(\d+)\s*nights?/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }
  m = text.match(/(\d+)\s*days?\s*(?:and|[\/&,])\s*(\d+)\s*nights?/i);
  if (m) return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };
  return null;
}

function resolveUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

/**
 * Strip URL fragments (#anchor) so we don't store multiple "deals" that
 * all point to the same landing page with different anchors.
 * The Festiva /adventure-club page is a single club-membership landing
 * page; its in-page anchors are not separate deal URLs.
 */
function stripFragment(url: string): string {
  const i = url.indexOf("#");
  return i >= 0 ? url.slice(0, i) : url;
}

function findKnownResort(url: string, text: string) {
  for (const resort of KNOWN_RESORTS) {
    if (url.includes(resort.slug) || text.includes(resort.name)) {
      return resort;
    }
  }
  return null;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runFestivaCrawler() {
  const processedUrls = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Scraping ${request.url}`);

      const isAdventureClub = request.url.includes("adventure-club");

      if (isAdventureClub) {
        // ── Adventure Club listing page ─────────────────────────────────
        // The /adventure-club page is a single club-membership landing
        // page with in-page anchors and "View Resort" links to per-resort
        // pages. It does NOT itself contain per-deal pricing.
        //
        // We do NOT emit deals from this page. We only enqueue real
        // per-resort URLs (fragment-stripped, deduped) so the resort
        // handler can decide if a real price exists.

        const enqueued = new Set<string>();
        $("a[href]").each((_i, el) => {
          const href = ($(el).attr("href") || "").trim();
          if (!href) return;
          // Skip pure same-page fragments — these are NOT separate deals.
          if (href.startsWith("#")) return;

          const abs = stripFragment(resolveUrl(href));
          // Only follow festiva.com links into resort pages, not back to
          // the same /adventure-club landing page.
          if (!abs.startsWith(BASE_URL)) return;
          if (abs === `${BASE_URL}/adventure-club`) return;
          if (enqueued.has(abs)) return;

          // Restrict to known resort slugs to avoid crawling marketing pages.
          const matchesKnown = KNOWN_RESORTS.some((r) => abs.includes(r.slug));
          if (!matchesKnown) return;

          enqueued.add(abs);
          crawler.addRequests([{ url: abs }]).catch(() => {});
        });

        log.info(`Enqueued ${enqueued.size} Festiva resort pages from /adventure-club`);
      } else {
        // ── Individual resort page ──────────────────────────────────────
        const pageText = $("body").text();
        const knownResort = findKnownResort(request.url, pageText);

        // Try to find pricing on the resort page
        const price = parsePrice(pageText);
        const duration = parseNights(pageText);

        // Get the main resort image
        const imgEl = $(
          'img[class*="hero"], img[class*="header"], .banner img, header img, section img'
        ).first();
        const imgSrc = imgEl.attr("src") || imgEl.attr("data-src") || "";

        // Extract description
        const description = $("p").filter((_i, el) => {
          const text = $(el).text().trim();
          return text.length > 50 && text.length < 500;
        }).first().text().trim() || undefined;

        // Extract amenities/inclusions
        const inclusions: string[] = [];
        $("li").each((_i, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 3 && text.length < 150) {
            inclusions.push(text);
          }
        });

        // Canonicalize: never store anchored variants of the same page.
        const dealUrl = stripFragment(request.url);
        if (processedUrls.has(dealUrl)) return;
        processedUrls.add(dealUrl);

        // Only emit a deal if we actually parsed a real price from the
        // page DOM. Festiva resort pages typically don't list vacpack
        // pricing (the Adventure Club is a points membership), so most
        // pages should produce zero deals — that's correct.
        if (!price) {
          log.info(`Skipping ${dealUrl} — no price found on page (Festiva club page, not a vacpack)`);
          return;
        }

        const deal: ScrapedDeal = {
          title: knownResort
            ? `${knownResort.name} - ${knownResort.city}`
            : $("h1").first().text().trim() || "Festiva Resort",
          price,
          durationNights: duration?.nights || 3,
          durationDays: duration?.days || 4,
          description:
            description ||
            (knownResort
              ? `Resort preview stay at ${knownResort.name} in ${knownResort.city}, ${knownResort.state}`
              : undefined),
          resortName: knownResort?.name || $("h1").first().text().trim() || undefined,
          url: dealUrl,
          imageUrl: imgSrc || undefined,
          inclusions: inclusions.length > 0 ? inclusions.slice(0, 10) : undefined,
          city: knownResort?.city || "Various",
          state: knownResort?.state,
          country: knownResort?.country || "US",
          brandSlug: "festiva",
        };

        await storeDeal(deal, "festiva");
        log.info(`Stored resort page deal: ${deal.title} ($${deal.price})`);
      }
    },
  });

  await crawler.run([`${BASE_URL}/adventure-club`]);
}
