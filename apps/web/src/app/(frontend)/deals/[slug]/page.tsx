import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDealBySlug, getDeals } from "@/lib/queries";
import { DealGrid } from "@/components/DealGrid";
import type { Deal } from "@/components/DealCard";
import { getCityIcon } from "@/lib/city-icons";
import { generateDealFAQs } from "@/lib/faqs";
import { FAQAccordion } from "@/components/FAQAccordion";
import { FAQSchema } from "@/components/FAQSchema";
import { StickyDealBar } from "@/components/StickyDealBar";

export const revalidate = 3600;

interface DealPageProps {
  params: Promise<{ slug: string }>;
}

// ---------------------------------------------------------------------------
// Destination gradient map (shared with DealCard)
// ---------------------------------------------------------------------------

const destinationGradients: Record<string, string> = {
  Orlando: "from-blue-400 to-cyan-300",
  "Las Vegas": "from-amber-400 to-orange-500",
  Cancun: "from-teal-400 to-emerald-300",
  Gatlinburg: "from-green-500 to-emerald-600",
  "Myrtle Beach": "from-sky-400 to-blue-500",
  Branson: "from-rose-400 to-pink-500",
  Williamsburg: "from-violet-400 to-purple-500",
  "San Antonio": "from-orange-400 to-red-500",
  Miami: "from-cyan-400 to-blue-500",
  Nashville: "from-yellow-400 to-amber-500",
};

