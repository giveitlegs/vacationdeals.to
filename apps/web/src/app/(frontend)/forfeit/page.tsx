import type { Metadata } from "next";
import Link from "next/link";
import {
  computeForfeitRates,
  DEFAULTS,
  formatUsd,
  secondsSinceMidnightUtc,
  secondsSinceYearStartUtc,
} from "@/lib/forfeit-math";
import { ForfeitTicker } from "./components/ForfeitTicker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Forfeit Clock — Live timeshare-deposit forfeitures, by the second",
  description:
    "Americans pay millions in non-refundable deposits for timeshare-presentation 'free vacations' they never take. Watch the meter run, by brand, in real time.",
  alternates: { canonical: "https://vacationdeals.to/forfeit" },
  openGraph: {
    title: "The Forfeit Clock — Watch timeshare deposits evaporate live",
    description: "Live counter of deposits forfeited to timeshare brands, by the second.",
    url: "https://vacationdeals.to/forfeit",
    type: "website",
  },
};

interface BrandShare {
  slug: string;
  name: string;
  count: number;
  share: number; // 0..1
  perSecond: number;
  perDay: number;
}

async function loadBrandShares(): Promise<{
  brandShares: BrandShare[];
  avgDepositUsd: number;
  totalActive: number;
}> {
  try {
    const { db } = await import("@vacationdeals/db");
    const { sql } = await import("drizzle-orm");
    const result = (await db.execute(sql`
      SELECT b.slug, b.name, COUNT(d.id)::int AS active, AVG(d.price::float)::float AS avg_price
      FROM deals d
      JOIN brands b ON d.brand_id = b.id
      WHERE d.is_active = true AND d.price > 0
      GROUP BY b.slug, b.name
      ORDER BY active DESC
    `)) as unknown as
      | { rows?: Array<{ slug: string; name: string; active: number; avg_price: number }> }
      | Array<{ slug: string; name: string; active: number; avg_price: number }>;
    const rows = (Array.isArray(result) ? result : result.rows ?? []) as Array<{
      slug: string;
      name: string;
      active: number;
      avg_price: number;
    }>;
    const totalActive = rows.reduce((a, r) => a + r.active, 0) || 1;

    // Weighted overall average deposit across all active deals.
    const totalDollars = rows.reduce((a, r) => a + r.avg_price * r.active, 0);
    const avgDepositUsd = totalDollars / totalActive;

    const rates = computeForfeitRates({ ...DEFAULTS, avgDepositUsd });

    const brandShares: BrandShare[] = rows.map((r) => {
      const share = r.active / totalActive;
      return {
        slug: r.slug,
        name: r.name,
        count: r.active,
        share,
        perSecond: rates.perSecond * share,
        perDay: rates.perDay * share,
      };
    });

    return { brandShares, avgDepositUsd, totalActive };
  } catch {
    return { brandShares: [], avgDepositUsd: 250, totalActive: 0 };
  }
}

