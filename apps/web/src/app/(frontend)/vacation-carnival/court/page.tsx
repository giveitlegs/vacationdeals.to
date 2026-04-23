import type { Metadata } from "next";
import Link from "next/link";
import { VacationCourtClient } from "./VacationCourtClient";

export const metadata: Metadata = {
  title: "Vacation Court | Vacation Carnival",
  description: "You are charged with Willful Overwork. Plead your case in 100 words. A jury of peers decides whether you deserve vacation.",
  alternates: { canonical: "https://vacationdeals.to/vacation-carnival/court" },
};

export default function VacationCourtPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/vacation-carnival" className="hover:text-blue-600">Vacation Carnival</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Vacation Court</li>
        </ol>
      </nav>

      <VacationCourtClient />
    </div>
  );
}
