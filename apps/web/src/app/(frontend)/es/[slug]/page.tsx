import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DealGrid } from "@/components/DealGrid";
import { getDeals } from "@/lib/queries";
import { ES_DESTINATIONS } from "@/lib/i18n/es-destinations";
import { FAQAccordion } from "@/components/FAQAccordion";
import { FAQSchema } from "@/components/FAQSchema";
import { TrustedHtmlBlock } from "@/components/TrustedHtmlBlock";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ES_DESTINATIONS.map((d) => ({ slug: d.esSlug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dest = ES_DESTINATIONS.find((d) => d.esSlug === slug);
  if (!dest) return { title: "Página no encontrada" };

  return {
    title: dest.metaTitle,
    description: dest.metaDescription,
    alternates: {
      canonical: `https://vacationdeals.to/es/${slug}`,
      languages: {
        "es": `https://vacationdeals.to/es/${slug}`,
        "en": `https://vacationdeals.to/${dest.enSlug}`,
        "x-default": `https://vacationdeals.to/${dest.enSlug}`,
      },
    },
    openGraph: {
      title: dest.metaTitle,
      description: dest.metaDescription,
      locale: "es_MX",
      alternateLocale: "en_US",
      url: `https://vacationdeals.to/es/${slug}`,
      type: "website",
    },
  };
}

export default async function SpanishDestinationPage({ params }: Props) {
  const { slug } = await params;
  const dest = ES_DESTINATIONS.find((d) => d.esSlug === slug);
  if (!dest) notFound();

  const result = await getDeals({ destinationSlug: dest.enSlug, limit: 24 });
  const deals = result?.deals ?? [];
  const totalDeals = result?.total ?? 0;
  const cheapest = deals.length > 0 ? Math.min(...deals.map((d) => d.price)) : null;

  const hydratedFaqs = dest.faqs.map((f) => ({ question: f.q, answer: f.a }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Ofertas Vacacionales", item: "https://vacationdeals.to/" },
          { "@type": "ListItem", position: 2, name: "Destinos", item: "https://vacationdeals.to/es" },
          { "@type": "ListItem", position: 3, name: dest.cityName, item: `https://vacationdeals.to/es/${slug}` },
        ],
      },
      {
        "@type": "TouristDestination",
        "@id": `https://vacationdeals.to/es/${slug}#destination`,
        name: dest.cityName,
        description: dest.metaDescription,
        url: `https://vacationdeals.to/es/${slug}`,
        inLanguage: "es",
      },
      {
        "@type": "FAQPage",
        mainEntity: hydratedFaqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Language switcher */}
      <div className="mb-4 flex justify-end">
        <Link
          href={`/${dest.enSlug}`}
          className="text-sm text-gray-500 underline hover:text-blue-600"
          hrefLang="en"
        >
          English version →
        </Link>
      </div>

      <div className="mb-8 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 px-8 py-12 text-white">
        <h1 className="mb-2 text-3xl font-bold sm:text-4xl">{dest.h1}</h1>
        <p className="max-w-2xl text-lg text-white/90">{dest.heroSub}</p>
        {cheapest != null && (
          <p className="mt-2 text-sm font-medium text-white/80">
            {totalDeals} ofertas disponibles · desde ${cheapest}
          </p>
        )}
      </div>

      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/es" className="hover:text-blue-600">Ofertas Vacacionales</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">{dest.cityName}</li>
        </ol>
      </nav>

      <section className="mb-8 rounded-xl border border-gray-100 bg-gray-50 p-6 text-sm leading-relaxed text-gray-700">
        <TrustedHtmlBlock html={dest.aboutHtml} />
      </section>

      <div className="mb-4 text-sm text-gray-500">
        Mostrando {deals.length} oferta{deals.length !== 1 ? "s" : ""} en {dest.cityName}
      </div>

      <DealGrid deals={deals} />

      <section className="mt-16">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Preguntas Frecuentes</h2>
        <FAQAccordion faqs={hydratedFaqs} />
        <FAQSchema faqs={hydratedFaqs} />
      </section>

      <section className="mt-12 rounded-xl border border-gray-200 bg-white p-6 text-center">
        <h3 className="mb-2 text-lg font-bold text-gray-900">¿Prefieres la versión en inglés?</h3>
        <p className="mb-4 text-sm text-gray-600">
          También ofrecemos esta página en inglés con acceso a nuestra base completa de datos de ofertas.
        </p>
        <Link
          href={`/${dest.enSlug}`}
          className="inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          hrefLang="en"
        >
          View in English →
        </Link>
      </section>
    </div>
  );
}
