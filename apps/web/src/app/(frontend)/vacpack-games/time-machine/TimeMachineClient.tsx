"use client";

import { useMemo, useState } from "react";
import type { PricePoint } from "@/lib/price-history";
import { LeadGenPopup } from "@/components/LeadGenPopup";

interface Props {
  points: PricePoint[];
  destinations: { label: string; value: string }[];
}

interface DaySnapshot {
  date: string;
  minPrice: number;
  deals: PricePoint[];
}

export function TimeMachineClient({ points, destinations }: Props) {
  const [destSlug, setDestSlug] = useState(destinations[0]?.value ?? "orlando");

  const filtered = useMemo(
    () => points.filter((p) => p.destinationSlug === destSlug),
    [points, destSlug],
  );

  const snapshots: DaySnapshot[] = useMemo(() => {
    const byDate = new Map<string, PricePoint[]>();
    for (const p of filtered) {
      const arr = byDate.get(p.date) ?? [];
      arr.push(p);
      byDate.set(p.date, arr);
    }
    const out: DaySnapshot[] = [];
    for (const [date, deals] of byDate) {
      const minPrice = deals.reduce((m, d) => Math.min(m, d.price), Infinity);
      out.push({ date, minPrice, deals: deals.sort((a, b) => a.price - b.price).slice(0, 5) });
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const [idx, setIdx] = useState(() => Math.max(0, snapshots.length - 1));
  const safeIdx = Math.min(idx, Math.max(0, snapshots.length - 1));
  const currentSnap = snapshots[safeIdx];

  const recordLow = useMemo(() => {
    let min = Infinity;
    let minDate = "";
    for (const s of snapshots) {
      if (s.minPrice < min) {
        min = s.minPrice;
        minDate = s.date;
      }
    }
    return { price: min, date: minDate };
  }, [snapshots]);

  const atRecord = currentSnap && currentSnap.minPrice === recordLow.price;

  const onDest = (slug: string) => {
    setDestSlug(slug);
    setIdx(0);
  };

  if (snapshots.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-4xl">🕰️</p>
        <p className="mt-3 text-lg font-bold text-gray-900">No history for this destination yet</p>
        <p className="mt-1 text-sm text-gray-500">Try another destination — we&apos;ve been recording prices every 6 hours.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {destinations.slice(0, 8).map((d) => (
            <button
              key={d.value}
              onClick={() => onDest(d.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                d.value === destSlug ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <LeadGenPopup
        id="time-machine-alert"
        timeDelayMs={0}
        scrollPercent={0.5}
        exitIntent
        headline="Get Alerts When Prices Hit the Record Low"
        subheadline={`Record low for this destination: $${recordLow.price}. Get an email the next time we see it.`}
        ctaText="Notify Me"
        source="time_machine_alert"
      />

      {/* Destination picker */}
      <div className="mb-6 flex flex-wrap gap-2">
        {destinations.slice(0, 12).map((d) => (
          <button
            key={d.value}
            onClick={() => onDest(d.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              d.value === destSlug
                ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Time machine display */}
      <div className={`rounded-2xl p-8 shadow-xl transition-all ${
        atRecord
          ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white animate-pulse"
          : "bg-gradient-to-br from-indigo-600 to-blue-600 text-white"
      }`}>
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest opacity-80">
            {destinations.find((d) => d.value === destSlug)?.label ?? destSlug}
          </p>
          <p className="mt-2 text-xl opacity-90">{formatDate(currentSnap?.date ?? "")}</p>
          <p className="mt-4 text-7xl font-black tracking-tight">
            ${currentSnap?.minPrice ?? "—"}
          </p>
          <p className="mt-1 text-sm opacity-80">cheapest vacpack that day</p>
          {atRecord && <p className="mt-3 inline-block rounded-full bg-white/25 px-4 py-1.5 text-sm font-bold">⚡ RECORD LOW</p>}
        </div>
      </div>

      {/* Time dial */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatDate(snapshots[0].date)}</span>
          <span className="font-bold text-indigo-600">Drag to travel</span>
          <span>{formatDate(snapshots[snapshots.length - 1].date)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={snapshots.length - 1}
          value={safeIdx}
          onChange={(e) => setIdx(+e.target.value)}
          className="mt-3 w-full accent-indigo-600"
          aria-label="Time dial"
        />
        <div className="mt-3 flex justify-between">
          <button
            onClick={() => setIdx(Math.max(0, safeIdx - 1))}
            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium hover:bg-gray-50"
          >
            ← Earlier
          </button>
          <button
            onClick={() => {
              const min = snapshots.findIndex((s) => s.minPrice === recordLow.price);
              if (min >= 0) setIdx(min);
            }}
            className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-600"
          >
            Jump to Record Low
          </button>
          <button
            onClick={() => setIdx(Math.min(snapshots.length - 1, safeIdx + 1))}
            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium hover:bg-gray-50"
          >
            Later →
          </button>
        </div>
      </div>

      {/* Top 5 on this date */}
      {currentSnap && currentSnap.deals.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Top deals on {formatDate(currentSnap.date)}</h3>
          <ul className="divide-y divide-gray-100">
            {currentSnap.deals.map((d, i) => (
              <li key={i} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{d.brandName}</p>
                  <p className="text-xs text-gray-500">{d.durationNights + 1}D/{d.durationNights}N</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-indigo-600">${d.price}</p>
                  {d.dealSlug && (
                    <a href={`/deals/${d.dealSlug}`} className="text-xs text-blue-600 hover:underline">View →</a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Record Low" value={`$${recordLow.price}`} sub={formatDate(recordLow.date)} />
        <StatCard label="Data Points" value={snapshots.length.toString()} sub="days tracked" />
        <StatCard
          label="vs. Record"
          value={currentSnap ? `${Math.round(((currentSnap.minPrice - recordLow.price) / recordLow.price) * 100)}%` : "—"}
          sub="over record low"
        />
      </div>
    </>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[+m - 1]} ${+d}, ${y}`;
}