function getGradient(city: string | null): string {
  if (!city) return "from-indigo-400 to-purple-500";
  return destinationGradients[city] ?? "from-indigo-400 to-purple-500";
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: DealPageProps): Promise<Metadata> {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);

  if (!deal) {
    return { title: "Deal Not Found" };
  }

  const location = [deal.city, deal.state].filter(Boolean).join(", ");
  const isEvent = deal.brandSlug === "westgate-events";
  const title = isEvent
    ? `${deal.title} — ${deal.durationNights}-Night Package from $${deal.price}`
    : `${deal.resortName || deal.title} — ${deal.durationNights}-Night Stay from $${deal.price}`;
  const description = isEvent
    ? `${deal.title} vacation package: ${deal.description || `${deal.durationNights} nights + event tickets from $${deal.price}.`} Compare event deals at VacationDeals.to.`
    : `Book a ${deal.durationNights}-night vacation deal at ${deal.resortName || deal.title} in ${location} for just $${deal.price}. ${deal.originalPrice ? `Save ${deal.savingsPercent}% off the $${deal.originalPrice} retail price.` : ""} Compare resort deals at VacationDeals.to.`;

  return {
    title,
    description,
    alternates: { canonical: `https://vacationdeals.to/deals/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://vacationdeals.to/deals/${slug}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function DealPage({ params }: DealPageProps) {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);

  if (!deal) {
    notFound();
  }

  const location = [deal.city, deal.state].filter(Boolean).join(", ");
  const gradient = getGradient(deal.city);
  const CityIconComponent = deal.city ? getCityIcon(deal.city) : null;

  // Fetch similar deals (same destination, exclude current)
  let similarDeals: Deal[] = [];
  if (deal.destinationSlug) {
    const result = await getDeals({
      destinationSlug: deal.destinationSlug,
      limit: 3,
      page: 1,
      sortBy: "price-asc",
    });
    if (result) {
      similarDeals = result.deals.filter((d) => d.slug !== deal.slug).slice(0, 3);
    }
  }

  // Generate deal-specific FAQs
  const faqs = generateDealFAQs({
    title: deal.title,
    resortName: deal.resortName,
    city: deal.city,
    state: deal.state,
    price: Number(deal.price),
    originalPrice: deal.originalPrice ? Number(deal.originalPrice) : null,
    durationNights: deal.durationNights,
    durationDays: deal.durationDays,
    brandName: deal.brandName,
    savingsPercent: deal.savingsPercent,
    inclusions: deal.inclusions || [],
  });

  // Schema.org Product/Offer JSON-LD
  const isWestgateEvent = deal.brandSlug === "westgate-events";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: deal.title,
    description: deal.description || `${deal.durationNights}-night vacation deal at ${deal.resortName || deal.title} in ${location}.`,
    dateModified: new Date().toISOString(),
    image: deal.imageUrl || undefined,
    brand: deal.brandName
      ? { "@type": "Brand", name: deal.brandName }
      : undefined,
    offers: {
      "@type": "Offer",
      price: deal.price,
      priceCurrency: "USD",
      availability: deal.isActive ? "https://schema.org/InStock" : "https://schema.org/Discontinued",
      url: deal.url,
      ...(deal.originalPrice
        ? {
            priceValidUntil: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            )
              .toISOString()
              .split("T")[0],
          }
        : {}),
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".deal-price", "[data-deal-summary]"],
    },
  };

  // Schema.org Event JSON-LD for Westgate Events deals
  let eventJsonLd: Record<string, unknown> | null = null;

  if (isWestgateEvent) {
    // Parse event dates from travel window (e.g. "Mar 19 - Mar 21, 2026")
    let startDate: string | undefined;
    let endDate: string | undefined;
    if (deal.travelWindow) {
      const dateMatch = deal.travelWindow.match(
        /([A-Z][a-z]+)\s+(\d{1,2})\s*[-–]\s*(?:([A-Z][a-z]+)\s+)?(\d{1,2}),?\s*(\d{4})/,
      );
      if (dateMatch) {
        const MONTHS: Record<string, string> = {
          Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
          Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
        };
        const sMonth = MONTHS[dateMatch[1]] || "01";
        const sDay = dateMatch[2].padStart(2, "0");
        const eMonthName = dateMatch[3] || dateMatch[1];
        const eMonth = MONTHS[eMonthName] || sMonth;
        const eDay = dateMatch[4].padStart(2, "0");
        const year = dateMatch[5];
        startDate = `${year}-${sMonth}-${sDay}`;
        endDate = `${year}-${eMonth}-${eDay}`;
      }
    }

    // Extract the actual event name from the SEO title
    // Format: "Discount {EventName} {Type} Tickets {City} at {Venue}"
    let eventName: string | null = null;
    const titleLower = deal.title.toLowerCase();

    // Extract event name: between "Discount " and type keyword
    const eventNameMatch = deal.title.match(
      /^Discount\s+(.+?)\s+(?:Concert|Comedy Show|Show|NASCAR|NFL|NBA|NHL|MLB|Fight|Sports|)\s*Tickets/i,
    );
    if (eventNameMatch) {
      eventName = eventNameMatch[1].trim();
    }

    // Determine performer from event name
    let performerName: string | null = eventName;
    let performerType: string | null = null;

    if (performerName) {
      if (titleLower.includes("concert")) {
        performerType = "MusicGroup";
      } else if (titleLower.includes("comedy")) {
        performerType = "Person";
      } else if (titleLower.includes("nascar") || titleLower.includes("sports") ||
                 titleLower.includes("nfl") || titleLower.includes("nba")) {
        // For sports events, the event name IS the event, not a performer
        performerType = null;
        performerName = null;
      }
    }

    // Extract venue from title: "... at {Venue}"
    let venueName: string | null = null;
    const venueMatch = deal.title.match(/\bat\s+(.+)$/i);
    if (venueMatch) {
      venueName = venueMatch[1].trim();
    }

    // Determine event @type based on title keywords
    let eventType = "Event";
    if (titleLower.includes("concert")) {
      eventType = "MusicEvent";
    } else if (titleLower.includes("nascar") || titleLower.includes("sports") ||
               titleLower.includes("nfl") || titleLower.includes("nba") ||
               titleLower.includes("nhl") || titleLower.includes("mlb")) {
      eventType = "SportsEvent";
    } else if (titleLower.includes("comedy")) {
      eventType = "ComedyEvent";
    } else if (titleLower.includes("show")) {
      eventType = "TheaterEvent";
    }

    eventJsonLd = {
      "@context": "https://schema.org",
      "@type": eventType,
      name: eventName || deal.title,
      description: deal.description || `Discounted event tickets with ${deal.durationNights}-night resort stay included.`,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: deal.isActive ? "https://schema.org/EventScheduled" : "https://schema.org/EventCancelled",
      location: {
        "@type": "Place",
        ...(venueName ? { name: venueName } : { name: deal.resortName || "Westgate Resort" }),
        address: {
          "@type": "PostalAddress",
          ...(deal.city ? { addressLocality: deal.city } : {}),
          ...(deal.state ? { addressRegion: deal.state } : {}),
          addressCountry: "US",
        },
      },
      offers: {
        "@type": "Offer",
        price: deal.price,
        priceCurrency: "USD",
        availability: deal.isActive ? "https://schema.org/InStock" : "https://schema.org/Discontinued",
        url: `https://vacationdeals.to/deals/${slug}`,
        validFrom: new Date().toISOString().split("T")[0],
      },
      ...(performerName && performerType
        ? {
            performer: {
              "@type": performerType,
              name: performerName,
            },
          }
        : {}),
      organizer: {
        "@type": "Organization",
        name: "Westgate Events",
        url: "https://westgateevents.com",
      },
    };
  }

  // Hotel + Offer MTE (Multi-Type Entity) Schema
  // Combines LodgingBusiness schema with Offer pricing so Google understands
  // these are resort deals with bookable rates. Automatically updates when
  // scrapers detect rate or offer changes. Similar to Westgate Resorts' approach.
  let hotelMteJsonLd: Record<string, unknown> | null = null;

  if (deal.resortName && deal.isActive) {
    const hotelType = isWestgateEvent
      ? ["Hotel", "LodgingBusiness", "EventVenue"]
      : ["Hotel", "LodgingBusiness"];

    const now = new Date();
    const validThrough = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    hotelMteJsonLd = {
      "@context": "https://schema.org",
      "@type": hotelType,
      name: deal.resortName,
      description: `Vacation deal at ${deal.resortName} in ${[deal.city, deal.state].filter(Boolean).join(", ")}. ${deal.durationNights}-night stay from $${deal.price}.`,
      url: `https://vacationdeals.to/deals/${slug}`,
      address: {
        "@type": "PostalAddress",
        ...(deal.city ? { addressLocality: deal.city } : {}),
        ...(deal.state ? { addressRegion: deal.state } : {}),
        addressCountry: "US",
      },
      ...(deal.latitude && deal.longitude
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: Number(deal.latitude),
              longitude: Number(deal.longitude),
            },
          }
        : {}),
      checkinTime: "16:00",
      checkoutTime: "11:00",
      starRating: {
        "@type": "Rating",
        ratingValue: "4",
      },
      makesOffer: {
        "@type": "Offer",
        name: deal.title,
        price: String(deal.price),
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: String(deal.price),
          priceCurrency: "USD",
          unitText: `${deal.durationNights} nights`,
        },
        availability: "https://schema.org/InStock",
        url: deal.url,
        validFrom: now.toISOString().split("T")[0],
        validThrough: validThrough.toISOString().split("T")[0],
        seller: deal.brandName
          ? { "@type": "Organization", name: deal.brandName }
          : undefined,
      },
      ...(deal.brandName
        ? { brand: { "@type": "Brand", name: deal.brandName } }
        : {}),
      ...(deal.inclusions.length > 0
        ? {
            amenityFeature: deal.inclusions.map((item) => ({
              "@type": "LocationFeatureSpecification",
              name: item,
              value: true,
            })),
          }
        : {}),
    };
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hotel + Offer MTE schema for resort deals */}
      {hotelMteJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelMteJsonLd) }}
        />
      )}

      {/* Event schema for Westgate Events deals */}
      {eventJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
      )}

      {/* Breadcrumb schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Vacation Deals", "item": "https://vacationdeals.to" },
            { "@type": "ListItem", "position": 2, "name": "All Vacation Deals", "item": "https://vacationdeals.to/deals" },
            { "@type": "ListItem", "position": 3, "name": isWestgateEvent ? deal.title : (deal.resortName || deal.title), "item": `https://vacationdeals.to/deals/${slug}` },
          ],
        }) }}
      />

      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-blue-600">
              Vacation Deals
            </Link>
          </li>
          <li>
            <span className="mx-1">/</span>
            <Link href="/deals" className="hover:text-blue-600">
              All Vacation Deals
            </Link>
          </li>
          <li className="min-w-0">
            <span className="mx-1">/</span>
            <span className="text-gray-900 font-medium overflow-hidden text-ellipsis whitespace-nowrap inline-block max-w-[200px] align-bottom sm:max-w-none">
              {isWestgateEvent ? deal.title : (deal.resortName || deal.title)}
            </span>
          </li>
        </ol>
      </nav>

      {/* Expired deal banner */}
      {!deal.isActive && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h2 className="text-sm font-semibold text-red-800">This deal has expired</h2>
              <p className="mt-1 text-sm text-red-700">
                This deal has expired and may no longer be available. Prices and availability shown were last verified
                {deal.updatedAt ? ` on ${new Date(deal.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}.
                Browse <Link href="/deals" className="font-medium underline hover:text-red-800">active vacation deals</Link> for current offers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main deal layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left column: image + details */}
        <div className="lg:col-span-2">
          {/* Image area */}
          <div
            className={`relative mb-6 flex h-64 items-end overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 sm:h-80 lg:h-96`}
            role="img"
            aria-label={isWestgateEvent ? `${deal.title} event package in ${location}` : `${deal.resortName || deal.title} resort in ${location}`}
          >
            {/* Decorative city icon */}
            {CityIconComponent && (
              <div className="absolute bottom-4 right-4 h-32 w-32 opacity-[0.15]" aria-hidden="true">
                <CityIconComponent className="h-full w-full" />
              </div>
            )}

            {/* Brand badge */}
            {deal.brandName && (
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm">
                {deal.brandName}
              </span>
            )}

            {/* Savings badge */}
            {deal.savingsPercent && deal.savingsPercent > 0 && (
              <span className="absolute right-4 top-4 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white">
                {deal.savingsPercent}% OFF
              </span>
            )}

            {/* Duration badge */}
            <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
              {deal.durationNights} Nights / {deal.durationDays} Days
            </span>
          </div>

          {/* Deal title + location */}
          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            {isWestgateEvent ? deal.title : (deal.resortName || deal.title)}
          </h1>
          {location && (
            <p className="mb-4 flex items-center gap-1.5 text-gray-500">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              {location}
            </p>
          )}

          {/* Description */}
          {deal.description && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                {isWestgateEvent ? "About This Event Package" : "About This Package"}
              </h2>
              <p className="leading-relaxed text-gray-600">{deal.description}</p>
            </div>
          )}

          {/* Resort info for event deals (show where you stay) */}
          {isWestgateEvent && deal.resortName && (
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
              </svg>
              <span>
                <strong>Stay at:</strong> {deal.resortName}
              </span>
            </div>
          )}

          {/* Inclusions */}
          {deal.inclusions.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                What&apos;s Included
              </h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {deal.inclusions.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-600">
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {deal.requirements.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Eligibility Requirements
              </h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {deal.requirements.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-600">
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Presentation info */}
          {deal.presentationMinutes && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="mb-1 text-sm font-semibold text-amber-800">
                Timeshare Presentation Required
              </h3>
              <p className="text-sm text-amber-700">
                This package requires attendance at a{" "}
                <strong>{deal.presentationMinutes}-minute</strong> timeshare
                sales presentation during your stay. You are not obligated to
                purchase anything.
              </p>
            </div>
          )}

          {/* Travel window */}
          {deal.travelWindow && (
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
              <span>
                <strong>Travel window:</strong> {deal.travelWindow}
              </span>
            </div>
          )}
        </div>

        {/* Right column: pricing card + CTA */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* Price */}
            <div className="mb-4 text-center">
              <div className="mb-1 flex items-baseline justify-center gap-2">
                <span className={`text-4xl font-bold ${deal.isActive ? "text-emerald-600" : "text-gray-400"}`}>
                  ${deal.price}
                </span>
                {deal.originalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    ${deal.originalPrice}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                per package &middot; {deal.durationNights} nights
              </p>
              {deal.originalPrice && deal.savingsPercent && (
                <p className="mt-1 text-sm font-semibold text-red-600">
                  You save ${deal.originalPrice - deal.price} ({deal.savingsPercent}% off)
                </p>
              )}
            </div>

            {/* Quick facts */}
            <div className="mb-5 space-y-3 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium text-gray-900">
                  {deal.durationNights}N / {deal.durationDays}D
                </span>
              </div>
              {deal.brandName && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Brand</span>
                  <Link
                    href={`/${deal.brandSlug}`}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {deal.brandName}
                  </Link>
                </div>
              )}
              {location && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Destination</span>
                  {deal.destinationSlug ? (
                    <Link
                      href={`/${deal.destinationSlug}`}
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      {location}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-900">{location}</span>
                  )}
                </div>
              )}
              {deal.presentationMinutes && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Presentation</span>
                  <span className="font-medium text-gray-900">
                    {deal.presentationMinutes} min
                  </span>
                </div>
              )}
            </div>

            {/* CTA */}
            <a
              href={deal.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`block w-full rounded-xl px-6 py-3.5 text-center text-base font-semibold text-white transition-colors ${deal.isActive ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 hover:bg-gray-500"}`}
            >
              {deal.isActive ? `View Deal on ${deal.brandName || "Provider Site"}` : "Check If Still Available"}
            </a>

            <p className="mt-3 text-center text-xs text-gray-400">
              {deal.isActive
                ? "You will be redirected to the provider\u2019s website to complete your booking."
                : "This deal has expired. The provider\u2019s page may no longer be available."}
            </p>
          </div>
        </div>
      </div>

      {/* Deal FAQs */}
      <FAQSchema faqs={faqs} />
      <section className="mt-10">
        <FAQAccordion
          faqs={faqs}
          title={`Frequently Asked Questions About This ${deal.city || ""} Deal`}
        />
      </section>

      {/* Disclaimer */}
      <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Important Disclosure
        </h3>
        <p className="text-xs leading-relaxed text-gray-500">
          This vacation package is a promotional offer that requires attendance
          at a timeshare sales presentation, typically lasting 90-120 minutes.
          Eligibility requirements such as minimum age, household income, and
          marital status may apply. You are under no obligation to purchase a
          timeshare. VacationDeals.to is an independent comparison site and is
          not affiliated with, endorsed by, or sponsored by any resort or
          timeshare company. We aggregate publicly available deal information to
          help travelers compare options. Prices and availability are subject to
          change. Always verify details directly with the provider before
          booking.
        </p>
      </div>

      {/* Sticky bottom CTA bar (hidden for expired deals) */}
      {deal.isActive && (
        <StickyDealBar
          title={isWestgateEvent ? deal.title : (deal.resortName || deal.title)}
          price={Number(deal.price)}
          url={deal.url}
        />
      )}

      {/* Similar deals */}
      {similarDeals.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Similar Deals in {deal.city}
          </h2>
          <DealGrid deals={similarDeals} />
        </section>
      )}

      {/* SEO content block */}
      <section className="mt-12 mb-8">
        <h2 className="mb-3 text-xl font-bold text-gray-900">
          Vacation Deals {location ? `in ${location}` : ""}
        </h2>
        <div className="space-y-2 text-sm leading-relaxed text-gray-600">
          <p>
            {deal.city ? `${deal.city} is one of the most popular vacation destinations in the country, attracting millions of visitors each year with its world-class resorts, dining, and entertainment.` : "This resort destination offers world-class accommodations and entertainment for the whole family."}{" "}
            Timeshare vacation deals offer an affordable way to experience
            premium resort stays — often at 60-80% below retail pricing.
          </p>
          <p>
            In exchange for the discounted rate, guests attend a brief timeshare
            presentation during their stay. These presentations typically last
            90-120 minutes, and there is absolutely no obligation to purchase. It
            is one of the best-kept secrets in travel for budget-conscious
            vacationers who still want a luxury resort experience.
          </p>
          <p>
            Browse more{" "}
            {deal.destinationSlug ? (
              <Link
                href={`/${deal.destinationSlug}`}
                className="text-blue-600 hover:text-blue-700"
              >
                vacation deals {deal.city ? `in ${deal.city}` : ""}
              </Link>
            ) : (
              <Link
                href="/deals"
                className="text-blue-600 hover:text-blue-700"
              >
                vacation deals
              </Link>
            )}{" "}
            or compare offers from{" "}
            <Link href="/brands" className="text-blue-600 hover:text-blue-700">
              all brands
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
