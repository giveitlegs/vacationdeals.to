import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DealGrid } from "@/components/DealGrid";
import type { Deal } from "@/components/DealCard";
import {
  getDeals,
  getBrandBySlug,
  getDestinationBySlug,
  getAllBrandSlugs,
  getAllDestinationSlugs,
} from "@/lib/queries";
import { SEOPreFooter } from "@/components/SEOPreFooter";
import { FAQAccordion } from "@/components/FAQAccordion";
import { FAQSchema } from "@/components/FAQSchema";
import { getFAQsForSlug } from "@/lib/faqs";
import { getBlogPostBySlug, getAllBlogPosts } from "@/lib/blog-types";
import type { BlogPost } from "@/lib/blog-types";
import { BlogPostRenderer } from "@/components/BlogPost";

export const dynamic = "force-dynamic"; // Always server-render with fresh DB data
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Static slug data — used as fallback when DB is unavailable
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
  { slug: "san-antonio", name: "San Antonio", state: "TX", description: "Historic Texas city with the Alamo, River Walk, world-class Tex-Mex cuisine, and family-friendly attractions." },
  { slug: "miami", name: "Miami", state: "FL", description: "Vibrant South Florida city with Art Deco architecture, stunning beaches, nightlife, and diverse cultural experiences." },
  { slug: "nashville", name: "Nashville", state: "TN", description: "Music City USA with honky-tonks, live music, the Grand Ole Opry, and a thriving food and entertainment scene." },
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
  { slug: "staypromo", name: "StayPromo", type: "broker", description: "Florida-licensed vacation deal broker with resort deals across 10+ US and international destinations." },
  { slug: "vacation-village", name: "Vacation Village Resorts", type: "direct", description: "Direct resort brand offering vacation deals from $49 in Orlando, Las Vegas, South Florida, and Williamsburg." },
  { slug: "spinnaker", name: "Spinnaker Resorts", type: "direct", description: "Hilton Head, Branson, Williamsburg, and Ormond Beach resort deals starting at $269 with entertainment credits." },
  { slug: "govip", name: "GoVIP", type: "broker", description: "Vacation deal broker (currently inactive — site under development)." },
  { slug: "departure-depot", name: "Departure Depot", type: "broker", description: "Modern vacation deal broker with 150+ destinations worldwide, offering Resort Preview Getaways with deep discounts." },
  { slug: "vegas-timeshare", name: "Las Vegas Timeshare", type: "broker", description: "Las Vegas-focused vacation deal broker with deals at Strip properties including SAHARA and Planet Hollywood." },
  { slug: "premier-travel", name: "Premier Travel Resorts", type: "broker", description: "Florida-based vacation deal broker offering promotional packages in Orlando, Las Vegas, Costa Rica, and more." },
  { slug: "discount-vacation", name: "Discount Vacation Hotels", type: "broker", description: "Villa Group promotional arm offering discounted all-inclusive deals at Mexico resort properties." },
  { slug: "legendary", name: "Legendary Vacation Club", type: "direct", description: "Luxury vacation club tied to Hard Rock Hotels and Palace Resorts with all-inclusive deals in Mexico and Caribbean." },
  { slug: "festiva", name: "Festiva Hospitality Group", type: "direct", description: "Vacation ownership with 21 resorts across unique US destinations including Asheville, Cape Cod, and Wisconsin Dells." },
];

const priceRanges = [
  { slug: "deals-under-100", label: "Deals Under $100", maxPrice: 100, description: "Incredible vacation deals for under $100. Stay at premium resorts for a fraction of the retail price." },
  { slug: "deals-under-200", label: "Deals Under $200", maxPrice: 200, description: "Affordable vacation deals under $200 with resort stays, perks, and extras included." },
  { slug: "deals-under-300", label: "Deals Under $300", maxPrice: 300, description: "Great value vacation deals under $300 at top-rated resorts nationwide." },
  { slug: "deals-under-500", label: "Deals Under $500", maxPrice: 500, description: "Premium resort deals under $500 including all-inclusive options and luxury stays." },
  { slug: "deals-100-to-200", label: "Deals $100\u2013$200", minPrice: 100, maxPrice: 200, description: "Mid-range vacation deals between $100 and $200 at popular resort destinations." },
];

