import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrandRealityScore, getRealityIndex } from "@/lib/reality-index";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

interface Props {
  params: Promise<{ brand: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand } = await params;
  const score = await getBrandRealityScore(brand);
  if (!score) return { title: "Not Found" };
  const title = `${score.brandName} Reality Score: ${score.scoreOverall}/100 — ${score.verdict}`;
  return {
    title,
    description: score.oneLine,
    alternates: { canonical: `https://vacationdeals.to/reality-index/${score.brandSlug}` },
    openGraph: {
      title,
      description: score.oneLine,
      url: `https://vacationdeals.to/reality-index/${score.brandSlug}`,
      type: "article",
    },
  };
}

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: number }) {
  const color = value >= 80 ? "#059669" : value >= 60 ? "#0284c7" : value >= 40 ? "#d97706" : "#dc2626";
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        <span className="text-xs text-gray-500">weight {(weight * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <p className="mt-1 text-xs text-gray-600">{value}/100</p>
    </div>
  );
}

export default async function BrandRealityPage({ params }: Props) {
  const { brand } = await params;
  const score = await getBrandRealityScore(brand);
  if (!score) notFound();

  const lastSeenAgo = score.lastScrapedAt
    ? Math.round((Date.now() - score.lastScrapedAt.getTime()) / 86400000)
    : null;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-4 text-xs text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/reality-index" className="hover:text-blue-600">Reality Index</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">{score.brandName}</li>
        </ol>
      </nav>

      {/* Score hero */}
      <div className="mb-8 rounded-2xl border-2 bg-white p-8 shadow-sm" style={{ borderColor: score.verdictColor }}>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-3xl font-black text-gray-900">{score.brandName}</h1>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase text-gray-600">
            {score.brandType}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div>
            <div className="text-7xl font-black leading-none" style={{ color: score.verdictColor }}>
              {score.scoreOverall}
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              out of 100
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-wider text-white" style={{ backgroundColor: score.verdictColor }}>
              {score.verdict}
            </div>
            <p className="mt-3 text-sm text-gray-700">{score.oneLine}</p>
          </div>
        </div>
      </div>

      {/* Components */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-base font-bold text-gray-900">Score Breakdown</h2>
          <ScoreBar label="URL Health" value={score.components.urlHealth} weight={0.3} />
          <ScoreBar label="Inventory Diversity" value={score.components.inventoryDiversity} weight={0.2} />
          <ScoreBar label="Price Stability (30d)" value={score.components.priceStability} weight={0.2} />
          <ScoreBar label="Recency" value={score.components.recency} weight={0.15} />
          <ScoreBar label="Bait-Flag Rate" value={score.components.baitFlagRate} weight={0.15} />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-base font-bold text-gray-900">Live Stats</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-100 py-1.5">
              <dt className="text-gray-600">Active deals</dt>
              <dd className="font-semibold text-gray-900">{score.activeDeals}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-1.5">
              <dt className="text-gray-600">Destinations covered</dt>
              <dd className="font-semibold text-gray-900">{score.destinations}</dd>
            </div>
            {score.cheapestPrice != null && (
              <div className="flex justify-between border-b border-gray-100 py-1.5">
                <dt className="text-gray-600">Cheapest current deal</dt>
                <dd className="font-semibold text-gray-900">${score.cheapestPrice}</dd>
              </div>
            )}
            {score.averagePrice != null && (
              <div className="flex justify-between border-b border-gray-100 py-1.5">
                <dt className="text-gray-600">Average deal price</dt>
                <dd className="font-semibold text-gray-900">${Math.round(score.averagePrice)}</dd>
              </div>
            )}
            <div className="flex justify-between border-b border-gray-100 py-1.5">
              <dt className="text-gray-600">Prices changed (30d)</dt>
              <dd className="font-semibold text-gray-900">{score.pricesChangedLast30d}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-1.5">
              <dt className="text-gray-600">Rotating-promo URLs</dt>
              <dd className="font-semibold text-gray-900">{score.rotatingPromoCount}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-1.5">
              <dt className="text-gray-600">Last scraped</dt>
              <dd className="font-semibold text-gray-900">
                {lastSeenAgo === 0 ? "Today" : lastSeenAgo === 1 ? "Yesterday" : lastSeenAgo != null ? `${lastSeenAgo} days ago` : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* What this means */}
      <section className="mb-8 rounded-xl border-2 border-blue-100 bg-blue-50/50 p-6">
        <h2 className="mb-3 text-lg font-bold text-blue-900">What this score means for you</h2>
        <p className="text-sm leading-relaxed text-blue-900">
          {score.scoreOverall >= 80 && `${score.brandName} consistently advertises real, specific deal pages with stable pricing. We see active inventory across multiple destinations and recent updates from their public catalog. Booking with confidence is reasonable — though always verify the specific terms before paying any deposit.`}
          {score.scoreOverall >= 60 && score.scoreOverall < 80 && `${score.brandName} is a working brand with credible inventory, but our scoring picks up at least one signal worth knowing about — typically rotating-promo URLs or moderate price fluctuation. Compare side-by-side against ${score.brandType === "broker" ? "the resort direct" : "broker pricing"} before booking.`}
          {score.scoreOverall >= 40 && score.scoreOverall < 60 && `${score.brandName} shows mixed signals: some real inventory, but we've also flagged URL hygiene or pricing inconsistencies that suggest some advertised deals don't lead where you'd expect. Read the specific deal page carefully and call to verify before paying any deposit.`}
          {score.scoreOverall < 40 && `${score.brandName} scores low on multiple components our index measures — typically a combination of stale data, rotating URLs that don't match their ad copy, and/or low active inventory. We'd recommend treating advertised deals as starting points only. Verify everything by phone before booking.`}
        </p>
      </section>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link href={`/${score.brandSlug}`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Browse {score.brandName} deals →
        </Link>
        <Link href="/reality-index" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          ← Back to Reality Index
        </Link>
      </div>

      <p className="text-xs text-gray-500">
        Score recomputed hourly from VacationDeals.to internal database. Independent. Not endorsed by or affiliated with {score.brandName}.
      </p>
    </div>
  );
}
