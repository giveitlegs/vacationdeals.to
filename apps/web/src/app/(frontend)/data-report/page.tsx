import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VacPack Rate Data Report — Enterprise Historical Data",
  description:
    "Purchase comprehensive historical VacPack rate data with full scrape provenance, timestamps, and source URL documentation across 40+ brands and 68+ destinations.",
  alternates: { canonical: "https://vacationdeals.to/data-report" },
  openGraph: {
    title: "VacPack Rate Data Report — Enterprise Historical Data",
    description: "Comprehensive historical pricing data for timeshare vacation packages.",
    type: "website",
    url: "https://vacationdeals.to/data-report",
  },
};

async function getReportStats() {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { count, countDistinct, min, max, eq } = await import("drizzle-orm");

    const [priceStats] = await db.select({
      totalObservations: count(),
    }).from(schema.dealPriceHistory);

    const [dealStats] = await db.select({
      totalDeals: count(),
      totalBrands: countDistinct(schema.deals.brandId),
      totalDestinations: countDistinct(schema.deals.destinationId),
    }).from(schema.deals).where(eq(schema.deals.isActive, true));

    const [dateRange] = await db.select({
      earliest: min(schema.dealPriceHistory.scrapedAt),
      latest: max(schema.dealPriceHistory.scrapedAt),
    }).from(schema.dealPriceHistory);

    const [runStats] = await db.select({
      totalRuns: count(),
    }).from(schema.scrapeRuns);

    return {
      totalObservations: priceStats?.totalObservations ?? 0,
      totalDeals: dealStats?.totalDeals ?? 0,
      totalBrands: dealStats?.totalBrands ?? 0,
      totalDestinations: dealStats?.totalDestinations ?? 0,
      earliestDate: dateRange?.earliest?.toISOString().split("T")[0] ?? "N/A",
      latestDate: dateRange?.latest?.toISOString().split("T")[0] ?? "N/A",
      totalScrapeRuns: runStats?.totalRuns ?? 0,
    };
  } catch {
    return {
      totalObservations: 0, totalDeals: 0, totalBrands: 0,
      totalDestinations: 0, earliestDate: "N/A", latestDate: "N/A", totalScrapeRuns: 0,
    };
  }
}

