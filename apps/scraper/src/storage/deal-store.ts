import { db } from "@vacationdeals/db";
import { deals, destinations, brands, sources, dealPriceHistory } from "@vacationdeals/db";
import { eq, and, lt } from "drizzle-orm";
import type { ScrapedDeal } from "@vacationdeals/shared";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Expired / inactive deal detection
// ---------------------------------------------------------------------------

/**
 * Keywords that strongly suggest a deal is expired or tied to a past event.
 * Holiday keywords only trigger expiration when combined with a past year or
 * when the current date is clearly outside the event window.
 */
const EXPIRED_STATUS_KEYWORDS = [
  "expired", "sold out", "no longer available", "offer has ended",
  "deal has ended", "promotion ended", "sale ended", "not available",
  "out of stock", "unavailable", "closed", "past deadline",
];

const HOLIDAY_KEYWORDS = [
  "cyber monday", "black friday", "memorial day", "labor day",
  "presidents day", "4th of july", "fourth of july",
  "christmas", "new year", "valentine", "easter",
];

const PAST_SEASON_PATTERNS = [
  /spring\s+break\s+202[0-5]/i,
  /summer\s+202[0-5]/i,
  /fall\s+202[0-5]/i,
  /winter\s+202[0-5]/i,
  /spring\s+202[0-5]/i,
];

/**
 * Regex patterns that capture explicit expiration dates from deal text.
 * Group 1 should be a parseable date string.
 */
const EXPIRED_DATE_PATTERNS = [
  /(?:ends?|expires?|valid\s+(?:through|until|thru)|deadline)\s*:?\s*(\w+\s+\d{1,2},?\s+\d{4})/i,
  /(?:ends?|expires?|valid\s+(?:through|until|thru))\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
];

/**
 * Determine whether a scraped deal is likely expired.
 *
 * Conservative approach: only returns true when there is strong evidence
 * the deal has ended. When in doubt, keeps the deal active.
 *
 * @param deal     The scraped deal metadata
 * @param pageText Optional full page HTML or body text for deeper analysis
 * @returns        `{ expired: boolean; expiresAt?: Date }` — if an expiration
 *                 date is detected in the future, expired will be false but
 *                 expiresAt will be set.
 */
