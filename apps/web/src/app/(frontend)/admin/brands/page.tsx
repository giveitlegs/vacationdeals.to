import { AdminShell } from "@/components/AdminShell";
import { BrandActionsClient } from "./BrandActionsClient";

export const dynamic = "force-dynamic";

async function getBrands() {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { sql, eq, count, desc } = await import("drizzle-orm");

    const rows = await db
      .select({
        id: schema.brands.id,
        name: schema.brands.name,
        slug: schema.brands.slug,
        type: schema.brands.type,
        website: schema.brands.website,
        dealCount: count(schema.deals.id),
      })
      .from(schema.brands)
      .leftJoin(schema.deals, sql`${schema.deals.brandId} = ${schema.brands.id} AND ${schema.deals.isActive} = true`)
      .groupBy(schema.brands.id)
      .orderBy(desc(count(schema.deals.id)));
    return rows;
  } catch { return []; }
}

export default async function AdminBrandsPage() {
  const brands = await getBrands();

  return (
    <AdminShell title="Brand Management">
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-3">Brand</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Website</th>
              <th className="px-3 py-3">Active Deals</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {brands.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <p className="font-medium text-gray-900">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.slug}</p>
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${
                    b.type === "direct" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                  }`}>
                    {b.type}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  <a href={b.website ?? "#"} target="_blank" rel="noopener" className="hover:underline">
                    {b.website?.replace(/^https?:\/\//, "").slice(0, 40)}
                  </a>
                </td>
                <td className="px-3 py-2 font-semibold text-emerald-600">{b.dealCount}</td>
                <td className="px-3 py-2">
                  <BrandActionsClient brandId={b.id} brandSlug={b.slug} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
