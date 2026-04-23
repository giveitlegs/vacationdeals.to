import type { Metadata } from "next";
import Link from "next/link";
import { CultClient } from "./CultClient";

export const metadata: Metadata = {
  title: "Cult of Leisure | Vacation Carnival",
  description: "Renounce your calendar. Choose your sacred destination. Receive your AI-generated cult name. Ascend.",
  alternates: { canonical: "https://vacationdeals.to/vacation-carnival/cult" },
};

export default function CultPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/vacation-carnival" className="hover:text-blue-600">Vacation Carnival</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Cult of Leisure</li>
        </ol>
      </nav>

      <CultClient />
    </div>
  );
}
