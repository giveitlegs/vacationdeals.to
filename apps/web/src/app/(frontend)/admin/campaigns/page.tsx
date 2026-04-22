import { AdminShell } from "@/components/AdminShell";
import { CampaignActions, CampaignCreateForm } from "./CampaignActions";

export const dynamic = "force-dynamic";

async function getCampaigns() {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { desc } = await import("drizzle-orm");
    return await db.select().from(schema.emailCampaigns).orderBy(desc(schema.emailCampaigns.createdAt));
  } catch { return []; }
}

async function getSubscriberCount(): Promise<number> {
  try {
    const { db } = await import("@vacationdeals/db");
    const { sql } = await import("drizzle-orm");
    const result = await db.execute(sql`SELECT COUNT(DISTINCT email)::int AS count FROM consent_records WHERE email IS NOT NULL AND email LIKE '%@%'`);
    const row = Array.isArray(result) ? result[0] : ((result as { rows?: unknown[] }).rows ?? [])[0];
    return (row as { count?: number })?.count ?? 0;
  } catch { return 0; }
}

export default async function AdminCampaignsPage() {
  const [campaigns, subCount] = await Promise.all([getCampaigns(), getSubscriberCount()]);
  const resendConfigured = !!process.env.RESEND_API_KEY;

  return (
    <AdminShell title="Email Campaigns">
      {!resendConfigured && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Resend API key not configured.</strong> Set <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> in .env to enable sending. Campaigns can still be drafted now; sends will fail until configured.
        </div>
      )}

      <p className="mb-4 text-sm text-gray-600">
        Bulk email to <strong>{subCount}</strong> TCPA-consented subscribers. Always send a test first.
      </p>

      <CampaignCreateForm />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-3">Campaign</th>
              <th className="px-3 py-3">Subject</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Sent</th>
              <th className="px-3 py-3">Opens</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">No campaigns yet. Create the first draft above.</td></tr>
            ) : campaigns.map((c) => {
              const statusColor = c.status === "sent" ? "bg-emerald-100 text-emerald-700"
                : c.status === "sending" ? "bg-amber-100 text-amber-700"
                : c.status === "draft" ? "bg-gray-100 text-gray-600"
                : "bg-blue-100 text-blue-700";
              return (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-medium text-gray-900">{c.name}</td>
                  <td className="px-3 py-2 text-gray-700">{c.subject.slice(0, 50)}{c.subject.length > 50 ? "…" : ""}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor}`}>{c.status}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-700">{c.totalSent ?? 0}</td>
                  <td className="px-3 py-2 text-gray-700">{c.totalOpened ?? 0}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <CampaignActions campaign={{
                      id: c.id,
                      name: c.name,
                      subject: c.subject,
                      status: c.status,
                      totalSent: c.totalSent,
                      sentAt: c.sentAt,
                    }} />
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
