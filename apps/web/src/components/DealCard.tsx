import Link from "next/link";
import { getCityIcon } from "@/lib/city-icons";

export interface Deal {
  id: number;
  title: string;
  resortName: string;
  price: number;
  originalPrice: number;
  durationNights: number;
  durationDays: number;
  city: string;
  state: string;
  brandName: string;
  brandSlug: string;
  savingsPercent: number;
  inclusions: string[];
  slug: string;
  imageUrl?: string;
}

const destinationGradients: Record<string, string> = {
  Orlando: "from-blue-400 to-cyan-300",
  "Las Vegas": "from-amber-400 to-orange-500",
  Cancun: "from-teal-400 to-emerald-300",
  Gatlinburg: "from-green-500 to-emerald-600",
  "Myrtle Beach": "from-sky-400 to-blue-500",
  default: "from-indigo-400 to-purple-500",
};

function getGradient(city: string): string {
  return destinationGradients[city] || destinationGradients.default;
}

export function DealCard({ deal }: { deal: Deal }) {
  const CityIconComponent = getCityIcon(deal.city);

  return (
    <Link
      href={`/deals/${deal.slug}`}
      className="deal-card group block rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      aria-label={`${deal.resortName} in ${deal.city}, ${deal.state} — ${deal.durationNights}-night stay from $${deal.price}`}
    >
      {/* Image / Gradient Placeholder */}
      <div
        className={`relative h-48 w-full overflow-hidden rounded-t-xl bg-gradient-to-br ${getGradient(deal.city)}`}
        role="img"
        aria-label={`${deal.resortName} vacation deal in ${deal.city}, ${deal.state}`}
      >
        {/* Decorative city icon */}
        <div className="absolute bottom-2 right-2 h-20 w-20 opacity-[0.15]" aria-hidden="true">
          <CityIconComponent className="h-full w-full" />
        </div>

        {/* Brand Badge */}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm">
          {deal.brandName}
        </span>

        {/* Savings Badge */}
        <span className="absolute right-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
          {deal.savingsPercent}% OFF
        </span>

        {/* Destination label inside image */}
        <div className="absolute bottom-3 left-3 text-sm font-medium text-white drop-shadow-md">
          {deal.city}, {deal.state}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5">
        {/* Resort Name */}
        <h3 className="mb-1 text-base font-semibold text-gray-900 group-hover:text-blue-600">
          {deal.resortName}
        </h3>

        {/* Duration */}
        <p className="mb-3 text-sm text-gray-500">
          {deal.durationNights} Nights / {deal.durationDays} Days
        </p>

        {/* Price Row */}
        <div className="mb-3 flex items-baseline gap-2">
          <span className="deal-price text-2xl font-bold text-emerald-600">
            ${deal.price}
          </span>
          <span className="text-sm text-gray-400 line-through">
            ${deal.originalPrice}
          </span>
        </div>

        {/* Inclusions */}
        {deal.inclusions.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {deal.inclusions.map((inclusion) => (
              <span
                key={inclusion}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
              >
                {inclusion}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors group-hover:bg-blue-700">
          View Deal
        </div>
      </div>
    </Link>
  );
}
