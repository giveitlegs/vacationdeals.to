"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BrandActionsClient({ brandId, brandSlug }: { brandId: number; brandSlug: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const runScraper = async () => {
    if (busy) return;
    if (!confirm(`Trigger scraper for ${brandSlug}? This runs on the VPS.`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, action: "trigger_scrape" }),
      });
      const data = await res.json();
      alert(data.message || "Scraper triggered (check logs on VPS)");
      router.refresh();
    } finally { setBusy(false); }
  };

  const toggleSuppress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, action: "toggle_suppress" }),
      });
      router.refresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="flex gap-1">
      <button onClick={runScraper} disabled={busy}
        className="rounded border border-blue-300 bg-white px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50">
        Run Scraper
      </button>
      <button onClick={toggleSuppress} disabled={busy}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
        Suppress
      </button>
    </div>
  );
}
