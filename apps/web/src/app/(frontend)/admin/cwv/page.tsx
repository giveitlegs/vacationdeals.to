import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";

interface CwvRow {
  url: string;
  strategy: string;
  lcp: string | null;
  cls: string | null;
  inp: string | null;
  fcp: string | null;
  ttfb: string | null;
  performanceScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  seoScore: number | null;
  errorMessage: string | null;
  checkedAt: Date | null;
}

async function getLatest(): Promise<CwvRow[]> {
  try {
    const { db } = await import("@vacationdeals/db");
    const { sql } = await import("drizzle-orm");
    const result = await db.execute(sql`
      SELECT DISTINCT ON (url, strategy)
        url,
        strategy,
        lcp,
        cls,
        inp,
        fcp,
        ttfb,
        performance_score AS "performanceScore",
        accessibility_score AS "accessibilityScore",
        best_practices_score AS "bestPracticesScore",
        seo_score AS "seoScore",
        error_message AS "errorMessage",
        checked_at AS "checkedAt"
      FROM cwv_results
      ORDER BY url, strategy, checked_at DESC
    `);
    const rows = (Array.isArray(result) ? result : ((result as { rows?: CwvRow[] }).rows ?? [])) as CwvRow[];
    return rows.sort((a, b) => {
      // Sort worst-perf first (mobile), then by URL
      if (a.strategy === "mobile" && b.strategy === "desktop") return -1;
      if (a.strategy === "desktop" && b.strategy === "mobile") return 1;
      const ap = a.performanceScore ?? 100;
      const bp = b.performanceScore ?? 100;
      return ap - bp;
    });
  } catch (e) {
    console.error("[admin/cwv] query failed:", e);
    return [];
  }
}

function scoreColor(score: number | null): string {
  if (score == null) return "bg-gray-100 text-gray-500";
  if (score >= 90) return "bg-emerald-100 text-emerald-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function lcpColor(ms: string | null): string {
  if (!ms) return "text-gray-400";
  const v = Number(ms);
  if (v <= 2500) return "text-emerald-700";
  if (v <= 4000) return "text-amber-700";
  return "text-red-700";
}

function clsColor(cls: string | null): string {
  if (!cls) return "text-gray-400";
  const v = Number(cls);
  if (v <= 0.1) return "text-emerald-700";
  if (v <= 0.25) return "text-amber-700";
  return "text-red-700";
}

function inpColor(ms: string | null): string {
  if (!ms) return "text-gray-400";
  const v = Number(ms);
  if (v <= 200) return "text-emerald-700";
  if (v <= 500) return "text-amber-700";
  return "text-red-700";
}

export default async function AdminCwvPage() {
  const rows = await getLatest();

  const mobileRows = rows.filter((r) => r.strategy === "mobile");
  const desktopRows = rows.filter((r) => r.strategy === "desktop");

  const avgMobile = mobileRows.length > 0
    ? Math.round(mobileRows.reduce((s, r) => s + (r.performanceScore ?? 0), 0) / mobileRows.length)
    : null;
  const avgDesktop = desktopRows.length > 0
    ? Math.round(desktopRows.reduce((s, r) => s + (r.performanceScore ?? 0), 0) / desktopRows.length)
    : null;

  const urlPath = (u: string) => {
    try { return new URL(u).pathname || "/"; } catch { return u; }
  };

  return (
    <AdminShell title="Core Web Vitals">
      <p className="mb-4 text-sm text-gray-600">
        PageSpeed Insights results for key pages. Run{" "}
        <code className="mx-1 rounded bg-gray-100 px-2 py-0.5 text-xs">npx tsx scripts/psi-check.ts</code>{" "}
        on the VPS to refresh (runs nightly via cron).
      </p>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-3xl font-black text-gray-900">{mobileRows.length}</p>
          <p className="text-xs text-gray-500">URLs tracked (mobile)</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className={`text-3xl font-black ${avgMobile == null ? "text-gray-400" : avgMobile >= 90 ? "text-emerald-700" : avgMobile >= 50 ? "text-amber-700" : "text-red-700"}`}>
            {avgMobile ?? "—"}
          </p>
          <p className="text-xs text-gray-500">Avg mobile perf</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-3xl font-black text-gray-900">{desktopRows.length}</p>
          <p className="text-xs text-gray-500">URLs tracked (desktop)</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className={`text-3xl font-black ${avgDesktop == null ? "text-gray-400" : avgDesktop >= 90 ? "text-emerald-700" : avgDesktop >= 50 ? "text-amber-700" : "text-red-700"}`}>
            {avgDesktop ?? "—"}
          </p>
          <p className="text-xs text-gray-500">Avg desktop perf</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-3">URL</th>
              <th className="px-3 py-3">Device</th>
              <th className="px-3 py-3">Perf</th>
              <th className="px-3 py-3">A11y</th>
              <th className="px-3 py-3">BP</th>
              <th className="px-3 py-3">SEO</th>
              <th className="px-3 py-3">LCP</th>
              <th className="px-3 py-3">CLS</th>
              <th className="px-3 py-3">INP</th>
              <th className="px-3 py-3">Checked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={10} className="px-3 py-6 text-center text-gray-400">
                No CWV results yet. Run <code className="rounded bg-gray-100 px-1">npx tsx scripts/psi-check.ts</code> to populate.
              </td></tr>
            ) : rows.map((r, i) => (
              <tr key={`${r.url}-${r.strategy}-${i}`}>
                <td className="px-3 py-2 font-mono text-xs">
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {urlPath(r.url)}
                  </a>
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${r.strategy === "mobile" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"}`}>
                    {r.strategy}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${scoreColor(r.performanceScore)}`}>
                    {r.performanceScore ?? "—"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${scoreColor(r.accessibilityScore)}`}>
                    {r.accessibilityScore ?? "—"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${scoreColor(r.bestPracticesScore)}`}>
                    {r.bestPracticesScore ?? "—"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${scoreColor(r.seoScore)}`}>
                    {r.seoScore ?? "—"}
                  </span>
                </td>
                <td className={`px-3 py-2 font-mono text-xs ${lcpColor(r.lcp)}`}>
                  {r.lcp ? `${Math.round(Number(r.lcp))}ms` : "—"}
                </td>
                <td className={`px-3 py-2 font-mono text-xs ${clsColor(r.cls)}`}>
                  {r.cls ? Number(r.cls).toFixed(3) : "—"}
                </td>
                <td className={`px-3 py-2 font-mono text-xs ${inpColor(r.inp)}`}>
                  {r.inp ? `${Math.round(Number(r.inp))}ms` : "—"}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {r.checkedAt ? new Date(r.checkedAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-gray-500">
        CWV targets: LCP ≤2.5s, CLS ≤0.1, INP ≤200ms. Lighthouse scores: green ≥90, amber 50-89, red &lt;50.
      </p>
    </AdminShell>
  );
}
