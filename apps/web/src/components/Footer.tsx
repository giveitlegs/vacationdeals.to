import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              VacationDeals.to
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              The best vacation package deals from top timeshare resorts, all in
              one place. Compare prices, read reviews, and book your next
              getaway.
            </p>
          </div>

          {/* Browse */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Browse</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-gray-500">
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

          {/* Popular Destinations */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Popular Destinations
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm text-gray-500">
              <li>
                <Link
                  href="/destinations/orlando"
                  className="hover:text-gray-900"
                >
                  Orlando, FL
                </Link>
              </li>
              <li>
                <Link
                  href="/destinations/las-vegas"
                  className="hover:text-gray-900"
                >
                  Las Vegas, NV
                </Link>
              </li>
              <li>
                <Link
                  href="/destinations/cancun"
                  className="hover:text-gray-900"
                >
                  Cancun, MX
                </Link>
              </li>
              <li>
                <Link
                  href="/destinations/gatlinburg"
                  className="hover:text-gray-900"
                >
                  Gatlinburg, TN
                </Link>
              </li>
              <li>
                <Link
                  href="/destinations/myrtle-beach"
                  className="hover:text-gray-900"
                >
                  Myrtle Beach, SC
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Brands */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Popular Brands
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm text-gray-500">
              <li>
                <Link
                  href="/brands/westgate"
                  className="hover:text-gray-900"
                >
                  Westgate Resorts
                </Link>
              </li>
              <li>
                <Link href="/brands/hgv" className="hover:text-gray-900">
                  Hilton Grand Vacations
                </Link>
              </li>
              <li>
                <Link
                  href="/brands/marriott"
                  className="hover:text-gray-900"
                >
                  Marriott Vacation Club
                </Link>
              </li>
              <li>
                <Link
                  href="/brands/wyndham"
                  className="hover:text-gray-900"
                >
                  Club Wyndham
                </Link>
              </li>
              <li>
                <Link
                  href="/brands/bookvip"
                  className="hover:text-gray-900"
                >
                  BookVIP
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} VacationDeals.to. All rights
            reserved.
          </p>
          <div className="flex gap-6 text-xs text-gray-400">
            <Link href="/privacy" className="hover:text-gray-600">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-600">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
