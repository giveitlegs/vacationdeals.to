import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";

interface ScraperRow {
  scraperKey: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  status: string | null;
  dealsFound: number | null;
  dealsStored: number | null;
  errorMessage: string | null;
}

async function getScraperStatus(): Promise<{ latest: ScraperRow[]; totals: { runs: number; ok: number; failed: number } }> {
  try {
    const { db } = await import("@vacationdeals/db");
    const { sql } = await import("drizzle-orm");

    // Latest run per scraperKey (Postgres DISTINCT ON)
    const rowsResult = await db.execute(sql`
      SELECT DISTINCT ON (scraper_key)
        scraper_key AS "scraperKey",
        started_at AS "startedAt",
        finished_at AS "finishedAt",
        status,
        deals_found AS "dealsFound",
        deals_stored AS "dealsStored",
        error_message AS "errorMessage"
      FROM scrape_runs
      ORDER BY scraper_key, started_at DESC
    `);
    const latest = (Array.isArray(rowsResult) ? rowsResult : ((rowsResult as { rows?: ScraperRow[] }).rows ?? [])) as ScraperRow[];

    const totalsResult = await db.execute(sql`
      SELECT
        COUNT(*)::int AS runs,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS ok,
        COUNT(*) FILTER (WHERE status = 'failed')::int AS failed
      FROM scrape_runs
      WHERE started_at > NOW() - INTERVAL '7 days'
    `);
    const totalsRow = (Array.isArray(totalsResult) ? totalsResult[0] : ((totalsResult as { rows?: unknown[] }).rows ?? [])[0]) as { runs?: number; ok?: number; failed?: number } | undefined;
    const totals = totalsRow ?? {};

    return {
      latest: latest.sort((a, b) => {
        const at = a.startedAt ? new Date(a.startedAt).getTime() : 0;
        const bt = b.startedAt ? new Date(b.startedAt).getTime() : 0;
        return bt - at;
      }),
      totals: { runs: totals.runs ?? 0, ok: totals.ok ?? 0, failed: totals.failed ?? 0 },
    };
  } catch (e) {
    console.error("[admin/scrapers] getScraperStatus failed:", e);
    return { latest: [], totals: { runs: 0, ok: 0, failed: 0 } };
  }
}

export default async function AdminScrapersPage() {
  const { latest, totals } = await getScraperStatus();

  return (
    <AdminShell title="Scraper Operations">
      <p className="mb-4 text-sm text-gray-600">
        Most recent run per scraper. To manually trigger, SSH to VPS and run:
        <code className="mx-1 rounded bg-gray-100 px-2 py-0.5 text-xs">npx tsx src/index.ts --source=brand-slug</code>
      </p>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-3xl font-black text-gray-900">{totals.runs}</p>
          <p className="text-xs text-gray-500">Total runs (7d)</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-3xl font-black text-emerald-700">{totals.ok}</p>
          <p className="text-xs text-emerald-700">Completed</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-3xl font-black text-red-700">{totals.failed}</p>
          <p className="text-xs text-red-700">Failed</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-3">Scraper</th>
              <th className="px-3 py-3">Last Run</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Deals Found</th>
              <th className="px-3 py-3">Stored</th>
              <th className="px-3 py-3">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {latest.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No scrape runs logged yet.</td></tr>
            ) : latest.map((s) => {
              const startedAt = s.startedAt ? new Date(s.startedAt) : null;
              const hoursAgo = startedAt ? Math.round((Date.now() - startedAt.getTime()) / 3600000) : 999;
              const healthColor = hoursAgo < 12 ? "bg-emerald-100 text-emerald-700"
                : hoursAgo < 48 ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700";
              const statusColor = s.status === "completed" ? "bg-emerald-100 text-emerald-700"
                : s.status === "failed" ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600";
              return (
                <tr key={s.scraperKey}>
                  <td className="px-3 py-2 font-medium text-gray-900">{s.scraperKey}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${healthColor}`}>
                      {startedAt ? startedAt.toLocaleString() : "—"}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">{hoursAgo < 999 ? `${hoursAgo}h ago` : ""}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor}`}>
                      {s.status ?? "?"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-700">{s.dealsFound ?? 0}</td>
                  <td className="px-3 py-2 text-gray-700">{s.dealsStored ?? 0}</td>
                  <td className="px-3 py-2 text-xs text-red-600">
                    {s.errorMessage ? s.errorMessage.slice(0, 60) : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
