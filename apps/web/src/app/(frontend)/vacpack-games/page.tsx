import type { Metadata } from "next";
import Link from "next/link";
import { GamesHubClient } from "./GamesHubClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VacPack Games & Challenges — VacationDeals.to",
  description:
    "Weird, fun, and shareable vacation deal games. Timeshare Survival Kit, VacPack Bingo, $59 Challenge, Time Machine, Scratch-Off, and Resort Roulette. Play now and discover deals.",
  alternates: { canonical: "https://vacationdeals.to/vacpack-games" },
  openGraph: {
    title: "VacPack Games & Challenges",
    description: "Weird, fun vacation deal games and lead-gen activations.",
    type: "website",
    url: "https://vacationdeals.to/vacpack-games",
  },
};

export default function VacPackGamesHub() {
  return (
    <div>
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">VacPack Games</li>
        </ol>
      </nav>

      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
          <span className="bg-gradient-to-r from-fuchsia-600 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
            VacPack Games
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Weird, shareable, stupid-fun vacation deal games. Pick one. Or pick all six.
        </p>
      </div>

      <GamesHubClient />
    </div>
  );
}
