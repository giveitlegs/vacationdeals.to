import type { Metadata } from "next";
import Link from "next/link";
import { getPriceHistory } from "@/lib/price-history";
import { ShowdownClient } from "./ShowdownClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "VacPack Rate Showdown — Compare Brand Prices",
  description:
    "Compare vacation deal prices between two resort brands head-to-head. See which brand offers the lowest rates, biggest savings, and best value.",
  alternates: { canonical: "https://vacationdeals.to/vacpack-rate-showdown" },
  openGraph: {
    title: "VacPack Rate Showdown — Compare Brand Prices",
    description: "Head-to-head vacation deal price comparison between resort brands.",
    type: "website",
    url: "https://vacationdeals.to/vacpack-rate-showdown",
  },
};

export default async function ShowdownPage() {
  const { points, brands } = await getPriceHistory({ days: 365 });

  return (
    <div>
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/rate-recap" className="hover:text-blue-600">Rate Recap</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Rate Showdown</li>
        </ol>
      </nav>

      <div className="mb-8 text-center">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">
          VacPack Rate Showdown
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Pick two brands and compare their vacation deal prices head-to-head.
          See who wins on price, consistency, and value across destinations.
        </p>
      </div>

      <ShowdownClient allPoints={points} allBrands={brands} />

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Individual Brand Rate Recaps</h2>
        <div className="flex flex-wrap gap-2">
          {brands.map((b) => (
            <Link key={b.slug} href={`/rate-recap-${b.slug}`}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-300 hover:text-blue-600">
              {b.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-xl bg-gray-900 p-6 text-center text-white">
        <h3 className="mb-2 text-lg font-bold">Need Competitive Rate Intelligence?</h3>
        <p className="mb-4 text-sm text-gray-400">
          Full historical pricing data with scrape provenance for competitive analysis.
        </p>
        <a href="mailto:data@vacationdeals.to?subject=Competitive%20Rate%20Intelligence%20Inquiry"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100">
          Request Data Report
        </a>
      </section>
    </div>
  );
}
