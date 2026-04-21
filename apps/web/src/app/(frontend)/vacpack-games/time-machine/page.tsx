import type { Metadata } from "next";
import Link from "next/link";
import { getPriceHistory, getFilterOptions } from "@/lib/price-history";
import { TimeMachineClient } from "./TimeMachineClient";

export const metadata: Metadata = {
  title: "VacPack Time Machine — Historical Vacation Deal Prices",
  description:
    "Drag the timeline. Watch vacation deal prices change over weeks and months. Find the record low. Predict next year. Get alerts when prices hit historical lows.",
  alternates: { canonical: "https://vacationdeals.to/vacpack-games/time-machine" },
};

export const revalidate = 3600;

export default async function TimeMachinePage() {
  const [history, options] = await Promise.all([
    getPriceHistory({ days: 180, maxDurationNights: 5 }),
    getFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/vacpack-games" className="hover:text-blue-600">VacPack Games</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Time Machine</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="mb-3 text-4xl font-black text-gray-900 sm:text-5xl">
          <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
            VacPack Time Machine
          </span>
        </h1>
        <p className="text-lg text-gray-600">
          Drag the dial. Watch vacation deal prices ripple through time.
          Find the record low. Get notified when it hits again.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="mb-2 text-lg font-bold text-gray-900">How it works</h2>
        <ol className="ml-4 list-decimal space-y-1 text-sm text-gray-700">
          <li>Pick a destination — the dial shows every price we&apos;ve ever recorded</li>
          <li>Drag the time dial to see what deals looked like on any given day</li>
          <li>The dial glows green when you&apos;re at the record low</li>
          <li>Sign up to get an alert the next time prices hit that low</li>
        </ol>
      </div>

      <TimeMachineClient
        points={history.points}
        destinations={options.destinations}
      />
    </div>
  );
}
