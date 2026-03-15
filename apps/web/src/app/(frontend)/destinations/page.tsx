import type { Metadata } from "next";
import Link from "next/link";
import { getDestinationsWithCounts, getDealStats } from "@/lib/queries";
import { getCityIcon } from "@/lib/city-icons";

export const revalidate = 3600; // Revalidate every hour

const fallbackDestinations = [
  { name: "Orlando", state: "FL", deals: 47, gradient: "from-blue-400 to-cyan-300" },
  { name: "Las Vegas", state: "NV", deals: 32, gradient: "from-amber-400 to-orange-500" },
  { name: "Cancun", state: "MX", deals: 28, gradient: "from-teal-400 to-emerald-300" },
  { name: "Gatlinburg", state: "TN", deals: 19, gradient: "from-green-500 to-emerald-600" },
  { name: "Myrtle Beach", state: "SC", deals: 24, gradient: "from-sky-400 to-blue-500" },
  { name: "Branson", state: "MO", deals: 15, gradient: "from-rose-400 to-pink-500" },
  { name: "Williamsburg", state: "VA", deals: 12, gradient: "from-violet-400 to-purple-500" },
  { name: "San Antonio", state: "TX", deals: 11, gradient: "from-orange-400 to-red-500" },
  { name: "Miami", state: "FL", deals: 18, gradient: "from-cyan-400 to-blue-500" },
  { name: "Nashville", state: "TN", deals: 9, gradient: "from-yellow-400 to-amber-500" },
  { name: "Sedona", state: "AZ", deals: 7, gradient: "from-red-400 to-orange-600" },
  { name: "Cabo San Lucas", state: "MX", deals: 14, gradient: "from-emerald-400 to-teal-500", slug: "cabo" },
  { name: "Park City", state: "UT", deals: 6, gradient: "from-slate-400 to-blue-600" },
  { name: "Hilton Head", state: "SC", deals: 10, gradient: "from-lime-400 to-green-500" },
  { name: "Daytona Beach", state: "FL", deals: 8, gradient: "from-indigo-400 to-blue-500" },
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
  Sedona: "from-red-400 to-orange-600",
  "Cabo San Lucas": "from-emerald-400 to-teal-500",
  "Park City": "from-slate-400 to-blue-600",
  "Hilton Head": "from-lime-400 to-green-500",
  "Daytona Beach": "from-indigo-400 to-blue-500",
};

function getGradient(name: string): string {
  return destinationGradients[name] ?? "from-indigo-400 to-purple-500";
}

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getDealStats();
  const destCount = stats?.destinationCount || 50;
  const totalDeals = stats?.totalDeals || 0;

  return {
    title: totalDeals > 0
      ? `Vacation Deals by Destination — ${destCount}+ Cities with Deals`
      : "Vacation Deals by Destination",
    alternates: { canonical: "https://vacationdeals.to/destinations" },
    description: totalDeals > 0
      ? `Vacation deals in ${destCount}+ destinations. ${totalDeals} resort deals across Orlando, Las Vegas, Cancun, Gatlinburg, and more.`
      : "Vacation deals by destination. Browse resort deals and getaway deals in Orlando, Las Vegas, Cancun, Gatlinburg, and 50+ more cities.",
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function DestinationsPage() {
  const dbDestinations = await getDestinationsWithCounts();

  const destinations =
    dbDestinations && dbDestinations.length > 0
      ? dbDestinations.map((d) => ({
          name: d.name,
          slug: d.slug,
          state: d.state ?? "",
          deals: d.deals,
          gradient: getGradient(d.name),
        }))
      : fallbackDestinations;

  // Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Vacation Destinations",
    url: "https://vacationdeals.to/destinations",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: destinations.length,
      itemListElement: destinations.map((d, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "TouristDestination",
          name: `${d.name}, ${d.state}`,
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
            { "@type": "ListItem", "position": 2, "name": "Vacation Destinations", "item": "https://vacationdeals.to/destinations" },
          ],
        }) }}
      />

      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Vacation Destinations</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Vacation Destinations
        </h1>
        <p className="text-gray-600">
          Browse vacation deals by destination. Find the best resort deals and
          travel deals for your favorite getaway spots.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((dest) => {
          const DestIcon = getCityIcon(dest.name);
          return (
            <Link
              key={dest.name}
              href={`/${"slug" in dest && dest.slug ? dest.slug : dest.name.toLowerCase().replace(/\s+/g, "-")}`}
              className="destination-card group overflow-hidden rounded-xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              aria-label={`Browse ${dest.deals} vacation deals in ${dest.name}, ${dest.state}`}
            >
              <div
                className={`relative flex h-40 flex-col items-center justify-center bg-gradient-to-br ${dest.gradient} p-6`}
                role="img"
                aria-label={`${dest.name}, ${dest.state} vacation destination`}
              >
                {/* Decorative city icon */}
                <div className="absolute bottom-2 right-2 h-20 w-20 opacity-[0.18]" aria-hidden="true">
                  <DestIcon className="h-full w-full" />
                </div>

                <span className="text-2xl font-bold text-white drop-shadow-sm">
                  {dest.name}
                </span>
                <span className="mb-2 text-sm font-medium text-white/80">
                  {dest.state}
                </span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {dest.deals} deals available
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
