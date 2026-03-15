import type { Metadata } from "next";
import Link from "next/link";
import { getBrandsWithCounts, getDealStats } from "@/lib/queries";

export const revalidate = 3600; // Revalidate every hour

const fallbackBrands = [
  { name: "Westgate Resorts", slug: "westgate", type: "direct" as const, deals: 52, description: "One of the largest timeshare companies in the US with resorts across Florida, Tennessee, and more." },
  { name: "Hilton Grand Vacations", slug: "hgv", type: "direct" as const, deals: 38, description: "Premium vacation ownership by Hilton with properties in Orlando, Las Vegas, Hawaii, and beyond." },
  { name: "Marriott Vacation Club", slug: "marriott", type: "direct" as const, deals: 41, description: "Luxury vacation ownership by Marriott International with world-class resorts." },
  { name: "Club Wyndham", slug: "wyndham", type: "direct" as const, deals: 35, description: "Flexible vacation ownership with access to resorts nationwide through Wyndham Destinations." },
  { name: "BookVIP", slug: "bookvip", type: "broker" as const, deals: 67, description: "Leading vacation package broker offering deals across multiple resort brands and destinations." },
  { name: "Holiday Inn Club Vacations", slug: "holiday-inn", type: "direct" as const, deals: 22, description: "Family-friendly vacation ownership by IHG with resorts in popular destinations." },
  { name: "Bluegreen Vacations", slug: "bluegreen", type: "direct" as const, deals: 18, description: "Flexible points-based vacation ownership with resorts in unique locations." },
  { name: "Hyatt Vacation Ownership", slug: "hyatt", type: "direct" as const, deals: 15, description: "Premium vacation ownership by Hyatt Hotels with select high-end resort properties." },
  { name: "Capital Vacations", slug: "capital-vacations", type: "direct" as const, deals: 14, description: "Growing vacation ownership company managing resorts across the eastern United States." },
  { name: "Monster Reservations Group", slug: "mrg", type: "broker" as const, deals: 43, description: "Major vacation package broker with 50+ destinations across US, Caribbean, and Mexico. Known for deeply discounted hotel stays." },
  { name: "Westgate Events", slug: "westgate-events", type: "direct" as const, deals: 29, description: "Part of Westgate Resorts ecosystem offering concert, sports, and entertainment vacation packages in Las Vegas, Orlando, and more." },
  { name: "StayPromo", slug: "staypromo", type: "broker" as const, deals: 15, description: "Florida-licensed vacation deal broker with resort deals across 10+ US and international destinations." },
  { name: "Vacation Village Resorts", slug: "vacation-village", type: "direct" as const, deals: 12, description: "Direct resort brand offering vacation deals from $49 in Orlando, Las Vegas, South Florida, and Williamsburg." },
  { name: "Spinnaker Resorts", slug: "spinnaker", type: "direct" as const, deals: 10, description: "Hilton Head, Branson, Williamsburg, and Ormond Beach resort deals starting at $269 with entertainment credits." },
];

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getDealStats();
  const brandCount = stats?.brandCount || 13;
  const totalDeals = stats?.totalDeals || 0;

  return {
    title: totalDeals > 0
      ? `Vacation Deal Brands — ${brandCount} Brands, ${totalDeals} Deals`
      : "Vacation Deal Brands",
    alternates: { canonical: "https://vacationdeals.to/brands" },
    description: totalDeals > 0
      ? `Vacation deals from ${brandCount} brands with ${totalDeals} active resort deals. Browse deals from Westgate, Hilton Grand Vacations, Marriott, Wyndham, and more.`
      : "Vacation deals by brand. Browse resort deals from Westgate, Hilton Grand Vacations, Marriott, Wyndham, and more.",
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function BrandsPage() {
  const dbBrands = await getBrandsWithCounts();

  const brands =
    dbBrands && dbBrands.length > 0
      ? dbBrands.map((b) => ({
          name: b.name,
          slug: b.slug,
          type: b.type as "direct" | "broker",
          deals: b.deals,
          description: b.description ?? "",
        }))
      : fallbackBrands;

  // Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Vacation Deal Brands",
    url: "https://vacationdeals.to/brands",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: brands.length,
      itemListElement: brands.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Organization",
          name: b.name,
          description: b.description,
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
            { "@type": "ListItem", "position": 2, "name": "Vacation Deal Brands", "item": "https://vacationdeals.to/brands" },
          ],
        }) }}
      />

      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Vacation Deal Brands</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Vacation Deal Brands
        </h1>
        <p className="text-gray-600">
          Browse vacation deals by brand. Direct brands sell their own resort
          deals, while brokers aggregate deals from multiple resorts.
        </p>
      </div>

      {/* Legend */}
      <div className="mb-6 flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Direct
          </span>
          <span>Sells own deals</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
            Broker
          </span>
          <span>Aggregates from multiple brands</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={`/${brand.slug}`}
            className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between">
              <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">
                {brand.name}
              </h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  brand.type === "direct"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {brand.type === "direct" ? "Direct" : "Broker"}
              </span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-gray-500">
              {brand.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-600">
                {brand.deals} deal{brand.deals !== 1 ? "s" : ""} available
              </span>
              <span className="text-sm font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                View deals &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
