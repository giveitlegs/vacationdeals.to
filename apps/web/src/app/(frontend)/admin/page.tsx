import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";

async function getDashboardStats() {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq, count, desc } = await import("drizzle-orm");

    const [active] = await db.select({ c: count() }).from(schema.deals).where(eq(schema.deals.isActive, true));
    const [expired] = await db.select({ c: count() }).from(schema.deals).where(eq(schema.deals.isActive, false));
    const [brands] = await db.select({ c: count() }).from(schema.brands);
    const [subs] = await db.select({ c: count() }).from(schema.subscribers);
    const [consents] = await db.select({ c: count() }).from(schema.consentRecords);
    const [posts] = await db.select({ c: count() }).from(schema.blogPosts);

    const recentActions = await db.select().from(schema.adminActions).orderBy(desc(schema.adminActions.createdAt)).limit(10);
    const recentRuns = await db.select().from(schema.scrapeRuns).orderBy(desc(schema.scrapeRuns.startedAt)).limit(10);

    return {
      active: active?.c ?? 0,
      expired: expired?.c ?? 0,
      brands: brands?.c ?? 0,
      subs: subs?.c ?? 0,
      consents: consents?.c ?? 0,
      posts: posts?.c ?? 0,
      recentActions,
      recentRuns,
    };
  } catch {
    return { active: 0, expired: 0, brands: 0, subs: 0, consents: 0, posts: 0, recentActions: [], recentRuns: [] };
  }
}

export default async function AdminDashboard() {
  const s = await getDashboardStats();

  return (
    <AdminShell title="Dashboard">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Active Deals", value: s.active, color: "text-emerald-600" },
          { label: "Expired", value: s.expired, color: "text-gray-500" },
          { label: "Brands", value: s.brands, color: "text-blue-600" },
          { label: "Subscribers", value: s.subs, color: "text-purple-600" },
          { label: "TCPA Consents", value: s.consents, color: "text-red-600" },
          { label: "Blog Posts", value: s.posts, color: "text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-bold text-gray-900">Recent Scrape Runs</h2>
          <div className="space-y-2 text-sm">
            {s.recentRuns.length === 0 ? (
              <p className="text-gray-400">No runs yet</p>
            ) : (
              s.recentRuns.map((r) => (
                <div key={r.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="font-medium text-gray-700">{r.scraperKey}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    r.status === "success" ? "bg-emerald-100 text-emerald-700" :
                    r.status === "failed" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {r.status} · {r.dealsStored ?? 0} new
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-bold text-gray-900">Recent Admin Actions</h2>
          <div className="space-y-2 text-sm">
            {s.recentActions.length === 0 ? (
              <p className="text-gray-400">No actions yet</p>
            ) : (
              s.recentActions.map((a) => (
                <div key={a.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-700">{a.action}</span>
                  <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
