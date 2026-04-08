/**
 * Meta Ad Library Scraper
 *
 * Pulls ads from the Meta (Facebook) Ad Library API for all known timeshare/vacation
 * deal brand pages. Stores ad creatives, copy, dates, and platforms.
 *
 * API: GET https://graph.facebook.com/v25.0/ads_archive
 * Rate limit: 200 calls/hour
 * Auth: Long-lived User Access Token (META_AD_LIBRARY_TOKEN env var)
 *
 * For commercial ads, we get: creative text, snapshot URL, start/stop dates, platforms.
 * We do NOT get: spend, impressions, demographics (those are political/EU ads only).
 */

import { db } from "@vacationdeals/db";
import { adLibraryPages, adLibraryAds, brands } from "@vacationdeals/db";
import { eq } from "drizzle-orm";

const API_VERSION = "v25.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}/ads_archive`;
const TOKEN = process.env.META_AD_LIBRARY_TOKEN || "";
const RATE_LIMIT_DELAY = 20000; // 20 seconds between calls (200/hour = 18s min)
const ADS_PER_PAGE = 500;

// Known Facebook Page IDs for timeshare/vacation brands
// These will be seeded to the adLibraryPages table
const BRAND_PAGE_IDS: Record<string, { pageId: string; pageName: string }> = {
  // Direct brands
  westgate: { pageId: "111822892193027", pageName: "Westgate Resorts" },
  hgv: { pageId: "167aborede15662", pageName: "Hilton Grand Vacations" },
  bluegreen: { pageId: "108082929229108", pageName: "Bluegreen Vacations" },
  wyndham: { pageId: "133284983367039", pageName: "Club Wyndham" },
  "holiday-inn": { pageId: "114867638534498", pageName: "Holiday Inn Club Vacations" },
  hyatt: { pageId: "113335485354042", pageName: "Hyatt Vacation Ownership" },
  marriott: { pageId: "200aborede53842", pageName: "Marriott Vacations Worldwide" },
  "capital-vacations": { pageId: "104575741232571", pageName: "Capital Vacations" },
  // Brokers
  bookvip: { pageId: "159848714044476", pageName: "BookVIP" },
  staypromo: { pageId: "104237808033792", pageName: "StayPromo" },
  mrg: { pageId: "119820401398486", pageName: "Monster Reservations Group" },
  // Mexican brands
  "el-cid": { pageId: "116749845028756", pageName: "El Cid Resorts" },
  "pueblo-bonito": { pageId: "108530149189804", pageName: "Pueblo Bonito Resorts" },
  "bahia-principe": { pageId: "111899758846660", pageName: "Bahia Principe Hotels" },
  tafer: { pageId: "227019960665476", pageName: "TAFER Hotels & Resorts" },
  "villa-group": { pageId: "113147622067614", pageName: "The Villa Group" },
  // Caribbean
  divi: { pageId: "115604125129735", pageName: "Divi Resorts" },
};

interface MetaAd {
  id: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_descriptions?: string[];
  ad_creative_link_captions?: string[];
  ad_snapshot_url?: string;
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  ad_creation_time?: string;
  publisher_platforms?: string[];
  languages?: string[];
  page_id?: string;
  page_name?: string;
}

