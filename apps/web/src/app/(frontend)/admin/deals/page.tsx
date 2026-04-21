import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { DealActionsClient } from "./DealActionsClient";

export const dynamic = "force-dynamic";

async function getDeals(filter: string, search: string, page: number) {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq, sql, desc, and, or, ilike } = await import("drizzle-orm");

    const PAGE_SIZE = 50;
    const offset = (page - 1) * PAGE_SIZE;

    const conds = [];
    if (filter === "active") conds.push(eq(schema.deals.isActive, true));
    if (filter === "expired") conds.push(eq(schema.deals.isActive, false));
    if (search) {
      conds.push(or(
        ilike(schema.deals.title, `%${search}%`),
        ilike(schema.deals.slug, `%${search}%`),
        ilike(schema.deals.resortName, `%${search}%`),
      ));
    }

    const rows = await db
      .select({
        id: schema.deals.id,
        title: schema.deals.title,
        slug: schema.deals.slug,
        price: schema.deals.price,
        isActive: schema.deals.isActive,
        durationNights: schema.deals.durationNights,
        scrapedAt: schema.deals.scrapedAt,
        url: schema.deals.url,
        brandName: schema.brands.name,
        city: schema.destinations.city,
      })
      .from(schema.deals)
      .leftJoin(schema.brands, sql`${schema.deals.brandId} = ${schema.brands.id}`)
      .leftJoin(schema.destinations, sql`${schema.deals.destinationId} = ${schema.destinations.id}`)
      .where(conds.length > 0 ? and(...conds) : undefined)
      .orderBy(desc(schema.deals.scrapedAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    return { rows, page, pageSize: PAGE_SIZE };
  } catch (e) {
    console.error("[admin/deals]", e);
    return { rows: [], page: 1, pageSize: 50 };
  }
}

export default async function AdminDealsPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string; page?: string }> }) {
  const { filter = "all", q = "", page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const { rows, pageSize } = await getDeals(filter, q, page);

  return (
    <AdminShell title="Deal Management">
      <form method="GET" className="mb-6 flex flex-wrap items-center gap-3">
        <input type="text" name="q" defaultValue={q} placeholder="Search title, slug, resort..."
          className="min-w-[240px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <div className="inline-flex rounded-lg border border-gray-300 bg-white">
          {["all", "active", "expired"].map((f) => (
            <Link key={f} href={`/admin/deals?filter=${f}${q ? `&q=${q}` : ""}`}
              className={`px-3 py-2 text-sm font-medium first:rounded-l-lg last:rounded-r-lg ${
                filter === f ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Link>
          ))}
        </div>
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Search</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-3">Title</th>
              <th className="px-3 py-3">Brand</th>
              <th className="px-3 py-3">Destination</th>
              <th className="px-3 py-3">Nights</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Scraped</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <Link href={`/deals/${d.slug}`} target="_blank" className="font-medium text-blue-600 hover:underline">
                    {d.title.slice(0, 50)}{d.title.length > 50 ? "..." : ""}
                  </Link>
                </td>
                <td className="px-3 py-2 text-gray-600">{d.brandName}</td>
                <td className="px-3 py-2 text-gray-600">{d.city}</td>
                <td className="px-3 py-2 text-gray-500">{d.durationNights}N</td>
                <td className="px-3 py-2 font-semibold text-emerald-600">${Number(d.price)}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    d.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {d.isActive ? "Active" : "Expired"}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-400">
                  {new Date(d.scrapedAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">
                  <DealActionsClient dealId={d.id} isActive={d.isActive} currentPrice={Number(d.price)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === pageSize && (
        <div className="mt-4 flex justify-center gap-2">
          {page > 1 && (
            <Link href={`/admin/deals?filter=${filter}&q=${q}&page=${page - 1}`}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm">
              Previous
            </Link>
          )}
          <span className="flex items-center px-3 text-sm text-gray-500">Page {page}</span>
          <Link href={`/admin/deals?filter=${filter}&q=${q}&page=${page + 1}`}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm">
            Next
          </Link>
        </div>
      )}
    </AdminShell>
  );
}
