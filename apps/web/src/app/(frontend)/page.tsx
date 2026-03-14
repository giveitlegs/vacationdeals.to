import type { Metadata } from "next";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { DealGrid } from "@/components/DealGrid";
import type { Deal } from "@/components/DealCard";
import {
  getFeaturedDeals,
  getDealStats,
  getDestinationsWithCounts,
  getBrandsWithCounts,
} from "@/lib/queries";

export const revalidate = 3600; // Revalidate every hour

// ---------------------------------------------------------------------------
// Mock / fallback data
// ---------------------------------------------------------------------------

const mockDeals: Deal[] = [
  { id: 1, title: "Westgate Lakes Resort & Spa", resortName: "Westgate Lakes", price: 99, originalPrice: 449, durationNights: 3, durationDays: 4, city: "Orlando", state: "FL", brandName: "Westgate Resorts", brandSlug: "westgate", savingsPercent: 78, inclusions: ["Free Parking", "Waterpark Access", "2 Adults + 2 Kids"], slug: "westgate-orlando-3-night-99" },
  { id: 2, title: "Hilton Grand Vacations Orlando", resortName: "Hilton Grand Vacations", price: 149, originalPrice: 599, durationNights: 3, durationDays: 4, city: "Orlando", state: "FL", brandName: "Hilton Grand Vacations", brandSlug: "hgv", savingsPercent: 75, inclusions: ["50,000 Hilton Honors Points", "Resort Fee Included"], slug: "hgv-orlando-3-night-149" },
  { id: 3, title: "Cancun All-Inclusive 5-Night Getaway", resortName: "Grand Oasis Cancun", price: 399, originalPrice: 1499, durationNights: 5, durationDays: 6, city: "Cancun", state: "QR", brandName: "BookVIP", brandSlug: "bookvip", savingsPercent: 73, inclusions: ["All Meals & Drinks", "Airport Transfers", "Resort Credits"], slug: "bookvip-cancun-5-night-399" },
  { id: 4, title: "Westgate Smoky Mountain Resort", resortName: "Westgate Smoky Mountains", price: 99, originalPrice: 399, durationNights: 3, durationDays: 4, city: "Gatlinburg", state: "TN", brandName: "Westgate Resorts", brandSlug: "westgate", savingsPercent: 75, inclusions: ["Free Parking", "Wild Bear Falls Waterpark", "Fireplace Suite"], slug: "westgate-gatlinburg-3-night-99" },
  { id: 5, title: "Club Wyndham Las Vegas", resortName: "Club Wyndham Grand Desert", price: 99, originalPrice: 449, durationNights: 2, durationDays: 3, city: "Las Vegas", state: "NV", brandName: "Club Wyndham", brandSlug: "wyndham", savingsPercent: 78, inclusions: ["$200 Virtual Mastercard", "60,000 Wyndham Points"], slug: "wyndham-vegas-2-night-99" },
  { id: 6, title: "Marriott Vacation Club Myrtle Beach", resortName: "Marriott OceanWatch", price: 299, originalPrice: 899, durationNights: 3, durationDays: 4, city: "Myrtle Beach", state: "SC", brandName: "Marriott Vacation Club", brandSlug: "marriott", savingsPercent: 67, inclusions: ["20,000 Bonvoy Points", "Ocean View Room", "Daily Breakfast"], slug: "marriott-myrtle-beach-3-night-299" },
];

const fallbackDestinations = [
  { name: "Orlando", state: "FL", deals: 47, gradient: "from-blue-400 to-cyan-300" },
  { name: "Las Vegas", state: "NV", deals: 32, gradient: "from-amber-400 to-orange-500" },
  { name: "Cancun", state: "MX", deals: 28, gradient: "from-teal-400 to-emerald-300" },
  { name: "Gatlinburg", state: "TN", deals: 19, gradient: "from-green-500 to-emerald-600" },
  { name: "Myrtle Beach", state: "SC", deals: 24, gradient: "from-sky-400 to-blue-500" },
];

