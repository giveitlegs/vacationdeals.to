import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About — Independent Vacation Deal Comparison",
  alternates: { canonical: "https://vacationdeals.to/about" },
  description:
    "VacationDeals.to is an independent comparison site for vacation deals from timeshare resorts. Learn how we aggregate resort deals from top brands to help you find the best prices.",
  openGraph: {
    title: "About VacationDeals.to",
    description:
      "Independent comparison site for vacation deals from timeshare resorts. We aggregate deals from top resort brands so you can compare and save.",
    type: "website",
    url: "https://vacationdeals.to/about",
  },
};

export default function AboutPage() {
  // Schema.org Organization JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VacationDeals.to",
    url: "https://vacationdeals.to",
    description:
      "Independent comparison site for timeshare vacation packages from top resort brands.",
    dateModified: new Date().toISOString(),
    sameAs: [],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Vacation Deals", "item": "https://vacationdeals.to" },
            { "@type": "ListItem", "position": 2, "name": "About", "item": "https://vacationdeals.to/about" },
          ],
        }) }}
      />

      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-blue-600">
              Vacation Deals
            </Link>
          </li>
          <li>
            <span className="mx-1">/</span>
            <span className="font-medium text-gray-900">About</span>
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          About VacationDeals.to
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          The independent comparison site for timeshare vacation packages.
        </p>
      </div>

      {/* Content sections */}
      <div className="mx-auto max-w-3xl">
        {/* What we do */}
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-bold text-gray-900">
            What Is VacationDeals.to?
          </h2>
          <div className="space-y-3 text-gray-600 leading-relaxed">
            <p>
              VacationDeals.to is a free comparison site that helps travelers
              find the best vacation package deals from timeshare resort brands
              and third-party brokers. We aggregate publicly available offers
              from companies like Westgate Reservations, Hilton Grand Vacations,
              Marriott Vacation Club, Club Wyndham, BookVIP, and many more —
              all in one easy-to-browse interface.
            </p>
            <p>
              Our goal is simple: make it easy to compare prices, inclusions,
              and destinations so you can make an informed decision about your
              next vacation.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-bold text-gray-900">
            How It Works
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  We Collect Deals
                </h3>
                <p className="text-sm text-gray-600">
                  Our system monitors vacation package offers from dozens of
                  timeshare resort brands and third-party brokers. We track
                  prices, inclusions, eligibility requirements, and
                  availability so you don&apos;t have to visit each site
                  individually.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  You Compare &amp; Choose
                </h3>
                <p className="text-sm text-gray-600">
                  Filter deals by destination, brand, price, or trip length.
                  Every listing shows upfront pricing, what&apos;s included,
                  and any requirements — no hidden catches.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Book Direct With the Provider
                </h3>
                <p className="text-sm text-gray-600">
                  When you find a deal you like, click through to the
                  resort&apos;s or broker&apos;s website to book directly. We
                  never handle payments or reservations — you deal directly
                  with the provider.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What are vacation packages */}
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-bold text-gray-900">
            What Are Timeshare Vacation Deals?
          </h2>
          <div className="space-y-3 text-gray-600 leading-relaxed">
            <p>
              Timeshare vacation packages — also called &quot;vacpacks&quot; or
              &quot;preview packages&quot; — are deeply discounted resort stays
              offered by timeshare companies as a marketing tool. In exchange
              for the reduced rate (often 60-80% below retail), guests agree to
              attend a timeshare sales presentation, typically lasting 90-120
              minutes, during their stay.
            </p>
            <p>
              These packages are a legitimate way to enjoy luxury resort
              accommodations at a fraction of the normal cost. You are never
              obligated to purchase a timeshare — the presentation is simply the
              &quot;cost&quot; of the discounted stay.
            </p>
            <p>
              Eligibility requirements vary by provider but commonly include
              minimum age (usually 25-30), minimum household income (typically
              $50,000-$75,000), and being married or cohabiting with a partner.
              Some packages require valid credit card verification.
            </p>
          </div>
        </section>

        {/* Disclaimer box */}
        <section className="mb-10 rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="mb-3 text-lg font-bold text-gray-900">
            Disclaimer
          </h2>
          <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
            <p>
              VacationDeals.to is an <strong>independent comparison website</strong>.
              We are not affiliated with, endorsed by, or sponsored by any
              resort company, timeshare brand, or booking broker listed on our
              site.
            </p>
            <p>
              All deal information is aggregated from publicly available sources
              and is provided for informational purposes only. Prices,
              availability, inclusions, and eligibility requirements are
              subject to change at any time without notice. We make every effort
              to keep information accurate and up-to-date, but we cannot
              guarantee the accuracy of any listing.
            </p>
            <p>
              Always verify deal details, terms, and conditions directly with
              the provider before making a booking decision.
            </p>
          </div>
        </section>

        {/* Links */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Learn More
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/deals"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600"
            >
              Browse All Deals
            </Link>
            <Link
              href="/terms"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              href="/privacy"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600"
            >
              Privacy Policy
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
