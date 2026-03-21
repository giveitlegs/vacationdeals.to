export interface BlogPostSection {
  type: "intro" | "point" | "table" | "protip" | "funfact" | "callout" | "image";
  content: string; // HTML string
  heading?: string; // H2/H3
  imageAlt?: string;
  number?: number; // for numbered points
}

export interface BlogFAQ {
  question: string;
  answer: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: "destinations" | "brands" | "interests" | "segments";
  publishDate: string; // ISO date
  author: string;
  readTime: string; // "8 min read"
  bluf: string; // Bottom Line Up Front summary (2-3 sentences)
  heroImageAlt: string;
  heroGradient: string; // tailwind gradient classes
  content: string; // Full HTML content of the blog post
  faqs: BlogFAQ[];
  internalLinks: { text: string; href: string }[]; // min 3
  relatedSlugs: string[]; // slugs of related blog posts
  tags: string[];
}

// ---------------------------------------------------------------------------
// Static blog post arrays (fallback when DB is unavailable)
// ---------------------------------------------------------------------------

import { destinationPosts } from "./blog-posts/destinations";
import { brandPosts } from "./blog-posts/brands";
import { interestPosts } from "./blog-posts/interests";
import { segmentPosts } from "./blog-posts/segments";
import { itineraryPosts } from "./blog-posts/itineraries";
import { bestofPosts } from "./blog-posts/bestof";
// Batch 2: Best-of listicles by category
import { bestofPricesPosts } from "./blog-posts/bestof-prices";
import { bestofSegments2Posts } from "./blog-posts/bestof-segments2";
import { bestofDestinations2Posts } from "./blog-posts/bestof-destinations2";
import { lowKdPosts } from "./blog-posts/low-kd-posts";
import { bestofAmenitiesPosts } from "./blog-posts/bestof-amenities";
import { bestofSeasonsPosts } from "./blog-posts/bestof-seasons";
// Batch 3: Vacation ideas for every segment
import { vacationIdeas1Posts } from "./blog-posts/vacation-ideas-1";
import { vacationIdeas2Posts } from "./blog-posts/vacation-ideas-2";
import { vacationIdeas3Posts } from "./blog-posts/vacation-ideas-3";
import { vacationIdeas4Posts } from "./blog-posts/vacation-ideas-4";
import { vacationIdeas6Posts } from "./blog-posts/vacation-ideas-6";
import { vacationIdeas10Posts } from "./blog-posts/vacation-ideas-10";

const _allPosts: BlogPost[] = [
  ...destinationPosts,
  ...brandPosts,
  ...interestPosts,
  ...segmentPosts,
  ...itineraryPosts,
  ...bestofPosts,
  // Batch 2
  ...bestofPricesPosts,
  ...bestofSegments2Posts,
  ...bestofDestinations2Posts,
  ...lowKdPosts,
  ...bestofAmenitiesPosts,
  ...bestofSeasonsPosts,
  // Batch 3
  ...vacationIdeas1Posts,
  ...vacationIdeas2Posts,
  ...vacationIdeas3Posts,
  ...vacationIdeas4Posts,
  ...vacationIdeas6Posts,
  ...vacationIdeas10Posts,
].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

// ---------------------------------------------------------------------------
// Async functions that try DB first, fall back to static arrays
// ---------------------------------------------------------------------------

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const { getBlogPostsFromDB } = await import("@/lib/queries");
    const dbResult = await getBlogPostsFromDB({ limit: 500 });
    if (dbResult && dbResult.posts.length > 0) {
      return dbResult.posts;
    }
  } catch {
    // DB unavailable, fall through to static
  }
  return _allPosts;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const { getBlogPostBySlugFromDB } = await import("@/lib/queries");
    const dbPost = await getBlogPostBySlugFromDB(slug);
    if (dbPost) return dbPost;
  } catch {
    // DB unavailable, fall through to static
  }
  return _allPosts.find((p) => p.slug === slug) || null;
}

export async function getBlogPostsByCategory(category: BlogPost["category"]): Promise<BlogPost[]> {
  try {
    const { getBlogPostsFromDB } = await import("@/lib/queries");
    const dbResult = await getBlogPostsFromDB({ category, limit: 500 });
    if (dbResult && dbResult.posts.length > 0) {
      return dbResult.posts;
    }
  } catch {
    // DB unavailable, fall through to static
  }
  return _allPosts.filter((p) => p.category === category);
}

export async function getFeaturedBlogPosts(count: number = 3): Promise<BlogPost[]> {
  const all = await getAllBlogPosts();
  return all.slice(0, count);
}
