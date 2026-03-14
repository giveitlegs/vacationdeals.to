import { DealCard, type Deal } from "./DealCard";

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="h-48 rounded-t-xl bg-gray-200" />
      <div className="p-5">
        <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
        <div className="mb-3 h-4 w-1/3 rounded bg-gray-200" />
        <div className="mb-3 flex items-baseline gap-2">
          <div className="h-7 w-16 rounded bg-gray-200" />
          <div className="h-4 w-12 rounded bg-gray-200" />
        </div>
        <div className="mb-4 flex gap-1.5">
          <div className="h-5 w-20 rounded-full bg-gray-200" />
          <div className="h-5 w-24 rounded-full bg-gray-200" />
        </div>
        <div className="h-10 w-full rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

export function DealGrid({
  deals,
  loading = false,
}: {
  deals: Deal[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-semibold text-gray-900">
          No deals found
        </h3>
        <p className="text-sm text-gray-500">
          Try adjusting your filters or search to find more deals.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} />
      ))}
    </div>
  );
}
