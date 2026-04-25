import { AdminShell } from "@/components/AdminShell";
import { ProspectCardActions } from "@/components/ProspectCardActions";

export const dynamic = "force-dynamic";

interface ProspectBanner {
  id: number;
  prospectBrandSlug: string;
  brandName: string;
  position: string;
  imageUrl: string;
  width: number | null;
  height: number | null;
  utmContentMatch: string;
}

async function getEngagement(): Promise<Map<string, { totalViews: number; uniqueViewers: number; lastSeen: Date | null }>> {
  try {
    const { db } = await import("@vacationdeals/db");
    const { sql } = await import("drizzle-orm");
    const result = await db.execute(sql`
      SELECT
        prospect_brand_slug AS brand,
        COUNT(*)::int AS "totalViews",
        COUNT(DISTINCT ip_hash)::int AS "uniqueViewers",
        MAX(viewed_at) AS "lastSeen"
      FROM prospect_clicks
      GROUP BY prospect_brand_slug
    `);
    type Row = { brand: string; totalViews: number; uniqueViewers: number; lastSeen: Date | null };
    const rows = (Array.isArray(result) ? result : ((result as { rows?: Row[] }).rows ?? [])) as Row[];
    return new Map(rows.map((r) => [r.brand, { totalViews: r.totalViews, uniqueViewers: r.uniqueViewers, lastSeen: r.lastSeen }]));
  } catch {
    return new Map();
  }
}

async function getProspectBanners(): Promise<ProspectBanner[]> {
  try {
    const { db } = await import("@vacationdeals/db");
    const { sql } = await import("drizzle-orm");
    const result = await db.execute(sql`
      SELECT
        id,
        prospect_brand_slug AS "prospectBrandSlug",
        name,
        position,
        image_url AS "imageUrl",
        width,
        height,
        utm_content_match AS "utmContentMatch"
      FROM ad_banners
      WHERE utm_content_match IS NOT NULL
        AND prospect_brand_slug IS NOT NULL
      ORDER BY prospect_brand_slug, position
    `);
    type Row = {
      id: number;
      prospectBrandSlug: string;
      name: string;
      position: string;
      imageUrl: string;
      width: number | null;
      height: number | null;
      utmContentMatch: string;
    };
    const rows = (Array.isArray(result) ? result : ((result as { rows?: Row[] }).rows ?? [])) as Row[];
    return rows.map((r) => ({
      id: r.id,
      prospectBrandSlug: r.prospectBrandSlug,
      brandName: r.name.replace(/\s+prospect\s+\d+x\d+$/i, ""),
      position: r.position,
      imageUrl: r.imageUrl,
      width: r.width,
      height: r.height,
      utmContentMatch: r.utmContentMatch,
    }));
  } catch (err) {
    console.error("[admin/prospects] error:", err);
    return [];
  }
}

export default async function AdminProspectsPage() {
  const [banners, engagement] = await Promise.all([getProspectBanners(), getEngagement()]);

  // Group by brand
  const byBrand = new Map<string, ProspectBanner[]>();
  for (const b of banners) {
    const list = byBrand.get(b.prospectBrandSlug) || [];
    list.push(b);
    byBrand.set(b.prospectBrandSlug, list);
  }
  const brandList = [...byBrand.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <AdminShell title="Prospect Banners">
      <p className="mb-4 text-sm text-gray-600">
        Each prospect sees their banner only via their UTM-tagged URL.
        Click {"“"}Copy URL{"”"} to grab the link, or {"“"}Open Preview{"”"} to see how it lands.
      </p>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-3xl font-black text-gray-900">{brandList.length}</p>
          <p className="text-xs text-gray-500">Prospect brands</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-3xl font-black text-gray-900">{banners.length}</p>
          <p className="text-xs text-gray-500">Banners ready</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-3xl font-black text-emerald-700">{engagement.size}</p>
          <p className="text-xs text-emerald-700">Brands engaged</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-3xl font-black text-emerald-700">
            {[...engagement.values()].reduce((sum, e) => sum + e.totalViews, 0)}
          </p>
          <p className="text-xs text-emerald-700">Total banner views</p>
        </div>
      </div>

      <div className="space-y-8">
        {brandList.map(([slug, brandBanners]) => {
          const utm = brandBanners[0].utmContentMatch;
          const previewUrl = `https://vacationdeals.to/?utm_content=${utm}`;
          const brandName = brandBanners[0].brandName;
          const stats = engagement.get(slug);
          const lastSeenAgo = stats?.lastSeen
            ? Math.round((Date.now() - new Date(stats.lastSeen).getTime()) / 60000)
            : null;
          return (
            <div key={slug} className={`rounded-xl border bg-white p-5 ${stats ? "border-emerald-300 ring-1 ring-emerald-100" : "border-gray-200"}`}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-3">
                  <h2 className="text-xl font-bold text-gray-900">{brandName}</h2>
                  {stats && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                      ✓ {stats.totalViews} view{stats.totalViews !== 1 ? "s" : ""}
                      {stats.uniqueViewers > 1 && ` · ${stats.uniqueViewers} viewers`}
                      {lastSeenAgo != null && (
                        <> · {lastSeenAgo < 60 ? `${lastSeenAgo}m ago` : lastSeenAgo < 1440 ? `${Math.round(lastSeenAgo / 60)}h ago` : `${Math.round(lastSeenAgo / 1440)}d ago`}</>
                      )}
                    </span>
                  )}
                </div>
                <code className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-700">
                  ?utm_content={utm}
                </code>
              </div>
              <ProspectCardActions previewUrl={previewUrl} brandName={brandName} brandSlug={slug} />
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {brandBanners.map((banner) => (
                  <div key={banner.id} className="overflow-hidden rounded-lg border border-gray-200">
                    <div className="bg-gray-50 px-3 py-2 text-xs font-semibold uppercase text-gray-500">
                      {banner.position} · {banner.width}×{banner.height}
                    </div>
                    <div className="bg-gray-100 p-3">
                      <img
                        src={banner.imageUrl}
                        alt={`${brandName} ${banner.position} banner`}
                        className="block max-w-full h-auto"
                        loading="lazy"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {brandList.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-lg text-gray-500">
            No prospect banners yet. Run{" "}
            <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">scripts/seed-prospect-banners.sql</code>.
          </p>
        </div>
      )}
    </AdminShell>
  );
}
