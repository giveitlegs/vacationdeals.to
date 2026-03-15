import { PlaywrightCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Legendary Vacation Club crawler (legendaryvacationclub.com).
 *
 * Hard Rock / Palace Resorts / Nobu Hotels / UNICO properties.
 * JS-rendered site (likely Wix/Duda) — requires Playwright.
 *
 * Site structure (from sitemap):
 *   - /special-offers/ — promotional deals page
 *   - /our-destinations.htm — all destinations overview
 *   - Individual resort pages: /hard-rock-hotel-cancun.htm, /ava-resort.htm, etc.
 *   - Resort brands: Hard Rock, AVA, DOMA, Eden Roc, Nobu, UNICO
 *   - Destinations: Cancun, Riviera Maya, Los Cabos, Vallarta, Punta Cana,
 *     Chicago, Miami Beach, Montego Bay
 *
 * Strategy:
 *   1. Crawl /special-offers/ for promotional deal cards
 *   2. Crawl /our-destinations.htm for destination/resort listings
 *   3. Crawl individual resort pages for pricing details
 *   4. Use Playwright since site is JS-rendered
 */

const BASE_URL = "https://www.legendaryvacationclub.com";

// ── Known resort pages with destination info ────────────────────────────────

const RESORT_PAGES: Array<{
  url: string;
  resortName: string;
  city: string;
  state?: string;
  country: string;
}> = [
  { url: "/hard-rock-hotel-cancun.htm", resortName: "Hard Rock Hotel Cancun", city: "Cancun", country: "Mexico" },
  { url: "/hard-rock-hotel-riviera-maya.htm", resortName: "Hard Rock Hotel Riviera Maya", city: "Riviera Maya", country: "Mexico" },
  { url: "/hard-rock-hotel-los-cabos.htm", resortName: "Hard Rock Hotel Los Cabos", city: "Los Cabos", country: "Mexico" },
  { url: "/hard-rock-hotel-vallarta.htm", resortName: "Hard Rock Hotel Vallarta", city: "Puerto Vallarta", country: "Mexico" },
  { url: "/hard-rock-hotel--casino-punta-cana.htm", resortName: "Hard Rock Hotel & Casino Punta Cana", city: "Punta Cana", country: "Dominican Republic" },
  { url: "/ava-resort.htm", resortName: "AVA Resort Cancun", city: "Cancun", country: "Mexico" },
  { url: "/doma.htm", resortName: "DOMA Hotel", city: "Cancun", country: "Mexico" },
  { url: "/eden-roc.htm", resortName: "Eden Roc at Cap Cana", city: "Punta Cana", country: "Dominican Republic" },
  { url: "/nobu-hotel.htm", resortName: "Nobu Hotel Los Cabos", city: "Los Cabos", country: "Mexico" },
  { url: "/nobu-hotel-chicago.htm", resortName: "Nobu Hotel Chicago", city: "Chicago", state: "IL", country: "US" },
  { url: "/nobu-hotel-miami-beach.htm", resortName: "Nobu Hotel Miami Beach", city: "Miami Beach", state: "FL", country: "US" },
  { url: "/unico-riviera-maya.htm", resortName: "UNICO 20 87 Riviera Maya", city: "Riviera Maya", country: "Mexico" },
  { url: "/unico-vallarta.htm", resortName: "UNICO Vallarta", city: "Puerto Vallarta", country: "Mexico" },
  { url: "/unico-montego-bay.htm", resortName: "UNICO Montego Bay", city: "Montego Bay", country: "Jamaica" },
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
  m = text.match(/(\d+)\s*nights?\s*(?:and|[\/&,])\s*(\d+)\s*days?/i);
  if (m) return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };
  return null;
}

function findResortInfo(
  url: string,
  text: string
): { resortName: string; city: string; state?: string; country: string } | null {
  // Match by URL path
  for (const resort of RESORT_PAGES) {
    if (url.includes(resort.url.replace(".htm", ""))) {
      return resort;
    }
  }
  // Match by text content
  for (const resort of RESORT_PAGES) {
    if (text.toLowerCase().includes(resort.resortName.toLowerCase())) {
      return resort;
    }
  }
  return null;
}