function detectExpiration(
  deal: ScrapedDeal,
  pageText?: string,
): { expired: boolean; expiresAt?: Date } {
  const now = new Date();
  const title = deal.title.toLowerCase();
  const desc = (deal.description || "").toLowerCase();
  const url = deal.url.toLowerCase();
  const fullText = `${title} ${desc} ${url} ${(pageText || "").toLowerCase()}`;

  // 1. Explicit "expired / sold out" language — high confidence
  for (const keyword of EXPIRED_STATUS_KEYWORDS) {
    if (fullText.includes(keyword)) {
      return { expired: true };
    }
  }

  // 2. Past-season patterns (e.g. "Summer 2025" when current year is 2026)
  for (const pattern of PAST_SEASON_PATTERNS) {
    if (pattern.test(fullText)) {
      return { expired: true };
    }
  }

  // 3. Holiday keywords + past-year evidence
  for (const keyword of HOLIDAY_KEYWORDS) {
    if (fullText.includes(keyword)) {
      // If the text also mentions a year that has already passed, mark expired
      if (/20(?:2[0-5])/.test(fullText)) {
        return { expired: true };
      }
      // For Black Friday / Cyber Monday, if we're well outside Nov/Dec
      // window, the deal is almost certainly stale
      if (keyword === "cyber monday" || keyword === "black friday") {
        const month = now.getMonth(); // 0-indexed
        if (month >= 1 && month <= 9) {
          // Feb through Oct — these deals are expired
          return { expired: true };
        }
      }
    }
  }

  // 4. JSON/structured data expiration fields (e.g. Westgate's offer_ends)
  const jsonDatePatterns = [
    /["']offer_ends["']\s*:\s*["'](\d{4}-\d{2}-\d{2})["']/i,
    /["']end_date["']\s*:\s*["'](\d{4}-\d{2}-\d{2})["']/i,
    /["']expiration_date["']\s*:\s*["'](\d{4}-\d{2}-\d{2})["']/i,
    /["']expires["']\s*:\s*["'](\d{4}-\d{2}-\d{2})["']/i,
    /["']valid_until["']\s*:\s*["'](\d{4}-\d{2}-\d{2})["']/i,
    /["']sale_ends["']\s*:\s*["'](\d{4}-\d{2}-\d{2})["']/i,
  ];
  for (const pattern of jsonDatePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      try {
        const expDate = new Date(match[1] + "T23:59:59");
        if (!isNaN(expDate.getTime())) {
          if (expDate < now) {
            return { expired: true, expiresAt: expDate };
          }
          return { expired: false, expiresAt: expDate };
        }
      } catch {}
    }
  }

  // 5. Explicit expiration dates in the page text
  for (const pattern of EXPIRED_DATE_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) {
      try {
        const expDate = new Date(match[1]);
        if (!isNaN(expDate.getTime())) {
          if (expDate < now) {
            return { expired: true, expiresAt: expDate };
          }
          // Future expiration — deal is still active but we know when it ends
          return { expired: false, expiresAt: expDate };
        }
      } catch {
        // Unparseable date, skip
      }
    }
  }

  return { expired: false };
}

/**
 * Mark all deals whose `expiresAt` timestamp has passed as inactive.
 * Intended to be called once per scraper run (or on a schedule).
 */
/**
 * Check if a deal's source URL is still reachable (200-299).
 * Returns true if the URL responds OK, or if the request fails due to
 * network issues (benefit of the doubt). Returns false for 404/410/5xx.
 */
export async function checkDealUrlHealth(dealUrl: string): Promise<boolean> {
  try {
    const response = await fetch(dealUrl, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    return response.ok; // true if 200-299
  } catch {
    // Network error, timeout, etc. — assume the deal is still alive
    return true;
  }
}

export async function deactivateExpiredDeals(): Promise<number> {
  const now = new Date();
  const result = await db
    .update(deals)
    .set({ isActive: false, updatedAt: now })
    .where(and(eq(deals.isActive, true), lt(deals.expiresAt, now)));
  const count = (result as any).rowCount ?? (result as any).count ?? 0;
  if (count > 0) {
    console.log(`[expired] Deactivated ${count} deal(s) past their expiresAt date`);
  }
  return count;
}

export async function storeDeal(scrapedDeal: ScrapedDeal, sourceKey: string, pageText?: string) {
  // Find or match brand
  const brand = await db.query.brands.findFirst({
    where: eq(brands.slug, scrapedDeal.brandSlug),
  });

  // Find or create destination
  let destination = await db.query.destinations.findFirst({
    where: eq(destinations.slug, slugify(scrapedDeal.city)),
  });

  if (!destination) {
    const [newDest] = await db
      .insert(destinations)
      .values({
        city: scrapedDeal.city,
        state: scrapedDeal.state || null,
        country: scrapedDeal.country || "US",
        slug: slugify(scrapedDeal.city),
      })
      .returning();
    destination = newDest;
  }

  // Find source
  const source = await db.query.sources.findFirst({
    where: eq(sources.scraperKey, sourceKey),
  });

  const dealSlug = slugify(
    `${scrapedDeal.brandSlug}-${scrapedDeal.city}-${scrapedDeal.durationNights}-night-${scrapedDeal.price}`,
  );

  // --- Expiration detection ---
  const { expired, expiresAt } = detectExpiration(scrapedDeal, pageText);
  if (expired) {
    console.log(`[expired] Detected expired deal: ${scrapedDeal.title}`);
  }

  // Upsert deal
  const existingDeal = await db.query.deals.findFirst({
    where: eq(deals.url, scrapedDeal.url),
  });

  if (existingDeal) {
    // Update existing deal and record price history if changed
    if (existingDeal.price !== String(scrapedDeal.price)) {
      await db.insert(dealPriceHistory).values({
        dealId: existingDeal.id,
        price: String(scrapedDeal.price),
      });
    }

    // If the new scrape detects expiration, mark inactive.
    // If a previously-expired deal is scraped again WITHOUT expiration
    // signals, re-activate it (it may have been renewed).
    const isActive = !expired;

    await db
      .update(deals)
      .set({
        title: scrapedDeal.title,
        price: String(scrapedDeal.price),
        originalPrice: scrapedDeal.originalPrice
          ? String(scrapedDeal.originalPrice)
          : null,
        description: scrapedDeal.description || null,
        imageUrl: scrapedDeal.imageUrl || null,
        inclusions: scrapedDeal.inclusions
          ? JSON.stringify(scrapedDeal.inclusions)
          : null,
        requirements: scrapedDeal.requirements
          ? JSON.stringify(scrapedDeal.requirements)
          : null,
        presentationMinutes: scrapedDeal.presentationMinutes || null,
        travelWindow: scrapedDeal.travelWindow || null,
        savingsPercent: scrapedDeal.savingsPercent || null,
        isActive,
        expiresAt: expiresAt ?? existingDeal.expiresAt,
        scrapedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(deals.id, existingDeal.id));

    return existingDeal.id;
  }

  // Insert new deal
  const [newDeal] = await db
    .insert(deals)
    .values({
      brandId: brand?.id || null,
      destinationId: destination?.id || null,
      sourceId: source?.id || null,
      title: scrapedDeal.title,
      slug: dealSlug,
      price: String(scrapedDeal.price),
      originalPrice: scrapedDeal.originalPrice
        ? String(scrapedDeal.originalPrice)
        : null,
      durationNights: scrapedDeal.durationNights,
      durationDays: scrapedDeal.durationDays,
      description: scrapedDeal.description || null,
      resortName: scrapedDeal.resortName || null,
      url: scrapedDeal.url,
      imageUrl: scrapedDeal.imageUrl || null,
      inclusions: scrapedDeal.inclusions
        ? JSON.stringify(scrapedDeal.inclusions)
        : null,
      requirements: scrapedDeal.requirements
        ? JSON.stringify(scrapedDeal.requirements)
        : null,
      presentationMinutes: scrapedDeal.presentationMinutes || null,
      travelWindow: scrapedDeal.travelWindow || null,
      savingsPercent: scrapedDeal.savingsPercent || null,
      isActive: !expired,
      expiresAt: expiresAt ?? null,
    })
    .returning();

  // Record initial price (only for active deals to keep chart clean)
  if (!expired) {
    await db.insert(dealPriceHistory).values({
      dealId: newDeal.id,
      price: String(scrapedDeal.price),
    });
  }

  return newDeal.id;
}
