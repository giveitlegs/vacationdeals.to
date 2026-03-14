"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const suggestions = [
  { label: "Orlando, FL", type: "destination" },
  { label: "Las Vegas, NV", type: "destination" },
  { label: "Cancun, QR", type: "destination" },
  { label: "Gatlinburg, TN", type: "destination" },
  { label: "Myrtle Beach, SC", type: "destination" },
  { label: "Westgate Resorts", type: "brand" },
  { label: "Hilton Grand Vacations", type: "brand" },
  { label: "Marriott Vacation Club", type: "brand" },
  { label: "Club Wyndham", type: "brand" },
  { label: "BookVIP", type: "brand" },
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
    if (suggestion.type === "destination") {
      const city = suggestion.label.split(",")[0].trim();
      router.push(`/deals?destination=${encodeURIComponent(city)}`);
    } else {
      router.push(`/deals?brand=${encodeURIComponent(suggestion.label)}`);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/deals?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
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
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
          {filtered.map((suggestion) => (
            <button
              key={suggestion.label}
              onClick={() => handleSelect(suggestion)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
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