interface AdLibraryResponse {
  data: MetaAd[];
  paging?: {
    cursors?: { after?: string };
    next?: string;
  };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Seed brand Facebook page IDs into the adLibraryPages table.
 * Run this once or as part of the regular seed script.
 */
export async function seedAdLibraryPages() {
  console.log("[ad-library] Seeding brand Facebook page IDs...");

  for (const [brandSlug, { pageId, pageName }] of Object.entries(BRAND_PAGE_IDS)) {
    const brand = await db.query.brands.findFirst({
      where: eq(brands.slug, brandSlug),
    });

    const existing = await db.query.adLibraryPages.findFirst({
      where: eq(adLibraryPages.pageId, pageId),
    });

    if (!existing) {
      await db.insert(adLibraryPages).values({
        brandId: brand?.id ?? null,
        pageId,
        pageName,
        pageUrl: `https://www.facebook.com/${pageId}`,
        platform: "facebook",
      });
      console.log(`  + ${pageName} (${pageId})`);
    }
  }

  console.log("[ad-library] Seeding complete.");
}

/**
 * Fetch ads from the Meta Ad Library API for a given page ID.
 */
async function fetchAdsForPage(
  pageId: string,
  cursor?: string,
): Promise<AdLibraryResponse> {
  if (!TOKEN) {
    throw new Error("META_AD_LIBRARY_TOKEN not set. Get a token from developers.facebook.com");
  }

  const params = new URLSearchParams({
    access_token: TOKEN,
    ad_reached_countries: "['US']",
    search_page_ids: pageId,
    ad_type: "ALL",
    ad_active_status: "ALL",
    fields: [
      "id",
      "ad_creative_bodies",
      "ad_creative_link_titles",
      "ad_creative_link_descriptions",
      "ad_creative_link_captions",
      "ad_snapshot_url",
      "ad_delivery_start_time",
      "ad_delivery_stop_time",
      "ad_creation_time",
      "publisher_platforms",
      "languages",
      "page_id",
      "page_name",
    ].join(","),
    limit: String(ADS_PER_PAGE),
  });

  if (cursor) {
    params.set("after", cursor);
  }

  const url = `${BASE_URL}?${params}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ad Library API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Store a single ad in the database.
 */
async function storeAd(ad: MetaAd, pageDbId: number, brandId: number | null) {
  const existing = await db.query.adLibraryAds.findFirst({
    where: eq(adLibraryAds.metaAdId, ad.id),
  });

  const adData = {
    adLibraryPageId: pageDbId,
    brandId,
    metaAdId: ad.id,
    adCreativeBody: ad.ad_creative_bodies?.join("\n---\n") ?? null,
    adCreativeLinkTitle: ad.ad_creative_link_titles?.join(" | ") ?? null,
    adCreativeLinkDescription: ad.ad_creative_link_descriptions?.join(" | ") ?? null,
    adCreativeLinkCaption: ad.ad_creative_link_captions?.join(" | ") ?? null,
    adSnapshotUrl: ad.ad_snapshot_url ?? null,
    adDeliveryStartTime: ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time) : null,
    adDeliveryStopTime: ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time) : null,
    adCreationTime: ad.ad_creation_time ? new Date(ad.ad_creation_time) : null,
    publisherPlatforms: ad.publisher_platforms ? JSON.stringify(ad.publisher_platforms) : null,
    languages: ad.languages ? JSON.stringify(ad.languages) : null,
    isActive: !ad.ad_delivery_stop_time,
    scrapedAt: new Date(),
  };

  if (existing) {
    await db.update(adLibraryAds).set(adData).where(eq(adLibraryAds.id, existing.id));
  } else {
    await db.insert(adLibraryAds).values(adData);
  }
}

/**
 * Run the Ad Library scraper for all known brand pages.
 */
export async function runAdLibraryCrawler() {
  if (!TOKEN) {
    console.log("[ad-library] META_AD_LIBRARY_TOKEN not set — skipping.");
    console.log("[ad-library] To get a token:");
    console.log("  1. Go to developers.facebook.com");
    console.log("  2. Create a Business app with Marketing API");
    console.log("  3. Complete identity verification");
    console.log("  4. Generate a User Access Token via Graph API Explorer");
    console.log("  5. Exchange for a long-lived token (60 days)");
    console.log("  6. Set META_AD_LIBRARY_TOKEN in .env");
    return;
  }

  // Seed pages first
  await seedAdLibraryPages();

  // Get all pages from DB
  const pages = await db.select().from(adLibraryPages);

  for (const page of pages) {
    console.log(`\n[ad-library] Scraping ads for ${page.pageName} (${page.pageId})...`);
    let totalAds = 0;
    let cursor: string | undefined;

    try {
      do {
        const response = await fetchAdsForPage(page.pageId, cursor);

        for (const ad of response.data) {
          await storeAd(ad, page.id, page.brandId);
          totalAds++;
        }

        cursor = response.paging?.cursors?.after;

        // Rate limiting
        if (cursor) {
          console.log(`  ... ${totalAds} ads so far, fetching next page...`);
          await sleep(RATE_LIMIT_DELAY);
        }
      } while (cursor);

      // Update page stats
      await db.update(adLibraryPages).set({
        totalAdsFound: totalAds,
        lastScrapedAt: new Date(),
      }).where(eq(adLibraryPages.id, page.id));

      console.log(`[ad-library] ${page.pageName}: ${totalAds} ads stored.`);
    } catch (err) {
      console.error(`[ad-library] ${page.pageName} failed:`, err);
    }

    // Wait between brands
    await sleep(RATE_LIMIT_DELAY);
  }

  console.log("\n[ad-library] All pages scraped.");
}

// Allow direct execution: npx tsx src/crawlers/ad-library.ts
if (require.main === module) {
  runAdLibraryCrawler().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
