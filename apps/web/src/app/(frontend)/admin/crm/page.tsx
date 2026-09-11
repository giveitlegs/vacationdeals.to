import { AdminShell } from "@/components/AdminShell";
import { CrmToolbar, LifecycleSelect, NotesCell, StatusButton } from "./CrmActions";

export const dynamic = "force-dynamic";

async function getData(q: string, status: string, lifecycle: string) {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { desc, and, or, ilike, eq, sql } = await import("drizzle-orm");

    const conds = [];
    if (q) {
      conds.push(
        or(
          ilike(schema.subscribers.email, `%${q}%`),
          ilike(schema.subscribers.phone, `%${q}%`),
          ilike(schema.subscribers.name, `%${q}%`),
          ilike(schema.subscribers.source, `%${q}%`),
        ),
      );
    }
    if (status) conds.push(eq(schema.subscribers.status, status));
    if (lifecycle) conds.push(eq(schema.subscribers.lifecycle, lifecycle));

    const rows = await db
      .select()
      .from(schema.subscribers)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(schema.subscribers.createdAt))
      .limit(2000);

    const [stats] = await db
      .select({
        total: sql<number>`(count(*))::int`,
        active: sql<number>`(count(*) filter (where ${schema.subscribers.status} = 'active'))::int`,
        unsub: sql<number>`(count(*) filter (where ${schema.subscribers.status} = 'unsubscribed'))::int`,
        sms: sql<number>`(count(*) filter (where ${schema.subscribers.smsConsent} = true))::int`,
      })
      .from(schema.subscribers);

    return { rows, stats: stats ?? { total: 0, active: 0, unsub: 0, sms: 0 } };
  } catch (e) {
    console.error("[admin/crm page]", e);
    return { rows: [], stats: { total: 0, active: 0, unsub: 0, sms: 0 } };
  }
}

export default async function AdminCrmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = sp.status ?? "";
  const lifecycle = sp.lifecycle ?? "";
  const { rows, stats } = await getData(q, status, lifecycle);

  return (
    <AdminShell title="Leads CRM">
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total leads" value={stats.total} color="text-emerald-600" />
        <Stat label="Active" value={stats.active} color="text-blue-600" />
        <Stat label="Unsubscribed" value={stats.unsub} color="text-gray-500" />
        <Stat label="SMS consented" value={stats.sms} color="text-purple-600" />
      </div>

      <CrmToolbar q={q} status={status} lifecycle={lifecycle} />

      <p className="mb-2 text-xs text-gray-500">
        Showing {rows.length} lead{rows.length === 1 ? "" : "s"}
        {(q || status || lifecycle) ? " (filtered)" : ""}. Source of truth: <code>subscribers</code>.
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Source</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Stage</th>
              <th className="px-3 py-3">SMS</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3 w-48">Notes</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">No leads yet</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className={r.status === "unsubscribed" ? "opacity-50" : ""}>
                <td className="px-3 py-2 font-medium text-gray-900">{r.email}</td>
                <td className="px-3 py-2 text-gray-600">{r.phone || "—"}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{r.source || "—"}</td>
                <td className="px-3 py-2 text-xs">{r.status}</td>
                <td className="px-3 py-2"><LifecycleSelect id={r.id} value={r.lifecycle} /></td>
                <td className="px-3 py-2 text-xs">{r.smsConsent ? "✅" : "—"}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-2"><NotesCell id={r.id} value={r.notes || ""} /></td>
                <td className="px-3 py-2 text-right"><StatusButton id={r.id} status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
