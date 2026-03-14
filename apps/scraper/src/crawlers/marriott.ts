import { PlaywrightCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Marriott Vacation Club crawler.
 *
 * Marriott packages live on packages.marriottvacationclubs.com (WordPress/Kadence).
 * The main site uses SSL certs that may fail standard fetch — the packages subdomain works.
 *
 * Structure:
 *   - /dce/cmd/org/ways-to-play/ — chooser page linking to destination pages
 *   - /dce/cmd/org/{destination}-vacations/ — destination landing with resort cards
 *   - /dce/cmd/org/{destination}/{resort-slug}/?loc=... — individual resort offer page
 *
 * Individual resort pages contain:
 *   - Price in body text (e.g. "$399", "$899")
 *   - Duration (e.g. "5 days / 4 nights")
 *   - Resort name in <title> and headings
 *   - Room type (e.g. "1-bedroom villa", "guestroom with kitchenette")
 *   - All require 90-minute timeshare presentation
 *   - Bonvoy points bonus (up to 20,000)
 *
 * Content is Kadence-block rendered and needs Playwright for full JS execution.
 */

const BASE_URL = "https://packages.marriottvacationclubs.com";

// Known resort offer pages with destinations and metadata
const RESORT_PAGES = [
  // Orlando
  {
    path: "/dce/cmd/org/orlando/grande-vista/",
    resort: "Marriott's Grande Vista",
    city: "Orlando",
    state: "FL",
    country: "US",
  },
  {
    path: "/dce/cmd/org/orlando/sheraton-vistana-villages/",
    resort: "Sheraton Vistana Villages",
    city: "Orlando",
    state: "FL",
    country: "US",
  },
  // Hawaii
  {
    path: "/dce/cmd/org/hawaii/big-island-hawaii/",
    resort: "Marriott's Waikoloa Ocean Club",
    city: "Waikoloa",
    state: "HI",
    country: "US",
  },
  // Florida (non-Orlando)
  {
    path: "/dce/cmd/org/florida/marco-island/",
    resort: "Marriott's Crystal Shores",
    city: "Marco Island",
    state: "FL",
    country: "US",
  },
  {
    path: "/dce/cmd/org/florida/singer-island/",
    resort: "Marriott's Ocean Pointe",
    city: "Singer Island",
    state: "FL",
    country: "US",
  },
  // South Carolina
  {
    path: "/dce/cmd/org/south-carolina/hilton-head/",
    resort: "Marriott's Barony Beach Club",
    city: "Hilton Head",
    state: "SC",
    country: "US",
  },
  {
    path: "/dce/cmd/org/south-carolina/myrtle-beach/",
    resort: "Marriott's OceanWatch Villas",
    city: "Myrtle Beach",
    state: "SC",
    country: "US",
  },
  // California
  {
    path: "/dce/cmd/org/california/palm-desert/",
    resort: "Marriott's Shadow Ridge",
    city: "Palm Desert",
    state: "CA",
    country: "US",
  },
  // Colorado
  {
    path: "/dce/cmd/org/colorado/vail/",
    resort: "Marriott's StreamSide at Vail",
    city: "Vail",
    state: "CO",
    country: "US",
  },
  // Utah
  {
    path: "/dce/cmd/org/utah/park-city/",
    resort: "Marriott's MountainSide",
    city: "Park City",
    state: "UT",
    country: "US",
  },
  // Las Vegas
  {
    path: "/dce/cmd/org/las-vegas/grand-chateau/",
    resort: "Marriott's Grand Chateau",
    city: "Las Vegas",
    state: "NV",
    country: "US",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseDuration(text: string): { nights: number; days: number } | null {
  // "5 days / 4 nights" or "4 nights / 5 days" or "3 nights"
  let m = text.match(/(\d+)\s*days?\s*[\/&]\s*(\d+)\s*nights?/i);
  if (m) return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*nights?\s*[\/&]\s*(\d+)\s*days?/i);
  if (m) return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*nights?/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }

  return null;
}

function parseBonvoyPoints(text: string): number | null {
  const m = text.replace(/,/g, "").match(/([\d]+)\s*(?:bonvoy\s*)?points/i);
  return m ? parseInt(m[1], 10) : null;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runMarriottCrawler() {
  const processedUrls = new Set<string>();

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 30,
    navigationTimeoutSecs: 60,
    requestHandlerTimeoutSecs: 90,
    headless: true,
    launchContext: {
      launchOptions: {
        args: ["--ignore-certificate-errors"],
      },
    },
    async requestHandler({ request, page, log }) {
      log.info(`Scraping ${request.url}`);

      // Wait for content to render (Kadence blocks load dynamically)
      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const url = request.url;
      const userData = request.userData as {
        resort?: string;
        city?: string;
        state?: string;
        country?: string;
      };

      // ── Destination listing pages: discover resort links ──────────────
      if (url.includes("-vacations/") || url.includes("ways-to-play")) {
        const links = await page.$$eval("a[href]", (els) =>
          els
            .map((a) => (a as HTMLAnchorElement).href)
            .filter(
              (h) =>
                h.includes("/dce/cmd/org/") &&
                !h.includes("-vacations") &&
                !h.includes("ways-to-play"),
            ),
        );

        const uniqueLinks = [...new Set(links)];
        for (const link of uniqueLinks) {
          if (!processedUrls.has(link)) {
            await crawler.addRequests([{ url: link }]);
          }
        }
        log.info(`Discovered ${uniqueLinks.length} resort links from ${url}`);
        return;
      }

      // ── Individual resort offer page ──────────────────────────────────
      if (processedUrls.has(url)) return;
      processedUrls.add(url);

      // Get all visible text content
      const bodyText = await page.evaluate(() => document.body?.innerText || "");
      const titleText = await page.title();

      // Extract price from page text
      const price = parsePrice(bodyText);
      if (!price || price <= 0) {
        log.info(`No price found on ${url}, skipping`);
        return;
      }

      // Extract duration
      const duration = parseDuration(bodyText) || { nights: 4, days: 5 };

      // Extract Bonvoy points
      const bonvoyPoints = parseBonvoyPoints(bodyText);

      // Resort name: from userData, title, or page heading
      let resortName = userData.resort || "";
      if (!resortName) {
        const heading = await page
          .$eval("h1, h2", (el) => el.textContent?.trim() || "")
          .catch(() => "");
        resortName = heading || titleText.split("|")[0].trim();
      }

      // Location from userData or parse from page
      const city = userData.city || parseCityFromTitle(titleText);
      const state = userData.state || "";
      const country = userData.country || "US";

      // Image URL
      const imageUrl = await page
        .$eval(
          ".kb-image img, .wp-block-kadence-image img, .kadence-column img",
          (img) => (img as HTMLImageElement).src,
        )
        .catch(() => undefined);

      // Build inclusions list
      const inclusions: string[] = [];
      inclusions.push(
        `${duration.days} Days / ${duration.nights} Nights at ${resortName}`,
      );
      if (bonvoyPoints) {
        inclusions.push(`Up to ${bonvoyPoints.toLocaleString()} Marriott Bonvoy Points`);
      }
      inclusions.push("90-minute timeshare presentation required");
      inclusions.push("$199 deposit locks offer for 12 months");

      // Room type from text
      const roomMatch = bodyText.match(
        /(1-bedroom\s+villa|2-bedroom\s+villa|studio|guestroom\s+with\s+kitchenette|suite)/i,
      );
      if (roomMatch) {
        inclusions.push(`Accommodation: ${roomMatch[1]}`);
      }

      const deal: ScrapedDeal = {
        title: `${resortName} - ${city} Vacation Package`,
        price,
        durationNights: duration.nights,
        durationDays: duration.days,
        description: `Experience ${city} with a discounted stay at ${resortName}. Attend a 90-minute Marriott Vacation Club presentation and earn Bonvoy points.`,
        resortName,
        url,
        imageUrl,
        inclusions,
        requirements: [
          "Attend 90-minute timeshare presentation",
          "Must be 25+ years old",
          "Combined household income $75,000+",
          "Married couples must attend together",
          "$199 deposit required",
        ],
        presentationMinutes: 90,
        savingsPercent: undefined,
        city,
        state,
        country,
        brandSlug: "marriott",
      };

      if (bonvoyPoints) {
        deal.inclusions!.push(
          `Earn up to ${bonvoyPoints.toLocaleString()} Bonvoy points`,
        );
      }

      try {
        await storeDeal(deal, "marriott");
        log.info(`Stored: ${deal.title} ($${deal.price})`);
      } catch (err) {
        log.error(`Failed to store ${deal.title}: ${err}`);
      }
    },
  });

  // Build request list: known resort pages + destination listing pages
  const requests = RESORT_PAGES.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    userData: {
      resort: r.resort,
      city: r.city,
      state: r.state,
      country: r.country,
    },
  }));

  // Also crawl destination listing pages to discover new resorts
  requests.push(
    { url: `${BASE_URL}/dce/cmd/org/ways-to-play/`, userData: {} as any },
    { url: `${BASE_URL}/dce/cmd/org/orlando-vacations/`, userData: {} as any },
    { url: `${BASE_URL}/dce/cmd/org/florida-vacations/`, userData: {} as any },
    { url: `${BASE_URL}/dce/cmd/org/hawaii-vacations/`, userData: {} as any },
  );

  await crawler.run(requests);
}

// ── Helper: extract city name from page title ────────────────────────────────

function parseCityFromTitle(title: string): string {
  // "Orlando Vacation Offer | Marriott's Grande Vista | ..."
  const m = title.match(/^(\w[\w\s]+?)\s*Vacation/i);
  if (m) return m[1].trim();

  // "Waikoloa Beach Vacation Offer | ..."
  const m2 = title.match(/^([\w\s]+?)\s*(?:Beach\s+)?Vacation/i);
  if (m2) return m2[1].trim();

  return "Unknown";
}
