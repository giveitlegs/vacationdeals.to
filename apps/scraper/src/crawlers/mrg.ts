import { CheerioCrawler, log as crawleeLog, type CheerioCrawlingContext } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

type CheerioAPI = CheerioCrawlingContext["$"];

const BASE_URL = "https://mrgvacationpackages.com";

/**
 * All destination URLs from the sitemap (destinations-sitemap.xml).
 */
const DESTINATION_PATHS = [
  "destinations/atlanta-ga",
  "destinations/austin-tx",
  "destinations/branson-mo",
  "destinations/cabo-mx",
  "destinations/cancun-mx",
  "destinations/cocoa-beach-fl",
  "destinations/collingwood-on",
  "destinations/cozumel-mx",
  "destinations/destin-fl",
  "destinations/galveston-tx",
  "destinations/hollywood-fl",
  "destinations/huatulco-mx",
  "destinations/las-vegas-nv",
  "destinations/loreto-mx",
  "destinations/massanutten-va",
  "destinations/maui-hi",
  "destinations/myrtle-beach-sc",
  "destinations/orlando-fl",
  "destinations/panama-city-fl",
  "destinations/playa-del-carmen-mx",
  "destinations/poconos-pa",
  "destinations/portland-or",
  "destinations/puerto-plata-dr",
  "destinations/puerto-vallarta-mx",
  "destinations/punta-cana-dominican-republic",
  "destinations/san-miguel-de-allende-mx",
  "destinations/washington-dc",
  "destinations/willemstad-curacao",
  "destinations/williamsburg-va",
];

/**
 * All bundle URLs from the sitemap (bundles-sitemap.xml).
 */
const BUNDLE_PATHS = [
  "bundles/adventure-seeker-bundle",
  "bundles/americas-shoreline-bundle",
  "bundles/american-heritage-bundle",
  "bundles/arts-architecture-bundle",
  "bundles/best-beaches-bundle",
  "bundles/bustling-city-bundle",
  "bundles/caribbean-crush-bundle",
  "bundles/coast-to-coast-beach-bundle",
  "bundles/cultural-experience-bundle",
  "bundles/endless-summer-bundle",
  "bundles/exciting-live-show-bundle",
  "bundles/family-fundle-bundle",
  "bundles/gourmet-getaway-bundle",
  "bundles/island-hopper-bundle",
  "bundles/luxe-coastal-collection",
  "bundles/nature-lovers-bundle",
  "bundles/north-meets-south-bundle",
  "bundles/peaks-pacific-bundle",
  "bundles/seaside-escape-bundle",
  "bundles/sun-and-sand-bundle",
];

