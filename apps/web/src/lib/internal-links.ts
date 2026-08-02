import type { BlogPost } from "@/lib/blog-types";
import { getSlugTitlesByCategory } from "@/lib/queries";
import { HUB_BY_CLUSTER, clusterForSlug } from "@/lib/topic-hubs";

/**
 * Computed internal-link resolver (2026-08-01 internal-linking ranking plan).
 *
 * The 225 niche/content pages shipped with only ~3 hand-authored internalLinks
 * each — a live crawl found 137 near-orphans, 474 under-linked pages, and the
 * commercial F-showdowns sitting at depth-3 with ~6 inlinks. This resolver
 * augments every content page at render time with:
 *   1. an UP-link to its geo pillar (city lander) and/or the two topical
 *      commercial pillars, and
 *   2. same-category sibling links,
 * lifting each page from ~3 to ~10-16 contextual internal links, with
 * descriptive (never generic) anchors and rotated pillar anchor text to avoid
 * exact-match over-optimization (leak: anchorMismatchDemotion).
 */

// The 20 destination pillars (city token -> lander slug + display city).
const CITY_PILLARS: Array<{ token: string; slug: string; city: string }> = [
  { token: "orlando", slug: "orlando", city: "Orlando" },
  { token: "las-vegas", slug: "las-vegas", city: "Las Vegas" },
  { token: "branson", slug: "branson", city: "Branson" },
  { token: "gatlinburg", slug: "gatlinburg", city: "Gatlinburg" },
  { token: "myrtle-beach", slug: "myrtle-beach", city: "Myrtle Beach" },
  { token: "williamsburg", slug: "williamsburg", city: "Williamsburg" },
  { token: "cancun", slug: "cancun", city: "Cancun" },
  { token: "cabo", slug: "cabo", city: "Cabo San Lucas" },
  { token: "punta-cana", slug: "punta-cana", city: "Punta Cana" },
  { token: "hilton-head", slug: "hilton-head", city: "Hilton Head" },
  { token: "daytona-beach", slug: "daytona-beach", city: "Daytona Beach" },
  { token: "cocoa-beach", slug: "cocoa-beach", city: "Cocoa Beach" },
  { token: "sedona", slug: "sedona", city: "Sedona" },
  { token: "park-city", slug: "park-city", city: "Park City" },
  { token: "key-west", slug: "key-west", city: "Key West" },
  { token: "lake-tahoe", slug: "lake-tahoe", city: "Lake Tahoe" },
  { token: "san-diego", slug: "san-diego", city: "San Diego" },
  { token: "nashville", slug: "nashville", city: "Nashville" },
  { token: "san-antonio", slug: "san-antonio", city: "San Antonio" },
  { token: "miami", slug: "miami", city: "Miami" },
];

// Rotated anchor variants per pillar (avoid one exact-match anchor sitewide).
function cityAnchors(city: string): string[] {
  return [
    `${city} vacation deals`,
    `${city} timeshare preview packages`,
    `cheap ${city} getaways`,
    `${city} deals`,
  ];
}

// The two commercial keyword pillars (built 2026-08-01).
const KEYWORD_PILLARS = [
  { slug: "timeshare-presentation-deals", anchors: ["timeshare presentation deals", "timeshare promotions", "preview package deals"] },
  { slug: "all-inclusive-vacation-deals", anchors: ["all-inclusive vacation deals", "all-inclusive preview packages"] },
];

export interface ComputedLink {
  text: string;
  href: string;
}

// Deterministic pick so the same page always renders the same anchor variant
// (stable across builds; no Math.random which would break ISR/caching).
function pickVariant(variants: string[], seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return variants[h % variants.length];
}

/**
 * Returns 8-16 computed internal links for a content page: geo pillar up-link,
 * relevant keyword-pillar up-link(s), and same-category siblings. Excludes the
 * page's own slug and anything already in its hand-authored internalLinks.
 */
export async function computeInternalLinks(post: BlogPost): Promise<ComputedLink[]> {
  const existing = new Set<string>([
    `/${post.slug}`,
    ...post.internalLinks.map((l) => l.href),
    ...post.relatedSlugs.map((s) => `/${s}`),
  ]);
  const out: ComputedLink[] = [];
  const push = (href: string, text: string) => {
    if (!existing.has(href) && !out.some((o) => o.href === href)) {
      out.push({ href, text });
      existing.add(href);
    }
  };

  // 1. Geo pillar up-link (longest matching city token wins so "san-antonio"
  //    isn't shadowed by a shorter token).
  const cityMatch = [...CITY_PILLARS]
    .filter((c) => post.slug.includes(c.token))
    .sort((a, b) => b.token.length - a.token.length)[0];
  if (cityMatch && post.slug !== cityMatch.slug) {
    push(`/${cityMatch.slug}`, pickVariant(cityAnchors(cityMatch.city), post.slug));
  }

  // 2. Keyword-pillar up-links where topically relevant.
  const s = post.slug;
  if (/presentation|timeshare|preview|deal|vacpack|cheapest|showdown|vs-/.test(s)) {
    const kp = KEYWORD_PILLARS[0];
    if (post.slug !== kp.slug) push(`/${kp.slug}`, pickVariant(kp.anchors, s));
  }
  if (/all-inclusive|cancun|cabo|punta-cana|playa/.test(s)) {
    const kp = KEYWORD_PILLARS[1];
    if (post.slug !== kp.slug) push(`/${kp.slug}`, pickVariant(kp.anchors, s));
  }

  // 2b. Topical-hub up-link — every child page links UP to its cluster hub
  //     (the reciprocal of the hub linking down; closes the orphan tail).
  const cluster = clusterForSlug(post.slug, post.tags || []);
  if (cluster) {
    const hub = HUB_BY_CLUSTER[cluster];
    if (post.slug !== hub.slug) push(`/${hub.slug}`, pickVariant(hub.anchors, post.slug));
  }

  // 3. Same-category siblings (descriptive title anchors).
  const siblings = await getSlugTitlesByCategory(post.category, 60);
  // Prefer siblings that share the city token, then fill with others.
  const shareToken = (sl: string) => cityMatch && sl.includes(cityMatch.token);
  const ranked = siblings
    .filter((sib) => sib.slug !== post.slug)
    .sort((a, b) => Number(shareToken(b.slug)) - Number(shareToken(a.slug)));
  for (const sib of ranked) {
    if (out.length >= 14) break;
    push(`/${sib.slug}`, sib.title.replace(/\s*\|\s*VacationDeals\.to\s*$/i, "").trim());
  }

  return out.slice(0, 14);
}
