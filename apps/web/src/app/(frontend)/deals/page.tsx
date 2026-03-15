import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { DealGrid } from "@/components/DealGrid";
import type { Deal } from "@/components/DealCard";
import { getDeals, getDealStats } from "@/lib/queries";
import { FAQAccordion } from "@/components/FAQAccordion";
import { FAQSchema } from "@/components/FAQSchema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const mockDeals: Deal[] = [
  { id: 1, title: "Westgate Lakes Resort & Spa", resortName: "Westgate Lakes", price: 99, originalPrice: 449, durationNights: 3, durationDays: 4, city: "Orlando", state: "FL", brandName: "Westgate Resorts", brandSlug: "westgate", savingsPercent: 78, inclusions: ["Free Parking", "Waterpark Access", "2 Adults + 2 Kids"], slug: "westgate-orlando-3-night-99" },
  { id: 2, title: "Hilton Grand Vacations Orlando", resortName: "Hilton Grand Vacations", price: 149, originalPrice: 599, durationNights: 3, durationDays: 4, city: "Orlando", state: "FL", brandName: "Hilton Grand Vacations", brandSlug: "hgv", savingsPercent: 75, inclusions: ["50,000 Hilton Honors Points", "Resort Fee Included"], slug: "hgv-orlando-3-night-149" },
  { id: 3, title: "Cancun All-Inclusive 5-Night Getaway", resortName: "Grand Oasis Cancun", price: 399, originalPrice: 1499, durationNights: 5, durationDays: 6, city: "Cancun", state: "QR", brandName: "BookVIP", brandSlug: "bookvip", savingsPercent: 73, inclusions: ["All Meals & Drinks", "Airport Transfers", "Resort Credits"], slug: "westgate-orlando-3-night-99" },
  { id: 4, title: "Westgate Smoky Mountain Resort", resortName: "Westgate Smoky Mountains", price: 99, originalPrice: 399, durationNights: 3, durationDays: 4, city: "Gatlinburg", state: "TN", brandName: "Westgate Resorts", brandSlug: "westgate", savingsPercent: 75, inclusions: ["Free Parking", "Wild Bear Falls Waterpark", "Fireplace Suite"], slug: "westgate-gatlinburg-3-night-99" },
  { id: 5, title: "Club Wyndham Las Vegas", resortName: "Club Wyndham Grand Desert", price: 99, originalPrice: 449, durationNights: 2, durationDays: 3, city: "Las Vegas", state: "NV", brandName: "Club Wyndham", brandSlug: "wyndham", savingsPercent: 78, inclusions: ["$200 Virtual Mastercard", "60,000 Wyndham Points"], slug: "westgate-las-vegas-3-night-99" },
  { id: 6, title: "Marriott Vacation Club Myrtle Beach", resortName: "Marriott OceanWatch", price: 299, originalPrice: 899, durationNights: 3, durationDays: 4, city: "Myrtle Beach", state: "SC", brandName: "Marriott Vacation Club", brandSlug: "marriott", savingsPercent: 67, inclusions: ["20,000 Bonvoy Points", "Ocean View Room", "Daily Breakfast"], slug: "westgate-gatlinburg-3-night-99" },
];

const dealsFaqs = [
  {
    question: "What is a vacation deal (vacpack)?",
    answer: "A vacation deal, also called a vacpack or preview package, is a deeply discounted resort stay offered by timeshare companies. In exchange for the reduced rate (often 60-80% below retail), guests agree to attend a timeshare sales presentation during their stay. There is no obligation to purchase anything.",
  },
  {
    question: "How much do vacation deals typically cost?",
    answer: "Vacation deals typically range from $59 to $499 depending on the destination, resort quality, and length of stay. Most 3-night resort packages fall in the $99-$199 range. All-inclusive international packages (like Cancun or Punta Cana) may range from $299-$499 for 5-night stays.",
  },
  {
    question: "Are vacation deals legitimate?",
    answer: "Yes, vacation deals are a legitimate marketing strategy used by major resort and timeshare companies like Westgate Resorts, Hilton Grand Vacations, Marriott Vacation Club, and Club Wyndham. They offer discounted stays to introduce potential buyers to their properties. These are real resort stays at real properties.",
  },
  {
    question: "What is a timeshare presentation and how long does it last?",
    answer: "A timeshare presentation is a sales pitch where the resort showcases its vacation ownership program. Presentations typically last 90-120 minutes, though some may run longer. You are shown the resort amenities and given a sales offer, but you are under no obligation to purchase. You keep all package perks regardless of your decision.",
  },
  {
    question: "What are the eligibility requirements for vacation deals?",
    answer: "Requirements vary by provider but commonly include: minimum age of 25-30, minimum household income of $50,000-$75,000 per year, being married or cohabiting with a partner (who must attend), valid government-issued ID, and a major credit card. Some packages have additional requirements. Always check the specific deal's terms before booking.",
  },
  {
    question: "How do I compare vacation deals effectively?",
    answer: "Compare deals by looking at the total package price (not per-night), what's included (resort credits, meals, tickets, loyalty points), the resort quality and location, trip duration, and any eligibility requirements. Use filters on VacationDeals.to to narrow by destination, brand, price range, or number of nights.",
  },
  {
    question: "What happens if I don't attend the timeshare presentation?",
    answer: "If you skip the required timeshare presentation, you may be charged the full retail rate for your stay instead of the discounted promotional rate. Some providers may also charge a penalty fee. It is important to attend the presentation as agreed to keep your discounted package pricing.",
  },
  {
    question: "Can I book a vacation deal for someone else?",
    answer: "Generally, no. The person who books the package must be one of the guests who stays at the resort and attends the presentation. The booking name must match the guest's ID. Some providers allow you to transfer a package, but this varies and often involves a transfer fee.",
  },
  {
    question: "What is the difference between a direct resort deal and a broker deal?",
    answer: "Direct resort deals come straight from the timeshare company (like Westgate or Hilton Grand Vacations) and are for their specific properties. Broker deals come from third-party companies (like BookVIP or Monster Reservations Group) that have partnerships with multiple resorts, often offering more destination variety and sometimes lower prices.",
  },
  {
    question: "When is the best time to book a vacation deal?",
    answer: "Vacation deals are available year-round, but you can often find the best prices during off-peak seasons — for example, September-November for Orlando, or midweek stays at any destination. Holidays and summer months tend to have higher prices or limited availability. Booking 2-4 weeks in advance typically gives the best selection.",
  },
];

