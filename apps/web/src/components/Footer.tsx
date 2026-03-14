import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              VacationDeals.to
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              The best vacation package deals from top timeshare resorts,
              all in one place.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Browse</h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/deals" className="hover:text-gray-900">
                  All Deals
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="hover:text-gray-900">
                  Destinations
                </Link>
              </li>
              <li>
                <Link href="/brands" className="hover:text-gray-900">
                  Brands
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Popular Destinations
            </h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-500">
              <li>
                <Link
                  href="/destinations/orlando"
                  className="hover:text-gray-900"
                >
                  Orlando
                </Link>
              </li>
              <li>
                <Link
                  href="/destinations/las-vegas"
                  className="hover:text-gray-900"
                >
                  Las Vegas
                </Link>
              </li>
              <li>
                <Link
                  href="/destinations/cancun"
                  className="hover:text-gray-900"
                >
                  Cancun
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} VacationDeals.to. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
