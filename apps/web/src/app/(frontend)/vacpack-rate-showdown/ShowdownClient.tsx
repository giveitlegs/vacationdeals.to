"use client";

import { useState, useMemo } from "react";
import { PriceChart } from "@/components/PriceChart";
import type { PricePoint, BrandInfo } from "@/lib/price-history";

interface ShowdownClientProps {
  allPoints: PricePoint[];
  allBrands: BrandInfo[];
}

export function ShowdownClient({ allPoints, allBrands }: ShowdownClientProps) {
  const [brand1, setBrand1] = useState(allBrands[0]?.slug ?? "");
  const [brand2, setBrand2] = useState(allBrands[1]?.slug ?? "");

  const filteredPoints = useMemo(
    () => allPoints.filter((p) => p.brandSlug === brand1 || p.brandSlug === brand2),
    [allPoints, brand1, brand2],
  );

  const filteredBrands = useMemo(
    () => allBrands.filter((b) => b.slug === brand1 || b.slug === brand2),
    [allBrands, brand1, brand2],
  );

  // Compute head-to-head stats
  const stats = useMemo(() => {
    const b1Points = allPoints.filter((p) => p.brandSlug === brand1);
    const b2Points = allPoints.filter((p) => p.brandSlug === brand2);

    const b1Avg = b1Points.length > 0 ? Math.round(b1Points.reduce((s, p) => s + p.price, 0) / b1Points.length) : 0;
    const b2Avg = b2Points.length > 0 ? Math.round(b2Points.reduce((s, p) => s + p.price, 0) / b2Points.length) : 0;
    const b1Min = b1Points.length > 0 ? Math.min(...b1Points.map((p) => p.price)) : 0;
    const b2Min = b2Points.length > 0 ? Math.min(...b2Points.map((p) => p.price)) : 0;
    const b1Max = b1Points.length > 0 ? Math.max(...b1Points.map((p) => p.price)) : 0;
    const b2Max = b2Points.length > 0 ? Math.max(...b2Points.map((p) => p.price)) : 0;
    const b1Count = b1Points.length;
    const b2Count = b2Points.length;

    // Unique destinations per brand
    const b1Dests = new Set(b1Points.map((p) => p.destinationSlug)).size;
    const b2Dests = new Set(b2Points.map((p) => p.destinationSlug)).size;

    return { b1Avg, b2Avg, b1Min, b2Min, b1Max, b2Max, b1Count, b2Count, b1Dests, b2Dests };
  }, [allPoints, brand1, brand2]);

  const brand1Info = allBrands.find((b) => b.slug === brand1);
  const brand2Info = allBrands.find((b) => b.slug === brand2);

  return (
    <div>
      {/* Brand Selectors */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Brand 1
          </label>
          <select
            value={brand1}
            onChange={(e) => setBrand1(e.target.value)}
            className="rounded-lg border-2 px-4 py-3 text-sm font-medium text-gray-900 transition-colors focus:border-blue-500 focus:outline-none"
            style={{ borderColor: brand1Info?.color ?? "#E5E7EB" }}
          >
            {allBrands.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Brand 2
          </label>
          <select
            value={brand2}
            onChange={(e) => setBrand2(e.target.value)}
            className="rounded-lg border-2 px-4 py-3 text-sm font-medium text-gray-900 transition-colors focus:border-blue-500 focus:outline-none"
            style={{ borderColor: brand2Info?.color ?? "#E5E7EB" }}
          >
            {allBrands.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Head-to-Head Stats */}
      {brand1 !== brand2 && (
        <div className="mb-8 overflow-hidden rounded-xl border border-gray-200">
          <div className="grid grid-cols-3 bg-gray-50 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
            <div className="p-3" style={{ color: brand1Info?.color }}>{brand1Info?.name}</div>
            <div className="p-3 text-gray-400">VS</div>
            <div className="p-3" style={{ color: brand2Info?.color }}>{brand2Info?.name}</div>
          </div>
          {[
            { label: "Avg Price", v1: `$${stats.b1Avg}`, v2: `$${stats.b2Avg}`, winner: stats.b1Avg < stats.b2Avg ? 1 : stats.b1Avg > stats.b2Avg ? 2 : 0 },
            { label: "Lowest Rate", v1: `$${stats.b1Min}`, v2: `$${stats.b2Min}`, winner: stats.b1Min < stats.b2Min ? 1 : stats.b1Min > stats.b2Min ? 2 : 0 },
            { label: "Highest Rate", v1: `$${stats.b1Max}`, v2: `$${stats.b2Max}`, winner: stats.b1Max < stats.b2Max ? 1 : stats.b1Max > stats.b2Max ? 2 : 0 },
            { label: "Data Points", v1: String(stats.b1Count), v2: String(stats.b2Count), winner: stats.b1Count > stats.b2Count ? 1 : stats.b1Count < stats.b2Count ? 2 : 0 },
            { label: "Destinations", v1: String(stats.b1Dests), v2: String(stats.b2Dests), winner: stats.b1Dests > stats.b2Dests ? 1 : stats.b1Dests < stats.b2Dests ? 2 : 0 },
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-3 border-t border-gray-100 text-center">
              <div className={`p-3 text-sm font-semibold ${row.winner === 1 ? "bg-emerald-50 text-emerald-700" : "text-gray-900"}`}>
                {row.v1} {row.winner === 1 && "\u2714"}
              </div>
              <div className="p-3 text-xs text-gray-400">{row.label}</div>
              <div className={`p-3 text-sm font-semibold ${row.winner === 2 ? "bg-emerald-50 text-emerald-700" : "text-gray-900"}`}>
                {row.v2} {row.winner === 2 && "\u2714"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overlay Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Price History Overlay</h2>
        <PriceChart data={filteredPoints} brands={filteredBrands} />
      </div>

      {brand1 === brand2 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-700">
          Select two different brands to see the comparison.
        </div>
      )}
    </div>
  );
}