const fallbackBrands = [
  { name: "Westgate Resorts", slug: "westgate", type: "direct", deals: 52 },
  { name: "Hilton Grand Vacations", slug: "hgv", type: "direct", deals: 38 },
  { name: "Marriott Vacation Club", slug: "marriott", type: "direct", deals: 41 },
  { name: "Club Wyndham", slug: "wyndham", type: "direct", deals: 35 },
  { name: "BookVIP", slug: "bookvip", type: "broker", deals: 67 },
  { name: "Holiday Inn Club", slug: "holiday-inn", type: "direct", deals: 22 },
  { name: "Bluegreen Vacations", slug: "bluegreen", type: "direct", deals: 18 },
  { name: "Hyatt Vacation Club", slug: "hyatt", type: "direct", deals: 15 },
  { name: "Monster Reservations", slug: "mrg", type: "broker", deals: 43 },
  { name: "Westgate Events", slug: "westgate-events", type: "direct", deals: 29 },
];

const destinationGradients: Record<string, string> = {
  Orlando: "from-blue-400 to-cyan-300",
  "Las Vegas": "from-amber-400 to-orange-500",
  Cancun: "from-teal-400 to-emerald-300",
  Gatlinburg: "from-green-500 to-emerald-600",
  "Myrtle Beach": "from-sky-400 to-blue-500",
  Branson: "from-rose-400 to-pink-500",
  Williamsburg: "from-violet-400 to-purple-500",
  "San Antonio": "from-orange-400 to-red-500",
  Miami: "from-cyan-400 to-blue-500",
  Nashville: "from-yellow-400 to-amber-500",
};

