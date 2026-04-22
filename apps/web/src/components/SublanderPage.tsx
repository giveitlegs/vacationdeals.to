import Link from "next/link";
import type { Deal } from "@/components/DealCard";
import { DealGrid } from "@/components/DealGrid";
import { CityModifierSubnav, type SubnavItem } from "@/components/CityModifierSubnav";
import { FAQAccordion } from "@/components/FAQAccordion";
import { FAQSchema } from "@/components/FAQSchema";
import {
  MODIFIERS,
  CITY_SUBLANDERS,
  getModifiersForCity,
  pickBlurb,
} from "@vacationdeals/shared";
import type { Modifier } from "@vacationdeals/shared";
import type { SublanderOverride } from "@/lib/sublander-overrides";
import { getRelatedBlogPosts } from "@/lib/related-blog-posts";

interface Props {
  citySlug: string;
  cityName: string;
  cityState: string;
  modifier: Modifier;
  deals: Deal[];
  totalDeals: number;
  override: SublanderOverride;
}

function prettyCity(slug: string) {
  return slug.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");
}

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(String(v));
  }
  return out;
}

function splitToParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);
}

function buildSubnav(citySlug: string, currentModifierSlug: string): SubnavItem[] {
  const mods = getModifiersForCity(citySlug);
  return mods.map((m) => ({
    label: m.chipLabel || m.label,
    href: `/${citySlug}-${m.slug}`,
    isActive: m.slug === currentModifierSlug,
  }));
}

