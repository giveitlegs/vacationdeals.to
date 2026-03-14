import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DealGrid } from "@/components/DealGrid";
import type { Deal } from "@/components/DealCard";

// ---------------------------------------------------------------------------
// Static slug data — will eventually come from the database
// ---------------------------------------------------------------------------

const destinations = [
  { slug: "orlando", name: "Orlando", state: "FL", description: "Theme park capital with world-class resorts, Walt Disney World, Universal Studios, and year-round sunshine." },
  { slug: "las-vegas", name: "Las Vegas", state: "NV", description: "Entertainment capital of the world with luxury resorts, shows, dining, and nightlife on the famous Strip." },
  { slug: "cancun", name: "Cancun", state: "MX", description: "Caribbean paradise with stunning beaches, all-inclusive resorts, ancient Mayan ruins, and vibrant nightlife." },
  { slug: "gatlinburg", name: "Gatlinburg", state: "TN", description: "Gateway to the Great Smoky Mountains with charming downtown, ski resorts, and family-friendly attractions." },
  { slug: "myrtle-beach", name: "Myrtle Beach", state: "SC", description: "60 miles of sandy beaches, oceanfront resorts, golf courses, and family entertainment along the Grand Strand." },
  { slug: "branson", name: "Branson", state: "MO", description: "Live entertainment capital with over 100 shows, theme parks, and beautiful Ozark Mountain scenery." },
  { slug: "williamsburg", name: "Williamsburg", state: "VA", description: "Historic colonial city with Busch Gardens, Water Country USA, and living history museums." },
  { slug: "cocoa-beach", name: "Cocoa Beach", state: "FL", description: "Florida's Space Coast with Kennedy Space Center, beautiful beaches, and relaxed coastal vibes." },
  { slug: "hilton-head", name: "Hilton Head", state: "SC", description: "Upscale island resort destination with pristine beaches, world-class golf, and Lowcountry charm." },
  { slug: "park-city", name: "Park City", state: "UT", description: "Premier ski destination with two world-class ski areas, historic Main Street, and Sundance Film Festival." },
  { slug: "daytona-beach", name: "Daytona Beach", state: "FL", description: "Famous for motorsports, wide sandy beaches, boardwalk attractions, and year-round events." },
  { slug: "cabo", name: "Cabo San Lucas", state: "MX", description: "Mexican resort city at the tip of Baja California with stunning coastline, luxury resorts, and vibrant nightlife." },
  { slug: "puerto-vallarta", name: "Puerto Vallarta", state: "MX", description: "Charming Mexican beach town with cobblestone streets, all-inclusive resorts, and Pacific Ocean views." },
  { slug: "punta-cana", name: "Punta Cana", state: "DR", description: "Dominican Republic's top resort area with white-sand beaches, all-inclusive resorts, and turquoise waters." },
  { slug: "key-west", name: "Key West", state: "FL", description: "Southernmost point of the US with island vibes, historic architecture, water sports, and legendary sunsets." },
  { slug: "sedona", name: "Sedona", state: "AZ", description: "Red rock canyon country with stunning desert scenery, spiritual retreats, hiking, and luxury spas." },
  { slug: "galveston", name: "Galveston", state: "TX", description: "Gulf Coast island with historic Victorian architecture, beaches, Moody Gardens, and Pleasure Pier." },
  { slug: "lake-tahoe", name: "Lake Tahoe", state: "CA", description: "Crystal-clear alpine lake with world-class skiing, summer water sports, and breathtaking mountain scenery." },
  { slug: "new-york-city", name: "New York City", state: "NY", description: "The city that never sleeps — Broadway, Central Park, iconic landmarks, and endless dining and shopping." },
  { slug: "san-diego", name: "San Diego", state: "CA", description: "Perfect weather, beautiful beaches, the San Diego Zoo, and a vibrant craft beer and dining scene." },
];