const durations = [
  { slug: "2-night-packages", label: "2-Night Packages", nights: 2, description: "Quick weekend getaway deals with 2-night stays at top resorts. Perfect for a short escape." },
  { slug: "3-night-packages", label: "3-Night Packages", nights: 3, description: "Our most popular deal length — 3-night resort stays with amazing inclusions and perks." },
  { slug: "4-night-packages", label: "4-Night Packages", nights: 4, description: "Extended 4-night vacation deals for a more relaxed resort experience with extra time to explore." },
  { slug: "5-night-packages", label: "5-Night Packages", nights: 5, description: "5-night vacation deals for the ultimate getaway. More time to enjoy the resort and local attractions." },
];

// ---------------------------------------------------------------------------
// Mock deals — fallback data
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

type DestinationData = { slug: string; name: string; state: string; region?: string; description: string };
type BrandData = { slug: string; name: string; type: string; description: string; website?: string };

type SlugType =
  | { type: "destination"; data: DestinationData }
  | { type: "brand"; data: BrandData }
  | { type: "price"; data: (typeof priceRanges)[number] }
  | { type: "duration"; data: (typeof durations)[number] }
  | { type: "blog"; data: BlogPost };

async function resolveSlug(slug: string): Promise<SlugType | null> {
  // 1. Check static price ranges (these never change)
  const priceMatch = priceRanges.find((p) => p.slug === slug);
  if (priceMatch) return { type: "price", data: priceMatch };

  // 2. Check static durations (these never change)
  const durationMatch = durations.find((d) => d.slug === slug);
  if (durationMatch) return { type: "duration", data: durationMatch };

  // 3. Check blog posts (DB first, static fallback)
  const blogPost = await getBlogPostBySlug(slug);
  if (blogPost) return { type: "blog", data: blogPost };

  // 4. Check DB for destination
  const dbDestinations = await getAllDestinationSlugs();
  const destMatch = dbDestinations.find((d) => d.slug === slug);
  if (destMatch) {
    return {
      type: "destination",
      data: {
        slug: destMatch.slug,
        name: destMatch.city,
        state: destMatch.state || "",
        region: destMatch.region || "",
        description: `Vacation deals in ${destMatch.city}, ${destMatch.state || destMatch.country}.`,
      },
    };
  }

  // 5. Check DB for brand
  const dbBrands = await getAllBrandSlugs();
  const brandMatch = dbBrands.find((b) => b.slug === slug);
  if (brandMatch) {
    return {
      type: "brand",
      data: {
        slug: brandMatch.slug,
        name: brandMatch.name,
        type: brandMatch.type,
        description: brandMatch.description || `Vacation deals from ${brandMatch.name}.`,
        website: brandMatch.website || undefined,
      },
    };
  }

  // 6. Fall back to hardcoded arrays (for when DB is unavailable)
  const staticDest = destinations.find((d) => d.slug === slug);
  if (staticDest) return { type: "destination", data: staticDest };

  const staticBrand = brands.find((b) => b.slug === slug);
  if (staticBrand) return { type: "brand", data: staticBrand };

  return null;
}

