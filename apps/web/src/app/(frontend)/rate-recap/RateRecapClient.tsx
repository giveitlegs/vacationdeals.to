"use client";

import { useState, useMemo } from "react";
import { PriceChart } from "@/components/PriceChart";
import type { PricePoint, BrandInfo } from "@/lib/price-history";

const DESTINATIONS = [
  { label: "All Destinations", value: "" },
  { label: "Orlando", value: "orlando" },
  { label: "Las Vegas", value: "las-vegas" },
  { label: "Cancun", value: "cancun" },
  { label: "Gatlinburg", value: "gatlinburg" },
  { label: "Myrtle Beach", value: "myrtle-beach" },
  { label: "Branson", value: "branson" },
  { label: "Williamsburg", value: "williamsburg" },
  { label: "Cocoa Beach", value: "cocoa-beach" },
  { label: "Hilton Head", value: "hilton-head" },
  { label: "Daytona Beach", value: "daytona-beach" },
  { label: "Cabo", value: "cabo" },
  { label: "Punta Cana", value: "punta-cana" },
];

const DURATIONS = [
  { label: "3 Days / 2 Nights", value: 2 },
  { label: "4 Days / 3 Nights", value: 3 },
];

type TimeRange = "30d" | "60d" | "90d" | "ytd" | "12m";

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: "30 Days", value: "30d" },
  { label: "60 Days", value: "60d" },
  { label: "90 Days", value: "90d" },
  { label: "YTD", value: "ytd" },
  { label: "12 Months", value: "12m" },
];

function getDateCutoff(range: TimeRange): string {
  const now = new Date();
  let cutoff: Date;
  switch (range) {
    case "30d":
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
      break;
    case "60d":
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 60);
      break;
    case "90d":
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 90);
      break;
    case "ytd":
      cutoff = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year
      break;
    case "12m":
      cutoff = new Date(now);
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      break;
  }
  return cutoff.toISOString().split("T")[0];
}

interface RateRecapClientProps {
  initialPoints: PricePoint[];
  initialBrands: BrandInfo[];
}

export function RateRecapClient({
  initialPoints,
  initialBrands,
}: RateRecapClientProps) {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState<number>(3);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [bestRateOnly, setBestRateOnly] = useState(false);

  // Filter data based on destination, duration, and time range
  const filteredPoints = useMemo(() => {
    const cutoff = getDateCutoff(timeRange);

    let points = initialPoints.filter((p) => {
      if (destination && p.destinationSlug !== destination) return false;
      if (p.durationNights !== duration) return false;
      if (p.date < cutoff) return false;
      return true;
    });

    // "Best Rate of Day" — for each brand+date, keep only the lowest price
    if (bestRateOnly) {
      const bestMap = new Map<string, PricePoint>();
      for (const p of points) {
        const key = `${p.brandSlug}|${p.date}`;
        const existing = bestMap.get(key);
        if (!existing || p.price < existing.price) {
          bestMap.set(key, p);
        }
      }
      points = Array.from(bestMap.values());
    }

    return points;
  }, [initialPoints, destination, duration, timeRange, bestRateOnly]);

  // Derive visible brands from filtered data
  const filteredBrands = useMemo(() => {
    const slugs = new Set(filteredPoints.map((p) => p.brandSlug));
    return initialBrands.filter((b) => slugs.has(b.slug));
  }, [filteredPoints, initialBrands]);

  return (
    <div>
      {/* Filter controls */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        {/* Destination dropdown */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="destination-filter"
            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Destination
          </label>
          <select
            id="destination-filter"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {DESTINATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Duration toggle */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Duration
          </span>
          <div className="inline-flex rounded-lg border border-gray-300 bg-white">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  duration === d.value
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time range selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Time Range
          </span>
          <div className="inline-flex rounded-lg border border-gray-300 bg-white">
            {TIME_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setTimeRange(r.value)}
                className={`px-3 py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  timeRange === r.value
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Best rate only toggle */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Lowest Rate
          </span>
          <button
            onClick={() => setBestRateOnly(!bestRateOnly)}
            className={`relative inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-all ${
              bestRateOnly
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                bestRateOnly ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                  bestRateOnly ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </span>
            Just Show Lowest Rate
          </button>
        </div>
      </div>

      {/* Chart */}
      <PriceChart data={filteredPoints} brands={filteredBrands} />
    </div>
  );
}
