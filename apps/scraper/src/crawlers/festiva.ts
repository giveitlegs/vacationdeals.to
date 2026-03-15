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
        // Resort cards: <img> + <h5> resort name + description + address + [View Resort] link

        // Strategy 1: Find resort card containers
        const resortSections = $("section, article, .resort, .property, .card, div").filter(
          (_i, el) => {
            const text = $(el).text();
            const hasResortName = $(el).find("h3, h4, h5, h6").length > 0;
            const hasViewResort = text.includes("View Resort");
            return hasResortName && hasViewResort;
          }
        );

        if (resortSections.length > 0) {
          log.info(`Found ${resortSections.length} resort sections`);

          resortSections.each((_i, el) => {
            const section = $(el);
            try {
              const resortName = section.find("h3, h4, h5, h6").first().text().trim();
              if (!resortName) return;

              const linkEl = section.find('a[href*="/"]').filter((_i, el) => {
                const text = $(el).text().trim();
                return text.includes("View Resort") || text.includes("Learn More");
              }).first();
              const href = linkEl.attr("href") || "";
              const resortUrl = href ? resolveUrl(href) : "";

              if (resortUrl && !processedUrls.has(resortUrl)) {
                // Enqueue resort page for detailed scraping
                crawler.addRequests([{ url: resortUrl }]).catch(() => {});
              }

              const imgEl = section.find("img").first();
              const imgSrc = imgEl.attr("src") || imgEl.attr("data-src") || "";
              const imageUrl = imgSrc || undefined;

              // Match to known resort data
              const knownResort = findKnownResort(href, resortName);

              // Create a listing entry for this resort
              const dealUrl = resortUrl || `${BASE_URL}/adventure-club#${resortName.replace(/\s+/g, "-")}`;
              if (processedUrls.has(dealUrl)) return;
              processedUrls.add(dealUrl);

              const deal: ScrapedDeal = {
                title: `${knownResort?.name || resortName} - ${knownResort?.city || "Various"}`,
                price: 199, // Festiva typical promo rate placeholder
                durationNights: 3,
                durationDays: 4,
                description: `Resort preview stay at ${knownResort?.name || resortName} in ${knownResort?.city || "Various"}, ${knownResort?.state || "US"}`,
                resortName: knownResort?.name || resortName,
                url: dealUrl,
                imageUrl,
                city: knownResort?.city || "Various",
                state: knownResort?.state,
                country: knownResort?.country || "US",
                brandSlug: "festiva",
              };

              storeDeal(deal, "festiva")
                .then(() => log.info(`Stored resort listing: ${deal.title}`))
                .catch((err) => log.error(`Failed to store resort: ${err}`));
            } catch (err) {
              log.error(`Error parsing resort section: ${err}`);
            }
          });
        }

        // Strategy 2: Fallback — find resort links by known slugs
        if (resortSections.length === 0) {
          log.info("Falling back to known resort slug matching");

          for (const resort of KNOWN_RESORTS) {
            const resortUrl = `${BASE_URL}/${resort.slug}`;

            // Check if page has a link to this resort
            const linkEl = $(`a[href*="${resort.slug}"]`).first();
            const imgEl = linkEl.length
              ? linkEl.closest("div, section").find("img").first()
              : $(`img[alt*="${resort.name}"]`).first();
            const imgSrc = imgEl.attr("src") || imgEl.attr("data-src") || "";

            if (processedUrls.has(resortUrl)) continue;
            processedUrls.add(resortUrl);

            // Enqueue for detailed scraping
            crawler.addRequests([{ url: resortUrl }]).catch(() => {});

            const deal: ScrapedDeal = {
              title: `${resort.name} - ${resort.city}`,
              price: 199,
              durationNights: 3,
              durationDays: 4,
              description: `Resort preview stay at ${resort.name} in ${resort.city}, ${resort.state}`,
              resortName: resort.name,
              url: resortUrl,
              imageUrl: imgSrc || undefined,
              city: resort.city,
              state: resort.state,
              country: resort.country,
              brandSlug: "festiva",
            };

            storeDeal(deal, "festiva")
              .then(() => log.info(`Stored known resort: ${deal.title}`))
              .catch((err) => log.error(`Failed to store resort: ${err}`));
          }
        }
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

        const dealUrl = request.url;
        if (processedUrls.has(dealUrl)) return;
        processedUrls.add(dealUrl);

        const deal: ScrapedDeal = {
          title: knownResort
            ? `${knownResort.name} - ${knownResort.city}`
            : $("h1").first().text().trim() || "Festiva Resort",
          price: price || 199,
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