const brands = [
  { slug: "westgate", name: "Westgate Resorts", type: "direct", description: "One of the largest privately held timeshare companies in the US with resorts in top vacation destinations." },
  { slug: "hgv", name: "Hilton Grand Vacations", type: "direct", description: "Hilton's vacation ownership brand offering premium resort experiences with Hilton Honors integration." },
  { slug: "bluegreen", name: "Bluegreen Vacations", type: "direct", description: "Flexible vacation ownership with resorts in popular drive-to destinations across the US." },
  { slug: "wyndham", name: "Club Wyndham", type: "direct", description: "Part of Travel + Leisure Co., offering vacation ownership at 230+ resorts worldwide." },
  { slug: "holiday-inn", name: "Holiday Inn Club Vacations", type: "direct", description: "IHG's vacation ownership brand with family-friendly resorts in top US vacation destinations." },
  { slug: "hyatt", name: "Hyatt Vacation Ownership", type: "direct", description: "Hyatt's vacation club offering luxury resort experiences with World of Hyatt integration." },
  { slug: "marriott", name: "Marriott Vacation Club", type: "direct", description: "Premium vacation ownership by Marriott with resorts worldwide and Bonvoy points integration." },
  { slug: "capital-vacations", name: "Capital Vacations", type: "direct", description: "Growing vacation ownership company managing resorts across the eastern United States." },
  { slug: "bookvip", name: "BookVIP", type: "broker", description: "Leading vacation package broker specializing in all-inclusive resort deals in Mexico and the Caribbean." },
  { slug: "getawaydealz", name: "GetawayDealz", type: "broker", description: "Online vacation package broker offering discounted timeshare preview packages." },
  { slug: "vacationvip", name: "VacationVIP", type: "broker", description: "Vacation package broker connecting travelers with discounted resort stays nationwide." },
  { slug: "bestvacationdealz", name: "BestVacationDealz", type: "broker", description: "Discount vacation package provider with deals from major timeshare brands." },
  { slug: "mrg", name: "Monster Reservations Group", type: "broker", description: "Large vacation package broker partnering with multiple timeshare brands for discounted getaways." },
  { slug: "westgate-events", name: "Westgate Events", type: "direct", description: "Westgate's event-based marketing division offering vacation packages at special events and venues." },
];

const priceRanges = [
  { slug: "deals-under-100", label: "Deals Under $100", maxPrice: 100, description: "Incredible vacation packages for under $100. Stay at premium resorts for a fraction of the retail price." },
  { slug: "deals-under-200", label: "Deals Under $200", maxPrice: 200, description: "Affordable vacation packages under $200 with resort stays, perks, and extras included." },
  { slug: "deals-under-300", label: "Deals Under $300", maxPrice: 300, description: "Great value vacation packages under $300 at top-rated resorts nationwide." },
  { slug: "deals-under-500", label: "Deals Under $500", maxPrice: 500, description: "Premium resort packages under $500 including all-inclusive options and luxury stays." },
  { slug: "deals-100-to-200", label: "Deals $100–$200", minPrice: 100, maxPrice: 200, description: "Mid-range vacation packages between $100 and $200 at popular resort destinations." },
];

const durations = [
  { slug: "2-night-packages", label: "2-Night Packages", nights: 2, description: "Quick weekend getaway packages with 2-night stays at top resorts. Perfect for a short escape." },
  { slug: "3-night-packages", label: "3-Night Packages", nights: 3, description: "Our most popular package length — 3-night resort stays with amazing inclusions and perks." },
  { slug: "4-night-packages", label: "4-Night Packages", nights: 4, description: "Extended 4-night vacation packages for a more relaxed resort experience with extra time to explore." },
  { slug: "5-night-packages", label: "5-Night Packages", nights: 5, description: "5-night vacation packages for the ultimate getaway. More time to enjoy the resort and local attractions." },
];

// ---------------------------------------------------------------------------
// Mock deals — same data used across the site
// ---------------------------------------------------------------------------

