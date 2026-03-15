import Link from "next/link";
import type { BlogPost } from "@/lib/blog-types";
import { getBlogPostBySlug } from "@/lib/blog-types";
import { FAQAccordion } from "@/components/FAQAccordion";
import { FAQSchema } from "@/components/FAQSchema";
import { SEOPreFooter } from "@/components/SEOPreFooter";
import { addBlogIllustrations } from "@/lib/blog-images";

interface BlogPostPageProps {
  post: BlogPost;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getCategoryLabel(category: BlogPost["category"]): string {
  const labels: Record<BlogPost["category"], string> = {
    destinations: "Destinations",
    brands: "Brands",
    interests: "Interests",
    segments: "Segments",
  };
  return labels[category];
}

function getCategoryColor(category: BlogPost["category"]): string {
  const colors: Record<BlogPost["category"], string> = {
    destinations: "bg-blue-100 text-blue-700",
    brands: "bg-purple-100 text-purple-700",
    interests: "bg-emerald-100 text-emerald-700",
    segments: "bg-amber-100 text-amber-700",
  };
  return colors[category];
}

export function BlogPostRenderer({ post }: BlogPostPageProps) {
  const relatedPosts = post.relatedSlugs
    .map((slug) => getBlogPostBySlug(slug))
    .filter((p): p is BlogPost => p !== null)
    .slice(0, 3);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Vacation Deals",
        item: "https://vacationdeals.to",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://vacationdeals.to/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://vacationdeals.to/${post.slug}`,
      },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishDate,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "VacationDeals.to",
      url: "https://vacationdeals.to",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://vacationdeals.to/${post.slug}`,
    },
  };

  return (
    <div>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-blue-600">
              Vacation Deals
            </Link>
          </li>
          <li>
            <span className="mx-1">/</span>
          </li>
          <li>
            <Link href="/blog" className="hover:text-blue-600">
              Blog
            </Link>
          </li>
          <li>
            <span className="mx-1">/</span>
          </li>
          <li className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-none">
            {post.title}
          </li>
        </ol>
      </nav>

      {/* BLUF Box */}
      <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50/60 p-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-blue-700">
          Bottom Line Up Front
        </h2>
        <p className="text-sm leading-relaxed text-gray-700">{post.bluf}</p>
      </div>

      {/* Hero */}
      <div
        className={`mb-10 rounded-2xl px-8 py-12 text-white bg-gradient-to-br ${post.heroGradient}`}
      >
        <span
          className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold ${getCategoryColor(post.category)}`}
        >
          {getCategoryLabel(post.category)}
        </span>
        <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
          <span>By {post.author}</span>
          <span className="hidden sm:inline">&middot;</span>
          <span>{formatDate(post.publishDate)}</span>
          <span className="hidden sm:inline">&middot;</span>
          <span>{post.readTime}</span>
        </div>
      </div>

      {/* Content Area */}
      <article className="blog-content mx-auto max-w-3xl text-gray-700">
        <div dangerouslySetInnerHTML={{ __html: addBlogIllustrations(post.content) }} />
      </article>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mx-auto mt-10 max-w-3xl">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* FAQs */}
      {post.faqs.length > 0 && (
        <>
          <FAQSchema faqs={post.faqs} />
          <section className="mt-16">
            <FAQAccordion faqs={post.faqs} />
          </section>
        </>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                href={`/${related.slug}`}
                className="deal-card group block rounded-xl border border-gray-200 bg-white overflow-hidden transition-all hover:-translate-y-0.5"
              >
                <div
                  className={`h-32 bg-gradient-to-br ${related.heroGradient}`}
                />
                <div className="p-5">
                  <span
                    className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryColor(related.category)}`}
                  >
                    {getCategoryLabel(related.category)}
                  </span>
                  <h3 className="mb-2 text-sm font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {related.readTime} &middot;{" "}
                    {formatDate(related.publishDate)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Internal Links */}
      {post.internalLinks.length > 0 && (
        <section className="mt-12 rounded-xl bg-gray-50 p-8">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Explore More Vacation Deals
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {post.internalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-blue-600 hover:underline"
              >
                {link.text}
              </Link>
            ))}
          </div>
        </section>
      )}

      <SEOPreFooter type="destinations" currentSlug={post.slug} />
    </div>
  );
}
