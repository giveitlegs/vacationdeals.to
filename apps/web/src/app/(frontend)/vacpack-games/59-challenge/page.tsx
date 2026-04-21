import type { Metadata } from "next";
import Link from "next/link";
import { ChallengeClient } from "./ChallengeClient";

export const metadata: Metadata = {
  title: "The $59 Challenge — 3-Night Vacation Under $200",
  description:
    "Plan + execute a full 3-night vacation for under $200 total (including a $59 vacpack). Submit your itinerary, win $100 toward your next trip.",
  alternates: { canonical: "https://vacationdeals.to/vacpack-games/59-challenge" },
};

export default function ChallengePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/vacpack-games" className="hover:text-blue-600">VacPack Games</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">$59 Challenge</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="mb-3 text-4xl font-black text-gray-900 sm:text-5xl">
          <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
            The $59 Challenge
          </span>
        </h1>
        <p className="text-lg text-gray-600">
          Full 3-night vacation. Under $200 total. Prove it with photos. Win $100.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="mb-2 text-lg font-bold text-gray-900">How to play</h2>
        <ol className="ml-4 list-decimal space-y-1 text-sm text-gray-700">
          <li>Book a $59 vacpack (or similar low-cost deal)</li>
          <li>Plan 3 nights total under $200 including gas, food, activities</li>
          <li>Take photos as proof (room, meals, activities)</li>
          <li>Submit your itinerary with receipts totals below</li>
          <li>Monthly winner wins $100 toward next vacpack + gets featured on homepage</li>
        </ol>
      </div>

      <ChallengeClient />
    </div>
  );
}