function filterMockDeals(resolved: SlugType): Deal[] {
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

// ---------------------------------------------------------------------------
// DB-powered deal fetching per slug type
// ---------------------------------------------------------------------------

async function getDealsForSlug(
  resolved: SlugType,
): Promise<{ deals: Deal[]; total: number } | null> {
  switch (resolved.type) {
    case "destination":
      return getDeals({ destinationSlug: resolved.data.slug });
    case "brand":
      return getDeals({ brandSlug: resolved.data.slug });
    case "price": {
      const { maxPrice, minPrice } = resolved.data as {
        maxPrice: number;
        minPrice?: number;
      };
      return getDeals({ maxPrice, minPrice });
    }
    case "duration":
      return getDeals({ durationNights: resolved.data.nights });
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// generateStaticParams
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const params: { slug: string }[] = [];

  // Static slugs (always included)
  for (const p of priceRanges) params.push({ slug: p.slug });
  for (const d of durations) params.push({ slug: d.slug });

  // DB destinations
  const dbDests = await getAllDestinationSlugs();
  for (const d of dbDests) params.push({ slug: d.slug });

  // DB brands
  const dbBrands = await getAllBrandSlugs();
  for (const b of dbBrands) params.push({ slug: b.slug });

  // Blog posts
  const blogPosts = await getAllBlogPosts();
  for (const p of blogPosts) params.push({ slug: p.slug });

  // Fallback static arrays (in case DB wasn't available)
  for (const d of destinations) {
    if (!params.some((p) => p.slug === d.slug)) params.push({ slug: d.slug });
  }
  for (const b of brands) {
    if (!params.some((p) => p.slug === b.slug)) params.push({ slug: b.slug });
  }

  return params;
}

// ---------------------------------------------------------------------------
// generateMetadata — dynamic with live data
// ---------------------------------------------------------------------------

interface SlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveSlug(slug);

  if (!resolved) {
    return { title: "Page Not Found" };
  }

  const baseUrl = "https://vacationdeals.to";

  switch (resolved.type) {
    case "destination": {
      const { name, state } = resolved.data;
      const destDetail = await getDestinationBySlug(slug);
      const dealCount = destDetail?.dealCount || 0;
      const cheapest = destDetail?.cheapestPrice || 59;

      return {
        title: dealCount > 0
          ? `${name} Vacation Deals from $${cheapest} (${dealCount} Deals)`
          : `${name} Vacation Deals`,
        description: dealCount > 0
          ? `${dealCount} vacation deals in ${name}, ${state} from $${cheapest}. Compare resort deals from top brands. Book premium resort stays.`.slice(0, 160)
          : `Vacation deals in ${name}, ${state}. Compare resort deals from top timeshare brands at premium resorts.`,
        alternates: { canonical: `${baseUrl}/${slug}` },
        openGraph: {
          title: dealCount > 0
            ? `${name} Vacation Deals from $${cheapest} (${dealCount} Deals)`
            : `${name} Vacation Deals`,
          description: dealCount > 0
            ? `${dealCount} vacation deals in ${name}, ${state} from $${cheapest}. Compare resort deals from top brands.`
            : `Vacation deals in ${name}, ${state}. Resort deals from top brands.`,
          url: `${baseUrl}/${slug}`,
          type: "website",
        },
      };
    }
    case "brand": {
      const { name } = resolved.data;
      const brandDetail = await getBrandBySlug(slug);
      const dealCount = brandDetail?.dealCount || 0;
      const cheapest = brandDetail?.cheapestPrice || 59;
      const destNames = brandDetail?.destinations?.slice(0, 4).join(", ") || "top destinations";

      return {
        title: dealCount > 0
          ? `${name} Vacation Deals from $${cheapest}`
          : `${name} Vacation Deals`,
        description: dealCount > 0
          ? `${dealCount} ${name} vacation deals from $${cheapest}. Browse resort deals in ${destNames}, and more.`.slice(0, 160)
          : `Vacation deals from ${name}. Compare resort deals, prices, and destinations. ${resolved.data.description}`.slice(0, 160),
        alternates: { canonical: `${baseUrl}/${slug}` },
        openGraph: {
          title: dealCount > 0
            ? `${name} Vacation Deals from $${cheapest}`
            : `${name} Vacation Deals`,
          description: dealCount > 0
            ? `Browse ${dealCount} resort deals starting at $${cheapest}.`
            : `Compare all ${name} vacation deals. Find the best resort deals and save up to 80%.`,
          url: `${baseUrl}/${slug}`,
          type: "website",
        },
      };
    }
    case "price": {
      const { label } = resolved.data;
      const result = await getDealsForSlug(resolved);
      const dealCount = result?.total || 0;

      return {
        title: dealCount > 0
          ? `${label} — ${dealCount} Cheap Vacation Deals`
          : `${label} — Cheap Vacation Deals`,
        description: dealCount > 0
          ? `${dealCount} ${label.toLowerCase()} from top timeshare resorts. ${resolved.data.description}`
          : `${resolved.data.description} Compare vacation deals from top timeshare resorts.`,
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
      const result = await getDealsForSlug(resolved);
      const dealCount = result?.total || 0;

      return {
        title: dealCount > 0
          ? `${label} — ${dealCount} Resort Vacation Deals`
          : `${label} — Resort Vacation Deals`,
        description: dealCount > 0
          ? `${dealCount} ${label.toLowerCase()} from top resort brands. ${resolved.data.description}`
          : `${resolved.data.description} Compare the best ${label.toLowerCase()} from top resort brands.`,
        alternates: { canonical: `${baseUrl}/${slug}` },
        openGraph: {
          title: label,
          description: resolved.data.description,
          url: `${baseUrl}/${slug}`,
          type: "website",
        },
      };
    }
    case "blog": {
      const post = resolved.data;
      return {
        title: post.metaTitle,
        description: post.metaDescription,
        alternates: { canonical: `${baseUrl}/${post.slug}` },
        openGraph: {
          title: post.metaTitle,
          description: post.metaDescription,
          url: `${baseUrl}/${post.slug}`,
          type: "article",
          images: [{ url: `${baseUrl}/og-image.svg`, width: 1200, height: 630 }],
          ...(post.publishDate
            ? { publishedTime: post.publishDate }
            : {}),
        },
        authors: [{ name: post.author }],
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params;
  const resolved = await resolveSlug(slug);

  if (!resolved) {
    notFound();
  }

  // Blog posts don't need deal data
  if (resolved.type === "blog") {
    return <BlogPostRenderer post={resolved.data} />;
  }

  // Try to fetch deals from DB, fall back to mock data
  const dbResult = await getDealsForSlug(resolved);
  console.log(`[slug] ${slug}: dbResult=${dbResult ? `${dbResult.deals.length} deals, total=${dbResult.total}` : 'null'}`);
  const deals = dbResult && dbResult.deals.length > 0 ? dbResult.deals : filterMockDeals(resolved);
  const totalDeals = dbResult?.total ?? deals.length;

  switch (resolved.type) {
    case "destination":
      return (
        <DestinationPage
          data={resolved.data}
          deals={deals}
          totalDeals={totalDeals}
          slug={slug}
        />
      );
    case "brand":
      return (
        <BrandPage
          data={resolved.data}
          deals={deals}
          totalDeals={totalDeals}
          slug={slug}
        />
      );
    case "price":
      return <PricePage data={resolved.data} deals={deals} totalDeals={totalDeals} slug={slug} />;
    case "duration":
      return <DurationPage data={resolved.data} deals={deals} totalDeals={totalDeals} slug={slug} />;
  }
}

// ---------------------------------------------------------------------------
// Sub-layouts for each slug type
// ---------------------------------------------------------------------------

async function DestinationPage({
  data,
  deals,
  totalDeals,
  slug,
}: {
  data: DestinationData;
  deals: Deal[];
  totalDeals: number;
  slug: string;
}) {
  // Fetch live stats for JSON-LD
  const destDetail = await getDestinationBySlug(slug);
  const cheapest = destDetail?.cheapestPrice ?? (deals.length > 0 ? Math.min(...deals.map((d) => d.price)) : null);
  const brandNames = destDetail?.brands ?? [...new Set(deals.map((d) => d.brandName))];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: data.name,
    description: data.description,
    url: `https://vacationdeals.to/${data.slug}`,
    dateModified: new Date().toISOString(),
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: data.state,
    },
    ...(cheapest != null
      ? {
          makesOffer: {
            "@type": "AggregateOffer",
            lowPrice: cheapest,
            priceCurrency: "USD",
            offerCount: totalDeals,
            offers: deals.slice(0, 5).map((d) => ({
              "@type": "Offer",
              name: d.title,
              price: d.price,
              priceCurrency: "USD",
              seller: { "@type": "Organization", name: d.brandName },
            })),
          },
        }
      : {}),
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
          Vacation Deals in {data.name}, {data.state}
        </h1>
        <p className="max-w-2xl text-lg text-white/90">{data.description}</p>
        {cheapest != null && (
          <p className="mt-2 text-sm font-medium text-white/80">
            {totalDeals} deal{totalDeals !== 1 ? "s" : ""} from ${cheapest} &middot; {brandNames.length} brand{brandNames.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Breadcrumb schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Vacation Deals", "item": "https://vacationdeals.to" },
            { "@type": "ListItem", "position": 2, "name": "Vacation Destinations", "item": "https://vacationdeals.to/destinations" },
            { "@type": "ListItem", "position": 3, "name": `${data.name} Vacation Deals`, "item": `https://vacationdeals.to/${data.slug}` },
          ],
        }) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/destinations" className="hover:text-blue-600">Vacation Destinations</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">{data.name} Vacation Deals</li>
        </ol>
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
          About {data.name} Vacation Deals
        </h2>
        <p className="text-sm leading-relaxed text-gray-600">
          {data.description} Browse and compare the best vacation deals
          available in {data.name}. These resort deals include stays at
          deeply discounted rates — often 70-80% off retail. Deals typically
          include a {data.name} resort stay with perks like free parking, resort
          credits, and loyalty points from top brands.
        </p>
      </section>

      {(() => {
        const faqs = getFAQsForSlug(slug);
        if (!faqs || faqs.length === 0) return null;
        return (
          <>
            <FAQSchema faqs={faqs} />
            <section className="mt-16">
              <FAQAccordion faqs={faqs} />
            </section>
          </>
        );
      })()}

      <SEOPreFooter type="destinations" currentSlug={slug} />
    </div>
  );
}

async function BrandPage({
  data,
  deals,
  totalDeals,
  slug,
}: {
  data: BrandData;
  deals: Deal[];
  totalDeals: number;
  slug: string;
}) {
  // Fetch live stats for JSON-LD
  const brandDetail = await getBrandBySlug(slug);
  const cheapest = brandDetail?.cheapestPrice ?? (deals.length > 0 ? Math.min(...deals.map((d) => d.price)) : null);
  const destNames = brandDetail?.destinations ?? [...new Set(deals.map((d) => d.city))];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.name,
    description: data.description,
    url: `https://vacationdeals.to/${data.slug}`,
    dateModified: new Date().toISOString(),
    ...(cheapest != null
      ? {
          makesOffer: {
            "@type": "AggregateOffer",
            lowPrice: cheapest,
            priceCurrency: "USD",
            offerCount: totalDeals,
          },
        }
      : {}),
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
        {cheapest != null && (
          <p className="mt-2 text-sm font-medium text-white/80">
            {totalDeals} deal{totalDeals !== 1 ? "s" : ""} from ${cheapest} &middot; {destNames.length} destination{destNames.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Breadcrumb schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Vacation Deals", "item": "https://vacationdeals.to" },
            { "@type": "ListItem", "position": 2, "name": "Vacation Deal Brands", "item": "https://vacationdeals.to/brands" },
            { "@type": "ListItem", "position": 3, "name": `${data.name} Vacation Deals`, "item": `https://vacationdeals.to/${data.slug}` },
          ],
        }) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/brands" className="hover:text-blue-600">Vacation Deal Brands</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">{data.name} Vacation Deals</li>
        </ol>
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
          {data.description} Compare all available {data.name} vacation deals
          on VacationDeals.to. We track pricing and availability daily so you
          always see the latest resort deals. {data.name} deals include resort stays
          at deeply discounted rates with perks and bonuses included.
        </p>
      </section>

      {(() => {
        const faqs = getFAQsForSlug(slug);
        if (!faqs || faqs.length === 0) return null;
        return (
          <>
            <FAQSchema faqs={faqs} />
            <section className="mt-16">
              <FAQAccordion faqs={faqs} />
            </section>
          </>
        );
      })()}

      <SEOPreFooter type="brands" currentSlug={slug} />
    </div>
  );
}

function PricePage({
  data,
  deals,
  totalDeals,
  slug,
}: {
  data: (typeof priceRanges)[number];
  deals: Deal[];
  totalDeals: number;
  slug: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: data.label,
    description: data.description,
    url: `https://vacationdeals.to/${data.slug}`,
    dateModified: new Date().toISOString(),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalDeals,
      itemListElement: deals.slice(0, 5).map((d, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Offer",
          name: d.title,
          price: d.price,
          priceCurrency: "USD",
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

      {/* Hero */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 px-8 py-12 text-white">
        <h1 className="mb-2 text-3xl font-bold sm:text-4xl">{data.label}</h1>
        <p className="max-w-2xl text-lg text-white/90">{data.description}</p>
        {totalDeals > 0 && (
          <p className="mt-2 text-sm font-medium text-white/80">
            {totalDeals} deal{totalDeals !== 1 ? "s" : ""} available
          </p>
        )}
      </div>

      {/* Breadcrumb schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Vacation Deals", "item": "https://vacationdeals.to" },
            { "@type": "ListItem", "position": 2, "name": "All Vacation Deals", "item": "https://vacationdeals.to/deals" },
            { "@type": "ListItem", "position": 3, "name": `Vacation ${data.label}`, "item": `https://vacationdeals.to/${data.slug}` },
          ],
        }) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/deals" className="hover:text-blue-600">All Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Vacation {data.label}</li>
        </ol>
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
          {data.description} These vacation deals offer incredible value —
          stay at premium resorts for a fraction of the retail price. In exchange
          for the discounted rate, you attend a brief timeshare presentation
          during your stay. No purchase required.
        </p>
      </section>

      {(() => {
        const faqs = getFAQsForSlug(slug);
        if (!faqs || faqs.length === 0) return null;
        return (
          <>
            <FAQSchema faqs={faqs} />
            <section className="mt-16">
              <FAQAccordion faqs={faqs} />
            </section>
          </>
        );
      })()}

      <SEOPreFooter type="prices" currentSlug={slug} />
    </div>
  );
}

function DurationPage({
  data,
  deals,
  totalDeals,
  slug,
}: {
  data: (typeof durations)[number];
  deals: Deal[];
  totalDeals: number;
  slug: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: data.label,
    description: data.description,
    url: `https://vacationdeals.to/${data.slug}`,
    dateModified: new Date().toISOString(),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalDeals,
      itemListElement: deals.slice(0, 5).map((d, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Offer",
          name: d.title,
          price: d.price,
          priceCurrency: "USD",
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

      {/* Hero */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 px-8 py-12 text-white">
        <h1 className="mb-2 text-3xl font-bold sm:text-4xl">{data.label}</h1>
        <p className="max-w-2xl text-lg text-white/90">{data.description}</p>
        {totalDeals > 0 && (
          <p className="mt-2 text-sm font-medium text-white/80">
            {totalDeals} deal{totalDeals !== 1 ? "s" : ""} available
          </p>
        )}
      </div>

      {/* Breadcrumb schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Vacation Deals", "item": "https://vacationdeals.to" },
            { "@type": "ListItem", "position": 2, "name": "All Vacation Deals", "item": "https://vacationdeals.to/deals" },
            { "@type": "ListItem", "position": 3, "name": `${data.nights}-Night Vacation Deals`, "item": `https://vacationdeals.to/${data.slug}` },
          ],
        }) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/deals" className="hover:text-blue-600">All Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">{data.nights}-Night Vacation Deals</li>
        </ol>
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
          {data.description} Browse {data.nights}-night resort deals from top
          timeshare brands including Westgate, Hilton Grand Vacations, Marriott,
          and more. Each deal includes a {data.nights}-night stay at a premium
          resort with perks and bonuses.
        </p>
      </section>

      {(() => {
        const faqs = getFAQsForSlug(slug);
        if (!faqs || faqs.length === 0) return null;
        return (
          <>
            <FAQSchema faqs={faqs} />
            <section className="mt-16">
              <FAQAccordion faqs={faqs} />
            </section>
          </>
        );
      })()}

      <SEOPreFooter type="durations" currentSlug={slug} />
    </div>
  );
}
