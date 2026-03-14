import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vacation Destinations",
  description:
    "Browse vacation package deals by destination. Orlando, Las Vegas, Cancun, Gatlinburg, and 50+ more cities.",
};

const destinations = [
  { name: "Orlando", state: "FL", deals: 47, gradient: "from-blue-400 to-cyan-300" },
  { name: "Las Vegas", state: "NV", deals: 32, gradient: "from-amber-400 to-orange-500" },
  { name: "Cancun", state: "MX", deals: 28, gradient: "from-teal-400 to-emerald-300" },
  { name: "Gatlinburg", state: "TN", deals: 19, gradient: "from-green-500 to-emerald-600" },
  { name: "Myrtle Beach", state: "SC", deals: 24, gradient: "from-sky-400 to-blue-500" },
  { name: "Branson", state: "MO", deals: 15, gradient: "from-rose-400 to-pink-500" },
  { name: "Williamsburg", state: "VA", deals: 12, gradient: "from-violet-400 to-purple-500" },
  { name: "San Antonio", state: "TX", deals: 11, gradient: "from-orange-400 to-red-500" },
  { name: "Miami", state: "FL", deals: 18, gradient: "from-cyan-400 to-blue-500" },
  { name: "Nashville", state: "TN", deals: 9, gradient: "from-yellow-400 to-amber-500" },
  { name: "Sedona", state: "AZ", deals: 7, gradient: "from-red-400 to-orange-600" },
  { name: "Cabo San Lucas", state: "MX", deals: 14, gradient: "from-emerald-400 to-teal-500" },
  { name: "Park City", state: "UT", deals: 6, gradient: "from-slate-400 to-blue-600" },
  { name: "Hilton Head", state: "SC", deals: 10, gradient: "from-lime-400 to-green-500" },
  { name: "Daytona Beach", state: "FL", deals: 8, gradient: "from-indigo-400 to-blue-500" },
];

export default function DestinationsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Vacation Destinations
        </h1>
        <p className="text-gray-600">
          Browse vacation package deals by destination. Find the best prices for
          your favorite getaway spots.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((dest) => (
          <Link
            key={dest.name}
            href={`/destinations/${dest.name.toLowerCase().replace(/\s+/g, "-")}`}
            className="destination-card group overflow-hidden rounded-xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className={`flex h-40 flex-col items-center justify-center bg-gradient-to-br ${dest.gradient} p-6`}
            >
              <span className="text-2xl font-bold text-white drop-shadow-sm">
                {dest.name}
              </span>
              <span className="mb-2 text-sm font-medium text-white/80">
                {dest.state}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {dest.deals} deals available
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