function getGradient(name: string): string {
  return destinationGradients[name] ?? "from-indigo-400 to-purple-500";
}

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getDealStats();
  const cheapest = stats?.cheapestPrice || 59;
  const totalDeals = stats?.totalDeals || 500;
  const brandCount = stats?.brandCount || 13;
  const destinationCount = stats?.destinationCount || 20;

  return {
    title: `VacationDeals.to — ${totalDeals}+ Vacation Packages from $${cheapest}`,
    description: `Compare ${totalDeals}+ vacation package deals from ${brandCount} brands. Packages starting at $${cheapest} for top resorts in ${destinationCount}+ destinations.`,
    openGraph: {
      title: `VacationDeals.to — ${totalDeals}+ Vacation Packages from $${cheapest}`,
      description: `Compare ${totalDeals}+ vacation package deals from ${brandCount} brands. Packages starting at $${cheapest}.`,
      type: "website",
      url: "https://vacationdeals.to",
    },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function HomePage() {
  const [featuredDeals, stats, destinationsData, brandsData] = await Promise.all(
    [getFeaturedDeals(6), getDealStats(), getDestinationsWithCounts(), getBrandsWithCounts()],
  );

  // Use DB data if available, otherwise fall back to mock data
  const dealsToShow = featuredDeals?.length ? featuredDeals : mockDeals;

  const popularDestinations =
    destinationsData && destinationsData.length > 0
      ? destinationsData.slice(0, 5).map((d) => ({
          name: d.name,
          state: d.state ?? "",
          deals: d.deals,
          gradient: getGradient(d.name),
        }))
      : fallbackDestinations;

  const popularBrands =
    brandsData && brandsData.length > 0
      ? brandsData.slice(0, 10).map((b) => ({
          name: b.name,
          slug: b.slug,
          type: b.type,
          deals: b.deals,
        }))
      : fallbackBrands;

  const totalDeals = stats?.totalDeals || 500;
  const destinationCount = stats?.destinationCount || 20;
  const brandCount = stats?.brandCount || 13;
  const cheapest = stats?.cheapestPrice || 59;

  // Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "VacationDeals.to",
    url: "https://vacationdeals.to",
    description: `Compare ${totalDeals}+ vacation package deals from ${brandCount} brands starting at $${cheapest}.`,
    potentialAction: {
      "@type": "SearchAction",
      target: "https://vacationdeals.to/deals?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="mb-16 pt-8 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          The Best Vacation Package Deals
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
          Compare deals from top timeshare resorts — all in one place. Packages
          starting at ${cheapest} for 3-night stays at premium resorts.
        </p>

        <SearchBar />

        {/* Stats */}
        <div className="mt-10 flex items-center justify-center gap-8 sm:gap-12">
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalDeals}+</p>
            <p className="text-sm text-gray-500">Active Deals</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{destinationCount}+</p>
            <p className="text-sm text-gray-500">Destinations</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{brandCount}</p>
            <p className="text-sm text-gray-500">Brands</p>
          </div>
        </div>
      </section>

      {/* Featured Deals */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Featured Deals</h2>
          <Link
            href="/deals"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all deals &rarr;
          </Link>
        </div>
        <DealGrid deals={dealsToShow} />
      </section>

      {/* Popular Destinations */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Popular Destinations
          </h2>
          <Link
            href="/destinations"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            All destinations &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {popularDestinations.map((dest) => (
            <Link
              key={dest.name}
              href={`/${dest.name.toLowerCase().replace(/\s+/g, "-")}`}
              className="destination-card group overflow-hidden rounded-xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={`flex h-32 flex-col items-center justify-center bg-gradient-to-br ${dest.gradient} p-4 text-center`}
              >
                <span className="text-lg font-bold text-white drop-shadow-sm">
                  {dest.name}
                </span>
                <span className="text-sm font-medium text-white/80">
                  {dest.state}
                </span>
                <span className="mt-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                  {dest.deals} deals
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Browse by Brand */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Browse by Brand</h2>
          <Link
            href="/brands"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            All brands &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {popularBrands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/${brand.slug}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              <span className="text-sm font-semibold text-gray-900">
                {brand.name}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    brand.type === "direct"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {brand.type === "direct" ? "Direct" : "Broker"}
                </span>
                <span className="text-xs text-gray-400">
                  {brand.deals} deals
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16 rounded-2xl bg-gray-50 px-6 py-12 sm:px-12">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
          How Vacation Packages Work
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              1
            </div>
            <h3 className="mb-2 text-base font-semibold text-gray-900">
              Browse Deals
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              Compare vacation packages from top timeshare brands. Filter by
              destination, price, and duration to find your perfect getaway.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              2
            </div>
            <h3 className="mb-2 text-base font-semibold text-gray-900">
              Book Your Package
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              Book directly through the resort or broker. Packages include
              resort stays at deeply discounted rates — often 70-80% off retail.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              3
            </div>
            <h3 className="mb-2 text-base font-semibold text-gray-900">
              Attend a Presentation
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              In exchange for the discounted rate, you attend a 90-120 minute
              timeshare presentation during your stay. No purchase required.
            </p>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          Find the Best Vacation Package Deals
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-gray-600">
          <p>
            VacationDeals.to is the most comprehensive comparison site for
            timeshare vacation packages. We aggregate deals from over {brandCount} major
            brands including Westgate Resorts, Hilton Grand Vacations, Marriott
            Vacation Club, Club Wyndham, and more.
          </p>
          <p>
            These vacation packages — sometimes called &quot;vacpacks&quot; or
            &quot;preview packages&quot; — offer incredible value. Stay at
            premium resorts in destinations like Orlando, Las Vegas, Cancun,
            Gatlinburg, and Myrtle Beach for a fraction of the retail price. In
            exchange, you simply attend a timeshare sales presentation during
            your stay.
          </p>
          <p>
            Our team tracks and updates deals daily so you always see the latest
            prices and availability. Use our filters to find packages by
            destination, brand, price range, or trip duration. Whether you are
            looking for a budget-friendly weekend getaway or an all-inclusive
            resort experience, we have deals starting from just ${cheapest}.
          </p>
        </div>
      </section>
    </div>
  );
}