/** Parse city and state/country from a destination slug like "cancun-mx" */
function parseDestinationSlug(slug: string): {
  city: string;
  state?: string;
  country: string;
} {
  // Known international suffixes
  const intlSuffixes: Record<string, string> = {
    mx: "MX",
    dr: "DO",
    "dominican-republic": "DO",
    curacao: "CW",
    on: "CA", // Ontario, Canada
  };

  const stateAbbrevs: Record<string, string> = {
    ga: "Georgia",
    tx: "Texas",
    mo: "Missouri",
    fl: "Florida",
    nv: "Nevada",
    va: "Virginia",
    hi: "Hawaii",
    sc: "South Carolina",
    pa: "Pennsylvania",
    or: "Oregon",
    dc: "District of Columbia",
  };

  // Split slug: e.g. "cancun-mx", "myrtle-beach-sc", "punta-cana-dominican-republic"
  // The last segment is typically the state/country abbreviation
  const parts = slug.split("-");

  // Check for multi-word suffixes like "dominican-republic"
  const lastTwo = parts.slice(-2).join("-");
  if (intlSuffixes[lastTwo]) {
    const city = parts
      .slice(0, -2)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return { city, country: intlSuffixes[lastTwo] };
  }

  const lastPart = parts[parts.length - 1];

  if (intlSuffixes[lastPart]) {
    const city = parts
      .slice(0, -1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return { city, country: intlSuffixes[lastPart] };
  }

  if (stateAbbrevs[lastPart]) {
    const city = parts
      .slice(0, -1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return { city, state: stateAbbrevs[lastPart], country: "US" };
  }

  // Fallback: treat the whole slug as the city name
  const city = parts
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return { city, country: "US" };
}

/**
 * Extract deals from an MRG destination page.
 *
 * Destination pages (WordPress + Astra + Elementor) have a consistent layout:
 * - Package Price: $XXX/Room
 * - Duration: X Days, Y Nights
 * - Party size: Up To N Adults, M Children
 * - Resort list with names and images
 * - Inclusions (all-inclusive for international, standard for domestic)
 * - Room type details
 */
function extractDestinationDeal(
  $: CheerioAPI,
  url: string,
  slug: string,
  log: { info: (msg: string) => void; warning: (msg: string) => void }
): ScrapedDeal | null {
  const bodyText = $.text();
  const location = parseDestinationSlug(slug);

  // --- Extract price ---
  // Patterns: "$199/Room", "$99/Room", "Package Price: $199", "$199 Per Room"
  let price: number | null = null;

  const pricePatterns = [
    /\$(\d{1,4})(?:\s*\/\s*Room|\s*Per\s*Room)/i,
    /Package\s*Price[:\s]*\$(\d{1,4})/i,
    /Starting\s*(?:At|From)\s*\$(\d{1,4})/i,
    /\$(\d{1,4})\s*(?:per\s+(?:room|person|package))/i,
  ];

  for (const pat of pricePatterns) {
    const m = bodyText.match(pat);
    if (m) {
      price = parseInt(m[1]);
      break;
    }
  }

  if (!price) {
    // Broader fallback - find first reasonable dollar amount
    const fallback = bodyText.match(/\$(\d{2,4})/);
    if (fallback) {
      const val = parseInt(fallback[1]);
      if (val >= 50 && val <= 1000) price = val;
    }
  }

  if (!price) {
    log.warning(`No price found on destination page: ${url}`);
    return null;
  }

  // --- Extract duration ---
  // Pattern: "6 Days, 5 Nights" or "5 Days & 4 Nights" or "5 days, 4 nights"
  let durationDays = 5;
  let durationNights = 4;

  const durationMatch = bodyText.match(
    /(\d+)\s*Days?\s*[,&/]\s*(\d+)\s*Nights?/i
  );
  if (durationMatch) {
    durationDays = parseInt(durationMatch[1]);
    durationNights = parseInt(durationMatch[2]);
  }

  // --- Extract resort names ---
  // Resort names typically appear as h2/h3 headings in the resort grid section.
  // They also appear in text like "Resort Options:" followed by a list.
  const resortNames: string[] = [];

  // Look for resort name headings near images
  $("h2, h3, h4").each((_i, el) => {
    const text = $(el).text().trim();
    // Resort names are typically 2-6 words, often contain "Resort", "Hotel", "Suites", etc.
    if (
      text.length > 5 &&
      text.length < 100 &&
      !text.includes("$") &&
      !text.match(
        /^(Package|Price|About|Welcome|Contact|Book|FAQ|Blog|Amenities|Room|What|Destination|How|Why|Included|Day|Night|Your|Our|The\s+Best|Explore|Discover)/i
      ) &&
      (text.match(
        /(?:Resort|Hotel|Suites?|Inn|Lodge|Villa|Palace|Club|Spa|Beach|Sonesta|Wyndham|Hilton|Hyatt|Marriott|Westin|Sheraton|Worldmark|Calypso|Barefoot|LaQuinta|Silver\s+Lake|Summer\s+Bay|Dreams|Grand|Oasis|Krystal|Laguna|Ocean|Sunset|Paramount)/i
      ) ||
        // If near an image, it's likely a resort name
        $(el).prev("img").length > 0 ||
        $(el).parent().find("img").length > 0)
    ) {
      resortNames.push(text);
    }
  });

  // --- Extract hero/featured image ---
  let imageUrl: string | undefined;

  // Check for Elementor background images (inline styles)
  $('[data-settings], [style*="background-image"]').each((_i, el) => {
    if (imageUrl) return;
    const style = $(el).attr("style") || "";
    const bgMatch = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/);
    if (bgMatch && bgMatch[1].match(/\.(jpg|jpeg|png|webp)/i)) {
      imageUrl = bgMatch[1];
    }
    // Also check Elementor data-settings for background
    const settings = $(el).attr("data-settings");
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        if (parsed.background_image?.url) {
          imageUrl = parsed.background_image.url;
        }
      } catch {
        // ignore parse errors
      }
    }
  });

  // Fallback: first large content image
  if (!imageUrl) {
    $("img").each((_i, el) => {
      if (imageUrl) return;
      const src = $(el).attr("src") || "";
      const width = parseInt($(el).attr("width") || "0");
      if (
        src.includes("wp-content/uploads") &&
        !src.includes("logo") &&
        !src.includes("icon") &&
        (width > 200 || width === 0)
      ) {
        imageUrl = src;
      }
    });
  }

  // --- Extract inclusions ---
  const inclusions: string[] = [];
  const inclusionKeywords = [
    /all[\s-]inclusive/i,
    /meals.*(?:drinks|alcohol)/i,
    /pool|swimming/i,
    /fitness|gym/i,
    /wi-?fi/i,
    /water\s*sports/i,
    /spa/i,
    /kids?\s*club/i,
    /room\s*service/i,
    /beach/i,
    /entertainment/i,
    /restaurant/i,
    /bar|lounge/i,
    /parking/i,
    /breakfast/i,
    /waterpark/i,
  ];

  $("li, p").each((_i, el) => {
    const text = $(el).text().trim();
    if (text.length < 5 || text.length > 200) return;
    for (const kw of inclusionKeywords) {
      if (kw.test(text)) {
        inclusions.push(text);
        break;
      }
    }
  });

  // Check for all-inclusive mention
  const isAllInclusive = /all[\s-]inclusive/i.test(bodyText);
  if (isAllInclusive && !inclusions.some((i) => /all[\s-]inclusive/i.test(i))) {
    inclusions.unshift("All-inclusive resort with meals, drinks & alcohol");
  }

  // --- Extract party size ---
  const partySizeMatch = bodyText.match(
    /[Uu]p\s+[Tt]o\s+(\d+)\s+(?:Adults?|people|guests?)/i
  );
  const maxGuests = partySizeMatch ? parseInt(partySizeMatch[1]) : undefined;
  if (maxGuests) {
    inclusions.push(`Accommodations for up to ${maxGuests} guests`);
  }

  // --- Check for presentation requirement ---
  const hasPresentation = /presentation/i.test(bodyText);
  const noPresentation = /no\s+presentation\s+required/i.test(bodyText);
  let presentationMinutes: number | undefined;
  const requirements: string[] = [];

  if (hasPresentation && !noPresentation) {
    const presMatch = bodyText.match(
      /(\d+)[\s-]*(?:minute|min)\s+(?:sales\s+)?presentation/i
    );
    presentationMinutes = presMatch ? parseInt(presMatch[1]) : 90;
    requirements.push(
      `${presentationMinutes}-minute sales presentation required`
    );
  }
  if (noPresentation) {
    requirements.push("No presentation required");
  }

  // Check for deposit requirement
  const depositMatch = bodyText.match(
    /\$(\d+)\s*(?:refundable)?\s*deposit/i
  );
  if (depositMatch) {
    requirements.push(`$${depositMatch[1]} refundable deposit required at booking`);
  }

  // Travel window (18 months is standard for MRG)
  const travelWindowMatch = bodyText.match(
    /(\d+)\s*months?\s+to\s+travel/i
  );
  const travelWindow = travelWindowMatch
    ? `${travelWindowMatch[1]} months to travel`
    : "18 months to travel";

  // Build resort name string
  const resortName =
    resortNames.length > 0
      ? resortNames.slice(0, 5).join(", ")
      : undefined;

  // Build title
  const title = `${location.city} - ${durationDays} Days / ${durationNights} Nights${isAllInclusive ? " (All-Inclusive)" : ""}`;

  const deal: ScrapedDeal = {
    title,
    price,
    durationNights,
    durationDays,
    description: `Vacation package to ${location.city}${resortName ? ` at ${resortNames[0]}` : ""}. ${isAllInclusive ? "All-inclusive with meals, drinks & alcohol." : ""} ${maxGuests ? `Accommodates up to ${maxGuests} guests.` : ""}`.trim(),
    resortName,
    url,
    imageUrl,
    inclusions: inclusions.length > 0 ? inclusions : undefined,
    requirements: requirements.length > 0 ? requirements : undefined,
    presentationMinutes,
    travelWindow,
    city: location.city,
    state: location.state,
    country: location.country,
    brandSlug: "mrg",
  };

  return deal;
}

