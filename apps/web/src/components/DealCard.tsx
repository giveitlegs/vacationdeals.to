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
  isActive?: boolean;
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
  const isExpired = deal.isActive === false;

  return (
    <Link
      href={`/deals/${deal.slug}`}
      className={`deal-card group block rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md${isExpired ? " opacity-75" : ""}`}
      aria-label={`${deal.resortName} in ${deal.city}, ${deal.state} — ${deal.durationNights}-night stay from $${deal.price}${isExpired ? " (expired)" : ""}`}
    >
      {/* Image / Gradient Placeholder */}
      <div
        className={`relative h-48 w-full overflow-hidden rounded-t-xl bg-gradient-to-br ${getGradient(deal.city)}`}
        role="img"
        aria-label={`${deal.resortName} vacation deal in ${deal.city}, ${deal.state}`}
      >
        {/* Real resort photo when available */}
        {deal.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={deal.imageUrl}
            alt={`${deal.resortName} resort in ${deal.city}, ${deal.state}`}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        )}
        {/* scrim for badge legibility on photos */}
        {deal.imageUrl && !isExpired && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
        )}

        {/* FLASH SALE — minimalist glass pill, lower-right; sheen wipe + glow pulse (only on photo tiles) */}
        {deal.imageUrl && !isExpired && (
          <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-10">
            <div className="vd-flash relative flex items-center gap-1 overflow-hidden rounded-full border border-white/15 bg-slate-900/55 px-2.5 py-0.5 backdrop-blur-md">
              <svg className="vd-bolt h-3 w-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" /></svg>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white">Flash Sale</span>
              <span className="vd-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            </div>
          </div>
        )}

        {/* Expired overlay */}
        {isExpired && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
            <span className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-lg">
              Expired
            </span>
          </div>
        )}

        {/* Decorative city icon — only when there's no real photo */}
        {!deal.imageUrl && (
          <div className="absolute bottom-2 right-2 h-20 w-20 opacity-[0.15]" aria-hidden="true">
            <CityIconComponent className="h-full w-full" />
          </div>
        )}

        {/* Brand Badge */}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm">
          {deal.brandName}
        </span>

        {/* Savings Badge */}
        {deal.savingsPercent > 0 && !isExpired && (
          <span className="absolute right-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
            {deal.savingsPercent}% OFF
          </span>
        )}

        {/* Hot Deal badge */}
        {deal.savingsPercent >= 70 && !isExpired && (
          <span className="hot-badge absolute left-3 bottom-3 z-10 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider">
            Hot Deal
          </span>
        )}

        {/* Destination label inside image */}
        <div className={`absolute ${deal.savingsPercent >= 70 && !isExpired ? 'bottom-3 left-24' : 'bottom-3 left-3'} text-sm font-medium text-white drop-shadow-md`} aria-hidden="true">
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
          <span className={`deal-price price-emphasis text-2xl font-bold ${isExpired ? "text-gray-400" : "text-emerald-600"}`}>
            ${deal.price}
          </span>
          {deal.originalPrice > 0 && deal.originalPrice > deal.price && (
            <span className="text-sm text-gray-400 line-through">
              ${deal.originalPrice}
            </span>
          )}
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
        <div className={`w-full min-h-[44px] flex items-center justify-center rounded-lg px-4 py-3 text-center text-sm font-semibold text-white transition-colors ${isExpired ? "bg-gray-400" : "cta-pulse bg-blue-600 group-hover:bg-blue-700"}`}>
          {isExpired ? "View Expired Deal" : "View Deal"}
        </div>
      </div>
    </Link>
  );
}
