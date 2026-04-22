import type { Metadata } from "next";
import Link from "next/link";
import { SeveranceClient } from "./SeveranceClient";

export const metadata: Metadata = {
  title: "Severance Package Generator | Vacation Carnival",
  description: "The resignation speech you're too polite to write. Generated for you. APPROVED: ONE (1) Real Vacation.",
  alternates: { canonical: "https://vacationdeals.to/vacation-carnival/severance" },
};

export default function SeverancePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/vacation-carnival" className="hover:text-blue-600">Vacation Carnival</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Severance Package Generator</li>
        </ol>
      </nav>

      <SeveranceClient />
    </div>
  );
}
