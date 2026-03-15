"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const suggestions = [
  { label: "Orlando, FL", slug: "orlando", type: "destination" },
  { label: "Las Vegas, NV", slug: "las-vegas", type: "destination" },
  { label: "Cancun, MX", slug: "cancun", type: "destination" },
  { label: "Gatlinburg, TN", slug: "gatlinburg", type: "destination" },
  { label: "Myrtle Beach, SC", slug: "myrtle-beach", type: "destination" },
  { label: "Branson, MO", slug: "branson", type: "destination" },
  { label: "Cabo San Lucas, MX", slug: "cabo", type: "destination" },
  { label: "Key West, FL", slug: "key-west", type: "destination" },
  { label: "Williamsburg, VA", slug: "williamsburg", type: "destination" },
  { label: "Hilton Head, SC", slug: "hilton-head", type: "destination" },
  { label: "Westgate Resorts", slug: "westgate", type: "brand" },
  { label: "Hilton Grand Vacations", slug: "hgv", type: "brand" },
  { label: "Marriott Vacation Club", slug: "marriott", type: "brand" },
  { label: "Club Wyndham", slug: "wyndham", type: "brand" },
  { label: "BookVIP", slug: "bookvip", type: "brand" },
  { label: "Holiday Inn Club", slug: "holiday-inn", type: "brand" },
  { label: "Monster Reservations", slug: "mrg", type: "brand" },
];

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const filtered = query.length > 0
    ? suggestions.filter((s) =>
        s.label.toLowerCase().includes(query.toLowerCase()),
      )
    : suggestions;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(suggestion: (typeof suggestions)[0]) {
    setQuery(suggestion.label);
    setOpen(false);
    router.push(`/${suggestion.slug}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    // Try to match a suggestion slug
    const match = suggestions.find((s) =>
      s.label.toLowerCase().includes(query.toLowerCase()),
    );
    if (match) {
      router.push(`/${match.slug}`);
    } else {
      // Fallback: slugify the query and try as a destination
      const slug = query.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      router.push(`/${slug}`);
    }
  }

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* Search Icon */}
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search vacation deals by destination or brand..."
            className="w-full rounded-xl border border-gray-300 bg-white py-4 pl-12 pr-4 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-2 w-full max-h-[60vh] overflow-y-auto rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
          {filtered.map((suggestion) => (
            <button
              key={suggestion.label}
              onClick={() => handleSelect(suggestion)}
              className="flex w-full items-center gap-3 px-4 py-3 min-h-[44px] text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  suggestion.type === "destination"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {suggestion.type === "destination" ? "City" : "Brand"}
              </span>
              <span>{suggestion.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
