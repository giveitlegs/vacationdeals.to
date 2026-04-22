import type { Metadata } from "next";
import Link from "next/link";
import { PTODebtClient } from "./PTODebtClient";

export const metadata: Metadata = {
  title: "Overdue PTO Collections Agency | Vacation Carnival",
  description: "You let your vacation days expire. We're here to collect. Calculate your Vacation Debt in dollars, get served a collections notice, settle with a real vacation.",
  alternates: { canonical: "https://vacationdeals.to/vacation-carnival/pto-debt" },
};

export default function PTODebtPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/vacation-carnival" className="hover:text-blue-600">Vacation Carnival</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">PTO Debt Collections</li>
        </ol>
      </nav>

      <PTODebtClient />
    </div>
  );
}
