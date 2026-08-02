import Link from "next/link";
import type { TopicHub } from "@/lib/topic-hubs";
import { getClusterPages } from "@/lib/queries";
import { FAQAccordion } from "@/components/FAQAccordion";
import { FAQSchema } from "@/components/FAQSchema";
import { SEOPreFooter } from "@/components/SEOPreFooter";

const LEGAL_DISCLAIMER =
  "This is not legal advice. VacationDeals.to is a vacation-deal information site, not a law firm. Laws change and have exceptions. Verify against the official statute linked on each page and consult a licensed attorney in your state before acting.";

export async function TopicHubRenderer({ hub }: { hub: TopicHub }) {
  const children = await getClusterPages(hub.cluster);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Vacation Deals", item: "https://vacationdeals.to" },
      { "@type": "ListItem", position: 2, name: hub.title, item: `https://vacationdeals.to/${hub.slug}` },
    ],
  };
  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: hub.title,
    description: hub.metaDescription,
    url: `https://vacationdeals.to/${hub.slug}`,
    hasPart: children.slice(0, 100).map((c) => ({
      "@type": "WebPage",
      name: c.title.replace(/\s*\|\s*VacationDeals\.to\s*$/i, "").trim(),
      url: `https://vacationdeals.to/${c.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collection).replace(/</g, "\\u003c") }} />

      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-blue-600">Vacation Deals</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{hub.title}</span>
      </nav>

      <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">{hub.h1}</h1>

      {hub.legal && (
        <div className="my-4 rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>This is not legal advice.</strong> {LEGAL_DISCLAIMER.replace("This is not legal advice. ", "")}
        </div>
      )}

      <p className="mb-8 text-lg text-gray-700">{hub.intro}</p>

      {/* Full child link-grid — links DOWN to every page in the cluster */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          All {children.length} pages in this guide
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {children.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="rounded-lg border border-gray-200 px-4 py-3 text-sm text-blue-700 hover:border-blue-300 hover:bg-blue-50"
            >
              {c.title.replace(/\s*\|\s*VacationDeals\.to\s*$/i, "").trim()}
            </Link>
          ))}
        </div>
      </section>

      {hub.legal && (
        <p className="mb-6 text-xs text-gray-500">
          Reminder — the information on these pages is general and not legal advice; confirm the current statute and consult a licensed attorney.
        </p>
      )}

      {hub.faqs.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Frequently asked questions</h2>
          <FAQAccordion faqs={hub.faqs} />
          <FAQSchema faqs={hub.faqs} />
        </section>
      )}

      <SEOPreFooter type="destinations" currentSlug={hub.slug} />
    </div>
  );
}
