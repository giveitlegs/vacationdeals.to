import type { Metadata } from "next";
import Link from "next/link";
import { checkUrl } from "@/lib/hold-up-check";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Will My VacPack Hold Up? — Paste any vacation-deal URL, get a score",
  description:
    "Paste any vacation-package or timeshare-preview URL. We'll tell you if the brand is reliable, if the URL is a rotating bait pattern, and what to verify before you pay a deposit.",
  alternates: { canonical: "https://vacationdeals.to/will-it-hold-up" },
  openGraph: {
    title: "Will My VacPack Hold Up?",
    description: "Independent vacation-deal URL checker. Free.",
    url: "https://vacationdeals.to/will-it-hold-up",
    type: "website",
  },
};

interface SearchProps {
  searchParams: Promise<{ url?: string }>;
}

export default async function WillItHoldUpPage({ searchParams }: SearchProps) {
  const { url } = await searchParams;
  const result = url ? await checkUrl(url) : null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 px-8 py-10 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-amber-100">Free · No signup</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Will My VacPack Hold Up?</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/90">
          Paste any vacation-package or timeshare-preview URL — from any provider. We compare it against our
          live brand database, flag rotating-promo URL patterns, surface 30-day price history if we have it,
          and give you a plain-English verdict before you pay a deposit.
        </p>
      </div>

      {/* Input form (GET so URL is shareable) */}
      <form action="/will-it-hold-up" method="get" className="mb-8">
        <label htmlFor="url" className="mb-2 block text-sm font-semibold text-gray-700">
          Paste the deal URL
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="url"
            name="url"
            type="text"
            placeholder="https://www.westgatereservations.com/specials/..."
            defaultValue={url ?? ""}
            className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700"
          >
            Check it
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Works on any URL from Westgate, BookVIP, MRG, HGV, Wyndham, Marriott, Hyatt, and 30+ other providers.
        </p>
      </form>

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {/* Verdict card */}
          <div
            className="overflow-hidden rounded-2xl border-2 bg-white p-6 shadow-md"
            style={{ borderColor: result.verdictColor }}
          >
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Verdict</p>
                <h2 className="text-3xl font-black" style={{ color: result.verdictColor }}>
                  {result.verdict}
                </h2>
              </div>
              {result.scoreOverall != null && (
                <div className="text-right">
                  <div className="text-5xl font-black leading-none" style={{ color: result.verdictColor }}>
                    {result.scoreOverall}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Brand score</div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-700">
              <strong>{result.hostname || "Invalid URL"}</strong>
              {result.brand && ` · ${result.brand.name}`}
              {!result.brand && " · We don't have data on this brand"}
            </p>
          </div>

          {/* Flags */}
          {result.flags.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-amber-900">URL signals</h3>
              <ul className="space-y-2">
                {result.flags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                    <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${flag.severity === "warn" ? "bg-amber-600 text-white" : "bg-amber-200 text-amber-900"}`}>
                      {flag.severity}
                    </span>
                    <span>{flag.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Matched deal */}
          {result.matchedDeal && (
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-900">We have data on this exact URL</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-blue-100 py-1.5">
                  <dt className="text-blue-800">Title we last saw</dt>
                  <dd className="text-right font-semibold text-blue-900">{result.matchedDeal.title}</dd>
                </div>
                <div className="flex justify-between border-b border-blue-100 py-1.5">
                  <dt className="text-blue-800">Last seen price</dt>
                  <dd className="font-semibold text-blue-900">${result.matchedDeal.price}</dd>
                </div>
                {result.matchedDeal.nights != null && (
                  <div className="flex justify-between border-b border-blue-100 py-1.5">
                    <dt className="text-blue-800">Nights</dt>
                    <dd className="font-semibold text-blue-900">{result.matchedDeal.nights}</dd>
                  </div>
                )}
                {result.matchedDeal.minPriceLast30d != null && result.matchedDeal.maxPriceLast30d != null && (
                  <div className="flex justify-between border-b border-blue-100 py-1.5">
                    <dt className="text-blue-800">Price range last 30 days</dt>
                    <dd className="font-semibold text-blue-900">
                      ${result.matchedDeal.minPriceLast30d} – ${result.matchedDeal.maxPriceLast30d}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between py-1.5">
                  <dt className="text-blue-800">Status</dt>
                  <dd className="font-semibold">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${result.matchedDeal.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {result.matchedDeal.isActive ? "Currently active" : "We've marked this expired"}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Brand reality summary */}
          {result.brandReality && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-700">Brand at a glance</h3>
              <p className="mb-3 text-sm text-gray-700">{result.brandReality.oneLine}</p>
              <Link
                href={`/reality-index/${result.brand?.slug}`}
                className="inline-block text-sm font-semibold text-blue-600 hover:underline"
              >
                Full {result.brand?.name} Reality Index report →
              </Link>
            </div>
          )}

          {/* Recommendations */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-700">What to do</h3>
            <ul className="ml-5 list-disc space-y-2 text-sm text-gray-700">
              {result.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {/* Share + footer */}
          <div className="flex flex-wrap gap-2">
            <Link href="/will-it-hold-up" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Check another URL
            </Link>
            {result.brand && (
              <Link href={`/${result.brand.slug}`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Browse all {result.brand.name} deals →
              </Link>
            )}
          </div>

          <p className="text-xs text-gray-500">
            This tool uses live data from VacationDeals.to{"’"}s database and a transparent algorithm. Not legal,
            financial, or consumer-protection advice. Always verify directly with the provider before paying.
          </p>
        </div>
      )}

      {!result && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-base font-bold text-gray-900">Try it with one of these</h3>
          <ul className="space-y-2 text-sm">
            {[
              "https://www.westgatereservations.com/specials/4-day-orlando-dream-vacation/",
              "https://www.westgatereservations.com/specials/travel-deal-tuesday/",
              "https://www.bookvip.com/hotel_details/calypso-cay-vacation-villas",
              "https://mrgvacationpackages.com/destinations/orlando-fl/",
            ].map((sample) => (
              <li key={sample}>
                <Link
                  href={`/will-it-hold-up?url=${encodeURIComponent(sample)}`}
                  className="text-blue-600 hover:underline break-all"
                >
                  {sample}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
