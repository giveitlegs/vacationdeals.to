"use client";

import { useState, useTransition } from "react";

interface Campaign {
  id: number;
  name: string;
  subject: string;
  status: string;
  totalSent: number | null;
  sentAt: Date | null;
}

export function CampaignActions({ campaign }: { campaign: Campaign }) {
  const [pending, start] = useTransition();
  const [testEmail, setTestEmail] = useState("");
  const [showTest, setShowTest] = useState(false);

  const sendTest = () => {
    if (!testEmail) return;
    start(async () => {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_test", campaignId: campaign.id, testEmail }),
      });
      const data = await res.json();
      if (data.ok) alert(`Test sent to ${testEmail}`);
      else alert(`Test failed: ${data.error ?? "Unknown error"}`);
      setShowTest(false);
    });
  };

  const sendToAll = () => {
    if (!confirm(`Send "${campaign.subject}" to ALL consented subscribers? This cannot be undone.`)) return;
    start(async () => {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_to_subscribers", campaignId: campaign.id }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(`Sent: ${data.successCount} · Failed: ${data.failCount}`);
        window.location.reload();
      } else {
        alert(`Bulk send failed: ${data.error ?? "Unknown"}`);
      }
    });
  };

  const del = () => {
    if (!confirm(`Delete campaign "${campaign.name}"?`)) return;
    start(async () => {
      await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", campaignId: campaign.id }),
      });
      window.location.reload();
    });
  };

  const alreadySent = campaign.status === "sent";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!alreadySent && (
        <>
          <button
            type="button"
            onClick={() => setShowTest(!showTest)}
            disabled={pending}
            className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Send test
          </button>
          <button
            type="button"
            onClick={sendToAll}
            disabled={pending}
            className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Sending..." : "Send to all"}
          </button>
        </>
      )}
      <button
        type="button"
        onClick={del}
        disabled={pending || alreadySent}
        className="text-xs text-red-600 hover:underline disabled:text-gray-400"
      >
        Delete
      </button>
      {showTest && (
        <form onSubmit={(e) => { e.preventDefault(); sendTest(); }} className="flex gap-1">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@..."
            className="rounded border border-gray-300 px-2 py-1 text-xs"
          />
          <button type="submit" disabled={pending || !testEmail} className="rounded bg-gray-800 px-2 py-1 text-xs text-white disabled:opacity-50">
            Send
          </button>
        </form>
      )}
    </div>
  );
}

export function CampaignCreateForm() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    start(async () => {
      setError(null);
      try {
        const res = await fetch("/api/admin/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            name: data.get("name"),
            subject: data.get("subject"),
            htmlBody: data.get("htmlBody"),
            textBody: data.get("textBody"),
          }),
        });
        if (!res.ok) { setError("Create failed"); return; }
        window.location.reload();
      } catch { setError("Network error"); }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        + New Campaign
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 font-semibold text-gray-900">New Email Campaign</h3>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block font-medium text-gray-700">Internal name</span>
          <input name="name" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-gray-700">Subject line</span>
          <input name="subject" required maxLength={120} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="block font-medium text-gray-700">HTML body</span>
          <textarea name="htmlBody" rows={10} required className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs" placeholder="<p>Hi {{firstName}},</p>" />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="block font-medium text-gray-700">Plain-text fallback (optional)</span>
          <textarea name="textBody" rows={3} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs" />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {pending ? "Creating..." : "Create Draft"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
