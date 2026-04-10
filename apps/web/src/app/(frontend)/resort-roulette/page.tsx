import type { Metadata } from "next";
import Link from "next/link";
import { RouletteClient } from "./RouletteClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resort Roulette — Spin to Win a Random Vacation Deal",
  description:
    "Spin the wheel and discover a random vacation deal. Real scraped vacpacks from 40+ brands. Every spin reveals a new resort, destination, and price.",
  alternates: { canonical: "https://vacationdeals.to/resort-roulette" },
  openGraph: {
    title: "Resort Roulette — Spin to Win a Random Vacation Deal",
    description: "Spin the wheel and discover a random vacation deal. Real scraped vacpacks from 40+ brands.",
    type: "website",
    url: "https://vacationdeals.to/resort-roulette",
  },
};

export default function ResortRoulettePage() {
  return (
    <div>
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Resort Roulette</li>
        </ol>
      </nav>

      <RouletteClient />
    </div>
  );
}