const mockDeals: Deal[] = [
  { id: 1, title: "Westgate Lakes Resort & Spa", resortName: "Westgate Lakes", price: 99, originalPrice: 449, durationNights: 3, durationDays: 4, city: "Orlando", state: "FL", brandName: "Westgate Resorts", brandSlug: "westgate", savingsPercent: 78, inclusions: ["Free Parking", "Waterpark Access", "2 Adults + 2 Kids"], slug: "westgate-orlando-3-night-99" },
  { id: 2, title: "Hilton Grand Vacations Orlando", resortName: "Hilton Grand Vacations", price: 149, originalPrice: 599, durationNights: 3, durationDays: 4, city: "Orlando", state: "FL", brandName: "Hilton Grand Vacations", brandSlug: "hgv", savingsPercent: 75, inclusions: ["50,000 Hilton Honors Points", "Resort Fee Included"], slug: "hgv-orlando-3-night-149" },
  { id: 3, title: "Cancun All-Inclusive 5-Night Getaway", resortName: "Grand Oasis Cancun", price: 399, originalPrice: 1499, durationNights: 5, durationDays: 6, city: "Cancun", state: "QR", brandName: "BookVIP", brandSlug: "bookvip", savingsPercent: 73, inclusions: ["All Meals & Drinks", "Airport Transfers", "Resort Credits"], slug: "bookvip-cancun-5-night-399" },
  { id: 4, title: "Westgate Smoky Mountain Resort", resortName: "Westgate Smoky Mountains", price: 99, originalPrice: 399, durationNights: 3, durationDays: 4, city: "Gatlinburg", state: "TN", brandName: "Westgate Resorts", brandSlug: "westgate", savingsPercent: 75, inclusions: ["Free Parking", "Wild Bear Falls Waterpark", "Fireplace Suite"], slug: "westgate-gatlinburg-3-night-99" },
  { id: 5, title: "Club Wyndham Las Vegas", resortName: "Club Wyndham Grand Desert", price: 99, originalPrice: 449, durationNights: 2, durationDays: 3, city: "Las Vegas", state: "NV", brandName: "Club Wyndham", brandSlug: "wyndham", savingsPercent: 78, inclusions: ["$200 Virtual Mastercard", "60,000 Wyndham Points"], slug: "wyndham-vegas-2-night-99" },
  { id: 6, title: "Marriott Vacation Club Myrtle Beach", resortName: "Marriott OceanWatch", price: 299, originalPrice: 899, durationNights: 3, durationDays: 4, city: "Myrtle Beach", state: "SC", brandName: "Marriott Vacation Club", brandSlug: "marriott", savingsPercent: 67, inclusions: ["20,000 Bonvoy Points", "Ocean View Room", "Daily Breakfast"], slug: "marriott-myrtle-beach-3-night-299" },
];

// ---------------------------------------------------------------------------
// Slug resolution helpers
// ---------------------------------------------------------------------------

type SlugType =
  | { type: "destination"; data: (typeof destinations)[number] }
  | { type: "brand"; data: (typeof brands)[number] }
  | { type: "price"; data: (typeof priceRanges)[number] }
  | { type: "duration"; data: (typeof durations)[number] };

function resolveSlug(slug: string): SlugType | null {
  const dest = destinations.find((d) => d.slug === slug);
  if (dest) return { type: "destination", data: dest };

  const brand = brands.find((b) => b.slug === slug);
  if (brand) return { type: "brand", data: brand };

  const price = priceRanges.find((p) => p.slug === slug);
  if (price) return { type: "price", data: price };

  const dur = durations.find((d) => d.slug === slug);
  if (dur) return { type: "duration", data: dur };

  return null;
}

function filterDeals(resolved: SlugType): Deal[] {
  switch (resolved.type) {
    case "destination": {
      const cityName = resolved.data.name;
      return mockDeals.filter((d) => d.city === cityName);
    }
    case "brand":
      return mockDeals.filter((d) => d.brandSlug === resolved.data.slug);
    case "price": {
      const { maxPrice, minPrice } = resolved.data as { maxPrice: number; minPrice?: number };
      return mockDeals.filter((d) => {
        if (minPrice && d.price < minPrice) return false;
        return d.price <= maxPrice;
      });
    }
    case "duration":
      return mockDeals.filter((d) => d.durationNights === resolved.data.nights);
    default:
      return [];
  }
}

