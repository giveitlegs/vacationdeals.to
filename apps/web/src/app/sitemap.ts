import type { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blog-types";
import { getAllBrandSlugs, getAllDestinationSlugs } from "@/lib/queries";

async function getDealSlugs(): Promise<string[]> {
  try {
    const { db } = await import("@vacationdeals/db");
    const { deals } = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");
    const rows = await db.select({ slug: deals.slug }).from(deals).where(eq(deals.isActive, true));
    return rows.map((r) => r.slug);
  } catch {
    return [];
  }
}

// Static fallback arrays (used only if DB is unreachable)
const fallbackDestinations = [
  "orlando", "las-vegas", "cancun", "gatlinburg", "myrtle-beach",
  "branson", "williamsburg", "cocoa-beach", "hilton-head", "park-city",
  "daytona-beach", "cabo", "puerto-vallarta", "punta-cana", "key-west",
  "sedona", "galveston", "lake-tahoe", "new-york-city", "san-diego",
  "san-antonio", "miami", "nashville",
];

const fallbackBrands = [
  "westgate", "hgv", "bluegreen", "wyndham", "holiday-inn",
  "hyatt", "marriott", "capital-vacations", "bookvip", "getawaydealz",
  "vacationvip", "bestvacationdealz", "mrg", "westgate-events",
  "staypromo", "vacation-village", "spinnaker", "govip",
  "departure-depot", "vegas-timeshare", "premier-travel",
  "discount-vacation", "legendary", "festiva",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://vacationdeals.to";

  // Query DB for destinations and brands, fall back to static arrays
  const dbDests = await getAllDestinationSlugs();
  const dbBrands = await getAllBrandSlugs();

  const destinations = dbDests.length > 0
    ? [...new Set([...dbDests.map((d) => d.slug), ...fallbackDestinations])]
    : fallbackDestinations;

  const brands = dbBrands.length > 0
    ? [...new Set([...dbBrands.map((b) => b.slug), ...fallbackBrands])]
    : fallbackBrands;

  const priceRanges = ["deals-under-100", "deals-under-200", "deals-under-300", "deals-under-500"];
  const durations = ["2-night-packages", "3-night-packages", "4-night-packages", "5-night-packages"];

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1.0 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/destinations`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/brands`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/rate-recap`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${baseUrl}/vacpack-rate-showdown`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/vacpack-ad-spy`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${baseUrl}/data-report`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/resort-roulette`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${baseUrl}/timeshare-laws`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/vacation-deals-map`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  const destinationPages = destinations.map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const brandPages = brands.map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const pricePages = priceRanges.map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const durationPages = durations.map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Fetch deal slugs from database
  const dealSlugs = await getDealSlugs();
  const dealPages = dealSlugs.map((slug) => ({
    url: `${baseUrl}/deals/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Blog pages
  const blogPosts = await getAllBlogPosts();
  const blogIndexPage = {
    url: `${baseUrl}/blog`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  };
  const blogPostPages = blogPosts.map((post) => ({
    url: `${baseUrl}/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Brand rate recap pages
  const brandRateRecapPages = brands.map((slug) => ({
    url: `${baseUrl}/rate-recap-${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticPages, blogIndexPage, ...destinationPages, ...brandPages, ...pricePages, ...durationPages, ...dealPages, ...blogPostPages, ...brandRateRecapPages];
}
