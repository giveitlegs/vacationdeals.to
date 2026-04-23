import type { Metadata } from "next";
import Link from "next/link";
import { ConfessionalClient } from "./ConfessionalClient";

export const metadata: Metadata = {
  title: "The Vacation Confessional | Vacation Carnival",
  description: "Confess your worst vacation sin. The booth will know. Absolution requires contact info.",
  alternates: { canonical: "https://vacationdeals.to/vacation-carnival/confessional" },
};

export default function ConfessionalPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/vacation-carnival" className="hover:text-blue-600">Vacation Carnival</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Confessional</li>
        </ol>
      </nav>

      <ConfessionalClient />
    </div>
  );
}
