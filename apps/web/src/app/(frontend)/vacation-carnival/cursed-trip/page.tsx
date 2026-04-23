import type { Metadata } from "next";
import Link from "next/link";
import { CursedTripClient } from "./CursedTripClient";

export const metadata: Metadata = {
  title: "Cursed Vacation Generator | Vacation Carnival",
  description: "Answer 5 questions, receive the most cursed vacation imaginable personalized for you. Then: the antidote.",
  alternates: { canonical: "https://vacationdeals.to/vacation-carnival/cursed-trip" },
};

export default function CursedTripPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/vacation-carnival" className="hover:text-blue-600">Vacation Carnival</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Cursed Trip Generator</li>
        </ol>
      </nav>

      <CursedTripClient />
    </div>
  );
}
