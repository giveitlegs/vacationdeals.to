import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Timeshare Laws by State — Consumer Protection Guide",
  description:
    "Comprehensive guide to timeshare rescission periods, consumer protection laws, and regulatory agencies for all 50 US states. Know your rights before attending a presentation.",
  alternates: { canonical: "https://vacationdeals.to/timeshare-laws" },
  openGraph: {
    title: "Timeshare Laws by State — Consumer Protection Guide",
    description: "Know your timeshare cancellation rights state by state.",
    type: "website",
    url: "https://vacationdeals.to/timeshare-laws",
  },
};

const states = [
  { state: "Alabama", period: "3 business days", statute: "AL Code \u00a734-27-50", body: "AL Real Estate Commission" },
  { state: "Alaska", period: "15 calendar days", statute: "AS \u00a734.08.580", body: "AK Div. of Legislative Audit" },
  { state: "Arizona", period: "7 calendar days", statute: "ARS \u00a732-2197", body: "AZ Dept. of Real Estate" },
  { state: "Arkansas", period: "5 calendar days", statute: "AR Code \u00a718-14-401", body: "AR Securities Dept." },
  { state: "California", period: "7 calendar days", statute: "CA Bus. & Prof. Code \u00a711238", body: "CA Dept. of Real Estate" },
  { state: "Colorado", period: "5 calendar days", statute: "CRS \u00a712-10-501", body: "CO Div. of Real Estate" },
  { state: "Connecticut", period: "3 business days", statute: "CT Gen. Stat. \u00a742-103aa", body: "CT Dept. of Consumer Protection" },
  { state: "Delaware", period: "5 calendar days", statute: "DE Code Title 6, Ch. 29", body: "DE Dept. of Justice" },
  { state: "DC", period: "3 business days", statute: "DC Code \u00a742-1801", body: "DC Licensing & Consumer Protection" },
  { state: "Florida", period: "10 calendar days", statute: "FL Stat. \u00a7721", body: "FL DBPR", highlight: true },
  { state: "Georgia", period: "7 calendar days", statute: "GA Code \u00a744-3-160", body: "GA Real Estate Commission" },
  { state: "Hawaii", period: "7 calendar days", statute: "HRS \u00a7514E", body: "HI Real Estate Commission", highlight: true },
  { state: "Idaho", period: "5 calendar days", statute: "ID Code \u00a755-2101", body: "ID Real Estate Commission" },
  { state: "Illinois", period: "5 calendar days", statute: "765 ILCS 101/", body: "IL Attorney General" },
  { state: "Indiana", period: "3 business days", statute: "IC \u00a724-5-19", body: "IN Attorney General" },
  { state: "Iowa", period: "3 business days", statute: "IA Code \u00a7557A", body: "IA Real Estate Commission" },
  { state: "Kansas", period: "3 business days", statute: "KS Stat. \u00a758-3301", body: "KS Attorney General" },
  { state: "Kentucky", period: "5 calendar days", statute: "KRS \u00a7367.780", body: "KY Real Estate Commission" },
  { state: "Louisiana", period: "5 calendar days", statute: "LA RS \u00a79:1131.1", body: "LA Real Estate Commission" },
  { state: "Maine", period: "10 calendar days", statute: "ME Rev. Stat. Title 33 \u00a7590", body: "ME Real Estate Commission" },
  { state: "Maryland", period: "5 calendar days", statute: "MD Real Property \u00a711A", body: "MD Real Estate Commission" },
  { state: "Massachusetts", period: "3 business days", statute: "MA Gen. Laws Ch. 183B", body: "MA Attorney General" },
  { state: "Michigan", period: "9 calendar days", statute: "MI Comp. Laws \u00a7559.151", body: "MI LARA" },
  { state: "Minnesota", period: "5 calendar days", statute: "MN Stat. \u00a783", body: "MN Dept. of Commerce" },
  { state: "Mississippi", period: "3 calendar days", statute: "MS Code \u00a789-21-1", body: "MS Real Estate Commission" },
  { state: "Missouri", period: "5 calendar days", statute: "MO Rev. Stat. \u00a7407.600", body: "MO Attorney General", highlight: true },
  { state: "Montana", period: "5 calendar days", statute: "MT Code \u00a737-53-101", body: "MT Consumer Protection" },
  { state: "Nebraska", period: "5 calendar days", statute: "NE Rev. Stat. \u00a776-1701", body: "NE Real Estate Commission" },
  { state: "Nevada", period: "5 calendar days", statute: "NRS \u00a7119A", body: "NV Real Estate Division", highlight: true },
  { state: "New Hampshire", period: "5 calendar days", statute: "NH RSA \u00a7356-B:65", body: "NH Real Estate Commission" },
  { state: "New Jersey", period: "7 calendar days", statute: "NJ Stat. \u00a745:15-16.50", body: "NJ Real Estate Commission" },
  { state: "New Mexico", period: "7 calendar days", statute: "NM Stat. \u00a747-11-1", body: "NM Real Estate Commission" },
  { state: "New York", period: "5 business days", statute: "NY Gen. Bus. Law \u00a7590", body: "NY Dept. of Law", highlight: true },
  { state: "North Carolina", period: "5 calendar days", statute: "NC Gen. Stat. \u00a793A-39", body: "NC Real Estate Commission" },
  { state: "North Dakota", period: "5 calendar days", statute: "ND Cent. Code \u00a743-27", body: "ND Real Estate Commission" },
  { state: "Ohio", period: "5 calendar days", statute: "ORC \u00a75075", body: "OH Div. of Real Estate" },
  { state: "Oklahoma", period: "5 calendar days", statute: "OK Stat. Title 60 \u00a71450", body: "OK Real Estate Commission" },
  { state: "Oregon", period: "5 calendar days", statute: "ORS \u00a794.803", body: "OR Real Estate Agency" },
  { state: "Pennsylvania", period: "5-7 calendar days", statute: "68 Pa. C.S. \u00a73301", body: "PA Attorney General" },
  { state: "Rhode Island", period: "5 calendar days", statute: "RI Gen. Laws \u00a734-41", body: "RI Business Regulation" },
  { state: "South Carolina", period: "5 calendar days", statute: "SC Code \u00a727-32", body: "SC Real Estate Commission", highlight: true },
  { state: "South Dakota", period: "5 calendar days", statute: "SD Codified Laws \u00a743-15B", body: "SD Real Estate Commission" },
  { state: "Tennessee", period: "10 calendar days", statute: "TN Code \u00a766-32", body: "TN Real Estate Commission", highlight: true },
  { state: "Texas", period: "6 calendar days", statute: "TX Prop. Code \u00a7221", body: "TX Real Estate Commission", highlight: true },
  { state: "Utah", period: "5 calendar days", statute: "UT Code \u00a757-19", body: "UT Div. of Real Estate" },
  { state: "Vermont", period: "5 calendar days", statute: "VT Stat. Title 32 \u00a710-172", body: "VT Real Estate Commission" },
  { state: "Virginia", period: "7 calendar days", statute: "VA Code \u00a755.1-2200", body: "VA CIC Board", highlight: true },
  { state: "Washington", period: "7 calendar days", statute: "RCW 64.36", body: "WA Dept. of Licensing" },
  { state: "West Virginia", period: "10 calendar days", statute: "WV Code \u00a736-9-1", body: "WV Attorney General" },
  { state: "Wisconsin", period: "5 calendar days", statute: "WI Stat. \u00a7707", body: "WI DATCP" },
  { state: "Wyoming", period: "5 calendar days", statute: "WY Stat. \u00a734-19-101", body: "WY Real Estate Commission" },
];