export async function SublanderPage({
  citySlug,
  cityName,
  cityState,
  modifier,
  deals,
  totalDeals,
  override,
}: Props) {
  const relatedBlogs = await getRelatedBlogPosts(citySlug, modifier, 4);
  const h1 = `Vacation Deals in ${cityName} ${modifier.h1Fragment}`.replace(/\s+/g, " ").trim();
  const lowPrice = deals.length > 0 ? Math.min(...deals.map((d) => d.price)) : null;
  const brandCount = new Set(deals.map((d) => d.brandSlug)).size;
  const durationSample = deals[0] ? `${deals[0].durationDays}D/${deals[0].durationNights}N` : "3D/2N";

  const templateVars = {
    city: cityName,
    cityState: `${cityName}, ${cityState}`,
    dealCount: String(totalDeals || deals.length),
    lowPrice: lowPrice != null ? String(lowPrice) : "99",
    brandCount: String(brandCount),
    durationSample,
    cityBlurb: pickBlurb(citySlug, modifier.slug),
    commonInclusions: "pool access, kitchen or kitchenette, on-site resort amenities",
  };

  // Prefer admin override (plain text, not HTML — each line becomes a paragraph).
  // Fall back to the coded template. Admin overrides are stored as plain text,
  // which is why we split to paragraphs rather than injecting raw HTML.
  const rawIntro = override.customIntroHtml
    ? override.customIntroHtml
    : fillTemplate(modifier.introTemplate, templateVars);
  const introParagraphs = splitToParagraphs(rawIntro);

  const canonical = `https://vacationdeals.to/${citySlug}-${modifier.slug}`;
  const subnavItems = buildSubnav(citySlug, modifier.slug);

  // --- Schema: BreadcrumbList + CollectionPage + ItemList of offers + FAQPage
  const graph: unknown[] = [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Vacation Deals", "item": "https://vacationdeals.to/" },
        { "@type": "ListItem", "position": 2, "name": "Vacation Destinations", "item": "https://vacationdeals.to/destinations" },
        { "@type": "ListItem", "position": 3, "name": `${cityName} Vacation Deals`, "item": `https://vacationdeals.to/${citySlug}` },
        { "@type": "ListItem", "position": 4, "name": h1, "item": canonical },
      ],
    },
    {
      "@type": "CollectionPage",
      "@id": `${canonical}#page`,
      "url": canonical,
      "name": h1,
      "about": { "@type": "TouristDestination", "name": `${cityName}, ${cityState}` },
      "isPartOf": { "@id": `https://vacationdeals.to/${citySlug}#page` },
    },
  ];

  if (deals.length > 0) {
    graph.push({
      "@type": "ItemList",
      "@id": `${canonical}#offers`,
      "numberOfItems": deals.length,
      "itemListElement": deals.slice(0, 25).map((d, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "Offer",
          "name": d.title,
          "price": d.price,
          "priceCurrency": "USD",
          "url": `https://vacationdeals.to/deals/${d.slug}`,
          "seller": { "@type": "Organization", "name": d.brandName },
          "availability": "https://schema.org/InStock",
          // 30-day soft validity unless deal has an explicit expiration
          "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        },
      })),
    });
  }

  const hydratedFaqs = modifier.faqs?.map((f) => ({
    question: f.q.replace("{{city}}", cityName),
    answer: f.a.replace("{{city}}", cityName),
  })) ?? [];

  if (hydratedFaqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "mainEntity": hydratedFaqs.map((f) => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer },
      })),
    });
  }

  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  // --- Sibling modifiers grouped for the prefooter
  const allModifiers = (CITY_SUBLANDERS[citySlug] || [])
    .map((s) => MODIFIERS[s])
    .filter(Boolean) as Modifier[];
  const byType: Record<string, Modifier[]> = {};
  for (const m of allModifiers) {
    if (m.slug === modifier.slug) continue;
    (byType[m.type] ||= []).push(m);
  }
  const typeLabels: Record<string, string> = {
    audience: "By Traveler",
    season: "By Season",
    occasion: "By Occasion",
    budget: "By Budget",
    duration: "By Duration",
    interest: "By Interest",
  };

  // --- Related cities (same modifier, different cities)
  const relatedCities = Object.entries(CITY_SUBLANDERS)
    .filter(([city, slugs]) => city !== citySlug && slugs.includes(modifier.slug))
    .map(([city]) => city)
    .slice(0, 8);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 px-8 py-10 text-white">
        <h1 className="mb-2 text-3xl font-bold sm:text-4xl">{h1}</h1>
        <p className="max-w-2xl text-lg text-white/90">
          {totalDeals} {modifier.metaBlurb} vacation deal{totalDeals !== 1 ? "s" : ""} in {cityName}
          {lowPrice != null ? `, from $${lowPrice}` : ""}.
        </p>
      </div>

      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/destinations" className="hover:text-blue-600">Vacation Destinations</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href={`/${citySlug}`} className="hover:text-blue-600">{cityName}</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">{modifier.label}</li>
        </ol>
      </nav>

      {/* Intro content (SEO content block at top) — paragraphs rendered as
          React nodes; no innerHTML, so admin override is safe by default. */}
      <section className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-5 text-sm leading-relaxed text-gray-700 sm:p-6">
        {introParagraphs.map((p, i) => (
          <p key={i} className={i > 0 ? "mt-3" : ""}>{p}</p>
        ))}
      </section>

      {/* Sub-nav (matches the green-box placement on parent pages) */}
      <CityModifierSubnav
        cityName={cityName}
        citySlug={citySlug}
        items={subnavItems}
        showParentChip
      />

      {/* Results meta */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {deals.length} deal{deals.length !== 1 ? "s" : ""} in {cityName} {modifier.h1Fragment}
      </div>

      <DealGrid deals={deals} />

      {/* FAQ */}
      {hydratedFaqs.length > 0 && (
        <>
          <FAQSchema faqs={hydratedFaqs} />
          <section className="mt-16">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              FAQs about {cityName} {modifier.h1Fragment}
            </h2>
            <FAQAccordion faqs={hydratedFaqs} />
          </section>
        </>
      )}

      {/* Sublander pre-footer */}
      <section className="mt-16 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">More {cityName} vacation deal categories</h2>
          <Link
            href={`/${citySlug}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            View all {cityName} deals →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(byType).map(([type, mods]) => (
            <div key={type}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">{typeLabels[type] || type}</h3>
              <ul className="space-y-1">
                {mods.map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/${citySlug}-${m.slug}`}
                      className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-white hover:text-blue-600"
                    >
                      {cityName} {m.h1Fragment}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {relatedBlogs.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Related reading</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {relatedBlogs.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/${p.slug}`}
                    className="block rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-blue-400 hover:bg-blue-50"
                  >
                    <p className="text-sm font-semibold text-gray-900">{p.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{p.metaDescription}</p>
                    <p className="mt-1 text-xs text-blue-600">{p.readTime} →</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {relatedCities.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Same category, other cities</h3>
            <div className="flex flex-wrap gap-2">
              {relatedCities.map((c) => (
                <Link
                  key={c}
                  href={`/${c}-${modifier.slug}`}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-blue-400 hover:text-blue-600"
                >
                  {prettyCity(c)} {modifier.h1Fragment}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
