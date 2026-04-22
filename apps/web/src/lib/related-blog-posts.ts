/**
 * Find related blog posts for a given sublander (city + modifier).
 *
 * Scoring heuristic:
 *   +3 if the post mentions the city (name or slug)
 *   +2 if the post mentions the modifier keyword
 *   +1 if the post's category matches the modifier type
 *   +1 freshness bonus for posts within the last 60 days
 *
 * Returns the top N matches. Runs server-side at build/ISR time; results
 * cached via Next.js route-level revalidation.
 */

import { getAllBlogPosts } from "@/lib/blog-types";
import type { BlogPost } from "@/lib/blog-types";
import type { Modifier } from "@vacationdeals/shared";

const CITY_KEYWORDS: Record<string, string[]> = {
  orlando: ["orlando"],
  "las-vegas": ["las vegas", "vegas"],
  gatlinburg: ["gatlinburg", "smoky"],
  "myrtle-beach": ["myrtle beach", "grand strand"],
  branson: ["branson", "ozarks"],
  williamsburg: ["williamsburg", "busch gardens"],
  "cocoa-beach": ["cocoa beach", "space coast"],
  cancun: ["cancun", "riviera maya"],
  "cabo-san-lucas": ["cabo", "los cabos"],
  "puerto-vallarta": ["puerto vallarta", "banderas bay"],
  "punta-cana": ["punta cana", "dominican"],
  "daytona-beach": ["daytona"],
  maui: ["maui", "hawaii", "ka'anapali", "kaanapali"],
  charleston: ["charleston"],
  "park-city": ["park city", "utah"],
  "hilton-head": ["hilton head"],
  "ormond-beach": ["ormond"],
  "new-smyrna-beach": ["new smyrna"],
  cozumel: ["cozumel"],
  atlanta: ["atlanta"],
  "river-ranch": ["river ranch", "dude ranch"],
};

const MODIFIER_KEYWORDS: Record<string, string[]> = {
  "for-families": ["family", "kids", "children"],
  "for-couples": ["couples", "romantic"],
  "for-seniors": ["seniors", "retirees", "55"],
  "solo-travelers": ["solo traveler", "single traveler"],
  "for-groups": ["group trip", "group vacation"],
  "honeymoon": ["honeymoon"],
  "bachelor-party": ["bachelor"],
  "bachelorette-party": ["bachelorette"],
  "girls-trip": ["girls trip", "girls' trip"],
  "destination-wedding": ["destination wedding"],
  "summer": ["summer"],
  "fall": ["fall", "autumn", "foliage"],
  "spring": ["spring"],
  "winter": ["winter"],
  "spring-break": ["spring break"],
  "shoulder-season": ["shoulder season"],
  "last-minute": ["last-minute", "last minute"],
  "memorial-day-weekend": ["memorial day"],
  "july-4th": ["july 4", "independence day"],
  "labor-day-weekend": ["labor day"],
  "thanksgiving": ["thanksgiving"],
  "christmas": ["christmas", "holiday"],
  "new-years": ["new year"],
  "under-99": ["under $99", "$59", "$79"],
  "under-149": ["under $149"],
  "under-199": ["under $200", "under $199"],
  "cheap": ["cheap", "cheapest"],
  "luxury": ["luxury"],
  "weekend": ["weekend getaway"],
  "2-night": ["2-night", "2 night"],
  "3-night": ["3-night", "3 night"],
  "5-night": ["5-night", "5 night"],
  "all-inclusive": ["all-inclusive"],
  "near-disney": ["disney", "magic kingdom"],
  "near-universal": ["universal studios"],
  "oceanfront": ["oceanfront", "ocean view"],
  "with-waterpark": ["waterpark"],
  "ski-in-ski-out": ["ski-in", "ski out"],
  "pet-friendly": ["pet-friendly", "pet friendly"],
  "adults-only": ["adults only"],
  "historic-district": ["historic"],
  "near-beach": ["near beach"],
  "golf-included": ["golf"],
  "dude-ranch": ["dude ranch", "ranch"],
  "beachfront-hawaii": ["beachfront", "hawaii"],
  "snorkeling": ["snorkel", "reef"],
  "urban-event": ["concert", "conference", "wedding"],
};

export interface RelatedPost {
  slug: string;
  title: string;
  metaDescription: string;
  readTime: string;
  score: number;
}

export async function getRelatedBlogPosts(
  citySlug: string,
  modifier: Modifier,
  limit = 4,
): Promise<RelatedPost[]> {
  const allPosts = await getAllBlogPosts();
  const cityKeys = CITY_KEYWORDS[citySlug] || [citySlug.replace(/-/g, " ")];
  const modifierKeys = MODIFIER_KEYWORDS[modifier.slug] || [modifier.label.toLowerCase()];

  const now = Date.now();
  const sixtyDays = 60 * 24 * 60 * 60 * 1000;

  const scored = allPosts.map((post: BlogPost) => {
    const haystack = (
      post.title +
      " " +
      post.metaDescription +
      " " +
      post.content +
      " " +
      (post.tags ?? []).join(" ")
    ).toLowerCase();

    let score = 0;
    for (const kw of cityKeys) if (haystack.includes(kw.toLowerCase())) { score += 3; break; }
    for (const kw of modifierKeys) if (haystack.includes(kw.toLowerCase())) { score += 2; break; }

    // Category-type crude match
    if (post.category === "destinations" && modifier.type === "interest") score += 1;
    if (post.category === "interests" && ["audience", "season", "occasion"].includes(modifier.type)) score += 1;

    // Freshness
    const published = post.publishDate ? new Date(post.publishDate).getTime() : 0;
    if (published && now - published < sixtyDays) score += 1;

    return {
      slug: post.slug,
      title: post.title,
      metaDescription: post.metaDescription,
      readTime: post.readTime,
      score,
    };
  });

  return scored
    .filter((p) => p.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
