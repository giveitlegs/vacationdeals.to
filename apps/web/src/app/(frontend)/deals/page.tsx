import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { DealGrid } from "@/components/DealGrid";
import type { Deal } from "@/components/DealCard";
import { getDeals, getDealStats } from "@/lib/queries";

export const revalidate = 3600; // Revalidate every hour

const mockDeals: Deal[] = [
  { id: 1, title: "Westgate Lakes Resort & Spa", resortName: "Westgate Lakes", price: 99, originalPrice: 449, durationNights: 3, durationDays: 4, city: "Orlando", state: "FL", brandName: "Westgate Resorts", brandSlug: "westgate", savingsPercent: 78, inclusions: ["Free Parking", "Waterpark Access", "2 Adults + 2 Kids"], slug: "westgate-orlando-3-night-99" },
  { id: 2, title: "Hilton Grand Vacations Orlando", resortName: "Hilton Grand Vacations", price: 149, originalPrice: 599, durationNights: 3, durationDays: 4, city: "Orlando", state: "FL", brandName: "Hilton Grand Vacations", brandSlug: "hgv", savingsPercent: 75, inclusions: ["50,000 Hilton Honors Points", "Resort Fee Included"], slug: "hgv-orlando-3-night-149" },
  { id: 3, title: "Cancun All-Inclusive 5-Night Getaway", resortName: "Grand Oasis Cancun", price: 399, originalPrice: 1499, durationNights: 5, durationDays: 6, city: "Cancun", state: "QR", brandName: "BookVIP", brandSlug: "bookvip", savingsPercent: 73, inclusions: ["All Meals & Drinks", "Airport Transfers", "Resort Credits"], slug: "bookvip-cancun-5-night-399" },
  { id: 4, title: "Westgate Smoky Mountain Resort", resortName: "Westgate Smoky Mountains", price: 99, originalPrice: 399, durationNights: 3, durationDays: 4, city: "Gatlinburg", state: "TN", brandName: "Westgate Resorts", brandSlug: "westgate", savingsPercent: 75, inclusions: ["Free Parking", "Wild Bear Falls Waterpark", "Fireplace Suite"], slug: "westgate-gatlinburg-3-night-99" },
  { id: 5, title: "Club Wyndham Las Vegas", resortName: "Club Wyndham Grand Desert", price: 99, originalPrice: 449, durationNights: 2, durationDays: 3, city: "Las Vegas", state: "NV", brandName: "Club Wyndham", brandSlug: "wyndham", savingsPercent: 78, inclusions: ["$200 Virtual Mastercard", "60,000 Wyndham Points"], slug: "wyndham-vegas-2-night-99" },
  { id: 6, title: "Marriott Vacation Club Myrtle Beach", resortName: "Marriott OceanWatch", price: 299, originalPrice: 899, durationNights: 3, durationDays: 4, city: "Myrtle Beach", state: "SC", brandName: "Marriott Vacation Club", brandSlug: "marriott", savingsPercent: 67, inclusions: ["20,000 Bonvoy Points", "Ocean View Room", "Daily Breakfast"], slug: "marriott-myrtle-beach-3-night-299" },
];

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getDealStats();
  const totalDeals = stats?.totalDeals || 0;
  const cheapest = stats?.cheapestPrice || 59;

  return {
    title: totalDeals > 0
      ? `All Vacation Deals — ${totalDeals} Resort Deals from $${cheapest}`
      : "All Vacation Deals",
    description: totalDeals > 0
      ? `Vacation deals from top resorts starting at $${cheapest}. Browse ${totalDeals} resort deals and hotel deals. Filter by destination, brand, price, and duration.`
      : "Vacation deals from top timeshare resorts. Browse resort deals, hotel deals, and getaway packages. Filter by destination, brand, price, and duration.",
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function DealsPage() {
  const dbResult = await getDeals({ page: 1, limit: 24 });
  const deals = dbResult && dbResult.deals.length > 0 ? dbResult.deals : mockDeals;
  const totalDeals = dbResult?.total ?? deals.length;
  const totalPages = Math.ceil(totalDeals / 24);

  // Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "All Vacation Deals",
    url: "https://vacationdeals.to/deals",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalDeals,
      itemListElement: deals.slice(0, 10).map((d, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Offer",
          name: d.title,
          price: d.price,
          priceCurrency: "USD",
          seller: { "@type": "Organization", name: d.brandName },
        },
      })),
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Vacation Deals", "item": "https://vacationdeals.to" },
            { "@type": "ListItem", "position": 2, "name": "All Vacation Deals", "item": "https://vacationdeals.to/deals" },
          ],
        }) }}
      />

      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">All Vacation Deals</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          All Vacation Deals
        </h1>
        <p className="text-gray-600">
          Browse and compare vacation deals from top timeshare resorts.
        </p>
      </div>

      {/* Filter Bar - wrapped in Suspense for useSearchParams */}
      <div className="mb-8">
        <Suspense
          fallback={
            <div className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
          }
        >
          <FilterBar />
        </Suspense>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {deals.length} of {totalDeals} deals
      </div>

      {/* Deal Grid */}
      <DealGrid deals={deals} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            1
          </span>
          {Array.from({ length: Math.min(totalPages - 1, 4) }, (_, i) => (
            <button
              key={i + 2}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              {i + 2}
            </button>
          ))}
          {totalPages > 5 && (
            <>
              <span className="px-2 text-gray-400">...</span>
              <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">
                {totalPages}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
