import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms and Conditions for VacationDeals.to. Understand the rules governing your use of our vacation package comparison website, including important timeshare disclosures.",
  alternates: { canonical: "https://vacationdeals.to/terms" },
};

export default function TermsAndConditionsPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Vacation Deals",
        item: "https://vacationdeals.to",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Terms & Conditions",
        item: "https://vacationdeals.to/terms",
      },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-blue-600">
              Vacation Deals
            </Link>
          </li>
          <li>
            <span className="mx-1">/</span>
          </li>
          <li className="font-medium text-gray-900">Terms &amp; Conditions</li>
        </ol>
      </nav>

      <h1 className="mb-2 text-3xl font-bold text-gray-900">
        Terms &amp; Conditions
      </h1>
      <p className="mb-8 text-sm text-gray-500">Last Updated: April 16, 2026</p>

      {/* ── Critical Disclaimers Banner ── */}
      <div className="mb-10 rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
        <p className="mb-3 font-semibold text-base">Important Notices</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong>VacationDeals.to is an independent comparison and information
            website.</strong> We are NOT affiliated with, endorsed by, or acting as
            agents for any resort, hotel, or timeshare company.
          </li>
          <li>
            All vacation packages displayed on this site are offered by{" "}
            <strong>third-party providers</strong>. VacationDeals.to does not sell,
            broker, or facilitate the sale of any vacation packages or timeshare
            interests.
          </li>
          <li>
            Vacation packages typically require attendance at a{" "}
            <strong>timeshare sales presentation</strong> (usually 90&ndash;120
            minutes). You are under <strong>NO obligation</strong> to purchase
            anything.
          </li>
          <li>
            Prices, availability, and package details are provided by third-party
            sources and may change without notice. We make reasonable efforts to
            keep information current but cannot guarantee accuracy.
          </li>
          <li>
            Some links on this site may be <strong>affiliate links</strong>. We may
            earn a commission if you book through our links, at no additional cost
            to you.
          </li>
        </ul>
      </div>

      <div className="space-y-10 text-gray-700 leading-relaxed">
        {/* ── 1. Acceptance ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using VacationDeals.to (the &ldquo;Site&rdquo;), you
            agree to be bound by these Terms &amp; Conditions (the
            &ldquo;Terms&rdquo;). If you do not agree, you must stop using the Site
            immediately. We may update these Terms at any time; continued use after
            changes are posted constitutes acceptance of the revised Terms.
          </p>
        </section>

        {/* ── 2. Description of Service ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            2. Description of Service
          </h2>
          <p>
            VacationDeals.to is a <strong>vacation-package aggregator and comparison
            website</strong>. We compile publicly available information about
            timeshare-preview vacation packages offered by third-party resort
            companies and brokers (including, but not limited to, Westgate Resorts,
            BookVIP, Marriott Vacation Club, Hilton Grand Vacations, Club Wyndham,
            and others) and present them in a convenient, searchable format.
          </p>
          <p className="mt-3">
            <strong>We do not:</strong>
          </p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>Sell, book, or process vacation packages or timeshare interests</li>
            <li>Collect payment or financial information for bookings</li>
            <li>Guarantee any pricing, availability, or package terms</li>
            <li>Act as an agent, broker, or representative for any resort or provider</li>
            <li>Provide legal, financial, or real-estate advice</li>
          </ul>
          <p className="mt-3">
            When you click a deal on our Site, you are redirected to the
            third-party provider&rsquo;s website. Your booking, payment, and
            interaction are governed entirely by that provider&rsquo;s terms and
            policies.
          </p>
        </section>

        {/* ── 3. Timeshare Presentation Disclosure ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            3. Timeshare Presentation Disclosure
          </h2>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            3.1 Presentation Requirement
          </h3>
          <p>
            Most vacation packages listed on this Site are promotional offers that
            require attendance at a <strong>timeshare sales presentation</strong>,
            typically lasting 90&ndash;120 minutes, as a condition of receiving the
            discounted rate. Failure to attend the presentation may result in
            forfeiture of the promotional rate and charges at the standard hotel rate.
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            3.2 No Purchase Obligation
          </h3>
          <p>
            Attendance at a timeshare presentation does <strong>not</strong> obligate
            you to purchase a timeshare, vacation ownership interest, or any other
            product or service. You may decline any offer made during the
            presentation.
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            3.3 Age and Income Qualifications
          </h3>
          <p>
            Third-party providers typically impose eligibility requirements for
            promotional packages, which may include minimum age (often 25&ndash;30),
            minimum household income, marital status, and valid government-issued ID
            requirements. These requirements vary by provider and package. Review the
            specific terms on the provider&rsquo;s website before booking.
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            3.4 Cooling-Off Period / Right of Rescission
          </h3>
          <p>
            If you choose to purchase a timeshare or vacation ownership interest
            during a sales presentation, most states provide a{" "}
            <strong>rescission (cooling-off) period</strong> during which you may
            cancel the purchase without penalty. This period varies by state
            (typically 3&ndash;15 days from the date of purchase or the date you
            receive required disclosures, whichever is later).
          </p>
          <p className="mt-2">
            <strong>You are strongly encouraged to understand your rescission
            rights before attending any presentation.</strong>
          </p>
        </section>

        {/* ── 4. State Rescission Periods ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            4. State Timeshare Rescission Periods
          </h2>
          <p className="mb-3">
            The following table summarizes rescission periods under various state
            laws. This is provided for informational purposes only and does not
            constitute legal advice. Laws are subject to change; consult an attorney
            for current requirements.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2 font-semibold text-gray-900 border-b border-gray-200">
                    State
                  </th>
                  <th className="px-4 py-2 font-semibold text-gray-900 border-b border-gray-200">
                    Rescission Period
                  </th>
                  <th className="px-4 py-2 font-semibold text-gray-900 border-b border-gray-200">
                    Key Statute
                  </th>
                  <th className="px-4 py-2 font-semibold text-gray-900 border-b border-gray-200">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-2 font-medium">Florida</td>
                  <td className="px-4 py-2">10 calendar days</td>
                  <td className="px-4 py-2">Fla. Stat. &sect;721</td>
                  <td className="px-4 py-2">
                    Requires specific public-offering statement; buyer may cancel
                    by midnight of the 10th day
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">California</td>
                  <td className="px-4 py-2">7 calendar days</td>
                  <td className="px-4 py-2">Cal. Bus. &amp; Prof. Code &sect;11238</td>
                  <td className="px-4 py-2">
                    Applies to timeshare interests in California properties
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Nevada</td>
                  <td className="px-4 py-2">5 calendar days</td>
                  <td className="px-4 py-2">NRS &sect;119A</td>
                  <td className="px-4 py-2">
                    Cancellation must be in writing
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Tennessee</td>
                  <td className="px-4 py-2">10 calendar days</td>
                  <td className="px-4 py-2">Tenn. Code &sect;66-32</td>
                  <td className="px-4 py-2">
                    15 days if developer fails to provide required disclosures
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">South Carolina</td>
                  <td className="px-4 py-2">5 calendar days</td>
                  <td className="px-4 py-2">S.C. Code &sect;27-32</td>
                  <td className="px-4 py-2">
                    Purchaser may cancel by midnight of the 5th business day
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">New York</td>
                  <td className="px-4 py-2">5 business days</td>
                  <td className="px-4 py-2">N.Y. Gen. Bus. Law &sect;396-bb</td>
                  <td className="px-4 py-2">
                    Business days (excludes weekends/holidays)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Texas</td>
                  <td className="px-4 py-2">6 calendar days</td>
                  <td className="px-4 py-2">Tex. Prop. Code &sect;221</td>
                  <td className="px-4 py-2">
                    Cancellation notice must be hand-delivered or sent by mail/telegram
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Hawaii</td>
                  <td className="px-4 py-2">7 calendar days</td>
                  <td className="px-4 py-2">HRS &sect;514E</td>
                  <td className="px-4 py-2">
                    Applies to timeshare plans offered in Hawaii
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Arizona</td>
                  <td className="px-4 py-2">7 calendar days</td>
                  <td className="px-4 py-2">A.R.S. &sect;32-2197</td>
                  <td className="px-4 py-2">
                    Written cancellation required
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Virginia</td>
                  <td className="px-4 py-2">7 calendar days</td>
                  <td className="px-4 py-2">Va. Code &sect;55.1-2200 et seq.</td>
                  <td className="px-4 py-2">
                    Developer must provide public-offering statement
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Colorado</td>
                  <td className="px-4 py-2">5 calendar days</td>
                  <td className="px-4 py-2">C.R.S. &sect;6-1-702</td>
                  <td className="px-4 py-2">
                    Right to cancel without cause
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-sm text-gray-500">
            This table is for general informational purposes only. It does not
            cover all states or territories, and laws may have changed since this
            page was last updated. Always verify current rescission rights with the
            applicable state agency or a licensed attorney before making a purchase.
          </p>
        </section>

        {/* ── 5. Timeshare State Law Disclosures ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            5. Timeshare State Law Disclosures
          </h2>
          <p className="mb-3">
            Various states impose specific disclosure requirements on timeshare
            advertising and sales. Although VacationDeals.to does not sell timeshare
            interests, we provide the following notices in the spirit of full
            transparency:
          </p>

          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">
                Florida (Fla. Stat. &sect;721)
              </h3>
              <p className="mt-1 text-sm">
                The developer is required to deliver a public-offering statement to
                prospective purchasers prior to execution of a purchase contract.
                Any purchaser has the right to cancel the contract within 10 days
                after execution. The State of Florida does not inspect, approve, or
                endorse timeshare plans.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">
                California (Bus. &amp; Prof. Code &sect;11238)
              </h3>
              <p className="mt-1 text-sm">
                Timeshare interests offered in California must be registered with
                the Department of Real Estate. Purchasers have 7 days to cancel.
                This is not an offering in any state where such an offering cannot
                lawfully be made.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">
                Nevada (NRS &sect;119A)
              </h3>
              <p className="mt-1 text-sm">
                A purchaser of a timeshare interest may cancel a purchase contract
                within 5 calendar days. The developer must register the timeshare
                plan with the Nevada Real Estate Division.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">
                Tennessee (Tenn. Code &sect;66-32)
              </h3>
              <p className="mt-1 text-sm">
                Purchasers have 10 calendar days to rescind a timeshare contract.
                If the developer fails to deliver all required disclosures, the
                rescission period extends to 15 days. All funds are held in escrow
                during the rescission period.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">
                South Carolina (S.C. Code &sect;27-32)
              </h3>
              <p className="mt-1 text-sm">
                Purchasers may cancel by midnight of the 5th business day following
                execution of the purchase contract. The developer must provide a
                public-offering statement.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">
                New York (Gen. Bus. Law &sect;396-bb)
              </h3>
              <p className="mt-1 text-sm">
                Purchasers have 5 business days to cancel. The offering must comply
                with the New York Department of Law filing requirements. No
                timeshare may be offered in New York unless properly registered.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">
                Texas (Tex. Prop. Code &sect;221)
              </h3>
              <p className="mt-1 text-sm">
                Purchasers have 6 calendar days to cancel a timeshare contract.
                The Texas Real Estate Commission oversees timeshare registrations.
                Written cancellation must be hand-delivered or sent by mail or
                telegram.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">
                Hawaii (HRS &sect;514E)
              </h3>
              <p className="mt-1 text-sm">
                Purchasers may cancel within 7 calendar days. Timeshare plans
                offered in Hawaii must be registered with the Department of
                Commerce and Consumer Affairs.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">
                Arizona (A.R.S. &sect;32-2197)
              </h3>
              <p className="mt-1 text-sm">
                Purchasers may cancel a timeshare contract within 7 calendar days.
                The Arizona Department of Real Estate regulates timeshare sales in
                the state.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">
                Virginia (Va. Code &sect;55.1-2200 et seq.)
              </h3>
              <p className="mt-1 text-sm">
                Purchasers have 7 calendar days to cancel. The developer must
                deliver a public-offering statement before the purchase contract is
                executed. The Virginia Common Interest Community Board oversees
                timeshare regulation.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">
                Colorado (C.R.S. &sect;6-1-702)
              </h3>
              <p className="mt-1 text-sm">
                Purchasers may cancel within 5 calendar days without cause. The
                developer must make specified disclosures, and all deposits must be
                placed in an escrow account.
              </p>
            </div>
          </div>
        </section>

        {/* ── 6. Affiliate Disclosure ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            6. FTC Affiliate Disclosure
          </h2>
          <p>
            In accordance with the Federal Trade Commission&rsquo;s guidelines on
            endorsements and testimonials (16 CFR Part 255), we disclose the
            following:
          </p>
          <p className="mt-3">
            Some links on VacationDeals.to are <strong>affiliate links</strong>.
            This means that if you click on a link and subsequently book a vacation
            package on a third-party site, we may receive a referral commission at{" "}
            <strong>no additional cost to you</strong>. This compensation may
            influence which deals are displayed and how they are ranked on our Site,
            but it does not affect the price you pay.
          </p>
          <p className="mt-3">
            Our editorial content and deal listings are created independently.
            Affiliate relationships do not guarantee inclusion, favorable
            positioning, or positive reviews for any particular provider or package.
          </p>
        </section>

        {/* ── 7. Intellectual Property ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            7. Intellectual Property
          </h2>
          <p>
            All content on the Site, including text, graphics, logos, page layouts,
            and software, is the property of VacationDeals.to or its content
            suppliers and is protected by United States and international copyright,
            trademark, and other intellectual property laws.
          </p>
          <p className="mt-3">
            Resort names, logos, and trademarks displayed on this Site (e.g.,
            Westgate Resorts, Marriott Vacation Club, Hilton Grand Vacations) are
            the property of their respective owners. Their use on this Site is for
            identification and informational purposes only and does not imply
            endorsement, affiliation, or sponsorship.
          </p>
          <p className="mt-3">
            You may not reproduce, distribute, modify, create derivative works of,
            publicly display, or exploit any content from this Site without prior
            written consent.
          </p>
        </section>

        {/* ── 8. User Conduct ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            8. User Conduct
          </h2>
          <p>You agree not to:</p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>Use the Site for any unlawful purpose</li>
            <li>
              Scrape, crawl, or use automated tools to extract data from the Site
              without written permission
            </li>
            <li>
              Attempt to interfere with or disrupt the Site&rsquo;s servers or
              infrastructure
            </li>
            <li>Impersonate VacationDeals.to or its operators</li>
            <li>
              Use the Site to transmit malware, spam, or other harmful content
            </li>
            <li>
              Copy, reproduce, or redistribute Site content for commercial purposes
            </li>
          </ul>
        </section>

        {/* ── 9. Disclaimer of Warranties ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            9. Disclaimer of Warranties
          </h2>
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm uppercase">
            <p>
              THE SITE AND ALL CONTENT, INFORMATION, AND DEAL LISTINGS ARE PROVIDED
              &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES
              OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE,
              INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR
              A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p className="mt-3">
              VACATIONDEALS.TO DOES NOT WARRANT THAT: (A) THE SITE WILL BE
              UNINTERRUPTED OR ERROR-FREE; (B) DEAL LISTINGS, PRICES, OR
              AVAILABILITY INFORMATION WILL BE ACCURATE, COMPLETE, OR CURRENT; (C)
              ANY THIRD-PARTY VACATION PACKAGE WILL MEET YOUR EXPECTATIONS; OR (D)
              ANY DEFECTS WILL BE CORRECTED.
            </p>
            <p className="mt-3">
              WE ARE NOT RESPONSIBLE FOR THE ACTIONS, PRODUCTS, SERVICES, OR CONTENT
              OF ANY THIRD-PARTY WEBSITES LINKED FROM THIS SITE.
            </p>
          </div>
        </section>

        {/* ── 10. Limitation of Liability ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            10. Limitation of Liability
          </h2>
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm uppercase">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, VACATIONDEALS.TO,
              ITS OWNERS, OFFICERS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR
              ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
              OR ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING OUT OF OR
              IN CONNECTION WITH YOUR USE OF THE SITE OR ANY THIRD-PARTY WEBSITE
              LINKED FROM THE SITE, WHETHER BASED ON WARRANTY, CONTRACT, TORT
              (INCLUDING NEGLIGENCE), STATUTE, OR ANY OTHER LEGAL THEORY, EVEN IF WE
              HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mt-3">
              OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING
              TO THE SITE SHALL NOT EXCEED ONE HUNDRED U.S. DOLLARS ($100.00).
            </p>
          </div>
        </section>

        {/* ── 11. Indemnification ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            11. Indemnification
          </h2>
          <p>
            You agree to indemnify, defend, and hold harmless VacationDeals.to, its
            owners, officers, employees, and affiliates from and against any and all
            claims, damages, losses, liabilities, costs, and expenses (including
            reasonable attorneys&rsquo; fees) arising out of or related to: (a) your
            use of the Site; (b) your violation of these Terms; (c) your violation of
            any third-party right, including any intellectual property, privacy, or
            proprietary right; or (d) any dispute between you and a third-party
            vacation-package provider.
          </p>
        </section>

        {/* ── 12. Third-Party Links ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            12. Third-Party Links and Content
          </h2>
          <p>
            The Site contains links to websites operated by third parties (resort
            companies, booking platforms, brokers, etc.). These links are provided
            for your convenience and informational purposes only. We do not control,
            endorse, or assume responsibility for the content, privacy policies,
            terms of service, or practices of any third-party site.
          </p>
          <p className="mt-3">
            Your interactions with third-party websites, including any purchases,
            are solely between you and the third party. We strongly recommend that
            you review the terms and privacy policies of any website you visit
            through links on our Site.
          </p>
        </section>

        {/* ── 13. Accuracy of Information ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            13. Accuracy of Information
          </h2>
          <p>
            We make reasonable efforts to ensure that the vacation-package
            information displayed on the Site (including prices, descriptions,
            locations, and availability) is accurate and up to date. However, this
            information is sourced from third-party providers and is subject to
            change at any time without notice.
          </p>
          <p className="mt-3">
            <strong>We do not guarantee</strong> the accuracy, completeness, or
            timeliness of any information on the Site. Always verify package details,
            pricing, eligibility requirements, and terms directly with the
            third-party provider before booking.
          </p>
        </section>

        {/* ── 14. Governing Law ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            14. Governing Law and Dispute Resolution
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with the
            laws of the State of Florida, United States, without regard to its
            conflict-of-law principles.
          </p>
          <p className="mt-3">
            Any dispute arising out of or relating to these Terms or the Site shall
            be resolved exclusively in the state or federal courts located in the
            State of Florida. You consent to the personal jurisdiction of such courts
            and waive any objection to venue.
          </p>
        </section>

        {/* ── 15. Severability ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            15. Severability
          </h2>
          <p>
            If any provision of these Terms is found to be invalid, illegal, or
            unenforceable by a court of competent jurisdiction, the remaining
            provisions shall continue in full force and effect. The invalid provision
            shall be modified to the minimum extent necessary to make it valid and
            enforceable.
          </p>
        </section>

        {/* ── 16. Entire Agreement ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            16. Entire Agreement
          </h2>
          <p>
            These Terms, together with our{" "}
            <a
              href="/privacy"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Privacy Policy
            </a>
            , constitute the entire agreement between you and VacationDeals.to
            regarding your use of the Site and supersede all prior agreements and
            understandings.
          </p>
        </section>

        {/* ── 17. DMCA ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            17. DMCA / Copyright Claims
          </h2>
          <p>
            If you believe that content on this Site infringes your copyright, please
            send a written notice to{" "}
            <a href="mailto:legal@vacationdeals.to" className="text-blue-600 underline hover:text-blue-800">
              legal@vacationdeals.to
            </a>{" "}
            with the following information: (a) identification of the copyrighted work;
            (b) identification of the infringing material and its location on the Site;
            (c) your contact information; (d) a statement that you have a good faith
            belief the use is not authorized; and (e) a statement under penalty of
            perjury that your notice is accurate and you are the copyright owner or
            authorized to act on their behalf.
          </p>
        </section>

        {/* ── 18. Binding Arbitration ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            18. Binding Arbitration &amp; Class Action Waiver
          </h2>
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm">
            <p>
              <strong>PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS.</strong>
            </p>
            <p className="mt-3">
              You and VacationDeals.to agree that any dispute, claim, or controversy
              arising out of or relating to these Terms or the Site shall be resolved by
              binding individual arbitration administered by the American Arbitration
              Association (&ldquo;AAA&rdquo;) under its Consumer Arbitration Rules, and
              not in court, except that either party may bring individual claims in small
              claims court if they qualify.
            </p>
            <p className="mt-3">
              <strong>CLASS ACTION WAIVER:</strong> You and VacationDeals.to agree that
              any arbitration or court proceeding shall be conducted only on an
              individual basis and not in a class, consolidated, or representative
              action. If a court or arbitrator determines that the class action waiver
              is void or unenforceable for any reason, then the arbitration agreement
              shall be null and void.
            </p>
            <p className="mt-3">
              You may opt out of this arbitration provision by sending written notice to{" "}
              <a href="mailto:legal@vacationdeals.to" className="text-blue-600 underline hover:text-blue-800">
                legal@vacationdeals.to
              </a>{" "}
              within 30 days of first using the Site.
            </p>
          </div>
        </section>

        {/* ── 19. Communications Consent (TCPA) ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            19. Communications Consent
          </h2>
          <p>
            By providing your email address and/or mobile phone number through any form
            on the Site, you provide your prior express written consent under the
            Telephone Consumer Protection Act (47 U.S.C. &sect; 227) to receive promotional
            communications from VacationDeals.to. This consent is not a condition of any
            purchase. You may revoke consent at any time by emailing{" "}
            <a href="mailto:privacy@vacationdeals.to" className="text-blue-600 underline hover:text-blue-800">
              privacy@vacationdeals.to
            </a>{" "}
            or replying STOP to any SMS message. See our{" "}
            <a href="/privacy" className="text-blue-600 underline hover:text-blue-800">
              Privacy Policy
            </a>{" "}
            for full details on how we handle your information.
          </p>
        </section>

        {/* ── 20. Changes to Terms ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            17. Changes to These Terms
          </h2>
          <p>
            We reserve the right to modify these Terms at any time. When we make
            material changes, we will update the &ldquo;Last Updated&rdquo; date at
            the top of this page. Your continued use of the Site after any
            modifications constitutes acceptance of the updated Terms. We encourage
            you to review this page periodically.
          </p>
        </section>

        {/* ── 18. Contact ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            18. Contact Us
          </h2>
          <p>
            If you have questions about these Terms &amp; Conditions, please
            contact us:
          </p>
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
            <p>
              <strong>VacationDeals.to</strong>
            </p>
            <p>
              Email:{" "}
              <a
                href="mailto:legal@vacationdeals.to"
                className="text-blue-600 underline hover:text-blue-800"
              >
                legal@vacationdeals.to
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
