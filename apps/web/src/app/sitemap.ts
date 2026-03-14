import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://vacationdeals.to";

  const destinations = [
    "orlando", "las-vegas", "cancun", "gatlinburg", "myrtle-beach",
    "branson", "williamsburg", "cocoa-beach", "hilton-head", "park-city",
    "daytona-beach", "cabo", "puerto-vallarta", "punta-cana", "key-west",
    "sedona", "galveston", "lake-tahoe", "new-york-city", "san-diego",
  ];

  const brands = [
    "westgate", "hgv", "bluegreen", "wyndham", "holiday-inn",
    "hyatt", "marriott", "capital-vacations", "bookvip", "getawaydealz",
    "vacationvip", "bestvacationdealz", "mrg", "westgate-events",
  ];

  const priceRanges = ["deals-under-100", "deals-under-200", "deals-under-300", "deals-under-500"];
  const durations = ["2-night-packages", "3-night-packages", "4-night-packages", "5-night-packages"];

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1.0 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/destinations`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/brands`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
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

  return [...staticPages, ...destinationPages, ...brandPages, ...pricePages, ...durationPages];
}