/**
 * Extract deals from an MRG bundle page.
 *
 * Bundle pages contain multiple destinations as part of a package deal.
 * Structure:
 * - Bundle title (e.g. "Caribbean Crush Bundle")
 * - Total price + original/retail price
 * - Multiple destination segments, each with days/nights
 * - Often includes a "Monster Week" bonus trip
 */
function extractBundleDeal(
  $: CheerioAPI,
  url: string,
  log: { info: (msg: string) => void; warning: (msg: string) => void }
): ScrapedDeal | null {
  const bodyText = $.text();

  // --- Extract bundle title ---
  // Usually the main h1 or the og:title
  let title =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().trim();

  // Clean up title - remove site name suffix
  title = title
    .replace(/\s*[-|]\s*Monster Reservations.*$/i, "")
    .replace(/\s*[-|]\s*MRG.*$/i, "")
    .trim();

  if (!title) {
    log.warning(`No title found for bundle: ${url}`);
    return null;
  }

  // --- Extract price ---
  let price: number | null = null;
  let originalPrice: number | undefined;

  // Bundle pages often show "$548" or "Only $691" or "Bundle Price: $XXX"
  const priceMatches = bodyText.match(/\$(\d{1,4}(?:,\d{3})*)/g);
  if (priceMatches) {
    const prices = priceMatches
      .map((p) => parseInt(p.replace(/[$,]/g, "")))
      .filter((p) => p >= 50 && p <= 5000)
      .sort((a, b) => a - b);

    if (prices.length >= 2) {
      // Smallest reasonable price is the deal price, largest is original
      price = prices[0];
      originalPrice = prices[prices.length - 1];
      // Sanity check: original should be much larger than deal price
      if (originalPrice <= price * 1.5) {
        originalPrice = undefined;
      }
    } else if (prices.length === 1) {
      price = prices[0];
    }
  }

  if (!price) {
    log.warning(`No price found for bundle: ${url}`);
    return null;
  }

  // --- Extract destinations and total duration ---
  // Look for patterns like "5 Days & 4 Nights" or "6 days, 5 nights"
  const durationMatches = [
    ...bodyText.matchAll(/(\d+)\s*Days?\s*[,&/]\s*(\d+)\s*Nights?/gi),
  ];

  let totalDays = 0;
  let totalNights = 0;
  const destinations: string[] = [];

  for (const dm of durationMatches) {
    const days = parseInt(dm[1]);
    const nights = parseInt(dm[2]);
    totalDays += days;
    totalNights += nights;
  }

  // If no duration found, estimate from the bundle type
  if (totalNights === 0) {
    totalDays = 12;
    totalNights = 11;
  }

  // Extract destination names from headings and text
  $("h2, h3, h4, h5, h6, strong, b").each((_i, el) => {
    const text = $(el).text().trim();
    // Match destination patterns like "Cozumel, Mexico" or "Myrtle Beach, South Carolina"
    const destMatch = text.match(
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*|[A-Z]{2})$/
    );
    if (destMatch && text.length < 50) {
      destinations.push(text);
    }
  });

  // --- Extract inclusions ---
  const inclusions: string[] = [];
  const isAllInclusive = /all[\s-]inclusive/i.test(bodyText);

  // Parse individual trip descriptions
  $("li, p").each((_i, el) => {
    const text = $(el).text().trim();
    if (text.length < 10 || text.length > 250) return;

    if (
      /(?:day|night|trip|inclusive|resort|accommodation|meal|drink|alcohol|water\s*sport|balcony|terrace|white\s*glove)/i.test(
        text
      )
    ) {
      inclusions.push(text);
    }
  });

  // Add destination summary
  if (destinations.length > 0) {
    inclusions.unshift(`Includes trips to: ${destinations.join(", ")}`);
  }
  if (isAllInclusive) {
    inclusions.push("All-inclusive resort with meals, drinks & alcohol");
  }

  // Check for Monster Week bonus
  const hasMonsterWeek = /monster\s*week/i.test(bodyText);
  if (hasMonsterWeek) {
    inclusions.push(
      "Bonus Monster Week trip (8 days/7 nights to select destinations)"
    );
  }

  // --- Extract image ---
  let imageUrl: string | undefined;
  $('[style*="background-image"]').each((_i, el) => {
    if (imageUrl) return;
    const style = $(el).attr("style") || "";
    const bgMatch = style.match(
      /background-image:\s*url\(["']?([^"')]+)["']?\)/
    );
    if (bgMatch && bgMatch[1].match(/\.(jpg|jpeg|png|webp)/i)) {
      imageUrl = bgMatch[1];
    }
  });
  if (!imageUrl) {
    $("img").each((_i, el) => {
      if (imageUrl) return;
      const src = $(el).attr("src") || "";
      if (
        src.includes("wp-content/uploads") &&
        !src.includes("logo") &&
        !src.includes("icon")
      ) {
        imageUrl = src;
      }
    });
  }

  // --- Requirements ---
  const requirements: string[] = [];
  const noPresentation = /no\s+presentation\s+required/i.test(bodyText);
  if (noPresentation) {
    requirements.push("No presentation required");
  }
  const depositMatch = bodyText.match(/\$(\d+)\s*(?:refundable)?\s*deposit/i);
  if (depositMatch) {
    requirements.push(`$${depositMatch[1]} refundable deposit required`);
  }

  // Determine the primary destination city for the deal record
  // Use first mentioned destination, or parse from bundle name
  let primaryCity = "Multiple Destinations";
  if (destinations.length > 0) {
    primaryCity = destinations[0].split(",")[0].trim();
  } else {
    // Try to extract from title
    const cityFromTitle = title.match(
      /(Caribbean|Beach|Island|Coastal|Mountain|City)/i
    );
    if (cityFromTitle) {
      primaryCity = `Bundle - ${title}`;
    }
  }

  // Calculate savings
  const savingsPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined;

  const deal: ScrapedDeal = {
    title: `${title} - ${totalDays} Days / ${totalNights} Nights`,
    price,
    originalPrice,
    durationNights: totalNights,
    durationDays: totalDays,
    description: `Multi-destination bundle: ${title}. ${destinations.length > 0 ? `Includes ${destinations.join(", ")}.` : ""} ${hasMonsterWeek ? "Plus bonus Monster Week trip." : ""}`.trim(),
    url,
    imageUrl,
    inclusions: inclusions.length > 0 ? inclusions : undefined,
    requirements: requirements.length > 0 ? requirements : undefined,
    travelWindow: "18 months to travel",
    savingsPercent,
    city: primaryCity,
    country: primaryCity.includes("Caribbean") || destinations.some((d) => /Mexico|MX|Dominican|DR|Curacao/i.test(d))
      ? "MX"
      : "US",
    brandSlug: "mrg",
  };

  return deal;
}

