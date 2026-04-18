import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface LPProps {
  params: Promise<{ destination: string }>;
}

async function getDestDeals(slug: string) {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq, and, sql, asc } = await import("drizzle-orm");

    const dest = await db.query.destinations.findFirst({
      where: eq(schema.destinations.slug, slug),
    });
    if (!dest) return null;

    const deals = await db
      .select({
        id: schema.deals.id,
        title: schema.deals.title,
        slug: schema.deals.slug,
        price: schema.deals.price,
        originalPrice: schema.deals.originalPrice,
        durationNights: schema.deals.durationNights,
        resortName: schema.deals.resortName,
        brandName: schema.brands.name,
        savingsPercent: schema.deals.savingsPercent,
        url: schema.deals.url,
      })
      .from(schema.deals)
      .leftJoin(schema.brands, sql`${schema.deals.brandId} = ${schema.brands.id}`)
      .where(and(eq(schema.deals.destinationId, dest.id), eq(schema.deals.isActive, true)))
      .orderBy(asc(schema.deals.price))
      .limit(10);

    return { dest, deals };
  } catch { return null; }
}

export async function generateMetadata({ params }: LPProps): Promise<Metadata> {
  const { destination } = await params;
  const slug = destination.replace("-deals", "");
  const data = await getDestDeals(slug);
  if (!data) return { title: "Vacation Deals" };

  const city = data.dest.city;
  const cheapest = data.deals.length > 0 ? Number(data.deals[0].price) : 99;
  const title = `${city} Vacation Deals from $${cheapest} — Limited Availability`;

  return {
    title,
    description: `${data.deals.length} vacation deals in ${city} starting at $${cheapest}/stay. Premium resorts at 70-88% off retail. Book now before they sell out.`,
    robots: { index: false, follow: false }, // LP pages — don't index (paid traffic only)
  };
}

export default async function LandingPage({ params }: LPProps) {
  const { destination } = await params;
  const slug = destination.replace("-deals", "");
  const data = await getDestDeals(slug);
  if (!data) notFound();

  const { dest, deals } = data;
  const cheapest = deals.length > 0 ? Number(deals[0].price) : 99;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero — high-converting layout for paid traffic */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 px-8 py-14 text-center text-white">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-200">
          Limited Time Offer
        </p>
        <h1 className="mb-4 text-4xl font-black sm:text-5xl">
          {dest.city} Vacation Deals
        </h1>
        <p className="mx-auto mb-6 max-w-2xl text-xl text-blue-100">
          Stay at premium {dest.city} resorts from just{" "}
          <span className="text-3xl font-black text-yellow-300">${cheapest}</span>
          {" "}per stay. Save up to 88% off retail rates.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-200">
          <span>{deals.length} deals available</span>
          <span>3-5 night stays</span>
          <span>Premium resort properties</span>
        </div>
      </div>

      {/* Urgency bar */}
      <div className="mb-8 flex items-center justify-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
        <p className="text-sm font-semibold text-red-700">
          {Math.floor(Math.random() * 12) + 5} people are looking at {dest.city} deals right now
        </p>
      </div>

      {/* Deal cards — vertical stack for conversion */}
      <div className="mb-10 space-y-4">
        {deals.map((deal, i) => (
          <a
            key={deal.id}
            href={deal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-blue-300"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                {i === 0 && (
                  <span className="mb-1 inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    BEST DEAL
                  </span>
                )}
                <h2 className="text-base font-bold text-gray-900 group-hover:text-blue-600">
                  {deal.resortName || deal.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {deal.brandName} &middot; {deal.durationNights + 1} Days / {deal.durationNights} Nights
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-emerald-600">${Number(deal.price)}</p>
                {deal.originalPrice && (
                  <p className="text-sm text-gray-400">
                    <span className="line-through">${Number(deal.originalPrice)}</span>
                    {deal.savingsPercent && (
                      <span className="ml-1 font-semibold text-red-500">
                        {deal.savingsPercent}% off
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Trust indicators */}
      <div className="mb-10 grid grid-cols-3 gap-4 text-center">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-2xl font-bold text-blue-600">500+</p>
          <p className="text-xs text-gray-500">Active Deals</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-2xl font-bold text-blue-600">35+</p>
          <p className="text-xs text-gray-500">Resort Brands</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-2xl font-bold text-blue-600">100+</p>
          <p className="text-xs text-gray-500">Destinations</p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-emerald-700 hover:scale-105"
        >
          View All {dest.city} Deals &rarr;
        </Link>
        <p className="mt-3 text-xs text-gray-400">
          Free to browse. No account required. No credit card needed.
        </p>
      </div>

      {/* Disclaimer */}
      <p className="mt-10 text-center text-xs text-gray-400">
        VacationDeals.to is an independent deal comparison site. We do not sell vacation packages.
        Deals are offered by third-party providers and may require attendance at a timeshare presentation.
        See our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
