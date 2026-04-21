"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DealActionsClient({ dealId, isActive, currentPrice }: {
  dealId: number;
  isActive: boolean;
  currentPrice: number;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const act = async (action: string, body: Record<string, unknown> = {}) => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/admin/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, action, ...body }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const overridePrice = async () => {
    const input = prompt(`Override price (current: $${currentPrice}):`, String(currentPrice));
    if (!input) return;
    const newPrice = parseFloat(input);
    if (isNaN(newPrice) || newPrice <= 0) { alert("Invalid price"); return; }
    await act("price_override", { newPrice });
  };

  return (
    <div className="flex gap-1">
      {isActive ? (
        <button onClick={() => act("expire")} disabled={busy}
          className="rounded border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
          Expire
        </button>
      ) : (
        <button onClick={() => act("reactivate")} disabled={busy}
          className="rounded border border-emerald-300 bg-white px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
          Reactivate
        </button>
      )}
      <button onClick={overridePrice} disabled={busy}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
        Edit $
      </button>
    </div>
  );
}
