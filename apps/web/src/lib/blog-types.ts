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

// Registry of all blog posts
export function getAllBlogPosts(): BlogPost[] {
  // Import all post files and combine
  // This will be populated as content files are created
  return [];
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return getAllBlogPosts().find((p) => p.slug === slug) || null;
}

export function getBlogPostsByCategory(category: BlogPost["category"]): BlogPost[] {
  return getAllBlogPosts().filter((p) => p.category === category);
}

export function getFeaturedBlogPosts(count: number = 3): BlogPost[] {
  return getAllBlogPosts().slice(0, count);
}