// ---------------------------------------------------------------------------
// Parse filter params
// ---------------------------------------------------------------------------

function parseFilters(searchParams: Record<string, string | string[] | undefined>) {
  const get = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" ? v : undefined;
  };

  const destination = get("destination");
  const brand = get("brand");
  const priceStr = get("price");
  const durationStr = get("duration");
  const sortBy = get("sort") || "price-asc";
  const pageStr = get("page");

  let minPrice: number | undefined;
  let maxPrice: number | undefined;
  if (priceStr) {
    const [lo, hi] = priceStr.split("-").map(Number);
    if (!isNaN(lo)) minPrice = lo;
    if (!isNaN(hi)) maxPrice = hi;
  }

  const durationNights = durationStr ? parseInt(durationStr) : undefined;
  const page = pageStr ? Math.max(1, parseInt(pageStr)) : 1;

  return {
    destinationSlug: destination?.toLowerCase().replace(/\s+/g, "-"),
    brandSlug: brand?.toLowerCase().replace(/\s+/g, "-"),
    minPrice,
    maxPrice,
    durationNights: isNaN(durationNights as number) ? undefined : durationNights,
    sortBy,
    page,
    limit: 24,
  };
}

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
    alternates: { canonical: "https://vacationdeals.to/deals" },
    description: totalDeals > 0
      ? `Vacation deals from top resorts starting at $${cheapest}. Browse ${totalDeals} resort deals and hotel deals. Filter by destination, brand, price, and duration.`
      : "Vacation deals from top timeshare resorts. Browse resort deals, hotel deals, and getaway packages. Filter by destination, brand, price, and duration.",
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

interface DealsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const hasFilters = !!(filters.destinationSlug || filters.brandSlug || filters.minPrice || filters.maxPrice || filters.durationNights);

  const dbResult = await getDeals(filters);

  let deals: Deal[];
  let totalDeals: number;

  if (dbResult && dbResult.deals.length > 0) {
    deals = dbResult.deals;
    totalDeals = dbResult.total;
  } else if (hasFilters) {
    // If filters are active but no DB results, filter mock data client-side
    let filtered = [...mockDeals];
    if (filters.minPrice !== undefined) filtered = filtered.filter(d => d.price >= filters.minPrice!);
    if (filters.maxPrice !== undefined) filtered = filtered.filter(d => d.price <= filters.maxPrice!);
    if (filters.durationNights !== undefined) filtered = filtered.filter(d => d.durationNights === filters.durationNights);
    deals = filtered;
    totalDeals = filtered.length;
  } else {
    deals = mockDeals;
    totalDeals = mockDeals.length;
  }

  const totalPages = Math.ceil(totalDeals / 24);

  // Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "All Vacation Deals",
    url: "https://vacationdeals.to/deals",
    dateModified: new Date().toISOString(),
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
        {hasFilters
          ? `Found ${totalDeals} deal${totalDeals !== 1 ? "s" : ""} matching your filters`
          : `Showing ${deals.length} of ${totalDeals} deals`}
      </div>

      {/* Deal Grid */}
      <DealGrid deals={deals} />

      {/* No results */}
      {deals.length === 0 && hasFilters && (
        <div className="py-16 text-center">
          <p className="text-lg font-medium text-gray-900">No deals match your filters</p>
          <p className="mt-2 text-sm text-gray-500">Try adjusting your filters or browse all deals.</p>
          <Link
            href="/deals"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Clear All Filters
          </Link>
        </div>
      )}

      {/* FAQs */}
      <FAQSchema faqs={dealsFaqs} />
      <section className="mt-16">
        <FAQAccordion faqs={dealsFaqs} />
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNum = i + 1;
            const isActive = pageNum === filters.page;
            // Build URL preserving existing filters
            const url = new URLSearchParams();
            if (params.destination) url.set("destination", String(params.destination));
            if (params.brand) url.set("brand", String(params.brand));
            if (params.price) url.set("price", String(params.price));
            if (params.duration) url.set("duration", String(params.duration));
            if (params.sort) url.set("sort", String(params.sort));
            if (pageNum > 1) url.set("page", String(pageNum));
            const href = `/deals${url.toString() ? `?${url.toString()}` : ""}`;

            return (
              <Link
                key={pageNum}
                href={href}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </Link>
            );
          })}
          {totalPages > 5 && (
            <>
              <span className="px-2 text-gray-400">...</span>
              <Link
                href={`/deals?page=${totalPages}`}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                {totalPages}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
