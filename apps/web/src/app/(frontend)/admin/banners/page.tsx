import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";

async function getBanners() {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { desc } = await import("drizzle-orm");
    return await db.select().from(schema.adBanners).orderBy(desc(schema.adBanners.createdAt));
  } catch { return []; }
}

export default async function AdminBannersPage() {
  const banners = await getBanners();

  return (
    <AdminShell title="Ad Banners">
      <p className="mb-4 text-sm text-gray-600">
        Partner ad placements. Upload banner image or HTML, set position and schedule.
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Position</th>
              <th className="px-3 py-3">Link</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {banners.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No banners yet. Create the first partner ad.</td></tr>
            ) : banners.map((b) => (
              <tr key={b.id}>
                <td className="px-3 py-2 font-medium text-gray-900">{b.name}</td>
                <td className="px-3 py-2">{b.position}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{b.linkUrl?.slice(0, 40)}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${b.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {b.isActive ? "Active" : "Paused"}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-500">Ad creation form — coming in next iteration. For now, insert directly via SQL.</p>
      </div>
    </AdminShell>
  );
}