/**
 * MRG (Monster Reservations Group) crawler.
 *
 * WordPress + Astra theme + Elementor page builder. Two types of pages:
 * 1. Destination pages (/destinations/city-state/) - individual vacation packages
 * 2. Bundle pages (/bundles/bundle-name/) - multi-destination bundle deals
 *
 * CheerioCrawler works here because the content is server-rendered WordPress.
 * The JetEngine listing grid on the homepage/vacation-bundles page loads
 * dynamically, but individual destination and bundle pages have static content.
 */
export async function runMrgCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 120,
    maxConcurrency: 5,
    requestHandlerTimeoutSecs: 60,

    async requestHandler({ request, $, log }) {
      const url = request.url;
      log.info(`Scraping ${url}`);

      // --- Destination pages ---
      if (url.includes("/destinations/") && !url.endsWith("/destinations/")) {
        // Extract slug from URL: /destinations/cancun-mx/ -> cancun-mx
        const slugMatch = url.match(/\/destinations\/([^/?#]+)/);
        if (!slugMatch) {
          log.warning(`Cannot parse destination slug from: ${url}`);
          return;
        }
        const slug = slugMatch[1].replace(/\/$/, "");

        const deal = extractDestinationDeal($, url, slug, log);
        if (deal) {
          log.info(`Storing destination deal: ${deal.title} @ $${deal.price}`);
          await storeDeal(deal, "mrg");
        }
        return;
      }

      // --- Bundle pages ---
      if (url.includes("/bundles/") && !url.endsWith("/bundles/")) {
        const deal = extractBundleDeal($, url, log);
        if (deal) {
          log.info(`Storing bundle deal: ${deal.title} @ $${deal.price}`);
          await storeDeal(deal, "mrg");
        }
        return;
      }

      // --- Index pages: discover destination and bundle links ---
      log.info(`Index page, discovering links: ${url}`);

      // Enqueue any destination or bundle links found on this page
      const links = new Set<string>();

      $("a[href]").each((_i, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        const fullUrl = href.startsWith("http")
          ? href
          : `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;

        if (
          fullUrl.includes("/destinations/") &&
          !fullUrl.endsWith("/destinations/")
        ) {
          links.add(fullUrl);
        }
        if (
          fullUrl.includes("/bundles/") &&
          !fullUrl.endsWith("/bundles/")
        ) {
          links.add(fullUrl);
        }
      });

      log.info(`Found ${links.size} destination/bundle links on ${url}`);
      for (const link of links) {
        await crawler.addRequests([{ url: link }]);
      }
    },

    failedRequestHandler({ request, log }) {
      log.warning(`Request failed: ${request.url}`);
    },
  });

  // Seed URLs: homepage, popular-bundles, vacation-bundles,
  // plus all known destination and bundle pages from the sitemap
  const seedUrls = [
    BASE_URL,
    `${BASE_URL}/popular-bundles/`,
    `${BASE_URL}/vacation-bundles/`,
    ...DESTINATION_PATHS.map((p) => `${BASE_URL}/${p}/`),
    ...BUNDLE_PATHS.map((p) => `${BASE_URL}/${p}/`),
  ];

  crawleeLog.info(
    `MRG crawler starting with ${seedUrls.length} seed URLs`
  );
  await crawler.run(seedUrls);
  crawleeLog.info("MRG crawler finished");
}
