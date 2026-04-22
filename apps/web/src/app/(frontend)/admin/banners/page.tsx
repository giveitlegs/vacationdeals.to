import { AdminShell } from "@/components/AdminShell";
import { BannerActions, BannerCreateForm } from "./BannerActions";

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
        Partner ad placements. Active banners render on the corresponding site positions in real time.
      </p>

      <BannerCreateForm />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Position</th>
              <th className="px-3 py-3">Link</th>
              <th className="px-3 py-3">Status / Actions</th>
              <th className="px-3 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {banners.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No banners yet. Create the first partner ad above.</td></tr>
            ) : banners.map((b) => (
              <tr key={b.id}>
                <td className="px-3 py-2 font-medium text-gray-900">{b.name}</td>
                <td className="px-3 py-2"><span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{b.position}</span></td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {b.linkUrl ? <a href={b.linkUrl} target="_blank" rel="noopener" className="text-blue-600 hover:underline">{b.linkUrl.slice(0, 40)}</a> : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-3 py-2">
                  <BannerActions banner={b} />
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