function detectDestination(text: string): {
  city: string;
  state?: string;
  country: string;
} {
  const patterns: Array<{ pattern: RegExp; city: string; state?: string; country: string }> = [
    { pattern: /cancun/i, city: "Cancun", country: "Mexico" },
    { pattern: /riviera\s*maya/i, city: "Riviera Maya", country: "Mexico" },
    { pattern: /los\s*cabos|cabo/i, city: "Los Cabos", country: "Mexico" },
    { pattern: /vallarta/i, city: "Puerto Vallarta", country: "Mexico" },
    { pattern: /punta\s*cana/i, city: "Punta Cana", country: "Dominican Republic" },
    { pattern: /montego\s*bay/i, city: "Montego Bay", country: "Jamaica" },
    { pattern: /chicago/i, city: "Chicago", state: "IL", country: "US" },
    { pattern: /miami/i, city: "Miami Beach", state: "FL", country: "US" },
  ];
  for (const p of patterns) {
    if (p.pattern.test(text)) return { city: p.city, state: p.state, country: p.country };
  }
  return { city: "Cancun", country: "Mexico" };
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runLegendaryCrawler() {
  const processedUrls = new Set<string>();

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 30,
    navigationTimeoutSecs: 60,
    requestHandlerTimeoutSecs: 90,
    browserPoolOptions: {
      useFingerprints: false,
    },
    async requestHandler({ request, page, log }) {
      log.info(`Scraping ${request.url}`);

      // Wait for JS rendering
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);

      const pageText = await page.textContent("body") || "";
      const isSpecialOffers = request.url.includes("special-offers");
      const isDestinations = request.url.includes("our-destinations");

      // ── Special offers page ───────────────────────────────────────────
      if (isSpecialOffers) {
        // Look for offer cards/sections with prices
        const offerSections = await page.$$eval(
          'section, article, [class*="offer"], [class*="deal"], [class*="package"], [class*="promo"], [class*="card"], [data-testid*="richtext"], [data-testid*="section"]',
          (elements) =>
            elements.map((el) => ({
              text: el.textContent || "",
              html: el.innerHTML || "",
              links: Array.from(el.querySelectorAll("a")).map((a) => ({
                href: a.getAttribute("href") || "",
                text: a.textContent || "",
              })),
              images: Array.from(el.querySelectorAll("img")).map((img) =>
                img.getAttribute("src") || img.getAttribute("data-src") || ""
              ),
            }))
        );

        for (const section of offerSections) {
          const price = parsePrice(section.text);
          if (!price || price <= 0 || price > 5000) continue;

          const duration = parseNights(section.text);
          const destination = detectDestination(section.text);
          const resortInfo = findResortInfo(request.url, section.text);

          const dealLink = section.links.find((l) =>
            l.href.includes("legendaryvacationclub") ||
            l.href.startsWith("/") ||
            l.text.match(/book|reserve|view|details|learn/i)
          );
          const dealUrl = dealLink?.href
            ? dealLink.href.startsWith("http")
              ? dealLink.href
              : `${BASE_URL}${dealLink.href}`
            : request.url;

          if (processedUrls.has(dealUrl)) continue;
          processedUrls.add(dealUrl);

          const imageUrl = section.images.find((img) =>
            img.startsWith("http") && !img.includes("logo") && !img.includes("icon")
          );

          const deal: ScrapedDeal = {
            title: resortInfo
              ? `${resortInfo.resortName} - ${resortInfo.city}`
              : `${destination.city} All-Inclusive Package`,
            price,
            durationNights: duration?.nights || 4,
            durationDays: duration?.days || 5,
            description: `All-inclusive resort preview at ${resortInfo?.resortName || destination.city}`,
            resortName: resortInfo?.resortName,
            url: dealUrl,
            imageUrl,
            city: resortInfo?.city || destination.city,
            state: resortInfo?.state || destination.state,
            country: resortInfo?.country || destination.country,
            brandSlug: "legendary",
          };

          await storeDeal(deal, "legendary");
          log.info(`Stored offer: ${deal.title} ($${deal.price})`);
        }
      }

      // ── Resort pages — extract pricing from individual resort pages ───
      if (!isSpecialOffers && !isDestinations) {
        const resortInfo = findResortInfo(request.url, pageText);
        if (!resortInfo) return;

        const price = parsePrice(pageText);
        if (!price || price <= 0 || price > 5000) {
          // No price on the resort page — create a listing-only entry
          // with a placeholder that will be updated on next special-offers crawl
          return;
        }

        const dealUrl = request.url;
        if (processedUrls.has(dealUrl)) return;
        processedUrls.add(dealUrl);

        const duration = parseNights(pageText) || { nights: 4, days: 5 };

        // Get the main hero/header image
        const imageUrl = await page.$eval(
          'img[class*="hero"], img[class*="header"], img[class*="banner"], section img, [data-testid*="image"] img',
          (img) => img.getAttribute("src") || ""
        ).catch(() => "");

        const deal: ScrapedDeal = {
          title: `${resortInfo.resortName} - ${resortInfo.city}`,
          price,
          durationNights: duration.nights,
          durationDays: duration.days,
          description: `All-inclusive resort preview at ${resortInfo.resortName}`,
          resortName: resortInfo.resortName,
          url: dealUrl,
          imageUrl: imageUrl || undefined,
          city: resortInfo.city,
          state: resortInfo.state,
          country: resortInfo.country,
          brandSlug: "legendary",
        };

        await storeDeal(deal, "legendary");
        log.info(`Stored resort deal: ${deal.title} ($${deal.price})`);
      }

      // ── Enqueue resort pages from destinations or homepage ────────────
      if (isDestinations || request.url === BASE_URL || request.url === `${BASE_URL}/`) {
        for (const resort of RESORT_PAGES) {
          const fullUrl = `${BASE_URL}${resort.url}`;
          if (!processedUrls.has(fullUrl)) {
            await crawler.addRequests([{ url: fullUrl }]);
          }
        }
        log.info(`Enqueued ${RESORT_PAGES.length} resort pages`);

        // Also enqueue special offers
        const specialUrl = `${BASE_URL}/special-offers/`;
        if (!processedUrls.has(specialUrl)) {
          await crawler.addRequests([{ url: specialUrl }]);
        }
      }
    },
  });

  // Start with special offers + destinations
  await crawler.run([
    `${BASE_URL}/special-offers/`,
    `${BASE_URL}/our-destinations.htm`,
  ]);
}
