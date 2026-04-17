import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              VacationDeals.to
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              The best vacation deals from top timeshare resorts, all in
              one place. Compare resort deals, travel deals, and getaway
              packages. Book your next vacation for less.
            </p>
          </div>

          {/* Browse */}
          <div>
            <p className="text-sm font-semibold text-gray-900">Browse</p>
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
              <li>
                <Link href="/blog" className="hover:text-gray-900">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-gray-900">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Destinations */}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Popular Destinations
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-gray-500">
              <li>
                <Link
                  href="/orlando"
                  className="hover:text-gray-900"
                >
                  Orlando, FL
                </Link>
              </li>
              <li>
                <Link
                  href="/las-vegas"
                  className="hover:text-gray-900"
                >
                  Las Vegas, NV
                </Link>
              </li>
              <li>
                <Link
                  href="/cancun"
                  className="hover:text-gray-900"
                >
                  Cancun, MX
                </Link>
              </li>
              <li>
                <Link
                  href="/gatlinburg"
                  className="hover:text-gray-900"
                >
                  Gatlinburg, TN
                </Link>
              </li>
              <li>
                <Link
                  href="/myrtle-beach"
                  className="hover:text-gray-900"
                >
                  Myrtle Beach, SC
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Brands */}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Popular Brands
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-gray-500">
              <li>
                <Link
                  href="/westgate"
                  className="hover:text-gray-900"
                >
                  Westgate Reservations
                </Link>
              </li>
              <li>
                <Link href="/hgv" className="hover:text-gray-900">
                  Hilton Grand Vacations
                </Link>
              </li>
              <li>
                <Link
                  href="/marriott"
                  className="hover:text-gray-900"
                >
                  Marriott Vacation Club
                </Link>
              </li>
              <li>
                <Link
                  href="/wyndham"
                  className="hover:text-gray-900"
                >
                  Club Wyndham
                </Link>
              </li>
              <li>
                <Link
                  href="/bookvip"
                  className="hover:text-gray-900"
                >
                  BookVIP
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-10 border-t border-gray-200 pt-8">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400 sm:gap-6">
            <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-600">Terms &amp; Conditions</Link>
            <Link href="/timeshare-laws" className="hover:text-gray-600">Timeshare Laws by State</Link>
            <a href="mailto:privacy@vacationdeals.to?subject=Do%20Not%20Sell%20My%20Personal%20Information" className="hover:text-gray-600">Do Not Sell My Info</a>
          </div>
        </div>

        {/* Aggregator Disclaimer */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-100 p-4 text-xs leading-relaxed text-gray-500">
          <p>
            <strong>Disclaimer:</strong> VacationDeals.to is an independent vacation deal comparison and aggregator website.
            We are <strong>NOT</strong> a timeshare company, resort developer, real estate broker, or travel agency. We do not
            sell, book, market, or facilitate the sale of vacation packages, timeshare interests, or any real estate. All deals
            displayed are sourced from publicly available information on third-party websites. Clicking a deal redirects you to
            the third-party provider&apos;s site. We make no guarantees about pricing, availability, or accuracy of any listing.
            All trademarks are property of their respective owners. See our{" "}
            <Link href="/terms" className="text-gray-600 underline hover:text-gray-800">Terms &amp; Conditions</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-gray-600 underline hover:text-gray-800">Privacy Policy</Link>{" "}
            for full details.
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} VacationDeals.to. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
