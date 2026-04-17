import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for VacationDeals.to. Learn how we collect, use, and protect your information when you visit our vacation package comparison website.",
  alternates: { canonical: "https://vacationdeals.to/privacy" },
};

export default function PrivacyPolicyPage() {
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
        name: "Privacy Policy",
        item: "https://vacationdeals.to/privacy",
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
          <li className="font-medium text-gray-900">Privacy Policy</li>
        </ol>
      </nav>

      <h1 className="mb-2 text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mb-8 text-sm text-gray-500">Last Updated: April 16, 2026</p>

      <div className="space-y-10 text-gray-700 leading-relaxed">
        {/* ── Introduction ── */}
        <section>
          <p>
            VacationDeals.to (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the website{" "}
            <strong>vacationdeals.to</strong> (the &ldquo;Site&rdquo;). This Privacy Policy explains
            how we collect, use, disclose, and safeguard your information when you
            visit our Site. VacationDeals.to is a vacation-package comparison and
            information website. We do <strong>not</strong> sell, broker, or facilitate
            the sale of vacation packages or timeshare interests. When you click a
            link on our Site, you are redirected to a third-party website whose own
            privacy policy governs that interaction.
          </p>
          <p className="mt-3">
            Please read this policy carefully. By accessing or using the Site, you
            agree to the terms of this Privacy Policy. If you do not agree, please
            do not use the Site.
          </p>
        </section>

        {/* ── 1. Information We Collect ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            1. Information We Collect
          </h2>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            1.1 Information Collected Automatically
          </h3>
          <p>
            When you visit the Site, we (and our third-party analytics providers)
            automatically collect certain information, including:
          </p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>IP address (which may be truncated or anonymized)</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Referring URL and exit pages</li>
            <li>Pages viewed, time spent on pages, and click-stream data</li>
            <li>Device type (desktop, tablet, mobile)</li>
            <li>Approximate geographic location (city/region level, derived from IP)</li>
            <li>Date and time of each visit</li>
          </ul>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            1.2 Cookies and Similar Technologies
          </h3>
          <p>
            We use cookies, pixel tags, and similar technologies to collect the
            information described above. See Section 3 (&ldquo;Cookies and
            Tracking&rdquo;) for details and opt-out instructions.
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            1.3 Information You Provide Voluntarily
          </h3>
          <p>
            If you contact us via email, a contact form, or opt-in to our
            communications (such as the Resort Roulette email gate or deal alerts
            signup), we collect the information you provide, which may include:
          </p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>Email address</li>
            <li>Mobile phone number (if provided for SMS alerts)</li>
            <li>Name (if provided)</li>
            <li>Message content (if contacting us)</li>
            <li>IP address and user agent at the time of submission (for consent verification)</li>
            <li>Date and timestamp of submission</li>
          </ul>
          <p className="mt-2">
            We do not require account creation to browse the Site. Providing your
            email or phone number is entirely voluntary and constitutes your express
            consent to receive communications as described in Section 16 (TCPA Compliance).
          </p>
        </section>

        {/* ── 2. How We Use Information ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            2. How We Use Your Information
          </h2>
          <p>We use the information we collect to:</p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>Operate, maintain, and improve the Site</li>
            <li>Understand how visitors use the Site (analytics)</li>
            <li>Detect and prevent fraud, abuse, and security incidents</li>
            <li>Display relevant advertisements (via Google AdSense or similar)</li>
            <li>Respond to your inquiries or requests</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p className="mt-3">
            We do <strong>not</strong> sell vacation packages, collect payment
            information, or process bookings. Any transaction you complete occurs
            on a third-party site subject to that site&rsquo;s privacy practices.
          </p>
        </section>

        {/* ── 3. Cookies and Tracking ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            3. Cookies and Tracking Technologies
          </h2>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            3.1 Types of Cookies We Use
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2 font-semibold text-gray-900 border-b border-gray-200">Category</th>
                  <th className="px-4 py-2 font-semibold text-gray-900 border-b border-gray-200">Provider</th>
                  <th className="px-4 py-2 font-semibold text-gray-900 border-b border-gray-200">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-2">Essential</td>
                  <td className="px-4 py-2">VacationDeals.to</td>
                  <td className="px-4 py-2">Site functionality, cookie-consent preference</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Analytics</td>
                  <td className="px-4 py-2">Google Analytics / Google Tag Manager</td>
                  <td className="px-4 py-2">Understand visitor behavior, page views, traffic sources</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Advertising</td>
                  <td className="px-4 py-2">Google AdSense</td>
                  <td className="px-4 py-2">Serve and personalize advertisements</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Affiliate Tracking</td>
                  <td className="px-4 py-2">Various affiliate networks</td>
                  <td className="px-4 py-2">Track referral clicks to third-party booking sites</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            3.2 Managing Cookies
          </h3>
          <p>You can control cookies through:</p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>
              <strong>Browser settings:</strong> Most browsers allow you to block or
              delete cookies. Refer to your browser&rsquo;s help documentation.
            </li>
            <li>
              <strong>Google Analytics opt-out:</strong> Install the{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                Google Analytics Opt-out Browser Add-on
              </a>
              .
            </li>
            <li>
              <strong>Ad personalization:</strong> Visit{" "}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                Google Ads Settings
              </a>{" "}
              or the{" "}
              <a
                href="https://optout.networkadvertising.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                NAI Consumer Opt-Out
              </a>
              .
            </li>
          </ul>
          <p className="mt-2">
            Disabling cookies may affect your experience on the Site but will not
            prevent you from viewing vacation deal listings.
          </p>
        </section>

        {/* ── 4. Third-Party Links ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            4. Third-Party Links and Services
          </h2>
          <p>
            The Site contains links to third-party websites (e.g., Westgate Resorts,
            BookVIP, Marriott Vacation Club, and other resort and broker websites).
            When you click one of these links, you leave VacationDeals.to. We are{" "}
            <strong>not responsible</strong> for the privacy practices, content, or
            security of any third-party site. We encourage you to read the privacy
            policy of every site you visit.
          </p>
          <p className="mt-3">
            Some outbound links may be affiliate links. If you book through an
            affiliate link, we may receive a commission at no additional cost to you.
            This does not affect the information collected by the third-party site.
          </p>
        </section>

        {/* ── 5. Data Sharing ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            5. How We Share Your Information
          </h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>
              <strong>Service providers:</strong> Hosting, analytics, and
              advertising partners who process data on our behalf.
            </li>
            <li>
              <strong>Legal compliance:</strong> If required by law, subpoena, or
              court order, or to protect our rights or safety.
            </li>
            <li>
              <strong>Business transfers:</strong> In the event of a merger,
              acquisition, or sale of assets.
            </li>
          </ul>
        </section>

        {/* ── 6. Data Retention ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            6. Data Retention
          </h2>
          <p>
            We retain automatically collected data (analytics, server logs) for up
            to 26 months, after which it is aggregated or deleted. If you contact us,
            we retain your correspondence for as long as necessary to address your
            inquiry and for our records, unless you request deletion.
          </p>
        </section>

        {/* ── 7. Data Security ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            7. Data Security
          </h2>
          <p>
            We use commercially reasonable technical and organizational measures to
            protect data against unauthorized access, alteration, disclosure, or
            destruction. However, no method of electronic storage or transmission is
            100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        {/* ── 8. Your Rights and Choices ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            8. Your Rights and Choices
          </h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt out of the sale or sharing of personal information</li>
            <li>Opt out of targeted advertising</li>
            <li>Withdraw consent (where processing is consent-based)</li>
            <li>Lodge a complaint with a supervisory authority</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, contact us at{" "}
            <a
              href="mailto:privacy@vacationdeals.to"
              className="text-blue-600 underline hover:text-blue-800"
            >
              privacy@vacationdeals.to
            </a>
            . We will respond within the timeframe required by applicable law
            (typically 30&ndash;45 days).
          </p>
        </section>

        {/* ── 9. CCPA ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            9. California Privacy Rights (CCPA / CPRA)
          </h2>
          <p>
            If you are a California resident, the California Consumer Privacy Act
            (as amended by the CPRA) provides you with specific rights:
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            Right to Know
          </h3>
          <p>
            You have the right to request that we disclose the categories and
            specific pieces of personal information we have collected about you, the
            categories of sources, the business purpose for collection, and the
            categories of third parties with whom we share it.
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            Right to Delete
          </h3>
          <p>
            You may request that we delete personal information we have collected
            from you, subject to certain exceptions provided by law.
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            Right to Opt-Out of Sale / Sharing
          </h3>
          <p>
            We do <strong>not</strong> sell personal information in the traditional
            sense. However, certain uses of cookies for targeted advertising may
            constitute &ldquo;sharing&rdquo; under the CCPA/CPRA. You may opt out of
            this sharing by adjusting your cookie preferences or contacting us.
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            Right to Non-Discrimination
          </h3>
          <p>
            We will not discriminate against you for exercising any of your CCPA
            rights.
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            Categories of Information Collected
          </h3>
          <p>
            In the preceding 12 months, we may have collected the following
            categories of personal information (as defined by the CCPA):
          </p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>
              <strong>Identifiers:</strong> IP address, cookie identifiers
            </li>
            <li>
              <strong>Internet activity:</strong> Browsing history on the Site, search
              queries, interactions with ads
            </li>
            <li>
              <strong>Geolocation data:</strong> Approximate location derived from IP
              address
            </li>
          </ul>

          <p className="mt-3">
            To submit a CCPA request, email{" "}
            <a
              href="mailto:privacy@vacationdeals.to"
              className="text-blue-600 underline hover:text-blue-800"
            >
              privacy@vacationdeals.to
            </a>{" "}
            with the subject line &ldquo;CCPA Request.&rdquo; We will verify your identity
            before fulfilling the request.
          </p>
        </section>

        {/* ── 10. Other US State Privacy Rights ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            10. Additional U.S. State Privacy Rights
          </h2>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            Virginia (VCDPA)
          </h3>
          <p>
            Virginia residents have the right to access, correct, delete, and obtain
            a copy of their personal data, and to opt out of the processing of
            personal data for targeted advertising, sale, or profiling. To exercise
            these rights, contact us at{" "}
            <a
              href="mailto:privacy@vacationdeals.to"
              className="text-blue-600 underline hover:text-blue-800"
            >
              privacy@vacationdeals.to
            </a>
            . If we decline your request, you may appeal by contacting us, and if
            unsatisfied, you may contact the Virginia Attorney General.
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            Colorado (CPA)
          </h3>
          <p>
            Colorado residents have similar rights to access, correct, delete, and
            port their personal data, and to opt out of targeted advertising, sale,
            or profiling. You may exercise these rights by contacting us. Appeals may
            be directed to the Colorado Attorney General.
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            Connecticut (CTDPA)
          </h3>
          <p>
            Connecticut residents have the right to access, correct, delete, and
            obtain a copy of their personal data, and to opt out of the sale of
            personal data, targeted advertising, and profiling. Contact us to
            exercise these rights. You may appeal a denial and, if unsatisfied,
            contact the Connecticut Attorney General.
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            Nevada
          </h3>
          <p>
            Nevada residents may submit a verified request directing us not to sell
            their personal information. Although we do not currently sell personal
            information as defined under Nevada law (SB 220), you may submit such a
            request to{" "}
            <a
              href="mailto:privacy@vacationdeals.to"
              className="text-blue-600 underline hover:text-blue-800"
            >
              privacy@vacationdeals.to
            </a>
            .
          </p>
        </section>

        {/* ── 11. GDPR ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            11. Information for European Economic Area (EEA) Visitors (GDPR)
          </h2>
          <p>
            If you are located in the European Economic Area, the United Kingdom, or
            Switzerland, the General Data Protection Regulation (GDPR) and equivalent
            local laws apply to our processing of your personal data.
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            Legal Bases for Processing
          </h3>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>
              <strong>Consent:</strong> For non-essential cookies and tracking
              technologies (analytics, advertising). You may withdraw consent at any
              time via your cookie settings.
            </li>
            <li>
              <strong>Legitimate interests:</strong> For operating and improving the
              Site, preventing fraud, and ensuring security.
            </li>
            <li>
              <strong>Legal obligation:</strong> Where required to comply with
              applicable laws.
            </li>
          </ul>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            Your GDPR Rights
          </h3>
          <p>You have the right to:</p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>Access your personal data</li>
            <li>Rectification of inaccurate data</li>
            <li>Erasure (&ldquo;right to be forgotten&rdquo;)</li>
            <li>Restrict processing</li>
            <li>Data portability</li>
            <li>Object to processing</li>
            <li>Withdraw consent at any time</li>
            <li>Lodge a complaint with your local data protection authority</li>
          </ul>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            International Data Transfers
          </h3>
          <p>
            Our Site is hosted in the United States. If you access the Site from
            outside the U.S., your data may be transferred to, stored in, and
            processed in the United States, which may have different data protection
            laws than your jurisdiction.
          </p>
        </section>

        {/* ── 12. Children's Privacy ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            12. Children&rsquo;s Privacy (COPPA)
          </h2>
          <p>
            The Site is not directed to children under the age of 13 (or 16 in the
            EEA). We do not knowingly collect personal information from children. If
            we learn that we have collected personal information from a child under
            the applicable age, we will take steps to delete it promptly. If you
            believe a child has provided us with personal information, please contact
            us at{" "}
            <a
              href="mailto:privacy@vacationdeals.to"
              className="text-blue-600 underline hover:text-blue-800"
            >
              privacy@vacationdeals.to
            </a>
            .
          </p>
        </section>

        {/* ── 13. Do Not Track ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            13. &ldquo;Do Not Track&rdquo; Signals
          </h2>
          <p>
            Some browsers transmit &ldquo;Do Not Track&rdquo; (DNT) signals. There
            is no uniform standard for responding to DNT signals. At this time, we do
            not respond to DNT signals, but you can manage tracking through your
            cookie preferences and the opt-out tools described in Section 3.
          </p>
        </section>

        {/* ── 14. Changes ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            14. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. When we make
            material changes, we will update the &ldquo;Last Updated&rdquo; date at
            the top of this page. We encourage you to review this page periodically.
            Your continued use of the Site after any changes constitutes acceptance of
            the updated policy.
          </p>
        </section>

        {/* ── 15. TCPA Compliance ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            15. Communications &amp; TCPA Compliance
          </h2>
          <p>
            By voluntarily providing your email address and/or mobile phone number through
            any form on the Site (including but not limited to the Resort Roulette bonus
            spins form, deal alerts signup, or data inquiry forms), you provide your{" "}
            <strong>prior express written consent</strong> under the Telephone Consumer
            Protection Act (TCPA), 47 U.S.C. &sect; 227, and all applicable FCC regulations,
            to receive:
          </p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>Promotional emails about vacation deals and offers</li>
            <li>SMS/text messages about vacation deals (if you provided a mobile number)</li>
            <li>Marketing communications from VacationDeals.to</li>
          </ul>
          <p className="mt-3">
            <strong>Consent is not a condition of purchase.</strong> You are not required to
            provide consent to receive communications in order to use the Site or access
            vacation deal listings. Message and data rates may apply to SMS messages.
            Message frequency varies.
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            Opting Out
          </h3>
          <p>
            You may opt out of communications at any time by:
          </p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>
              <strong>Email:</strong> Clicking the &ldquo;unsubscribe&rdquo; link in any
              marketing email we send
            </li>
            <li>
              <strong>SMS:</strong> Replying STOP to any text message we send
            </li>
            <li>
              <strong>Direct request:</strong> Emailing{" "}
              <a href="mailto:privacy@vacationdeals.to" className="text-blue-600 underline hover:text-blue-800">
                privacy@vacationdeals.to
              </a>{" "}
              with &ldquo;Unsubscribe&rdquo; in the subject line
            </li>
          </ul>
          <p className="mt-3">
            We will honor opt-out requests within 10 business days for email and immediately
            for SMS. Opting out of marketing communications does not affect transactional
            messages (e.g., responses to your direct inquiries).
          </p>

          <h3 className="mb-2 mt-4 text-lg font-medium text-gray-800">
            Consent Records
          </h3>
          <p>
            When you submit your contact information through any form on the Site, we
            securely record the following as proof of your consent: your IP address, user
            agent string, the exact form submitted, the date and time of submission (UTC),
            and the version of the terms you agreed to. These records are stored securely
            and retained for a minimum of 5 years to comply with TCPA record-keeping
            requirements.
          </p>
        </section>

        {/* ── 16. Contact ── */}
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            16. Contact Us
          </h2>
          <p>
            If you have questions or concerns about this Privacy Policy, or wish to
            exercise any of your rights, please contact us:
          </p>
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
            <p>
              <strong>VacationDeals.to</strong>
            </p>
            <p>
              Email:{" "}
              <a
                href="mailto:privacy@vacationdeals.to"
                className="text-blue-600 underline hover:text-blue-800"
              >
                privacy@vacationdeals.to
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
