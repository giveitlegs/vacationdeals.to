import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllBlogPosts,
  getBlogPostsByCategory,
  getFeaturedBlogPosts,
} from "@/lib/blog-types";
import type { BlogPost } from "@/lib/blog-types";
import { SEOPreFooter } from "@/components/SEOPreFooter";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return {
    title: "Vacation Deals Blog",
    description:
      "Expert tips, destination guides, and insider knowledge for getting the best vacation deals. Learn how to save up to 80% on resort stays.",
    alternates: { canonical: "https://vacationdeals.to/blog" },
    openGraph: {
      title: "Vacation Deals Blog",
      description:
        "Expert tips, destination guides, and insider knowledge for getting the best vacation deals.",
      url: "https://vacationdeals.to/blog",
      type: "website",
    },
  };
}

const categories = [
  { value: "all", label: "All" },
  { value: "destinations", label: "Destinations" },
  { value: "brands", label: "Brands" },
  { value: "interests", label: "Interests" },
  { value: "segments", label: "Segments" },
] as const;

function getCategoryColor(category: BlogPost["category"]): string {
  const colors: Record<BlogPost["category"], string> = {
    destinations: "bg-blue-100 text-blue-700",
    brands: "bg-purple-100 text-purple-700",
    interests: "bg-emerald-100 text-emerald-700",
    segments: "bg-amber-100 text-amber-700",
  };
  return colors[category];
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

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface BlogPageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { category: categoryParam, page: pageParam } = await searchParams;
  const POSTS_PER_PAGE = 48;

  const activeCategory = categoryParam || "all";
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10));

  const allPosts =
    activeCategory === "all"
      ? getAllBlogPosts()
      : getBlogPostsByCategory(activeCategory as BlogPost["category"]);

  const featured = getFeaturedBlogPosts(3);
  const showFeatured = activeCategory === "all" && currentPage === 1;

  // For grid: exclude featured posts if shown
  const gridPosts = showFeatured
    ? allPosts.filter((p) => !featured.some((f) => f.slug === p.slug))
    : allPosts;

  const totalPages = Math.max(1, Math.ceil(gridPosts.length / POSTS_PER_PAGE));
  const paginatedPosts = gridPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

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
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Vacation Deals Blog",
    description:
      "Expert tips, destination guides, and insider knowledge for getting the best vacation deals.",
    url: "https://vacationdeals.to/blog",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: allPosts.length,
      itemListElement: allPosts.slice(0, 10).map((post, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Article",
          headline: post.title,
          url: `https://vacationdeals.to/${post.slug}`,
        },
      })),
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      {/* Hero */}
      <div className="mb-10 rounded-2xl bg-gradient-to-br from-blue-50 via-white to-emerald-50 border border-gray-100 px-8 py-12 text-center">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">
          Vacation Deals Blog
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Expert tips, destination guides, and insider knowledge to help you get
          the most out of timeshare vacation deals.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.value;
          const href =
            cat.value === "all" ? "/blog" : `/blog?category=${cat.value}`;
          return (
            <Link
              key={cat.value}
              href={href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>

      {/* Featured Posts */}
      {showFeatured && featured.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Featured Articles
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {featured.map((post) => (
              <Link
                key={post.slug}
                href={`/${post.slug}`}
                className="deal-card group block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5"
              >
                <div className={`h-40 bg-gradient-to-br ${post.heroGradient}`} />
                <div className="p-6">
                  <span
                    className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryColor(post.category)}`}
                  >
                    {getCategoryLabel(post.category)}
                  </span>
                  <h3 className="mb-2 text-lg font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mb-3 text-sm text-gray-500 line-clamp-2">
                    {post.bluf}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{formatDate(post.publishDate)}</span>
                    <span>&middot;</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Post Count */}
      <div className="mb-4 text-sm text-gray-500">
        {allPosts.length} article{allPosts.length !== 1 ? "s" : ""}
        {activeCategory !== "all" ? ` in ${activeCategory}` : ""}
        {totalPages > 1 ? ` — Page ${currentPage} of ${totalPages}` : ""}
      </div>

      {/* Posts Grid */}
      {paginatedPosts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/${post.slug}`}
                className="deal-card group block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5"
              >
                <div className={`h-32 bg-gradient-to-br ${post.heroGradient}`} />
                <div className="p-5">
                  <span
                    className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryColor(post.category)}`}
                  >
                    {getCategoryLabel(post.category)}
                  </span>
                  <h3 className="mb-2 text-sm font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mb-3 text-xs text-gray-500 line-clamp-2">
                    {post.bluf}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{formatDate(post.publishDate)}</span>
                    <span>&middot;</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/blog?${activeCategory !== "all" ? `category=${activeCategory}&` : ""}page=${currentPage - 1}`}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Previous
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Link
                    key={page}
                    href={`/blog?${activeCategory !== "all" ? `category=${activeCategory}&` : ""}page=${page}`}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      page === currentPage
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {page}
                  </Link>
                ),
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/blog?${activeCategory !== "all" ? `category=${activeCategory}&` : ""}page=${currentPage + 1}`}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <p className="text-lg font-medium text-gray-500">
            No blog posts yet. Check back soon!
          </p>
          <p className="mt-2 text-sm text-gray-400">
            We are working on expert guides and destination insights.
          </p>
        </div>
      )}

      <SEOPreFooter type="destinations" currentSlug="" />
    </div>
  );
}
