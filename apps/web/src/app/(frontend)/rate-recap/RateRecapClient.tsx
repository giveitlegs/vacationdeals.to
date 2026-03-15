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

  // Note: For a full implementation, changing filters would re-fetch from the
  // server. For now, we display all initial data and let the chart's brand
  // toggles handle interactivity. The filters are wired up for future use.
  const filteredPoints = useMemo(() => {
    // Mock data doesn't have destination/duration metadata, so we show all
    return initialPoints;
  }, [initialPoints]);

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
      </div>

      {/* Chart */}
      <PriceChart data={filteredPoints} brands={initialBrands} />
    </div>
  );
}
