import Link from "next/link";
import { getTickerDeals } from "@/lib/queries";

/* ── Tiny inline SVG separator icons (12x12, cycle through 6) ── */

const icons = [
  // Flip flop
  <svg key="ff" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-blue-400/50 mx-3 shrink-0">
    <ellipse cx="4" cy="7" rx="3" ry="4" />
    <ellipse cx="8" cy="7" rx="3" ry="4" />
    <path d="M4 3 L4 7 M8 3 L8 7" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.6" />
  </svg>,
  // Cocktail glass
  <svg key="ck" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-blue-400/50 mx-3 shrink-0">
    <path d="M2 1 L10 1 L6 6 Z" fillOpacity="0.8" />
    <line x1="6" y1="6" x2="6" y2="10" stroke="currentColor" strokeWidth="1" />
    <line x1="4" y1="10" x2="8" y2="10" stroke="currentColor" strokeWidth="1" />
    <circle cx="9" cy="2" r="1" />
  </svg>,
  // Palm tree
  <svg key="pt" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-blue-400/50 mx-3 shrink-0">
    <path d="M6 4 L6 11" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M6 4 Q3 1 1 3" strokeWidth="0.8" fill="none" stroke="currentColor" />
    <path d="M6 4 Q9 1 11 3" strokeWidth="0.8" fill="none" stroke="currentColor" />
    <path d="M6 3 Q4 0 2 1" strokeWidth="0.8" fill="none" stroke="currentColor" />
    <path d="M6 3 Q8 0 10 1" strokeWidth="0.8" fill="none" stroke="currentColor" />
  </svg>,
  // Sun
  <svg key="sn" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-blue-400/50 mx-3 shrink-0">
    <circle cx="6" cy="6" r="2.5" />
    <line x1="6" y1="1" x2="6" y2="2.5" stroke="currentColor" strokeWidth="1" />
    <line x1="6" y1="9.5" x2="6" y2="11" stroke="currentColor" strokeWidth="1" />
    <line x1="1" y1="6" x2="2.5" y2="6" stroke="currentColor" strokeWidth="1" />
    <line x1="9.5" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1" />
    <line x1="2.5" y1="2.5" x2="3.5" y2="3.5" stroke="currentColor" strokeWidth="1" />
    <line x1="8.5" y1="8.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1" />
    <line x1="2.5" y1="9.5" x2="3.5" y2="8.5" stroke="currentColor" strokeWidth="1" />
    <line x1="8.5" y1="3.5" x2="9.5" y2="2.5" stroke="currentColor" strokeWidth="1" />
  </svg>,
  // Beach umbrella
  <svg key="bu" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-blue-400/50 mx-3 shrink-0">
    <path d="M6 2 Q1 2 2 6 L6 4 Z" fillOpacity="0.7" />
    <path d="M6 2 Q11 2 10 6 L6 4 Z" fillOpacity="0.9" />
    <line x1="6" y1="2" x2="6" y2="11" stroke="currentColor" strokeWidth="1" />
  </svg>,
  // Surfboard
  <svg key="sb" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-blue-400/50 mx-3 shrink-0">
    <ellipse cx="6" cy="6" rx="1.8" ry="5" transform="rotate(-20 6 6)" fillOpacity="0.8" />
    <line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
  </svg>,
];

function getIcon(index: number) {
  return icons[index % icons.length];
}

export async function DealTicker() {
  const deals = await getTickerDeals();
  if (!deals || deals.length === 0) return null;

  // Build ticker items
  const items = deals.map((deal, i) => {
    const perk = deal.perk ? ` · ${deal.perk}` : "";
    const duration = `${deal.durationNights}N/${deal.durationDays}D`;
    return (
      <span key={deal.slug} className="inline-flex items-center">
        {i > 0 && getIcon(i - 1)}
        <Link
          href={`/deals/${deal.slug}`}
          className="inline-flex items-center gap-1.5 whitespace-nowrap text-gray-200 hover:text-white transition-colors"
        >
          <span className="font-semibold text-emerald-400">${deal.price}</span>
          <span className="text-gray-400">·</span>
          <span>{deal.brandName}</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-400">{duration}</span>
          {deal.perk && (
            <>
              <span className="text-gray-400">·</span>
              <span className="text-blue-300">{deal.perk}</span>
            </>
          )}
        </Link>
      </span>
    );
  });

  // Duplicate for seamless loop
  return (
    <div className="sticky top-0 z-50 overflow-hidden bg-gray-900 border-b border-gray-800" style={{ height: "36px" }}>
      {/* Luggage tag label */}
      <div className="absolute left-0 top-0 z-10 flex h-[36px] items-center">
        <span className="relative ml-2 inline-flex items-center gap-1 rounded-r-md border border-l-0 border-amber-500/40 bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-900 shadow-md" style={{ clipPath: "polygon(8px 0%, 100% 0%, 100% 100%, 8px 100%, 0% 50%)" }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="shrink-0 opacity-70"><circle cx="2" cy="5" r="1.5" fill="none" stroke="currentColor" strokeWidth="1"/><path d="M3.5 2 L9 2 Q10 2 10 3 L10 7 Q10 8 9 8 L3.5 8 L3.5 2Z" fillOpacity="0.3"/></svg>
          VacPack Rate Ticker
        </span>
      </div>
      <div className="deal-ticker inline-flex items-center pl-40" style={{ height: "36px" }}>
        <div className="inline-flex items-center gap-0 text-xs sm:text-sm px-4">
          {items}
          {/* Separator before duplicate */}
          {getIcon(deals.length - 1)}
        </div>
        {/* Duplicate for seamless loop */}
        <div className="inline-flex items-center gap-0 text-xs sm:text-sm px-4" aria-hidden="true">
          {items}
          {getIcon(deals.length - 1)}
        </div>
      </div>
    </div>
  );
}
