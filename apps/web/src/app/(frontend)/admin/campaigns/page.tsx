import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  return (
    <AdminShell title="Email Campaigns">
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="mb-4 text-gray-600">
          Email/SMS campaigns pipeline — infrastructure ready. Configure RESEND_API_KEY and TWILIO_* env vars to enable sending.
        </p>
        <p className="text-xs text-gray-400">
          API endpoints: <code className="rounded bg-gray-100 px-1">/api/email/send</code>, <code className="rounded bg-gray-100 px-1">/api/email/unsubscribe</code>
        </p>
      </div>
    </AdminShell>
  );
}
