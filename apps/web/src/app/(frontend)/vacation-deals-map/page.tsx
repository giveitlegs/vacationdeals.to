import type { Metadata } from "next";
import Link from "next/link";
import { DealMapClient } from "./DealMapClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vacation Deals Map — Find Deals Near You",
  description:
    "Interactive map of vacation deals across 100+ destinations. Click any pin to see the cheapest resort deals in that city.",
  alternates: { canonical: "https://vacationdeals.to/vacation-deals-map" },
  openGraph: {
    title: "Vacation Deals Map — Find Deals Near You",
    description: "Interactive map of vacation deals across 100+ destinations.",
    type: "website",
    url: "https://vacationdeals.to/vacation-deals-map",
  },
};

export default function MapPage() {
  return (
    <div>
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Deal Map</li>
        </ol>
      </nav>

      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Vacation Deals Map</h1>
        <p className="text-gray-600">
          Click any pin to see the cheapest vacation deals at that destination. Larger pins = more deals available.
        </p>
      </div>

      <DealMapClient />

      <section className="mt-8 text-center">
        <Link href="/destinations" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          Browse All Destinations &rarr;
        </Link>
      </section>
    </div>
  );
}
