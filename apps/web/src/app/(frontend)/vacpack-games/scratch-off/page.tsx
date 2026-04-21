import type { Metadata } from "next";
import Link from "next/link";
import { getDeals } from "@/lib/queries";
import { ScratchOffClient } from "./ScratchOffClient";

export const metadata: Metadata = {
  title: "Deal Scratch-Off — Win a Mystery Vacation Deal",
  description:
    "Scratch the card. Reveal a random real vacation deal. 1 free scratch per day. Golden ticket = premium mystery deal.",
  alternates: { canonical: "https://vacationdeals.to/vacpack-games/scratch-off" },
};

export const revalidate = 3600;

export default async function ScratchOffPage() {
  const result = await getDeals({ limit: 30, sortBy: "cheapest" });
  const deals = (result?.deals ?? []).filter((d) => d.price && d.price <= 299);

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/vacpack-games" className="hover:text-blue-600">VacPack Games</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Scratch-Off</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="mb-3 text-4xl font-black text-gray-900 sm:text-5xl">
          <span className="bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
            The Deal Scratch-Off
          </span>
        </h1>
        <p className="text-lg text-gray-600">
          Scratch with your finger. Reveal a mystery vacpack.
          1 free per day. Rare golden ticket unlocks premium deals.
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="mb-2 text-lg font-bold text-gray-900">How to play</h2>
        <ol className="ml-4 list-decimal space-y-1 text-sm text-gray-700">
          <li>Tap &quot;New Card&quot; to reveal a covered card</li>
          <li>Drag your finger (or mouse) across the card to scratch it</li>
          <li>Scratch ~50% to auto-reveal your deal</li>
          <li>Love it? Click through. Out of scratches? Share or subscribe for more</li>
        </ol>
      </div>

      <ScratchOffClient deals={deals} />
    </div>
  );
}
