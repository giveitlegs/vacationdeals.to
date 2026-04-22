import { AdminShell } from "@/components/AdminShell";
import { SubscriberToolbar, UnsubscribeButton } from "./SubscriberActions";

export const dynamic = "force-dynamic";

async function getSubscribers() {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { desc } = await import("drizzle-orm");

    // Unified list: consentRecords (TCPA opt-ins) + dataInquiries (B2B leads)
    const consents = await db.select().from(schema.consentRecords).orderBy(desc(schema.consentRecords.consentedAt)).limit(500);
    const inquiries = await db.select().from(schema.dataInquiries).orderBy(desc(schema.dataInquiries.createdAt)).limit(500);

    return { consents, inquiries };
  } catch { return { consents: [], inquiries: [] }; }
}

export default async function AdminSubscribersPage() {
  const { consents, inquiries } = await getSubscribers();

  return (
    <AdminShell title="Subscribers & Leads">
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-3xl font-black text-purple-600">{consents.length}</p>
          <p className="text-xs text-gray-500">TCPA Consents (Roulette, etc.)</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-3xl font-black text-blue-600">{inquiries.length}</p>
          <p className="text-xs text-gray-500">B2B Inquiries (Data Report)</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-3xl font-black text-emerald-600">{consents.length + inquiries.length}</p>
          <p className="text-xs text-gray-500">Total Leads</p>
        </div>
      </div>

      <SubscriberToolbar />

      <h2 className="mb-3 mt-8 text-lg font-bold text-gray-900">TCPA Consent Records</h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Source</th>
              <th className="px-3 py-3">IP</th>
              <th className="px-3 py-3">Consented</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {consents.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No consents yet</td></tr>
            ) : consents.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2 font-medium text-gray-900">{c.email}</td>
                <td className="px-3 py-2 text-gray-600">{c.phone || "—"}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{c.formSource}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-400">{c.ipAddress}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{new Date(c.consentedAt).toLocaleString()}</td>
                <td className="px-3 py-2 text-right"><UnsubscribeButton email={c.email || ""} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-gray-900">B2B Data Inquiries</h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inquiries.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No inquiries yet</td></tr>
            ) : inquiries.map((i) => (
              <tr key={i.id}>
                <td className="px-3 py-2 font-medium text-gray-900">{i.name}</td>
                <td className="px-3 py-2 text-gray-600">{i.email}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{i.inquiryType}</td>
                <td className="px-3 py-2 text-xs">{i.status}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{new Date(i.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
