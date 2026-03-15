import { NextResponse } from "next/server";
import { getAllBlogPosts } from "@/lib/blog-types";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function toRfc822(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toUTCString();
}

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}

async function getDealItems(): Promise<RssItem[]> {
  try {
    const { getDeals } = await import("@/lib/queries");
    const result = await getDeals({ limit: 50, sortBy: "price-asc" });
    if (!result || result.deals.length === 0) return [];

    return result.deals.map((deal) => ({
      title: deal.title,
      link: `https://vacationdeals.to/deals/${deal.slug}`,
      description: `${deal.brandName} - ${deal.city}, ${deal.state}. ${deal.durationNights} nights from $${deal.price}${deal.originalPrice ? ` (was $${deal.originalPrice})` : ""}. ${deal.inclusions.length > 0 ? `Includes: ${deal.inclusions.join(", ")}.` : ""}`,
      pubDate: toRfc822(new Date()),
      guid: `https://vacationdeals.to/deals/${deal.slug}`,
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  const baseUrl = "https://vacationdeals.to";
  const now = toRfc822(new Date());

  // Blog post items
  const blogPosts = (await getAllBlogPosts()).slice(0, 50);
  const blogItems: RssItem[] = blogPosts.map((post) => ({
    title: post.title,
    link: `${baseUrl}/${post.slug}`,
    description: post.bluf || stripHtml(post.content).slice(0, 300),
    pubDate: toRfc822(post.publishDate),
    guid: `${baseUrl}/${post.slug}`,
  }));

  // Deal items
  const dealItems = await getDealItems();

  // Merge and sort by pubDate (newest first)
  const allItems = [...blogItems, ...dealItems];

  const itemsXml = allItems
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${item.pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VacationDeals.to — Best Vacation Deals</title>
    <link>${baseUrl}</link>
    <description>The best vacation deals from top timeshare resorts. Compare prices across 11+ brands.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/og-image.svg</url>
      <title>VacationDeals.to</title>
      <link>${baseUrl}</link>
    </image>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
