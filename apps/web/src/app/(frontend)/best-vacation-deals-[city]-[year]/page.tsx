import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DealCard } from "@/components/DealCard";
import { FAQAccordion } from "@/components/FAQAccordion";
import { FAQSchema } from "@/components/FAQSchema";
import { getDeals } from "@/lib/queries";
import { LISTICLES } from "@/lib/listicles";
import type { ListicleConfig } from "@/lib/listicles";

export const revalidate = 3600; // 1h

interface Props {
  params: Promise<{ city: string; year: string }>;
}

export async function generateStaticParams() {
  return LISTICLES.map((l) => ({ city: l.citySlug, year: String(l.year) }));
}

function findConfig(city: string, year: string): ListicleConfig | undefined {
  return LISTICLES.find((l) => l.citySlug === city && String(l.year) === year);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, year } = await params;
  const cfg = findConfig(city, year);
  if (!cfg) return { title: "Not Found" };

  const title = `10 Best Vacation Deals in ${cfg.cityName} ${year} — Live Rankings`;
  const description = `Top 10 vacation deals in ${cfg.cityName}, ${cfg.stateOrCountry} for ${year}. Ranked by price, quality, and inclusions. Live data — refreshed every 6 hours.`;

  return {
    title,
    description,
    alternates: { canonical: `https://vacationdeals.to/best-vacation-deals-${city}-${year}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://vacationdeals.to/best-vacation-deals-${city}-${year}`,
    },
  };
}

export default async function ListiclePage({ params }: Props) {
  const { city, year } = await params;
  const cfg = findConfig(city, year);
  if (!cfg) notFound();

  const result = await getDeals({
    destinationSlug: cfg.citySlug,
    limit: 10,
    sortBy: "price-asc",
  });
  const deals = result?.deals ?? [];

  const canonical = `https://vacationdeals.to/best-vacation-deals-${city}-${year}`;
  const introParagraphs = cfg.intro.split(/\n{2,}/).filter(Boolean);

  // Schema emission: JSON-LD is generated from our own config + DB, never user input.
  // dangerouslySetInnerHTML is the Next.js standard pattern for <script type="application/ld+json">.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Vacation Deals", item: "https://vacationdeals.to/" },
          { "@type": "ListItem", position: 2, name: `${cfg.cityName} Vacation Deals`, item: `https://vacationdeals.to/${cfg.citySlug}` },
          { "@type": "ListItem", position: 3, name: `Best of ${cfg.year}`, item: canonical },
        ],
      },
      {
        "@type": "BlogPosting",
        "@id": `${canonical}#article`,
        headline: `10 Best Vacation Deals in ${cfg.cityName} ${cfg.year}`,
        description: `Top 10 vacation deals in ${cfg.cityName} for ${cfg.year}, ranked and refreshed every 6 hours.`,
        author: {
          "@type": "Organization",
          name: "VacationDeals.to Editorial",
          url: "https://vacationdeals.to/about",
        },
        publisher: {
          "@type": "Organization",
          name: "VacationDeals.to",
          url: "https://vacationdeals.to",
        },
        datePublished: `${cfg.year}-01-01`,
        dateModified: new Date().toISOString(),
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        articleSection: `${cfg.cityName} Deals`,
      },
      {
        "@type": "ItemList",
        "@id": `${canonical}#deals`,
        name: `Best ${cfg.cityName} Vacation Deals ${cfg.year}`,
        numberOfItems: deals.length,
        itemListElement: deals.map((d, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Offer",
            name: d.title,
            price: d.price,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `https://vacationdeals.to/deals/${d.slug}`,
            seller: { "@type": "Organization", name: d.brandName },
            priceValidUntil: new Date(Date.now() + 30 * 86_400_000).toISOString().split("T")[0],
          },
        })),
      },
      ...(cfg.faqs.length > 0
        ? [{
            "@type": "FAQPage",
            mainEntity: cfg.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }]
        : []),
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">Live Rankings · Updated every 6 hours</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          10 Best Vacation Deals in {cfg.cityName} {cfg.year}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/90">
          Ranked by our editors against live DB pricing. Refreshed every 6 hours.
          {deals.length > 0 && ` Current #1 starts at $${deals[0].price}.`}
        </p>
      </div>

      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href={`/${cfg.citySlug}`} className="hover:text-blue-600">{cfg.cityName} Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Best of {cfg.year}</li>
        </ol>
      </nav>

      <section className="mb-10 text-base leading-relaxed text-gray-700">
        {introParagraphs.map((p, i) => (
          <p key={i} className="mb-4">{p}</p>
        ))}
      </section>

      {deals.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-lg text-gray-500">No active deals right now. Check back shortly.</p>
        </div>
      ) : (
        <>
          <section className="space-y-6">
            {deals.map((d, i) => {
              const rank = i + 1;
              const commentary = rank === 1 ? cfg.rank1Commentary
                : rank === 2 ? cfg.rank2Commentary
                : rank === 3 ? cfg.rank3Commentary
                : null;
              return (
                <article key={d.slug} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-baseline gap-3">
                    <span className="text-3xl font-black text-blue-600">#{rank}</span>
                    <h2 className="flex-1 text-xl font-bold text-gray-900">{d.title}</h2>
                  </div>
                  {commentary && (
                    <p className="mb-4 border-l-4 border-blue-500 pl-4 text-sm italic text-gray-600">
                      {commentary}
                    </p>
                  )}
                  <DealCard deal={d} />
                </article>
              );
            })}
          </section>

          <section className="mt-12 rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="mb-3 text-xl font-bold text-amber-900">
              5 {cfg.cityName} vacpack tips you won&apos;t find elsewhere
            </h2>
            <ol className="ml-6 space-y-2 text-sm text-amber-900 list-decimal">
              {cfg.uniqueTips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ol>
          </section>

          <section className="mt-12">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              {cfg.cityName} Vacation Deal FAQs
            </h2>
            <FAQAccordion faqs={cfg.faqs.map((f) => ({ question: f.q, answer: f.a }))} />
            <FAQSchema faqs={cfg.faqs.map((f) => ({ question: f.q, answer: f.a }))} />
          </section>
        </>
      )}

      <section className="mt-16 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6">
        <h2 className="mb-4 text-xl font-bold text-gray-900">More {cfg.cityName} resources</h2>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${cfg.citySlug}`} className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-200">
            All {cfg.cityName} deals →
          </Link>
          <Link href={`/${cfg.citySlug}-for-families`} className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">
            {cfg.cityName} for families
          </Link>
          <Link href={`/${cfg.citySlug}-under-199`} className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">
            {cfg.cityName} under $199
          </Link>
          <Link href={`/${cfg.citySlug}-weekend`} className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">
            {cfg.cityName} weekends
          </Link>
          <Link href={`/${cfg.citySlug}-bundles`} className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">
            {cfg.cityName} bundles
          </Link>
        </div>
      </section>
    </div>
  );
}
