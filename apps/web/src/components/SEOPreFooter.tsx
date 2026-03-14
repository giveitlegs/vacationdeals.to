import Link from "next/link";

interface SEOPreFooterProps {
  type: "destinations" | "brands" | "prices" | "durations";
  currentSlug: string;
}

const destinationLinks = [
  { slug: "orlando", label: "Orlando Vacation Packages" },
  { slug: "las-vegas", label: "Las Vegas Vacation Packages" },
  { slug: "cancun", label: "Cancun Vacation Packages" },
  { slug: "gatlinburg", label: "Gatlinburg Vacation Packages" },
  { slug: "myrtle-beach", label: "Myrtle Beach Vacation Packages" },
  { slug: "branson", label: "Branson Vacation Packages" },
  { slug: "williamsburg", label: "Williamsburg Vacation Packages" },
  { slug: "cocoa-beach", label: "Cocoa Beach Vacation Packages" },
  { slug: "hilton-head", label: "Hilton Head Vacation Packages" },
  { slug: "park-city", label: "Park City Vacation Packages" },
  { slug: "daytona-beach", label: "Daytona Beach Vacation Packages" },
  { slug: "cabo", label: "Cabo San Lucas Vacation Packages" },
  { slug: "puerto-vallarta", label: "Puerto Vallarta Vacation Packages" },
  { slug: "punta-cana", label: "Punta Cana Vacation Packages" },
  { slug: "key-west", label: "Key West Vacation Packages" },
  { slug: "sedona", label: "Sedona Vacation Packages" },
  { slug: "galveston", label: "Galveston Vacation Packages" },
  { slug: "lake-tahoe", label: "Lake Tahoe Vacation Packages" },
  { slug: "new-york-city", label: "New York City Vacation Packages" },
  { slug: "san-diego", label: "San Diego Vacation Packages" },
];

const brandLinks = [
  { slug: "westgate", label: "Westgate Resorts Vacation Packages" },
  { slug: "hgv", label: "Hilton Grand Vacations Deals" },
  { slug: "marriott", label: "Marriott Vacation Club Packages" },
  { slug: "wyndham", label: "Club Wyndham Vacation Deals" },
  { slug: "holiday-inn", label: "Holiday Inn Club Vacations" },
  { slug: "bluegreen", label: "Bluegreen Vacations Packages" },
  { slug: "hyatt", label: "Hyatt Vacation Club Deals" },
  { slug: "capital-vacations", label: "Capital Vacations Packages" },
  { slug: "bookvip", label: "BookVIP Vacation Deals" },
  { slug: "getawaydealz", label: "GetawayDealz Packages" },
  { slug: "mrg", label: "Monster Reservations Group Deals" },
  { slug: "westgate-events", label: "Westgate Events & Shows" },
];

const priceLinks = [
  { slug: "deals-under-100", label: "Vacation Packages Under $100" },
  { slug: "deals-under-200", label: "Vacation Packages Under $200" },
  { slug: "deals-under-300", label: "Vacation Packages Under $300" },
  { slug: "deals-under-500", label: "Vacation Packages Under $500" },
];

const durationLinks = [
  { slug: "2-night-packages", label: "2-Night Vacation Packages" },
  { slug: "3-night-packages", label: "3-Night Vacation Packages" },
  { slug: "4-night-packages", label: "4-Night Vacation Packages" },
  { slug: "5-night-packages", label: "5-Night Vacation Packages" },
];

const titles: Record<SEOPreFooterProps["type"], string> = {
  destinations: "Explore Other Vacation Package Destinations",
  brands: "Compare Other Vacation Package Brands",
  prices: "Browse Deals by Price Range",
  durations: "Browse Packages by Duration",
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
