import type { Metadata } from "next";
import Link from "next/link";
import { AdSpyClient } from "./AdSpyClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "VacPack Ad Spy — Timeshare Ad Intelligence",
  description:
    "See every Facebook and Instagram ad running from top timeshare resort brands. Track ad creative, copy, and launch dates across 33 vacation deal brands.",
  alternates: { canonical: "https://vacationdeals.to/vacpack-ad-spy" },
  openGraph: {
    title: "VacPack Ad Spy — Timeshare Ad Intelligence",
    description: "Competitive ad intelligence for timeshare vacation deal brands.",
    type: "website",
    url: "https://vacationdeals.to/vacpack-ad-spy",
  },
};

async function getAdLibraryData() {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { desc, sql, eq } = await import("drizzle-orm");

    // Get all pages with their brand info
    const pages = await db
      .select({
        id: schema.adLibraryPages.id,
        pageId: schema.adLibraryPages.pageId,
        pageName: schema.adLibraryPages.pageName,
        totalAdsFound: schema.adLibraryPages.totalAdsFound,
        lastScrapedAt: schema.adLibraryPages.lastScrapedAt,
        brandSlug: schema.brands.slug,
        brandName: schema.brands.name,
      })
      .from(schema.adLibraryPages)
      .leftJoin(schema.brands, sql`${schema.adLibraryPages.brandId} = ${schema.brands.id}`)
      .orderBy(desc(schema.adLibraryPages.totalAdsFound));

    // Get recent ads (last 100)
    const ads = await db
      .select({
        id: schema.adLibraryAds.id,
        metaAdId: schema.adLibraryAds.metaAdId,
        adCreativeBody: schema.adLibraryAds.adCreativeBody,
        adCreativeLinkTitle: schema.adLibraryAds.adCreativeLinkTitle,
        adSnapshotUrl: schema.adLibraryAds.adSnapshotUrl,
        adDeliveryStartTime: schema.adLibraryAds.adDeliveryStartTime,
        adDeliveryStopTime: schema.adLibraryAds.adDeliveryStopTime,
        publisherPlatforms: schema.adLibraryAds.publisherPlatforms,
        isActive: schema.adLibraryAds.isActive,
        brandSlug: schema.brands.slug,
        brandName: schema.brands.name,
        pageName: schema.adLibraryPages.pageName,
      })
      .from(schema.adLibraryAds)
      .leftJoin(schema.brands, sql`${schema.adLibraryAds.brandId} = ${schema.brands.id}`)
      .leftJoin(schema.adLibraryPages, sql`${schema.adLibraryAds.adLibraryPageId} = ${schema.adLibraryPages.id}`)
      .orderBy(desc(schema.adLibraryAds.adDeliveryStartTime))
      .limit(200);

    return { pages, ads };
  } catch (e) {
    console.error("[ad-spy] Failed to load data:", e);
    return { pages: [], ads: [] };
  }
}

export default async function AdSpyPage() {
  const { pages, ads } = await getAdLibraryData();

  const totalAds = ads.length;
  const activeAds = ads.filter((a) => a.isActive).length;
  const brandsTracked = new Set(pages.map((p) => p.brandSlug)).size;

  return (
    <div>
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Ad Spy</li>
        </ol>
      </nav>

      <div className="mb-8 text-center">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">
          VacPack Ad Spy
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Competitive ad intelligence for the timeshare vacation deal industry.
          See what brands are advertising on Facebook and Instagram.
        </p>

        {/* Stats */}
        <div className="mt-6 flex items-center justify-center gap-8">
          <div>
            <p className="text-2xl font-bold text-gray-900">{brandsTracked}</p>
            <p className="text-xs text-gray-500">Brands Tracked</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalAds}</p>
            <p className="text-xs text-gray-500">Ads Found</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-emerald-600">{activeAds}</p>
            <p className="text-xs text-gray-500">Currently Active</p>
          </div>
        </div>
      </div>

      {/* Brand Overview Table */}
      {pages.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Brands Being Tracked</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Facebook Page</th>
                  <th className="px-4 py-3">Ads Found</th>
                  <th className="px-4 py-3">Last Scraped</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {page.brandName ?? page.pageName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{page.pageName}</td>
                    <td className="px-4 py-3 text-gray-700">{page.totalAdsFound ?? 0}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {page.lastScrapedAt
                        ? new Date(page.lastScrapedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "Not yet"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Ad Gallery */}
      <AdSpyClient ads={ads.map((a) => ({
        id: a.id,
        metaAdId: a.metaAdId,
        brandName: a.brandName ?? a.pageName ?? "Unknown",
        brandSlug: a.brandSlug ?? "",
        body: a.adCreativeBody ?? "",
        title: a.adCreativeLinkTitle ?? "",
        snapshotUrl: a.adSnapshotUrl ?? "",
        startDate: a.adDeliveryStartTime?.toISOString() ?? "",
        stopDate: a.adDeliveryStopTime?.toISOString() ?? null,
        platforms: a.publisherPlatforms ?? "[]",
        isActive: a.isActive,
      }))} />

      {/* Empty state */}
      {ads.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <h3 className="mb-2 text-lg font-semibold text-gray-700">No Ads Scraped Yet</h3>
          <p className="text-sm text-gray-500">
            The Ad Library scraper needs a Meta API token to pull ads. Once configured,
            ads from all 33 timeshare brands will appear here.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Set META_AD_LIBRARY_TOKEN in .env to enable scraping.
          </p>
        </div>
      )}

      {/* Subscription CTA */}
      <section className="mt-12 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-center text-white">
        <h2 className="mb-3 text-2xl font-bold">Full Ad Intelligence Access</h2>
        <p className="mb-2 text-gray-300">
          Get unlimited access to our competitive ad intelligence dashboard with historical ad archives,
          creative analysis, and brand monitoring alerts.
        </p>
        <ul className="mb-6 space-y-1 text-sm text-gray-400">
          <li>Complete ad creative archive across 33 brands</li>
          <li>Historical ad copy and launch date tracking</li>
          <li>Platform breakdown (Facebook vs Instagram)</li>
          <li>New ad alerts and competitive monitoring</li>
        </ul>
        <a
          href="mailto:data@vacationdeals.to?subject=VacPack%20Ad%20Spy%20Subscription%20Inquiry"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
        >
          Request Access
        </a>
        <p className="mt-3 text-xs text-gray-500">
          Contact us for enterprise subscription pricing.
        </p>
      </section>
    </div>
  );
}
