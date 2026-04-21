import type { Metadata } from "next";
import Link from "next/link";
import { BingoClient } from "./BingoClient";

export const metadata: Metadata = {
  title: "VacPack Bingo — Timeshare Presentation Bingo Card",
  description:
    "Digital bingo card with real timeshare sales tactics. Check them off during your next presentation. Get BINGO, win a discount on your next vacpack.",
  alternates: { canonical: "https://vacationdeals.to/vacpack-games/bingo" },
};

export default function BingoPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/vacpack-games" className="hover:text-blue-600">VacPack Games</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">VacPack Bingo</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="mb-3 text-4xl font-black text-gray-900 sm:text-5xl">
          <span className="bg-gradient-to-r from-fuchsia-600 to-pink-500 bg-clip-text text-transparent">
            VacPack Bingo
          </span>
        </h1>
        <p className="text-lg text-gray-600">
          25 real timeshare sales tactics on one card. Tap each square as it happens.
          5 in a row = BINGO = free gift.
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="mb-2 text-lg font-bold text-gray-900">How to play</h2>
        <ol className="ml-4 list-decimal space-y-1 text-sm text-gray-700">
          <li>Tap &quot;New Card&quot; to randomize 25 squares (all different each time)</li>
          <li>During your presentation, tap each square as the rep says it</li>
          <li>Get 5 in a row (horizontal, vertical, or diagonal) to hit BINGO</li>
          <li>Share your board, then claim a discount code for a real vacpack</li>
        </ol>
      </div>

      <BingoClient />
    </div>
  );
}
