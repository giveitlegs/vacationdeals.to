import type { Metadata } from "next";
import Link from "next/link";
import { getPriceHistory } from "@/lib/price-history";
import { RateRecapClient } from "./RateRecapClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "VacPack Rate Recap",
  description:
    "Track vacation deal prices in realtime. Compare daily price trends from Westgate, BookVIP, Hilton Grand Vacations, Wyndham, Marriott, and more across top destinations.",
  alternates: { canonical: "https://vacationdeals.to/rate-recap" },
};

export default async function RateRecapPage() {
  const { points, brands, isMock } = await getPriceHistory({ days: 30 });

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
  const brandAvgs = new Map<string, { total: number; count: number; name: string }>();
  for (const p of recentPoints) {
    const entry = brandAvgs.get(p.brandSlug) ?? { total: 0, count: 0, name: p.brandName };
    entry.total += p.price;
    entry.count += 1;
    brandAvgs.set(p.brandSlug, entry);
  }
  let cheapestWeekBrand: { name: string; avg: number } | null = null;
  for (const [, val] of brandAvgs) {
    const avg = Math.round(val.total / val.count);
    if (!cheapestWeekBrand || avg < cheapestWeekBrand.avg) {
      cheapestWeekBrand = { name: val.name, avg };
    }
  }

  // BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
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
              {isMock ? "Sample data" : "Tracking"}: {fmt(earliest)}
              {earliest !== latest ? ` \u2013 ${fmt(latest)}` : ""}
            </p>
          );
        })()}
      </div>

      {/* Mock data notice */}
      {isMock && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Sample data</strong> — Real price tracking begins after scrapers
          run for several days. The chart below shows simulated prices for
          demonstration purposes.
        </div>
      )}

      {/* Interactive chart + filters (client component) */}
      <RateRecapClient
        initialPoints={points}
        initialBrands={brands}
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
                {cheapestToday.brandName} at ${cheapestToday.price}
              </p>
            )}
            {cheapestWeekBrand && (
              <p className="text-gray-700">
                <span className="font-semibold text-blue-600">
                  Best value this week:
                </span>{" "}
                {cheapestWeekBrand.name} averaging ${cheapestWeekBrand.avg}/night
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
    </div>
  );
}