export default async function DataReportPage() {
  const stats = await getReportStats();

  return (
    <div>
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Data Report</li>
        </ol>
      </nav>

      {/* Hero */}
      <div className="mb-12 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 px-8 py-16 text-center text-white">
        <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
          VacPack Rate Data Report
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">
          The most comprehensive historical pricing dataset for timeshare vacation
          packages. Full scrape provenance, source URL documentation, and verified timestamps.
        </p>
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold">{stats.totalObservations.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Price Observations</p>
          </div>
          <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold">{stats.totalDeals}</p>
            <p className="text-xs text-gray-400">Active Deals</p>
          </div>
          <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold">{stats.totalBrands}</p>
            <p className="text-xs text-gray-400">Brands Tracked</p>
          </div>
          <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold">{stats.totalDestinations}</p>
            <p className="text-xs text-gray-400">Destinations</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-400">
          Data coverage: {stats.earliestDate} to {stats.latestDate} &middot; {stats.totalScrapeRuns} verified scrape runs
        </p>
      </div>

      {/* What's Included */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">What You Get</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Complete Price History",
              desc: "Every price observation for every deal, timestamped to the second. See exactly how rates change across seasons, promotions, and market conditions.",
            },
            {
              title: "Source URL Provenance",
              desc: "The exact URL on the brand's website where each rate was found. Click through to verify any data point against the live source.",
            },
            {
              title: "Scrape Run Documentation",
              desc: "Logs of every crawler execution: start time, end time, deals found, success/failure status. Full audit trail for data verification.",
            },
            {
              title: "Brand & Destination Metadata",
              desc: "Complete brand profiles (direct vs. broker, website URLs) and destination data (city, state, country, region) for every deal.",
            },
            {
              title: "Methodology Documentation",
              desc: "Detailed description of our scraping infrastructure, crawl frequency, data integrity measures, and expiration detection algorithms.",
            },
            {
              title: "Flexible Formats",
              desc: "Download as JSON (structured) or CSV (spreadsheet-ready). Filter by brand, destination, or date range. API access available.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-2 text-base font-semibold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample Data Preview */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Sample Data Format</h2>
        <p className="mb-4 text-sm text-gray-600">
          Each record in the report includes the following fields:
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-left font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Field</th>
                <th className="px-3 py-2">Example</th>
                <th className="px-3 py-2">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {[
                ["observationTimestamp", "2026-04-07T18:00:03Z", "Exact UTC time of price capture"],
                ["price", "99", "VacPack price in USD"],
                ["originalRetailPrice", "449", "Retail price before discount"],
                ["deal.resortName", "Westgate Lakes Resort", "Property name"],
                ["deal.sourceUrl", "https://westgatereservations.com/...", "Exact page URL scraped"],
                ["deal.durationNights", "3", "Length of stay"],
                ["deal.firstSeenAt", "2026-03-14T00:00:00Z", "When deal first appeared"],
                ["deal.lastVerifiedAt", "2026-04-07T18:00:03Z", "Last successful verification"],
                ["brand.name", "Westgate Reservations", "Brand name"],
                ["brand.type", "direct", "Direct brand or broker"],
                ["destination.city", "Orlando", "City"],
                ["destination.state", "FL", "State/province"],
                ["source.scraperKey", "westgate", "Crawler identifier"],
              ].map(([field, example, desc]) => (
                <tr key={field} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-blue-600">{field}</td>
                  <td className="px-3 py-2 text-gray-700">{example}</td>
                  <td className="px-3 py-2 text-gray-500 font-sans">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Pricing</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-gray-200 bg-white p-8">
            <h3 className="mb-1 text-lg font-bold text-gray-900">Standard Report</h3>
            <p className="mb-4 text-sm text-gray-500">Full historical data export</p>
            <p className="mb-6 text-4xl font-bold text-gray-900">$5,000</p>
            <ul className="mb-6 space-y-2 text-sm text-gray-600">
              <li>All brands and destinations</li>
              <li>Full date range (since inception)</li>
              <li>JSON + CSV formats</li>
              <li>Scrape provenance documentation</li>
              <li>Methodology whitepaper</li>
            </ul>
            <a
              href="mailto:data@vacationdeals.to?subject=Standard%20VacPack%20Rate%20Data%20Report&body=Hi%2C%0A%0AI%27d%20like%20to%20purchase%20the%20Standard%20VacPack%20Rate%20Data%20Report.%0A%0ACompany%3A%20%0AUse%20case%3A%20%0A%0AThanks!"
              className="block rounded-lg bg-gray-900 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800"
            >
              Request Report
            </a>
          </div>
          <div className="rounded-xl border-2 border-blue-500 bg-white p-8 shadow-lg">
            <div className="mb-2 inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
              Most Popular
            </div>
            <h3 className="mb-1 text-lg font-bold text-gray-900">Enterprise Subscription</h3>
            <p className="mb-4 text-sm text-gray-500">Ongoing access + API</p>
            <p className="mb-6 text-4xl font-bold text-gray-900">Custom</p>
            <ul className="mb-6 space-y-2 text-sm text-gray-600">
              <li>Everything in Standard</li>
              <li>Monthly data refreshes</li>
              <li>API access for real-time queries</li>
              <li>Custom brand/destination filtering</li>
              <li>Dedicated account manager</li>
              <li>Ad intelligence add-on available</li>
            </ul>
            <a
              href="mailto:data@vacationdeals.to?subject=Enterprise%20VacPack%20Data%20Subscription%20Inquiry&body=Hi%2C%0A%0AI%27m%20interested%20in%20an%20Enterprise%20subscription%20for%20VacPack%20rate%20data.%0A%0ACompany%3A%20%0AUse%20case%3A%20%0AVolume%20needs%3A%20%0A%0AThanks!"
              className="block rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="mb-12 rounded-xl bg-gray-50 p-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900 text-center">Data You Can Trust</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-center">
          <div>
            <p className="text-3xl font-bold text-blue-600">4x Daily</p>
            <p className="text-sm text-gray-600">Scrape frequency (every 6 hours)</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">40</p>
            <p className="text-sm text-gray-600">Automated crawlers</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">100%</p>
            <p className="text-sm text-gray-600">Source URL traceability</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: "How is the data collected?", a: "Our automated web crawlers visit 38+ vacation deal websites every 6 hours. Each crawler extracts deal pricing, resort names, durations, and inclusions. Every observation is timestamped and linked to the exact source URL." },
            { q: "How far back does the data go?", a: `Our data collection began March 14, 2026. We now have ${stats.totalObservations.toLocaleString()}+ price observations across ${stats.totalBrands} brands and ${stats.totalDestinations} destinations.` },
            { q: "Can I verify the data?", a: "Yes. Every price observation includes the source URL where the rate was found. You can click through to the original listing to verify. Our scrape run logs document exactly when each crawler ran and what it found." },
            { q: "What format is the data delivered in?", a: "JSON (structured, nested) or CSV (flat, spreadsheet-ready). The JSON format includes full methodology documentation and scrape provenance alongside the price data." },
            { q: "Can I filter by specific brands or destinations?", a: "Yes. The API supports filtering by brand slug, destination slug, and date range. Enterprise subscribers get direct API access for custom queries." },
            { q: "Is the spend data for Facebook ads included?", a: "Ad intelligence data is available as an Enterprise add-on. Note that Meta does not provide exact spend data for commercial ads — only creative text, platforms, and run dates." },
          ].map((faq) => (
            <details key={faq.q} className="group rounded-xl border border-gray-200 bg-white">
              <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-gray-900">
                {faq.q}
              </summary>
              <div className="px-6 pb-4 text-sm text-gray-600">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
