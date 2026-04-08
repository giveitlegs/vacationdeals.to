import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPriceHistory, getFilterOptions, getBrandColor } from "@/lib/price-history";
import { RateRecapClient } from "../rate-recap/RateRecapClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface BrandRateRecapProps {
  params: Promise<{ brand: string }>;
}

async function getBrandInfo(slug: string) {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");
    return await db.query.brands.findFirst({ where: eq(schema.brands.slug, slug) }) ?? null;
  } catch { return null; }
}

async function getBrandScrapeHistory(slug: string) {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq, desc } = await import("drizzle-orm");
    return await db.select().from(schema.scrapeRuns)
      .where(eq(schema.scrapeRuns.scraperKey, slug))
      .orderBy(desc(schema.scrapeRuns.startedAt)).limit(20);
  } catch { return []; }
}

async function getAllBrandSlugs() {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    return await db.select({ slug: schema.brands.slug, name: schema.brands.name })
      .from(schema.brands).orderBy(schema.brands.name);
  } catch { return []; }
}

export async function generateStaticParams() {
  const brands = await getAllBrandSlugs();
  return brands.map((b) => ({ brand: b.slug }));
}

export async function generateMetadata({ params }: BrandRateRecapProps): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const brand = await getBrandInfo(brandSlug);
  if (!brand) return { title: "Brand Not Found" };
  const title = `${brand.name} Rate Recap — VacPack Price Tracker`;
  const description = `Track every ${brand.name} vacation deal price over time. Historical rates, scrape timestamps, and pricing trends.`;
  return {
    title, description,
    alternates: { canonical: `https://vacationdeals.to/rate-recap-${brandSlug}` },
    openGraph: { title, description, type: "website", url: `https://vacationdeals.to/rate-recap-${brandSlug}` },
  };
}

export default async function BrandRateRecapPage({ params }: BrandRateRecapProps) {
  const { brand: brandSlug } = await params;
  const brand = await getBrandInfo(brandSlug);
  if (!brand) notFound();

  const [{ points, brands: allBrands }, filterOptions, scrapeHistory, allBrandSlugs] = await Promise.all([
    getPriceHistory({ days: 365 }),
    getFilterOptions(),
    getBrandScrapeHistory(brandSlug),
    getAllBrandSlugs(),
  ]);

  const brandPoints = points.filter((p) => p.brandSlug === brandSlug);
  const brandInfo = allBrands.find((b) => b.slug === brandSlug) ?? {
    name: brand.name, slug: brandSlug, color: getBrandColor(brandSlug),
  };

  const latestPrice = brandPoints.length > 0 ? brandPoints.reduce((a, b) => (a.date > b.date ? a : b)).price : null;
  const lowestEver = brandPoints.length > 0 ? Math.min(...brandPoints.map((p) => p.price)) : null;
  const highestEver = brandPoints.length > 0 ? Math.max(...brandPoints.map((p) => p.price)) : null;
  const totalDataPoints = brandPoints.length;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Vacation Deals", item: "https://vacationdeals.to" },
      { "@type": "ListItem", position: 2, name: "Rate Recap", item: "https://vacationdeals.to/rate-recap" },
      { "@type": "ListItem", position: 3, name: `${brand.name} Rate Recap`, item: `https://vacationdeals.to/rate-recap-${brandSlug}` },
    ],
  };

  // Schema is a static JSON object from trusted DB data, safe for inline rendering
  const schemaScript = JSON.stringify(breadcrumbSchema);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaScript }} />

      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/rate-recap" className="hover:text-blue-600">Rate Recap</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">{brand.name}</li>
        </ol>
      </nav>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: getBrandColor(brandSlug) }} />
          <h1 className="text-3xl font-bold text-gray-900">{brand.name} Rate Recap</h1>
        </div>
        <p className="text-lg text-gray-600">
          Every VacPack rate we have scraped from {brand.name}, tracked over time with full provenance.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{latestPrice ? `$${latestPrice}` : "\u2014"}</p>
            <p className="text-xs text-gray-500">Latest Rate</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{lowestEver ? `$${lowestEver}` : "\u2014"}</p>
            <p className="text-xs text-gray-500">Lowest Ever</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{highestEver ? `$${highestEver}` : "\u2014"}</p>
            <p className="text-xs text-gray-500">Highest Ever</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalDataPoints}</p>
            <p className="text-xs text-gray-500">Data Points</p>
          </div>
        </div>
      </div>

      <RateRecapClient
        initialPoints={brandPoints}
        initialBrands={[brandInfo]}
        destinations={filterOptions.destinations}
        durations={filterOptions.durations}
      />

      {scrapeHistory.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Scrape History</h2>
          <p className="mb-4 text-sm text-gray-600">
            Verified scrape runs for {brand.name}. Each row represents a crawler execution with timestamp and results.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Date &amp; Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Deals Found</th>
                  <th className="px-4 py-3">New Deals</th>
                  <th className="px-4 py-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scrapeHistory.map((run) => {
                  const dur = run.finishedAt && run.startedAt
                    ? Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
                    : null;
                  return (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">
                        {new Date(run.startedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          run.status === "success" ? "bg-emerald-100 text-emerald-700" :
                          run.status === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}>{run.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{run.dealsFound ?? "\u2014"}</td>
                      <td className="px-4 py-3 text-gray-700">{run.dealsStored ?? "\u2014"}</td>
                      <td className="px-4 py-3 text-gray-500">{dur ? `${dur}s` : "\u2014"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Other Brand Rate Recaps</h2>
        <div className="flex flex-wrap gap-2">
          {allBrandSlugs.filter((b) => b.slug !== brandSlug).map((b) => (
            <Link key={b.slug} href={`/rate-recap-${b.slug}`}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-300 hover:text-blue-600">
              {b.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <Link href={`/vacpack-rate-showdown?brand1=${brandSlug}`}
          className="block rounded-xl border border-blue-200 bg-blue-50 p-6 text-center transition-colors hover:bg-blue-100">
          <p className="font-semibold text-blue-900">Compare {brand.name} against another brand &rarr;</p>
          <p className="text-sm text-blue-700">Launch the VacPack Rate Showdown</p>
        </Link>
      </section>

      <section className="mt-8 rounded-xl bg-gray-900 p-6 text-center text-white">
        <h3 className="mb-2 text-lg font-bold">Need {brand.name} Historical Data?</h3>
        <p className="mb-4 text-sm text-gray-400">Full price history with scrape provenance, timestamps, and source URLs.</p>
        <a href={`mailto:data@vacationdeals.to?subject=${encodeURIComponent(`${brand.name} Historical Rate Data Inquiry`)}`}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100">
          Request Data Report
        </a>
      </section>
    </div>
  );
}
