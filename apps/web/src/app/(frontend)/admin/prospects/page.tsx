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
  const banners = await getProspectBanners();

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

      <div className="mb-6 flex gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-3xl font-black text-gray-900">{brandList.length}</p>
          <p className="text-xs text-gray-500">Prospect brands</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-3xl font-black text-gray-900">{banners.length}</p>
          <p className="text-xs text-gray-500">Banners ready</p>
        </div>
      </div>

      <div className="space-y-8">
        {brandList.map(([slug, brandBanners]) => {
          const utm = brandBanners[0].utmContentMatch;
          const previewUrl = `https://vacationdeals.to/?utm_content=${utm}`;
          const brandName = brandBanners[0].brandName;
          return (
            <div key={slug} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-900">{brandName}</h2>
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
