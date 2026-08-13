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

        {/* Aggregator Disclaimer (sitewide — renders on every page) */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-100 p-4 text-xs leading-relaxed text-gray-500">
          <p className="mb-2 text-sm font-semibold text-gray-700">
            This is not a timeshare marketing site — we only make publicly available data easier to find.
          </p>
          <p>
            <strong>Disclaimer:</strong> VacationDeals.to is an independent information and data-aggregation service — <strong>not</strong> a
            timeshare seller, developer, broker, marketer, resort, real estate broker, or travel agency, and <strong>not affiliated with, endorsed
            by, or sponsored by</strong> any resort or brand named on this site. We do not sell, book, market, or facilitate the sale of vacation
            packages or timeshare interests, and we do not take bookings or payments. Listings are aggregated from publicly available third-party
            sources, may be inaccurate or out of date, and are provided for informational purposes only — not as legal, financial, or professional
            advice. Always verify all prices, terms, and requirements directly with the seller before you rely on them. Clicking a deal redirects
            you to the third-party provider&apos;s own site. All trademarks are property of their respective owners. See our{" "}
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

        {/* Westgate Seller of Travel disclosure (compliance-required, sitewide) */}
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-xs leading-relaxed text-gray-500">
          <p className="font-semibold text-gray-700">Westgate Resorts Ltd</p>
          <p className="mt-0.5">5601 Windhover Drive Orlando, FL 32819</p>
          <p className="mt-0.5">
            SOT: Florida: ST32029 | Washington: 1970 | California: 2030985-50 | Iowa: 837
          </p>
          <p className="mt-1.5">
            <a
              href="https://www.westgatereservations.com/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-700"
            >
              Privacy Policy
            </a>
            <span className="mx-2 text-gray-300" aria-hidden="true">|</span>
            <a
              href="https://www.westgatereservations.com/terms-and-conditions/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-700"
            >
              Terms &amp; Conditions
            </a>
          </p>
        </div>

        {/* Timeshare Advertising Disclosure — MUST stand alone; nothing may abut it. */}
        <div className="my-10 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            This advertising material is being used for the purpose of soliciting sales of timeshare interests or plans
          </p>
        </div>
      </div>
    </footer>
  );
}
