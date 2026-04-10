"use client";

import { useState, useEffect } from "react";

interface RouletteDeal {
  dealId: number;
  title: string;
  price: string;
  slug: string;
  city: string;
  brandName: string;
  weight: number | null;
  isFeatured: boolean | null;
  isExcluded: boolean | null;
  rarity: string | null;
  spinCount: number | null;
  clickCount: number | null;
}

export function AdminRouletteClient() {
  const [authKey, setAuthKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [deals, setDeals] = useState<RouletteDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "featured" | "excluded">("all");

  useEffect(() => {
    const stored = sessionStorage.getItem("admin-key");
    if (stored) {
      setAuthKey(stored);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed || !authKey) return;
    loadDeals();
  }, [authed, authKey]);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/roulette?key=${encodeURIComponent(authKey)}`);
      if (!res.ok) {
        setAuthed(false);
        sessionStorage.removeItem("admin-key");
        return;
      }
      const data = await res.json();
      setDeals(data.deals || []);
    } finally {
      setLoading(false);
    }
  };

  const updateDeal = async (dealId: number, updates: Partial<RouletteDeal>) => {
    // Optimistic update
    setDeals((ds) => ds.map((d) => (d.dealId === dealId ? { ...d, ...updates } : d)));

    await fetch("/api/admin/roulette", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authKey}` },
      body: JSON.stringify({ dealId, ...updates }),
    });
  };

  if (!authed) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="mb-3 text-sm text-gray-600">Enter admin key to continue:</p>
        <input
          type="password"
          value={authKey}
          onChange={(e) => setAuthKey(e.target.value)}
          placeholder="PAYLOAD_SECRET"
          className="mb-3 w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm"
        />
        <button
          onClick={() => {
            sessionStorage.setItem("admin-key", authKey);
            setAuthed(true);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Authenticate
        </button>
      </div>
    );
  }

  const filtered = deals.filter((d) => {
    if (filter === "featured" && !d.isFeatured) return false;
    if (filter === "excluded" && !d.isExcluded) return false;
    if (search && !(`${d.title} ${d.city} ${d.brandName}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search deals..."
          className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="inline-flex rounded-lg border border-gray-300 bg-white">
          {(["all", "featured", "excluded"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-sm font-medium first:rounded-l-lg last:rounded-r-lg ${
                filter === f ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={loadDeals}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        Showing {filtered.length} of {deals.length} deals
      </p>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-3">Deal</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">City</th>
              <th className="px-3 py-3">Brand</th>
              <th className="px-3 py-3">Weight</th>
              <th className="px-3 py-3">Rarity</th>
              <th className="px-3 py-3">Featured</th>
              <th className="px-3 py-3">Excluded</th>
              <th className="px-3 py-3">Spins</th>
              <th className="px-3 py-3">Clicks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((d) => (
              <tr key={d.dealId} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-900">{d.title.slice(0, 40)}{d.title.length > 40 ? "..." : ""}</td>
                <td className="px-3 py-2 font-semibold text-emerald-600">${Number(d.price)}</td>
                <td className="px-3 py-2 text-gray-600">{d.city}</td>
                <td className="px-3 py-2 text-gray-600">{d.brandName}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={d.weight ?? 5}
                    onChange={(e) => updateDeal(d.dealId, { weight: Number(e.target.value) })}
                    className="w-14 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={d.rarity ?? "common"}
                    onChange={(e) => updateDeal(d.dealId, { rarity: e.target.value })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                  >
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!d.isFeatured}
                    onChange={(e) => updateDeal(d.dealId, { isFeatured: e.target.checked })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!d.isExcluded}
                    onChange={(e) => updateDeal(d.dealId, { isExcluded: e.target.checked })}
                  />
                </td>
                <td className="px-3 py-2 text-center text-gray-500">{d.spinCount ?? 0}</td>
                <td className="px-3 py-2 text-center text-gray-500">{d.clickCount ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
