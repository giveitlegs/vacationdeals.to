import type { Metadata } from "next";
import Link from "next/link";
import { SurvivalKitClient } from "./SurvivalKitClient";

export const metadata: Metadata = {
  title: "Timeshare Presentation Survival Kit — Can You Say No?",
  description:
    "20 real scenarios from timeshare sales pitches. Pick your response, get your Survival Score. Free guide: 'The Official Pushback Phrase Book'.",
  alternates: { canonical: "https://vacationdeals.to/vacpack-games/survival-kit" },
};

export default function SurvivalKitPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/vacpack-games" className="hover:text-blue-600">VacPack Games</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Survival Kit</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="mb-3 text-4xl font-black text-gray-900 sm:text-5xl">
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Timeshare Presentation Survival Kit
          </span>
        </h1>
        <p className="text-lg text-gray-600">
          20 real scenarios that actually happen. Pick what you&apos;d do.
          Get your Survival Score at the end.
        </p>
      </div>

      {/* How to play */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="mb-2 text-lg font-bold text-gray-900">How to play</h2>
        <ol className="ml-4 list-decimal space-y-1 text-sm text-gray-700">
          <li>Read each scenario — these are all real tactics we&apos;ve experienced</li>
          <li>Pick the response that best matches what you&apos;d actually do</li>
          <li>No overthinking — gut reaction wins</li>
          <li>At the end: get your Survival Level + share your score</li>
        </ol>
      </div>

      <SurvivalKitClient />
    </div>
  );
}