export default function TimeshareLawsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Timeshare Laws by State</li>
        </ol>
      </nav>

      <h1 className="mb-2 text-3xl font-bold text-gray-900">Timeshare Laws by State</h1>
      <p className="mb-4 text-gray-600">
        A comprehensive guide to timeshare consumer protection laws, rescission (cancellation) periods,
        and regulatory agencies across all 50 U.S. states and the District of Columbia.
      </p>

      {/* Important disclaimer */}
      <div className="mb-8 rounded-xl border-2 border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="mb-2 font-bold text-base">Important Legal Disclaimer</p>
        <p>
          This information is provided for <strong>educational and informational purposes only</strong> and
          does <strong>NOT</strong> constitute legal advice. Timeshare laws change frequently. The information
          below was compiled as of April 2026 and may not reflect recent legislative changes. Always consult
          a <strong>licensed attorney in your state</strong> for specific legal guidance before making any
          timeshare purchase decision.
        </p>
        <p className="mt-2">
          VacationDeals.to is an independent deal comparison website. We do not sell, broker, or facilitate
          the sale of timeshare interests. We are not a law firm and cannot provide legal advice.
        </p>
      </div>

      {/* Key takeaways */}
      <section className="mb-10 rounded-xl border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Key Takeaways</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li><strong>Every state provides a cancellation period.</strong> You always have a right to cancel a timeshare purchase within a set number of days.</li>
          <li><strong>Periods range from 3 to 15 days</strong> depending on the state. Alaska has the longest (15 days), while some states offer only 3 business days.</li>
          <li><strong>&ldquo;Calendar days&rdquo; vs. &ldquo;business days&rdquo; matters.</strong> 3 business days is effectively 5 calendar days. Check your state carefully.</li>
          <li><strong>Cancellation must typically be in writing.</strong> Send by certified mail with return receipt for proof.</li>
          <li><strong>Deposits must usually be held in escrow</strong> during the rescission period.</li>
          <li><strong>You cannot waive your rescission rights.</strong> Any contract clause attempting to remove your right to cancel is void in most states.</li>
          <li><strong>Attending a presentation does NOT obligate you to buy.</strong> You may decline all offers.</li>
        </ul>
      </section>

      {/* State table */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          All 50 States + DC: Rescission Periods &amp; Regulatory Bodies
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Cancellation Period</th>
                <th className="px-4 py-3">Key Statute</th>
                <th className="px-4 py-3">Regulatory Body</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {states.map((s) => (
                <tr key={s.state} className={`hover:bg-gray-50 ${s.highlight ? "bg-blue-50" : ""}`}>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{s.state}</td>
                  <td className="px-4 py-2.5 text-gray-700">{s.period}</td>
                  <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{s.statute}</td>
                  <td className="px-4 py-2.5 text-gray-600">{s.body}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Highlighted rows indicate major timeshare states. &ldquo;Business days&rdquo; exclude weekends and
          holidays; &ldquo;calendar days&rdquo; include all days. This table is for informational purposes only.
        </p>
      </section>

      {/* Federal laws */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Federal Regulations</h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-900">FTC Cooling-Off Rule (16 CFR 429)</h3>
            <p className="mt-1 text-sm text-gray-600">
              Provides 3 days to cancel sales made at locations other than the seller&apos;s permanent place
              of business. May apply to some off-site timeshare presentations.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-900">FTC Telemarketing Sales Rule (16 CFR 310)</h3>
            <p className="mt-1 text-sm text-gray-600">
              Prohibits deceptive practices in telemarketing. Applies to timeshare resale companies that use
              telemarketing. Bans advance fees for timeshare resale services in many contexts.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-900">Interstate Land Sales Full Disclosure Act (ILSA)</h3>
            <p className="mt-1 text-sm text-gray-600">
              Administered by the CFPB. Requires registration and disclosure for subdivisions of 100+ lots
              sold interstate. Many timeshare projects are exempt under 1980 amendments.
            </p>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Additional Resources</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            <strong>ARDA (American Resort Development Association):</strong>{" "}
            <span className="text-gray-500">arda.org &mdash; Industry trade group, publishes state law summaries</span>
          </li>
          <li>
            <strong>FTC Consumer Information:</strong>{" "}
            <span className="text-gray-500">consumer.ftc.gov &mdash; Search &ldquo;timeshare&rdquo; for federal guidance</span>
          </li>
          <li>
            <strong>National Conference of State Legislatures (NCSL):</strong>{" "}
            <span className="text-gray-500">ncsl.org &mdash; Tracks timeshare legislation by state</span>
          </li>
          <li>
            <strong>Your State Attorney General:</strong>{" "}
            <span className="text-gray-500">Most AG offices have consumer protection divisions with timeshare buyer guides</span>
          </li>
        </ul>
      </section>

      {/* CTA */}
      <section className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-600">
        <p className="mb-3">
          Looking for vacation deals? Browse our aggregated listings from 40+ brands across 100+ destinations.
        </p>
        <Link
          href="/deals"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Browse All Vacation Deals &rarr;
        </Link>
      </section>
    </div>
  );
}
