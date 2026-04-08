"use client";

import { useState, useMemo } from "react";

interface Ad {
  id: number;
  metaAdId: string;
  brandName: string;
  brandSlug: string;
  body: string;
  title: string;
  snapshotUrl: string;
  startDate: string;
  stopDate: string | null;
  platforms: string;
  isActive: boolean;
}

interface AdSpyClientProps {
  ads: Ad[];
}

export function AdSpyClient({ ads }: AdSpyClientProps) {
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const brands = useMemo(() => {
    const set = new Map<string, string>();
    for (const ad of ads) {
      if (ad.brandSlug) set.set(ad.brandSlug, ad.brandName);
    }
    return Array.from(set.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [ads]);

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      if (brandFilter && ad.brandSlug !== brandFilter) return false;
      if (statusFilter === "active" && !ad.isActive) return false;
      if (statusFilter === "inactive" && ad.isActive) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!ad.body.toLowerCase().includes(q) && !ad.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [ads, brandFilter, statusFilter, searchQuery]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Brand</label>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All Brands</option>
            {brands.map(([slug, name]) => (
              <option key={slug} value={slug}>{name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
          <div className="inline-flex rounded-lg border border-gray-300 bg-white">
            {(["all", "active", "inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  statusFilter === s ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Search Ad Copy</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ad text..."
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        {filteredAds.length} ad{filteredAds.length !== 1 ? "s" : ""} found
      </p>

      {/* Ad Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAds.slice(0, 60).map((ad) => {
          let platforms: string[] = [];
          try { platforms = JSON.parse(ad.platforms); } catch {}

          return (
            <div
              key={ad.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <span className="text-sm font-semibold text-gray-900">{ad.brandName}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  ad.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {ad.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Ad Copy */}
              {ad.title && (
                <p className="mb-1 text-sm font-medium text-gray-800">{ad.title}</p>
              )}
              {ad.body && (
                <p className="mb-3 text-xs text-gray-600 line-clamp-4">{ad.body}</p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                {ad.startDate && (
                  <span>
                    {new Date(ad.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
                {platforms.length > 0 && (
                  <>
                    <span>&middot;</span>
                    {platforms.map((p) => (
                      <span key={p} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                        {p.toLowerCase()}
                      </span>
                    ))}
                  </>
                )}
              </div>

              {/* View on Meta */}
              {ad.snapshotUrl && (
                <a
                  href={ad.snapshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  View on Meta Ad Library &nearr;
                </a>
              )}
            </div>
          );
        })}
      </div>

      {filteredAds.length > 60 && (
        <p className="mt-6 text-center text-sm text-gray-500">
          Showing 60 of {filteredAds.length} ads. Full access available with a subscription.
        </p>
      )}
    </div>
  );
}
