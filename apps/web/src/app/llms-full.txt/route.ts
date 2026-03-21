import { NextResponse } from "next/server";

/**
 * Dynamic llms-full.txt — serves a comprehensive, LLM-readable version
 * of the site with live deal data from the database.
 * Cached for 1 hour via s-maxage.
 */
export async function GET() {
  let dealsSection = "";
  let brandsSection = "";
  let destinationsSection = "";

  try {
    const { getDeals, getBrandsWithCounts, getDestinationsWithCounts } = await import("@/lib/queries");

    // Fetch live deals
    const result = await getDeals({ limit: 100, sortBy: "price-asc" });
    if (result && result.deals.length > 0) {
      dealsSection = `## Current Vacation Deals (Top 100 by Price)\n\n`;
      dealsSection += `| Deal | Brand | Destination | Price | Duration | Inclusions |\n`;
      dealsSection += `|------|-------|-------------|-------|----------|------------|\n`;
      for (const d of result.deals) {
        const inclusions = d.inclusions?.join(", ") || "—";
        dealsSection += `| [${d.title}](https://vacationdeals.to/deals/${d.slug}) | ${d.brandName} | ${d.city}, ${d.state} | $${d.price} | ${d.durationNights} nights | ${inclusions} |\n`;
      }
      dealsSection += `\nTotal active deals: ${result.total}\n`;
    }

    // Fetch brands
    const brands = await getBrandsWithCounts();
    if (brands && brands.length > 0) {
      brandsSection = `## Resort Brands We Track (${brands.length} total)\n\n`;
      for (const b of brands) {
        brandsSection += `- **[${b.name}](https://vacationdeals.to/${b.slug})** — ${b.type === "direct" ? "Direct resort brand" : "Broker/aggregator"} (${b.deals} deals)\n`;
      }
    }

    // Fetch destinations
    const destinations = await getDestinationsWithCounts();
    if (destinations && destinations.length > 0) {
      destinationsSection = `## Vacation Destinations (${destinations.length} total)\n\n`;
      for (const d of destinations) {
        destinationsSection += `- **[${d.name}](https://vacationdeals.to/${d.slug})** — ${d.state || "US"} (${d.deals} deals)\n`;
      }
    }
  } catch {
    // DB unavailable — serve static version
  }

  const content = `# VacationDeals.to — Full Site Reference

> The world's largest vacation deal aggregator for timeshare resort preview packages. Updated daily with live pricing from 25+ brands across 50+ destinations.

## What We Do

VacationDeals.to aggregates and compares "vacation deals" (also known as vacpacks or timeshare preview packages) from 25+ major resort brands. These are deeply discounted resort stays (60-80% below retail) where guests attend a brief timeshare sales presentation. No purchase is required.

**Key facts:**
- Deals range from $59 to $499 for 2-7 night stays at premium resorts
- Most popular: 3-night packages at $99-$199
- All-inclusive international packages: $299-$499 for 5 nights
- Typical eligibility: age 25-30+, household income $50K+, married/cohabiting

${dealsSection}

${brandsSection}

${destinationsSection}

## Deal Categories

### By Price
- [Deals Under $100](https://vacationdeals.to/deals-under-100)
- [Deals Under $200](https://vacationdeals.to/deals-under-200)
- [Deals Under $300](https://vacationdeals.to/deals-under-300)
- [Deals Under $500](https://vacationdeals.to/deals-under-500)

### By Duration
- [2-Night Packages](https://vacationdeals.to/2-night-packages)
- [3-Night Packages](https://vacationdeals.to/3-night-packages)
- [4-Night Packages](https://vacationdeals.to/4-night-packages)
- [5-Night Packages](https://vacationdeals.to/5-night-packages)

## Key Pages
- [All Deals](https://vacationdeals.to/deals) — Browse all deals with filters
- [Rate Recap](https://vacationdeals.to/rate-recap) — Daily price tracking chart
- [Blog](https://vacationdeals.to/blog) — 200+ destination guides and deal tips
- [All Destinations](https://vacationdeals.to/destinations)
- [All Brands](https://vacationdeals.to/brands)

## APIs & Feeds
- RSS Feed: https://vacationdeals.to/feed.xml
- Sitemap: https://vacationdeals.to/sitemap.xml
- LLMs summary: https://vacationdeals.to/llms.txt

## Legal
- [Privacy Policy](https://vacationdeals.to/privacy)
- [Terms & Conditions](https://vacationdeals.to/terms)

VacationDeals.to is an independent comparison site. We are not affiliated with any resort or timeshare company.

*Last updated: ${new Date().toISOString().split("T")[0]}*
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
