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

        {/* Sitewide legal disclaimer (renders on every page) */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-100 p-4 text-xs leading-relaxed text-gray-500">
          <p className="mb-2 text-sm font-semibold text-gray-700">
            Important Disclaimer — Please Read
          </p>
          <p>
            VacationDeals.to is, first and foremost, an information and data-availability service: we make
            publicly available vacation and timeshare-promotion data easier to find and compare. We do{" "}
            <strong>not</strong> take payments, process bookings, or transact on this site, and we never handle
            your money — any booking or purchase happens on the provider&apos;s own website, directly between you
            and them. Depending on the offer, some content on this site may function as advertising material for
            the resorts and brands featured. Listings, prices, inclusions, and availability are aggregated from
            third-party sources and <strong>may be inaccurate, incomplete, out of date, or out of sync with the
            provider — and we are not responsible or liable for any of that, or for any decision you make based
            on it.</strong> You use this information entirely at your own risk, and you should always verify all
            prices, terms, availability, and eligibility requirements directly with the provider before you rely
            on them. <strong>Buyer beware:</strong> purchasing a timeshare is a significant, long-term financial
            and legal commitment — read every document carefully, understand your state&apos;s rescission
            (cancellation) rights, and consider seeking independent legal or financial advice before you buy.
            Clicking a deal redirects you to the third-party provider&apos;s own site. All trademarks are the
            property of their respective owners. See our{" "}
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
            <Link href="/privacy" className="text-blue-600 underline hover:text-blue-700">
              Privacy Policy
            </Link>
            <span className="mx-2 text-gray-300" aria-hidden="true">|</span>
            <Link href="/terms" className="text-blue-600 underline hover:text-blue-700">
              Terms &amp; Conditions
            </Link>
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
