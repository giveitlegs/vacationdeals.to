import { AdminShell } from "@/components/AdminShell";
import { channelLabel } from "@/lib/leads/channel";
import { LeadsToolbar, StatusSelect, ReplyButton } from "./LeadsActions";

export const dynamic = "force-dynamic";

type Rollup = { channel: string; count: number };

/**
 * Same-origin-only href for a stored lander. Defense-in-depth on top of the
 * store-time check in attribution.ts: only a path beginning with a single "/"
 * (not "//" protocol-relative, not an absolute/js: URL) is ever rendered clickable.
 */
function safeLanderHref(path: string | null): string | undefined {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return undefined;
  return path;
}

function channelColor(channel: string): string {
  if (channel.startsWith("organic-")) return "bg-green-100 text-green-800";
  if (channel.startsWith("ai-")) return "bg-purple-100 text-purple-800";
  if (channel.startsWith("social-")) return "bg-blue-100 text-blue-800";
  if (channel === "paid") return "bg-amber-100 text-amber-800";
  if (channel === "email") return "bg-teal-100 text-teal-800";
  if (channel === "referral") return "bg-slate-100 text-slate-700";
  return "bg-gray-100 text-gray-600"; // direct / unknown
}

async function getData(q: string, channel: string, status: string) {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { desc, and, or, ilike, eq, sql } = await import("drizzle-orm");

    const conds = [];
    if (q) {
      conds.push(
        or(
          ilike(schema.leadSubmissions.subscriberEmail, `%${q}%`),
          ilike(schema.leadSubmissions.landingPath, `%${q}%`),
          ilike(schema.leadSubmissions.source, `%${q}%`),
        ),
      );
    }
    if (channel) conds.push(eq(schema.leadSubmissions.channel, channel));
    if (status) conds.push(eq(schema.leadSubmissions.status, status));

    const rows = await db
      .select()
      .from(schema.leadSubmissions)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(schema.leadSubmissions.createdAt))
      .limit(1000);

    // Channel rollup — last 30 days.
    const rollup = (await db
      .select({
        channel: schema.leadSubmissions.channel,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.leadSubmissions)
      .where(sql`${schema.leadSubmissions.createdAt} > now() - interval '30 days'`)
      .groupBy(schema.leadSubmissions.channel)
      .orderBy(sql`count(*) desc`)) as Rollup[];

    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        unactioned: sql<number>`(count(*) filter (where ${schema.leadSubmissions.status} = 'new'))::int`,
        replied: sql<number>`(count(*) filter (where ${schema.leadSubmissions.status} = 'replied'))::int`,
        week: sql<number>`(count(*) filter (where ${schema.leadSubmissions.createdAt} > now() - interval '7 days'))::int`,
      })
      .from(schema.leadSubmissions);

    // Distinct channels ever seen — for the filter dropdown.
    const chRows = (await db
      .selectDistinct({ channel: schema.leadSubmissions.channel })
      .from(schema.leadSubmissions)) as { channel: string }[];

    return {
      rows,
      rollup,
      stats: stats ?? { total: 0, unactioned: 0, replied: 0, week: 0 },
      channels: chRows.map((r) => r.channel).filter(Boolean).sort(),
    };
  } catch (e) {
    console.error("[admin/leads page]", e);
    return { rows: [], rollup: [], stats: { total: 0, unactioned: 0, replied: 0, week: 0 }, channels: [] };
  }
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const channel = sp.channel ?? "";
  const status = sp.status ?? "";
  const { rows, rollup, stats, channels } = await getData(q, channel, status);

  return (
    <AdminShell title="Leads Inbox">
      {/* Stat tiles */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total leads", value: stats.total },
          { label: "Unactioned (new)", value: stats.unactioned },
          { label: "Replied", value: stats.replied },
          { label: "Last 7 days", value: stats.week },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Channel rollup — last 30 days */}
      <div className="mb-5 rounded-lg border border-gray-200 bg-white p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">By channel · last 30 days</div>
        {rollup.length === 0 ? (
          <p className="text-sm text-gray-400">No leads yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rollup.map((r) => (
              <a
                key={r.channel}
                href={`/admin/leads?channel=${encodeURIComponent(r.channel)}`}
                className={`rounded-full px-3 py-1 text-xs font-medium ${channelColor(r.channel)}`}
                title={r.channel}
              >
                {channelLabel(r.channel)} · {r.count}
              </a>
            ))}
          </div>
        )}
      </div>

      <LeadsToolbar q={q} channel={channel} status={status} channels={channels} />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Channel</th>
              <th className="px-3 py-2">Lander</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">No leads match.</td></tr>
            ) : rows.map((r) => {
              const utm = [r.utmSource, r.utmMedium, r.utmCampaign].filter(Boolean).join(" / ");
              return (
                <tr key={r.id} className="align-top hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">{r.subscriberEmail}</div>
                    {r.firstReferrer && (
                      <div className="max-w-[220px] truncate text-[11px] text-gray-400" title={r.firstReferrer}>
                        ref: {r.firstReferrer}
                      </div>
                    )}
                    {utm && <div className="text-[11px] text-gray-400" title={utm}>utm: {utm}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${channelColor(r.channel)}`}>
                      {channelLabel(r.channel)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {(() => {
                      const href = safeLanderHref(r.landingPath);
                      if (!r.landingPath) return <span className="text-gray-300">—</span>;
                      return href ? (
                        <a href={href} target="_blank" rel="noreferrer"
                          className="block max-w-[200px] truncate text-blue-600 hover:underline" title={r.landingPath}>
                          {r.landingPath}
                        </a>
                      ) : (
                        // Non-same-origin/garbage path: show as inert text, never a link.
                        <span className="block max-w-[200px] truncate text-gray-600" title={r.landingPath}>{r.landingPath}</span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">{r.source || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {new Date(r.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </td>
                  <td className="px-3 py-2"><StatusSelect id={r.id} value={r.status} /></td>
                  <td className="px-3 py-2"><ReplyButton id={r.id} email={r.subscriberEmail} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">Showing newest {rows.length} (max 1000). Person-level list + unsubscribe lives in <a href="/admin/crm" className="underline">Leads CRM</a>; this inbox is per-submission with channel attribution.</p>
    </AdminShell>
  );
}
