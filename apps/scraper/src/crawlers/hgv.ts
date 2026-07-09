import { PlaywrightCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

/**
 * Hilton Grand Vacations (HGV) crawler — Playwright.
 *
 * Rewritten 2026-07-09: the old CheerioCrawler stored 0 deals because HGV's
 * current offers are client-rendered (the GA4 arrays and
 * window.fullwidthctapromos the old strategy relied on are gone, and
 * /vacation-packages now 404s). Live inventory verified in a real browser
 * lives on the "start traveling" page as offer cards whose rendered text
 * follows:
 *   "$249 /STAY Retail Value Original price $915 BEST SELLER 3 Nights in
 *    Las Vegas LEARN MORE"
 * We render the page, find the smallest elements containing that pattern,
 * and store one deal per destination. DOM-verified only — no catalog.
 */

const BASE_URL = "https://www.hiltongrandvacations.com";
const OFFER_PAGES = [
  `${BASE_URL}/en/discover-hilton-grand-vacations/start-traveling-webop`,
  `${BASE_URL}/offers`,
];

const STATE_MAP: Record<string, string> = {
  Orlando: "FL",
  "Las Vegas": "NV",
  "Myrtle Beach": "SC",
  "Daytona Beach": "FL",
  Williamsburg: "VA",
  "New York City": "NY",
  "New York": "NY",
  "Hilton Head": "SC",
  "Park City": "UT",
  Carlsbad: "CA",
  Waikoloa: "HI",
  Honolulu: "HI",
  "Marco Island": "FL",
};

interface RawOffer {
  price: number;
  originalPrice: number | null;
  nights: number;
  city: string;
}

export async function runHgvCrawler() {
  const seen = new Set<string>();

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 6,
    navigationTimeoutSecs: 60,
    requestHandlerTimeoutSecs: 90,
    headless: true,
    launchContext: {
      launchOptions: { args: ["--ignore-certificate-errors"] },
    },
    async requestHandler({ request, page, log }) {
      log.info(`Scraping ${request.url}`);
      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2500);

      const offers: RawOffer[] = await page.evaluate(() => {
        const found: Array<{ price: number; originalPrice: number | null; nights: number; city: string }> = [];
        const els = Array.from(document.querySelectorAll("div,section,article,li")).filter((e) => {
          const t = (e as HTMLElement).innerText || "";
          return t.length < 300 && /\$\d+\s*\/\s*STAY/i.test(t) && /(\d+)\s*Nights?\s*in\s+/i.test(t);
        });
        for (const el of els) {
          const t = ((el as HTMLElement).innerText || "").replace(/\s+/g, " ");
          const priceM = t.match(/\$(\d[\d,]*)\s*\/\s*STAY/i);
          const origM = t.match(/Original price\s*\$(\d[\d,]*)/i);
          const destM = t.match(/(\d+)\s*Nights?\s*in\s+([A-Za-z][A-Za-z .']+?)(?:\s*(?:LEARN MORE|Learn More|$))/);
          if (!priceM || !destM) continue;
          found.push({
            price: parseInt(priceM[1].replace(/,/g, ""), 10),
            originalPrice: origM ? parseInt(origM[1].replace(/,/g, ""), 10) : null,
            nights: parseInt(destM[1], 10),
            city: destM[2].trim(),
          });
        }
        return found;
      });

      let stored = 0;
      for (const o of offers) {
        if (!o.price || o.price < 49 || o.price > 5000 || !o.city) continue;
        const key = `${o.city}-${o.nights}-${o.price}`;
        if (seen.has(key)) continue;
        seen.add(key);

        await storeDeal(
          {
            title: `Hilton Grand Vacations ${o.city} — ${o.nights} Nights for $${o.price}`,
            price: o.price,
            originalPrice: o.originalPrice || undefined,
            durationNights: o.nights,
            durationDays: o.nights + 1,
            city: o.city,
            state: STATE_MAP[o.city],
            brandSlug: "hgv",
            // Fragment keeps each destination's URL unique (deal-store
            // upserts match on url).
            url: `${request.url}#${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            inclusions: [
              `${o.nights + 1} Days / ${o.nights} Nights accommodations`,
              "15,000 Hilton Honors Bonus Points after presentation",
            ],
            requirements: ["Attend a timeshare sales presentation"],
            presentationMinutes: 120,
          },
          "hgv",
        );
        stored++;
        log.info(`Stored HGV ${o.city} ${o.nights}N @ $${o.price} (was $${o.originalPrice ?? "?"})`);
      }
      log.info(`[hgv] ${stored} DOM-verified offers stored from ${request.url}`);
    },
  });

  await crawler.run(OFFER_PAGES);
}
