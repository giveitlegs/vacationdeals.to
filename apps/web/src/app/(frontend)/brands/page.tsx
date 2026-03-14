import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vacation Package Brands",
  description:
    "Browse vacation packages by brand. Westgate, Hilton Grand Vacations, Marriott, Wyndham, and more.",
};

const brands = [
  { name: "Westgate Resorts", slug: "westgate", type: "direct" as const, deals: 52, description: "One of the largest timeshare companies in the US with resorts across Florida, Tennessee, and more." },
  { name: "Hilton Grand Vacations", slug: "hgv", type: "direct" as const, deals: 38, description: "Premium vacation ownership by Hilton with properties in Orlando, Las Vegas, Hawaii, and beyond." },
  { name: "Marriott Vacation Club", slug: "marriott", type: "direct" as const, deals: 41, description: "Luxury vacation ownership by Marriott International with world-class resorts." },
  { name: "Club Wyndham", slug: "wyndham", type: "direct" as const, deals: 35, description: "Flexible vacation ownership with access to resorts nationwide through Wyndham Destinations." },
  { name: "BookVIP", slug: "bookvip", type: "broker" as const, deals: 67, description: "Leading vacation package broker offering deals across multiple resort brands and destinations." },
  { name: "Holiday Inn Club Vacations", slug: "holiday-inn", type: "direct" as const, deals: 22, description: "Family-friendly vacation ownership by IHG with resorts in popular destinations." },
  { name: "Bluegreen Vacations", slug: "bluegreen", type: "direct" as const, deals: 18, description: "Flexible points-based vacation ownership with resorts in unique locations." },
  { name: "Hyatt Vacation Ownership", slug: "hyatt", type: "direct" as const, deals: 15, description: "Premium vacation ownership by Hyatt Hotels with select high-end resort properties." },
  { name: "Diamond Resorts", slug: "diamond", type: "direct" as const, deals: 20, description: "Vacation ownership with a diverse portfolio of resorts worldwide, now part of Hilton Grand Vacations." },
  { name: "Travel Smart VIP", slug: "travelsmart", type: "broker" as const, deals: 31, description: "Vacation package broker specializing in discounted timeshare preview stays." },
  { name: "Vacation Vip Access", slug: "vip-access", type: "broker" as const, deals: 25, description: "Broker offering curated vacation packages from multiple resort brands." },
  { name: "Shell Vacations", slug: "shell", type: "direct" as const, deals: 10, description: "Boutique vacation ownership with intimate resort properties in scenic locations." },
  { name: "Capital Vacations", slug: "capital", type: "direct" as const, deals: 14, description: "Growing vacation ownership company with resorts across the Eastern US." },
];

export default function BrandsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Vacation Package Brands
        </h1>
        <p className="text-gray-600">
          Browse deals by brand. Direct brands sell their own timeshare
          packages, while brokers aggregate deals from multiple resorts.
        </p>
      </div>

      {/* Legend */}
      <div className="mb-6 flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Direct
          </span>
          <span>Sells own packages</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
            Broker
          </span>
          <span>Aggregates from multiple brands</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={`/brands/${brand.slug}`}
            className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between">
              <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">
                {brand.name}
              </h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  brand.type === "direct"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {brand.type === "direct" ? "Direct" : "Broker"}
              </span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-gray-500">
              {brand.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-600">
                {brand.deals} deals available
              </span>
              <span className="text-sm font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                View deals &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
