import type { Metadata } from "next";
import Link from "next/link";
import { getPriceHistory, getFilterOptions } from "@/lib/price-history";
import { RateRecapClient } from "./RateRecapClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "VacPack Rate Recap",
  description:
    "Track vacation deal prices in realtime. Compare daily price trends from Westgate, BookVIP, Hilton Grand Vacations, Wyndham, Marriott, and more across top destinations.",
  alternates: { canonical: "https://vacationdeals.to/rate-recap" },
};

export default async function RateRecapPage() {
  // Fetch 365 days so the client can slice by time range
  const [{ points, brands, isMock }, filterOptions] = await Promise.all([
    getPriceHistory({ days: 365, excludeBrands: ["mrg"], maxDurationNights: 5 }),
    getFilterOptions(),
  ]);

  // Compute quick insights from data
  const latestDate = points.length > 0 ? points[points.length - 1].date : null;
  const latestPoints = latestDate
    ? points.filter((p) => p.date === latestDate)
    : [];
  const cheapestToday = latestPoints.length > 0
    ? latestPoints.reduce((a, b) => (a.price < b.price ? a : b))
    : null;

  // Find brand with lowest avg over last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().split("T")[0];
  const recentPoints = points.filter((p) => p.date >= weekStr);
  const brandAvgs = new Map<string, { total: number; count: number; name: string; slug: string }>();
  for (const p of recentPoints) {
    const entry = brandAvgs.get(p.brandSlug) ?? { total: 0, count: 0, name: p.brandName, slug: p.brandSlug };
    entry.total += p.price;
    entry.count += 1;
    brandAvgs.set(p.brandSlug, entry);
  }
  let cheapestWeekBrand: { name: string; slug: string; avg: number } | null = null;
  for (const [, val] of brandAvgs) {
    const avg = Math.round(val.total / val.count);
    if (!cheapestWeekBrand || avg < cheapestWeekBrand.avg) {
      cheapestWeekBrand = { name: val.name, slug: val.slug, avg };
    }
  }

  // WebPage schema
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "VacPack Rate Recap",
    description: "Track vacation deal prices daily across 25+ resort brands.",
    url: "https://vacationdeals.to/rate-recap",
    dateModified: new Date().toISOString(),
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    dateModified: new Date().toISOString(),
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Vacation Deals",
        item: "https://vacationdeals.to",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Rate Recap",
        item: "https://vacationdeals.to/rate-recap",
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-blue-600">
              Vacation Deals
            </Link>
          </li>
          <li>
            <span className="mx-1">/</span>
          </li>
          <li className="font-medium text-gray-900">Rate Recap</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          VacPack Rate Recap
        </h1>
        <p className="text-lg text-gray-600">
          Track vacation deal prices on a daily basis in realtime!
        </p>
        {/* Date range label */}
        {points.length > 0 && (() => {
          const sortedDates = [...new Set(points.map((p) => p.date))].sort();
          const earliest = sortedDates[0];
          const latest = sortedDates[sortedDates.length - 1];
          const fmt = (iso: string) => {
            const d = new Date(iso + "T00:00:00");
            return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
          };
          return (
            <p className="mt-1 text-sm text-gray-500">
              Tracking: {fmt(earliest)}
              {earliest !== latest ? ` \u2013 ${fmt(latest)}` : ""}
            </p>
          );
        })()}

        {/* Data freshness indicator */}
        {filterOptions.lastScrapedAt && (() => {
          const lastScrape = new Date(filterOptions.lastScrapedAt!);
          const hoursAgo = Math.round((Date.now() - lastScrape.getTime()) / 3600000);
          const isFresh = hoursAgo < 7;    // green: scraped within 7 hours
          const isStale = hoursAgo >= 24;   // red: older than 24 hours
          const dotColor = isFresh ? "bg-emerald-500" : isStale ? "bg-red-500" : "bg-amber-500";
          const label = hoursAgo < 1
            ? "less than 1 hour ago"
            : `${hoursAgo} hour${hoursAgo !== 1 ? "s" : ""} ago`;
          return (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
              <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} />
              Prices updated every 6 hours &middot; Last scrape: {label}
            </div>
          );
        })()}
      </div>

      {/* Interactive chart + filters (client component) */}
      <RateRecapClient
        initialPoints={points}
        initialBrands={brands}
        destinations={filterOptions.destinations}
        durations={filterOptions.durations}
      />

      {/* Price Trends section */}
      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Price Trends
        </h2>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
          <p className="mb-4 text-gray-700">
            The chart above tracks average daily prices for vacation deal
            packages across major timeshare brands and resellers. Prices are
            updated every time our scrapers run, giving you a clear picture of
            how deal pricing shifts over time. Use the filters to narrow down by
            destination or stay duration.
          </p>

          {/* Auto-generated insights */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Key Insights
            </h3>
            {cheapestToday && (
              <p className="text-gray-700">
                <span className="font-semibold text-blue-600">
                  Cheapest today:
                </span>{" "}
                <Link href={`/${cheapestToday.brandSlug}`} className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800">
                  {cheapestToday.brandName}
                </Link>{" "}
                at{" "}
                <Link href={`/deals/${cheapestToday.dealSlug}`} className="font-semibold text-emerald-600 underline underline-offset-2 hover:text-emerald-800">
                  ${cheapestToday.price}
                </Link>
              </p>
            )}
            {cheapestWeekBrand && (
              <p className="text-gray-700">
                <span className="font-semibold text-blue-600">
                  Best value this week:
                </span>{" "}
                <Link href={`/${cheapestWeekBrand.slug}`} className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800">
                  {cheapestWeekBrand.name}
                </Link>{" "}
                averaging ${cheapestWeekBrand.avg}/night
              </p>
            )}
          </div>

          <div className="mt-6">
            <Link
              href="/deals"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Browse Current Deals
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>
      {/* Brand Rate Recap Pages */}
      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Rate Recap by Brand
        </h2>
        <p className="mb-6 text-gray-600">
          Dive deep into pricing trends for a specific brand. Every rate we scrape, when we scraped it, and how it has changed over time.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/rate-recap-${brand.slug}`}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm"
            >
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: brand.color }}
              />
              {brand.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Rate Showdown CTA */}
      <section className="mt-12">
        <Link
          href="/vacpack-rate-showdown"
          className="block rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-8 text-center transition-colors hover:border-blue-500 hover:bg-blue-100"
        >
          <h2 className="mb-2 text-2xl font-bold text-blue-900">
            VacPack Rate Showdown
          </h2>
          <p className="text-blue-700">
            Compare two brands head-to-head. See which resort brand consistently offers the lowest rates, biggest savings, and best value across destinations.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white">
            Launch Showdown &rarr;
          </span>
        </Link>
      </section>

      {/* B2B Historical Data CTA */}
      <section className="mt-12 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-2xl font-bold">
            Need Historical VacPack Rate Data?
          </h2>
          <p className="mb-2 text-gray-300">
            We offer comprehensive data reports for businesses, analysts, and researchers who need verified historical pricing data across all timeshare vacation package brands.
          </p>
          <ul className="mb-6 space-y-1 text-sm text-gray-400">
            <li>Full price history across 33 brands and 97+ destinations</li>
            <li>Exact scrape timestamps with source URL provenance</li>
            <li>Methodology documentation and data verification</li>
            <li>Custom date ranges and brand/destination filtering</li>
          </ul>
          <a
            href="mailto:data@vacationdeals.to?subject=Historical%20VacPack%20Rate%20Data%20Inquiry&body=Hi%2C%0A%0AI%27m%20interested%20in%20purchasing%20historical%20VacPack%20rate%20data.%0A%0ACompany%3A%20%0AUse%20case%3A%20%0ADate%20range%20needed%3A%20%0ABrands%2Fdestinations%20of%20interest%3A%20%0A%0AThanks!"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Request Data Report
          </a>
          <p className="mt-3 text-xs text-gray-500">
            Enterprise pricing starts at $5,000. Includes full provenance documentation.
          </p>
        </div>
      </section>
    </div>
  );
}
