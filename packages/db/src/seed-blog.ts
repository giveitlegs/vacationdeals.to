import { db } from "./client.js";
import { blogPosts } from "./schema.js";
import { destinationPosts } from "../../../apps/web/src/lib/blog-posts/destinations";
import { brandPosts } from "../../../apps/web/src/lib/blog-posts/brands";
import { interestPosts } from "../../../apps/web/src/lib/blog-posts/interests";
import { segmentPosts } from "../../../apps/web/src/lib/blog-posts/segments";

interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  publishDate: string;
  author: string;
  readTime: string;
  bluf: string;
  heroImageAlt: string;
  heroGradient: string;
  content: string;
  faqs: { question: string; answer: string }[];
  internalLinks: { text: string; href: string }[];
  relatedSlugs: string[];
  tags: string[];
}

async function seedBlog() {
  console.log("Seeding blog posts...");

  const allPosts: BlogPost[] = [
    ...destinationPosts,
    ...brandPosts,
    ...interestPosts,
    ...segmentPosts,
  ];

  console.log(`Found ${allPosts.length} blog posts to seed.`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const post of allPosts) {
    try {
      const result = await db
        .insert(blogPosts)
        .values({
          slug: post.slug,
          title: post.title,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          category: post.category,
          publishDate: new Date(post.publishDate),
          author: post.author,
          readTime: post.readTime,
          bluf: post.bluf,
          heroImageAlt: post.heroImageAlt,
          heroGradient: post.heroGradient,
          content: post.content,
          faqs: JSON.stringify(post.faqs),
          internalLinks: JSON.stringify(post.internalLinks),
          relatedSlugs: JSON.stringify(post.relatedSlugs),
          tags: JSON.stringify(post.tags),
          isPublished: true,
        })
        .onConflictDoUpdate({
          target: blogPosts.slug,
          set: {
            title: post.title,
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
            category: post.category,
            publishDate: new Date(post.publishDate),
            author: post.author,
            readTime: post.readTime,
            bluf: post.bluf,
            heroImageAlt: post.heroImageAlt,
            heroGradient: post.heroGradient,
            content: post.content,
            faqs: JSON.stringify(post.faqs),
            internalLinks: JSON.stringify(post.internalLinks),
            relatedSlugs: JSON.stringify(post.relatedSlugs),
            tags: JSON.stringify(post.tags),
            updatedAt: new Date(),
          },
        });

      // onConflictDoUpdate always returns, so we count based on attempt
      inserted++;
    } catch (err) {
      console.error(`Error seeding post "${post.slug}":`, err);
      errors++;
    }
  }

  console.log(`Seeding complete: ${inserted} posts upserted, ${errors} errors.`);
  process.exit(0);
}

seedBlog().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