export default async function ForfeitClockPage() {
  const { brandShares, avgDepositUsd, totalActive } = await loadBrandShares();
  const rates = computeForfeitRates({ ...DEFAULTS, avgDepositUsd });
  const now = new Date();
  const todayBaseUsd = secondsSinceMidnightUtc(now) * rates.perSecond;
  const ytdBaseUsd = secondsSinceYearStartUtc(now) * rates.perSecond;
  const anchorIso = now.toISOString();
  const tweet =
    `Americans have already forfeited ${formatUsd(todayBaseUsd)} to timeshare brands TODAY. ` +
    `Watch the meter run by the second.`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent("https://vacationdeals.to/forfeit")}`;

  // Top 8 brands for the breakdown (ordered by share desc)
  const topBrands = brandShares.slice(0, 8);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero — the ticker is the entire above-the-fold */}
      <section className="mb-10 rounded-3xl bg-gradient-to-br from-rose-700 via-red-700 to-amber-700 px-6 py-12 text-white shadow-2xl sm:px-12 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-rose-100">Live · updates every 100ms</p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
          Americans have forfeited
        </h1>

        <div className="mt-6 mb-2">
          <ForfeitTicker
            todayBaseUsd={todayBaseUsd}
            anchorIso={anchorIso}
            perSecondUsd={rates.perSecond}
          />
        </div>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
          to timeshare brands today — in deposits paid for "free" vacations they'll never take.
          The meter resets at midnight UTC. Last year's grand total was over <strong>{formatUsd(rates.annualUsd)}</strong>.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-white px-5 py-2 text-sm font-bold text-rose-800 shadow-md hover:bg-rose-50"
          >
            Tweet the number
          </a>
          <Link
            href="/will-it-hold-up"
            className="rounded-full border border-white/40 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            Don't forfeit yours — vet your URL →
          </Link>
        </div>
      </section>

      {/* Headline numbers */}
      <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Per second" value={formatUsd(rates.perSecond, 2)} />
        <Stat label="Per minute" value={formatUsd(rates.perMinute)} />
        <Stat label="Per hour" value={formatUsd(rates.perHour)} />
        <Stat label="Year to date" value={formatUsd(ytdBaseUsd)} />
      </section>

      {/* Brand-by-brand breakdown */}
      {topBrands.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 text-2xl font-bold text-gray-900">Where it's going right now</h2>
          <p className="mb-5 text-sm text-gray-500">
            Shares are weighted by each brand's percentage of our {totalActive} active vacpack listings.
          </p>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {topBrands.map((b, i) => (
              <div
                key={b.slug}
                className={`flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
              >
                <div className="w-full sm:w-48">
                  <Link href={`/${b.slug}`} className="font-semibold text-gray-900 hover:text-orange-600">
                    {b.name}
                  </Link>
                  <div className="text-xs text-gray-500">{b.count} listings · {(b.share * 100).toFixed(1)}%</div>
                </div>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500"
                      style={{ width: `${Math.max(2, b.share * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right font-mono text-sm tabular-nums text-gray-700 sm:w-44">
                  {formatUsd(b.perDay)} <span className="text-gray-400">/day</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Methodology */}
      <section className="mb-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-bold text-gray-900">How the math works</h2>
        <p className="mb-3 text-sm leading-relaxed text-gray-700">
          Three inputs, one multiplication. We keep the constants in code so the methodology is
          auditable in git history — not buried in a marketing footer.
        </p>
        <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
          <li>
            <strong>{DEFAULTS.vacpacksPerYear.toLocaleString()}</strong> — estimated annual vacpacks sold
            across the major US timeshare brands. Conservative midpoint of ARDA-affiliated reports and
            trade-press estimates.
          </li>
          <li>
            <strong>{(DEFAULTS.noShowRate * 100).toFixed(0)}%</strong> — share of buyers who pay the
            deposit but never attend or travel, forfeiting it. Industry research cites 20–30%; we use
            the low end.
          </li>
          <li>
            <strong>{formatUsd(avgDepositUsd, 0)}</strong> — average deposit, calculated live from
            our database of {totalActive} active vacpack listings.
          </li>
        </ul>
        <p className="mt-4 text-xs text-gray-500">
          Multiply, divide by 365 / 24 / 60 / 60. The clock is updated client-side at 10 Hz from
          a server-rendered anchor — same approach as the National Debt Clock.
        </p>
      </section>

      <section className="mb-12 rounded-xl bg-gray-900 px-6 py-8 text-white">
        <h2 className="text-xl font-bold">"But isn't this a free vacation?"</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-200">
          Vacpacks are not free. They are <em>prepaid, forfeitable</em> deposits. If you skip the
          presentation, miss the travel window, or fail to confirm by the deadline — that money is
          gone. The brands rely on this. Most don't even bother fighting chargebacks; the no-show
          revenue is the model.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/reality-index"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            See which brands have the worst forfeiture terms →
          </Link>
          <Link
            href="/pitch-diaries"
            className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Read what attendees actually heard at the pitch →
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-5 text-center shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-1 font-mono text-lg font-bold tabular-nums text-gray-900 sm:text-xl">{value}</div>
    </div>
  );
}
