"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

const destinations = [
  "Orlando",
  "Las Vegas",
  "Cancun",
  "Gatlinburg",
  "Myrtle Beach",
  "Branson",
  "Williamsburg",
  "San Antonio",
  "Miami",
  "Nashville",
];

const brands = [
  "Westgate Resorts",
  "Hilton Grand Vacations",
  "Marriott Vacation Club",
  "Club Wyndham",
  "Holiday Inn Club",
  "Bluegreen Vacations",
  "BookVIP",
  "Hyatt Vacation Club",
];

const priceRanges = [
  { label: "Under $100", value: "0-99" },
  { label: "$100 - $199", value: "100-199" },
  { label: "$200 - $299", value: "200-299" },
  { label: "$300+", value: "300-9999" },
];

const durations = [
  { label: "2-Night", value: "2" },
  { label: "3-Night", value: "3" },
  { label: "4-Night+", value: "4" },
];

const sortOptions = [
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest", value: "newest" },
  { label: "Biggest Savings", value: "savings" },
];

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentDestination = searchParams.get("destination") || "";
  const currentBrand = searchParams.get("brand") || "";
  const currentPrice = searchParams.get("price") || "";
  const currentDuration = searchParams.get("duration") || "";
  const currentSort = searchParams.get("sort") || "";

  const hasFilters =
    currentDestination || currentBrand || currentPrice || currentDuration || currentSort;

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:gap-3">
        {/* Destination */}
        <div className="flex-1 lg:min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Destination
          </label>
          <select
            value={currentDestination}
            onChange={(e) => updateParam("destination", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Destinations</option>
            {destinations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <div className="flex-1 lg:min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Brand
          </label>
          <select
            value={currentBrand}
            onChange={(e) => updateParam("brand", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="lg:min-w-[240px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Price Range
          </label>
          <div className="flex flex-wrap gap-1.5">
            {priceRanges.map((range) => (
              <button
                key={range.value}
                onClick={() =>
                  updateParam(
                    "price",
                    currentPrice === range.value ? "" : range.value,
                  )
                }
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  currentPrice === range.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="lg:min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Duration
          </label>
          <div className="flex flex-wrap gap-1.5">
            {durations.map((d) => (
              <button
                key={d.value}
                onClick={() =>
                  updateParam(
                    "duration",
                    currentDuration === d.value ? "" : d.value,
                  )
                }
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  currentDuration === d.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex-1 lg:min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Sort By
          </label>
          <select
            value={currentSort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Default</option>
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
