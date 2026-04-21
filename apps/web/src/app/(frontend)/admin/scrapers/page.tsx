import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";

async function getScraperStatus() {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { sql, desc } = await import("drizzle-orm");

    const rows = await db.execute(sql`
      SELECT DISTINCT ON (scraper_key) scraper_key, started_at, finished_at, status, deals_found, deals_stored, error_message
      FROM scrape_runs
      ORDER BY scraper_key, started_at DESC
    `);
    return (rows as any).rows ?? [];
  } catch { return []; }
}

export default async function AdminScrapersPage() {
  const status = await getScraperStatus();

  return (
    <AdminShell title="Scraper Operations">
      <p className="mb-4 text-sm text-gray-600">
        Most recent run per scraper. To manually trigger, SSH to VPS and run:
        <code className="mx-1 rounded bg-gray-100 px-2 py-0.5 text-xs">npx tsx src/index.ts --source=brand-slug</code>
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-3">Scraper</th>
              <th className="px-3 py-3">Last Run</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Deals Found</th>
              <th className="px-3 py-3">New Deals</th>
              <th className="px-3 py-3">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {status.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No scrape runs logged yet.</td></tr>
            ) : status.map((s: any, i: number) => {
              const lastRun = s.started_at ? new Date(s.started_at) : null;
              const hoursAgo = lastRun ? Math.round((Date.now() - lastRun.getTime()) / 3600000) : 999;
              const healthColor = hoursAgo < 12 ? "bg-emerald-100 text-emerald-700"
                : hoursAgo < 48 ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700";
              return (
                <tr key={i}>
                  <td className="px-3 py-2 font-medium text-gray-900">{s.scraper_key}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {lastRun ? `${hoursAgo}h ago` : "never"}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${healthColor}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{s.deals_found ?? "—"}</td>
                  <td className="px-3 py-2 font-semibold text-emerald-600">{s.deals_stored ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-red-500">{s.error_message?.slice(0, 50) || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
