import type { Metadata } from "next";
import Link from "next/link";
import { LostResortClient } from "./LostResortClient";

export const metadata: Metadata = {
  title: "The Lost Resort Files | Vacation Carnival",
  description: "A leaked document describes a resort that doesn't officially exist. Solve three puzzles to unlock the coordinates.",
  alternates: { canonical: "https://vacationdeals.to/vacation-carnival/lost-resort" },
};

export default function LostResortPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/vacation-carnival" className="hover:text-blue-600">Vacation Carnival</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Lost Resort Files</li>
        </ol>
      </nav>

      <LostResortClient />
    </div>
  );
}
