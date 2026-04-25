import type { Metadata } from "next";
import Link from "next/link";
import { getRealityIndex } from "@/lib/reality-index";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "VacPack Reality Index — Which Vacation-Deal Brands Are Reliable",
  description:
    "Independent brand-by-brand scoring of vacation package providers. Built from live deal data, URL health, price stability, and inventory diversity. Updated every hour.",
  alternates: { canonical: "https://vacationdeals.to/reality-index" },
  openGraph: {
    title: "VacPack Reality Index",
    description:
      "Independent scoring of every major vacation-deal brand. Built from live data, not marketing copy.",
    url: "https://vacationdeals.to/reality-index",
    type: "website",
  },
};

export default async function RealityIndexPage() {
  const scores = await getRealityIndex();

  const verdictCounts = scores.reduce<Record<string, number>>((acc, s) => {
    acc[s.verdict] = (acc[s.verdict] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Hero */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-8 py-12 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-amber-300">
          Independent · Updated Hourly
        </p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">VacPack Reality Index</h1>
        <p className="mt-3 max-w-3xl text-base text-white/80 leading-relaxed">
          Most affiliate sites tell you what brands want you to hear. We score every vacation-deal
          provider using only data we can verify ourselves: live URL health, price stability over
          30 days, inventory diversity, scrape recency, and rate of bait-and-switch URL patterns.
          Higher score = more reliable for consumers.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          {Object.entries(verdictCounts).map(([verdict, n]) => (
            <span key={verdict} className="rounded-full bg-white/10 px-3 py-1 font-semibold backdrop-blur-sm">
              {verdict}: {n}
            </span>
          ))}
        </div>
      </div>

      {/* Methodology */}
      <details className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm">
        <summary className="cursor-pointer font-semibold text-gray-800">How is this scored?</summary>
        <div className="mt-4 space-y-3 text-gray-700">
          <p>Each brand gets a 0-100 overall score, weighted across five components:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li><strong>URL health (30%):</strong> what fraction of advertised deal links resolve to a real, specific deal page (not a rotating promo).</li>
            <li><strong>Inventory diversity (20%):</strong> log-scaled deal count — more active offers = more genuine engagement with the market.</li>
            <li><strong>Price stability (20%):</strong> deals whose advertised price hasn{"'"}t silently shifted in the last 30 days.</li>
            <li><strong>Recency (15%):</strong> how recently we successfully scraped the brand{"'"}s public catalog.</li>
            <li><strong>Bait-flag rate (15%):</strong> rate of deals stored at rotating-promo or seasonal URLs (cyber-monday, memorial-day, etc.) where the actual content rotates over time.</li>
          </ul>
          <p className="text-xs text-gray-500">
            Source: VacationDeals.to internal database. Scores recompute hourly. This is an algorithmic measurement of public-facing data and not a legal or financial endorsement.
          </p>
        </div>
      </details>

      {/* Brand cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scores.map((s) => (
          <Link
            key={s.brandSlug}
            href={`/reality-index/${s.brandSlug}`}
            className="group block rounded-xl border-2 border-gray-200 bg-white p-5 transition-all hover:border-blue-400 hover:shadow-lg"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-700">{s.brandName}</h2>
              <div className="text-right">
                <div className="text-3xl font-black" style={{ color: s.verdictColor }}>
                  {s.scoreOverall}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: s.verdictColor }}>
                  {s.verdict}
                </div>
              </div>
            </div>
            <p className="mb-3 text-xs text-gray-600 leading-relaxed">{s.oneLine}</p>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                {s.activeDeals} deals
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                {s.destinations} dest{s.destinations === 1 ? "" : "s"}
              </span>
              {s.cheapestPrice != null && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                  from ${s.cheapestPrice}
                </span>
              )}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-600">
                {s.brandType}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">
        Scores are advisory and computed from publicly available data. They do not constitute legal,
        financial, or consumer-protection advice.
      </p>
    </div>
  );
}