function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// generateStaticParams
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  const allSlugs = [
    ...destinations.map((d) => d.slug),
    ...brands.map((b) => b.slug),
    ...priceRanges.map((p) => p.slug),
    ...durations.map((d) => d.slug),
  ];
  return allSlugs.map((slug) => ({ slug }));
}

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------

interface SlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveSlug(slug);

  if (!resolved) {
    return { title: "Page Not Found" };
  }

  const baseUrl = "https://vacationdeals.to";

  switch (resolved.type) {
    case "destination": {
      const { name, state } = resolved.data;
      return {
        title: `${name}, ${state} Vacation Packages — Deals from $59 | VacationDeals.to`,
        description: `Find the best vacation package deals in ${name}, ${state}. Compare prices from top timeshare resorts. ${resolved.data.description}`,
        alternates: { canonical: `${baseUrl}/${slug}` },
        openGraph: {
          title: `${name} Vacation Package Deals`,
          description: `Compare vacation packages in ${name}, ${state}. Deals starting at $59 from top resorts.`,
          url: `${baseUrl}/${slug}`,
          type: "website",
        },
      };
    }
    case "brand": {
      const { name } = resolved.data;
      return {
        title: `${name} Vacation Packages — Compare Deals | VacationDeals.to`,
        description: `Browse all vacation package deals from ${name}. Compare prices, durations, and destinations. ${resolved.data.description}`,
        alternates: { canonical: `${baseUrl}/${slug}` },
        openGraph: {
          title: `${name} Vacation Packages`,
          description: `Compare all ${name} vacation packages. Find the best deals and save up to 80%.`,
          url: `${baseUrl}/${slug}`,
          type: "website",
        },
      };
    }
    case "price": {
      const { label } = resolved.data;
      return {
        title: `${label} — Cheap Vacation Packages | VacationDeals.to`,
        description: `${resolved.data.description} Compare packages from top timeshare resorts.`,
        alternates: { canonical: `${baseUrl}/${slug}` },
        openGraph: {
          title: label,
          description: resolved.data.description,
          url: `${baseUrl}/${slug}`,
          type: "website",
        },
      };
    }
    case "duration": {
      const { label } = resolved.data;
      return {
        title: `${label} — Resort Vacation Deals | VacationDeals.to`,
        description: `${resolved.data.description} Compare the best ${label.toLowerCase()} from top resort brands.`,
        alternates: { canonical: `${baseUrl}/${slug}` },
        openGraph: {
          title: label,
          description: resolved.data.description,
          url: `${baseUrl}/${slug}`,
          type: "website",
        },
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params;
  const resolved = resolveSlug(slug);

  if (!resolved) {
    notFound();
  }

  const deals = filterDeals(resolved);

  switch (resolved.type) {
    case "destination":
      return <DestinationPage data={resolved.data} deals={deals} />;
    case "brand":
      return <BrandPage data={resolved.data} deals={deals} />;
    case "price":
      return <PricePage data={resolved.data} deals={deals} />;
    case "duration":
      return <DurationPage data={resolved.data} deals={deals} />;
  }
}

// ---------------------------------------------------------------------------
// Sub-layouts for each slug type
// ---------------------------------------------------------------------------

function DestinationPage({
  data,
  deals,
}: {
  data: (typeof destinations)[number];
  deals: Deal[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: data.name,
    description: data.description,
    url: `https://vacationdeals.to/${data.slug}`,
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: data.state,
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 px-8 py-12 text-white">
        <h1 className="mb-2 text-3xl font-bold sm:text-4xl">
          Vacation Packages in {data.name}, {data.state}
        </h1>
        <p className="max-w-2xl text-lg text-white/90">{data.description}</p>
      </div>

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/destinations" className="hover:text-blue-600">
          Destinations
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{data.name}</span>
      </nav>

      {/* Results */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {deals.length} deal{deals.length !== 1 ? "s" : ""} in{" "}
        {data.name}
      </div>

      <DealGrid deals={deals} />

      {/* SEO content block */}
      <section className="mt-12 rounded-xl bg-gray-50 p-8">
        <h2 className="mb-3 text-xl font-bold text-gray-900">
          About {data.name} Vacation Packages
        </h2>
        <p className="text-sm leading-relaxed text-gray-600">
          {data.description} Browse and compare the best timeshare vacation
          packages available in {data.name}. These deals include resort stays at
          deeply discounted rates — often 70-80% off retail. Packages typically
          include a {data.name} resort stay with perks like free parking, resort
          credits, and loyalty points from top brands.
        </p>
      </section>
    </div>
  );
}

function BrandPage({
  data,
  deals,
}: {
  data: (typeof brands)[number];
  deals: Deal[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.name,
    description: data.description,
    url: `https://vacationdeals.to/${data.slug}`,
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 px-8 py-12 text-white">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-3xl font-bold sm:text-4xl">{data.name}</h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              data.type === "direct"
                ? "bg-white/20 text-white"
                : "bg-yellow-400/90 text-gray-900"
            }`}
          >
            {data.type === "direct" ? "Direct Resort" : "Broker"}
          </span>
        </div>
        <p className="max-w-2xl text-lg text-white/90">{data.description}</p>
      </div>

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/brands" className="hover:text-blue-600">
          Brands
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{data.name}</span>
      </nav>

      {/* Results */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {deals.length} deal{deals.length !== 1 ? "s" : ""} from{" "}
        {data.name}
      </div>

      <DealGrid deals={deals} />

      {/* SEO content block */}
      <section className="mt-12 rounded-xl bg-gray-50 p-8">
        <h2 className="mb-3 text-xl font-bold text-gray-900">
          About {data.name}
        </h2>
        <p className="text-sm leading-relaxed text-gray-600">
          {data.description} Compare all available {data.name} vacation packages
          on VacationDeals.to. We track pricing and availability daily so you
          always see the latest deals. {data.name} packages include resort stays
          at deeply discounted rates with perks and bonuses included.
        </p>
      </section>
    </div>
  );
}

function PricePage({
  data,
  deals,
}: {
  data: (typeof priceRanges)[number];
  deals: Deal[];
}) {
  return (
    <div>
      {/* Hero */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 px-8 py-12 text-white">
        <h1 className="mb-2 text-3xl font-bold sm:text-4xl">{data.label}</h1>
        <p className="max-w-2xl text-lg text-white/90">{data.description}</p>
      </div>

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/deals" className="hover:text-blue-600">
          Deals
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{data.label}</span>
      </nav>

      {/* Results */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {deals.length} deal{deals.length !== 1 ? "s" : ""} —{" "}
        {data.label}
      </div>

      <DealGrid deals={deals} />

      {/* SEO content block */}
      <section className="mt-12 rounded-xl bg-gray-50 p-8">
        <h2 className="mb-3 text-xl font-bold text-gray-900">{data.label}</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          {data.description} These vacation packages offer incredible value —
          stay at premium resorts for a fraction of the retail price. In exchange
          for the discounted rate, you attend a brief timeshare presentation
          during your stay. No purchase required.
        </p>
      </section>
    </div>
  );
}

function DurationPage({
  data,
  deals,
}: {
  data: (typeof durations)[number];
  deals: Deal[];
}) {
  return (
    <div>
      {/* Hero */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 px-8 py-12 text-white">
        <h1 className="mb-2 text-3xl font-bold sm:text-4xl">{data.label}</h1>
        <p className="max-w-2xl text-lg text-white/90">{data.description}</p>
      </div>

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/deals" className="hover:text-blue-600">
          Deals
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{data.label}</span>
      </nav>

      {/* Results */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {deals.length} deal{deals.length !== 1 ? "s" : ""} —{" "}
        {data.label}
      </div>

      <DealGrid deals={deals} />

      {/* SEO content block */}
      <section className="mt-12 rounded-xl bg-gray-50 p-8">
        <h2 className="mb-3 text-xl font-bold text-gray-900">{data.label}</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          {data.description} Browse {data.nights}-night resort packages from top
          timeshare brands including Westgate, Hilton Grand Vacations, Marriott,
          and more. Each package includes a {data.nights}-night stay at a premium
          resort with perks and bonuses.
        </p>
      </section>
    </div>
  );
}
