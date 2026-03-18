import Link from "next/link";

interface SEOPreFooterProps {
  type: "destinations" | "brands" | "prices" | "durations";
  currentSlug: string;
}

const destinationLinks = [
  { slug: "orlando", label: "Orlando Vacation Deals" },
  { slug: "las-vegas", label: "Las Vegas Vacation Deals" },
  { slug: "cancun", label: "Cancun Vacation Deals" },
  { slug: "gatlinburg", label: "Gatlinburg Vacation Deals" },
  { slug: "myrtle-beach", label: "Myrtle Beach Vacation Deals" },
  { slug: "branson", label: "Branson Vacation Deals" },
  { slug: "williamsburg", label: "Williamsburg Vacation Deals" },
  { slug: "cocoa-beach", label: "Cocoa Beach Vacation Deals" },
  { slug: "hilton-head", label: "Hilton Head Vacation Deals" },
  { slug: "park-city", label: "Park City Vacation Deals" },
  { slug: "daytona-beach", label: "Daytona Beach Vacation Deals" },
  { slug: "cabo", label: "Cabo San Lucas Vacation Deals" },
  { slug: "puerto-vallarta", label: "Puerto Vallarta Vacation Deals" },
  { slug: "punta-cana", label: "Punta Cana Vacation Deals" },
  { slug: "key-west", label: "Key West Vacation Deals" },
  { slug: "sedona", label: "Sedona Vacation Deals" },
  { slug: "galveston", label: "Galveston Vacation Deals" },
  { slug: "lake-tahoe", label: "Lake Tahoe Vacation Deals" },
  { slug: "new-york-city", label: "New York City Vacation Deals" },
  { slug: "san-diego", label: "San Diego Vacation Deals" },
  { slug: "san-antonio", label: "San Antonio Vacation Deals" },
  { slug: "miami", label: "Miami Vacation Deals" },
  { slug: "nashville", label: "Nashville Vacation Deals" },
];

const brandLinks = [
  { slug: "westgate", label: "Westgate Reservations Vacation Deals" },
  { slug: "hgv", label: "Hilton Grand Vacations Deals" },
  { slug: "marriott", label: "Marriott Vacation Club Deals" },
  { slug: "wyndham", label: "Club Wyndham Vacation Deals" },
  { slug: "holiday-inn", label: "Holiday Inn Club Vacation Deals" },
  { slug: "bluegreen", label: "Bluegreen Vacations Deals" },
  { slug: "hyatt", label: "Hyatt Vacation Club Deals" },
  { slug: "capital-vacations", label: "Capital Vacations Deals" },
  { slug: "bookvip", label: "BookVIP Vacation Deals" },
  { slug: "getawaydealz", label: "GetawayDealz Deals" },
  { slug: "mrg", label: "Monster Reservations Group Deals" },
  { slug: "westgate-events", label: "Westgate Events & Shows Deals" },
  { slug: "staypromo", label: "StayPromo Vacation Deals" },
  { slug: "vacation-village", label: "Vacation Village Resorts Deals" },
  { slug: "spinnaker", label: "Spinnaker Resorts Deals" },
  { slug: "departure-depot", label: "Departure Depot Vacation Deals" },
  { slug: "vegas-timeshare", label: "Las Vegas Timeshare Deals" },
  { slug: "premier-travel", label: "Premier Travel Resorts Deals" },
  { slug: "discount-vacation", label: "Discount Vacation Hotel Deals" },
  { slug: "legendary", label: "Legendary Vacation Club Deals" },
  { slug: "festiva", label: "Festiva Resorts Deals" },
];

const priceLinks = [
  { slug: "deals-under-100", label: "Vacation Deals Under $100" },
  { slug: "deals-under-200", label: "Vacation Deals Under $200" },
  { slug: "deals-under-300", label: "Vacation Deals Under $300" },
  { slug: "deals-under-500", label: "Vacation Deals Under $500" },
];

const durationLinks = [
  { slug: "2-night-packages", label: "2-Night Vacation Deals" },
  { slug: "3-night-packages", label: "3-Night Vacation Deals" },
  { slug: "4-night-packages", label: "4-Night Vacation Deals" },
  { slug: "5-night-packages", label: "5-Night Vacation Deals" },
];

const titles: Record<SEOPreFooterProps["type"], string> = {
  destinations: "Explore Other Vacation Deal Destinations",
  brands: "Compare Other Vacation Deal Brands",
  prices: "Browse Vacation Deals by Price Range",
  durations: "Browse Vacation Deals by Duration",
};

const linkData: Record<SEOPreFooterProps["type"], { slug: string; label: string }[]> = {
  destinations: destinationLinks,
  brands: brandLinks,
  prices: priceLinks,
  durations: durationLinks,
};

export function SEOPreFooter({ type, currentSlug }: SEOPreFooterProps) {
  const links = linkData[type].filter((link) => link.slug !== currentSlug);
  const title = titles[type];

  return (
    <section className="mt-12 rounded-xl bg-gray-50 p-8">
      <h2 className="mb-4 text-lg font-bold text-gray-900">{title}</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
        {links.map((link) => (
          <Link
            key={link.slug}
            href={`/${link.slug}`}
            className="text-sm text-blue-600 hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
