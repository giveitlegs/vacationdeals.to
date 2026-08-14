import type { Metadata } from "next";
import Link from "next/link";
import { getVacationRoutes } from "@/lib/vacation-routes";
import { RouteMap } from "./RouteMap";

export const revalidate = 3600;

const CANONICAL = "https://vacationdeals.to/get-paid-to-go-on-vacation";

export async function generateMetadata(): Promise<Metadata> {
  const { stats, routes } = await getVacationRoutes();
  const desc =
    `${stats.payYouCount} real vacation packages hand you a Visa gift card worth more than the ` +
    `trip costs — up to $${stats.maxCashBack} back. Chain ${routes.length} multi-city routes ` +
    `where the gift cards cover the whole trip, and some legs literally pay you to show up.`;
  return {
    title:
      "Get Paid to Go on Vacation — Chain Vacpacks, Collect Perks, Travel Free",
    description: desc,
    alternates: { canonical: CANONICAL },
    openGraph: {
      title: "Get Paid to Go on Vacation — Chain Vacpacks, Collect Perks, Travel Free",
      description: desc,
      type: "website",
      url: CANONICAL,
    },
    twitter: {
      card: "summary_large_image",
      title: "Get Paid to Go on Vacation",
      description: desc,
    },
  };
}

// --- tiny formatters ---------------------------------------------------------
const money = (n: number) =>
  "$" + Math.round(Math.abs(n)).toLocaleString("en-US");
const signedNet = (n: number) => (n <= 0 ? `+${money(n)}` : `-${money(n)}`);

// --- FAQ ---------------------------------------------------------------------
const FAQS: { question: string; answer: string }[] = [
  {
    question: "Can you really get paid to go on vacation?",
    answer:
      "On some deals, yes. Certain timeshare-preview packages cost less than the Visa or Mastercard gift card they hand you for attending — for example a $99 package that comes with a $100 gift card nets you a dollar ahead. You still pay for the package up front and only come out ahead after you attend the required resort presentation and receive the card. Chain a few of these together and the gift cards can cover most or all of a multi-city trip.",
  },
  {
    question: "How does chaining vacpacks work?",
    answer:
      "Each 'vacpack' (vacation package) is a discounted 3–5 night resort stay that requires you to attend a roughly 90-minute sales presentation. Because several of them return a gift card close to the purchase price, you can book a sequence of cities — say Branson, then Gatlinburg, then Orlando — and let each stop's gift card offset the next one. The routes on this page pre-calculate the running total so you can see exactly what you'd pay and get back.",
  },
  {
    question: "What's the difference between a gift card and a 'resort credit'?",
    answer:
      "A Visa or Mastercard gift card is real, spendable cash you keep — it counts toward the 'money back' math on this page. A 'resort credit' or 'dining credit' can only be spent at that specific property (on the spa, restaurant, or activities), so it has value but it is not cash in your pocket. We only count gift cards and cash-back toward the net cost; credits are shown separately as bonus perk value.",
  },
  {
    question: "Do I have to sit through a timeshare presentation?",
    answer:
      "Yes. Every one of these packages requires you (and usually a spouse or travel companion) to attend a roughly 90 to 120 minute sales presentation, sometimes called a 'preview' or 'owner update.' You are never obligated to buy anything, but attendance is mandatory to receive the discounted rate and the gift card. If you skip it, the resort typically charges you the full rack rate.",
  },
  {
    question: "Am I eligible for these deals?",
    answer:
      "Eligibility rules vary by provider but are common across the industry: you generally must be 25 to 30 or older, married or attending with a partner, and meet a minimum household income (often $50,000–$75,000). Some exclude single travelers, students, and self-employed applicants. Always read the specific package's qualification terms before you pay.",
  },
  {
    question: "Is there a catch beyond the presentation?",
    answer:
      "The main catch is your time and the hard sell. Presentations can run long and are designed to be persuasive. Beyond that, watch for resort fees, taxes, and activation fees on the gift card that aren't included in the headline price, blackout dates, and short booking windows. None of those are hidden if you read the terms — but they can shrink the 'free' math, which is why we tell you to verify every figure with the provider.",
  },
  {
    question: "How accurate are the prices and gift-card amounts shown here?",
    answer:
      "Prices and perks are scraped directly from each provider's live offer pages and refreshed regularly, and we only count a dollar figure as 'money back' when the page explicitly describes a Visa/Mastercard gift card or cash-back — never marketing 'value' or 'retail' numbers. Offers change often, though, so treat these as a starting point and confirm the exact terms on the provider's site before booking.",
  },
  {
    question: "Is this a scam?",
    answer:
      "The packages are real and the gift cards are real, but this is a lead-generation model: resorts sell steeply discounted stays because a percentage of attendees buy a timeshare. That's a legitimate, decades-old marketing tactic — not a scam — as long as you go in knowing you'll sit through a presentation and you decline politely if it's not for you. The people who come out ahead are the ones who treat it as a transaction: attend, collect the gift card, and leave.",
  },
  {
    question: "Can I book these back-to-back in real life?",
    answer:
      "Often yes, with planning. The routes here are grouped by geography so the drive or short flight between stops is realistic, but each resort sets its own booking windows and travel-date requirements. Space the presentations out enough to actually enjoy each city, and confirm that the gift card from one stop will arrive before you'd want to lean on it for the next.",
  },
  {
    question: "Where does the money-back actually come from?",
    answer:
      "The resort. They spend marketing dollars to get qualified vacationers in front of a sales team, and the discounted room plus the gift card is that marketing budget spent on you instead of on ads. You're effectively being paid for your attention and your time in the presentation room.",
  },
];

export default async function GetPaidPage() {
  const data = await getVacationRoutes();
  const { routes, hallOfFame, stats } = data;

  // JSON-LD: WebPage + ItemList of routes + FAQPage
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Get Paid to Go on Vacation",
      url: CANONICAL,
      description:
        "Chain cheap timeshare-preview vacation packages whose gift-card perks cover — or exceed — the price, so a multi-city trip nets around $0 or pays you.",
      isPartOf: { "@type": "WebSite", name: "VacationDeals.to", url: "https://vacationdeals.to" },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Get-Paid-to-Travel Routes",
      itemListElement: routes.map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: r.name,
        description: `${r.totalNights} nights across ${r.stops.length} cities — pay ${money(r.totalCost)}, get ${money(r.totalCashBack)} back in gift cards.`,
        url: CANONICAL,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ];

  return (
    <div className="gp-root">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Scoped animations (pure CSS, reduced-motion aware) */}
      <style>{gpStyles}</style>

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-emerald-700">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Get Paid to Go on Vacation</li>
        </ol>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO */}
      {/* ------------------------------------------------------------------ */}
      <section className="gp-hero relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-10 sm:py-20">
        {/* floating money glyphs */}
        <div aria-hidden className="gp-money-field pointer-events-none absolute inset-0">
          {["💵", "💸", "🪙", "💰", "💵", "💸", "🪙", "💰"].map((g, i) => (
            <span key={i} className={`gp-float gp-float-${i}`}>{g}</span>
          ))}
        </div>

        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-400/10 px-4 py-1.5 text-sm font-semibold text-emerald-100">
            <span className="gp-pulse-dot" /> Real deals. Real gift cards. Real math.
          </span>
          <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-7xl">
            Get Paid to Go
            <br />
            <span className="gp-gold-text">on Vacation</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-emerald-50/90 sm:text-xl">
            Some vacation packages hand you a <strong className="text-white">Visa gift card worth more
            than the trip costs</strong>. Attend a ~90-minute resort preview, pocket the card, and
            chain the next city — until the whole trip nets around <strong className="text-white">$0</strong>,
            or actually pays you.
          </p>

          {/* stat strip */}
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="gp-stat">
              <div className="gp-stat-num">{stats.payYouCount}</div>
              <div className="gp-stat-label">deals that pay you to show up</div>
            </div>
            <div className="gp-stat">
              <div className="gp-stat-num">{money(stats.maxCashBack)}</div>
              <div className="gp-stat-label">biggest single gift card</div>
            </div>
            <div className="gp-stat">
              <div className="gp-stat-num">{routes.length}</div>
              <div className="gp-stat-label">get-paid-to-travel routes</div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a href="#routes" className="gp-cta-gold">Build my free trip →</a>
            <a href="#how" className="rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10">
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. MAP */}
      {/* ------------------------------------------------------------------ */}
      {routes.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">The money map</h2>
            <p className="mx-auto mt-2 max-w-2xl text-gray-600">
              Pick a route to light up its stops and watch the running tally. The greener the number,
              the more the gift cards cover.
            </p>
          </div>
          <RouteMap routes={routes} />
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. ROUTES */}
      {/* ------------------------------------------------------------------ */}
      <section id="routes" className="mt-20 scroll-mt-24">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">Choose your route</h2>
          <p className="mx-auto mt-2 max-w-2xl text-gray-600">
            Each route chains the cheapest real vacpack in every city. Tally = what you pay minus the
            gift cards you collect.
          </p>
        </div>

        {routes.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-10 text-center text-gray-600">
            Routes are refreshing — check back shortly, or{" "}
            <Link href="/deals" className="font-semibold text-emerald-700 underline">
              browse all live deals
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {routes.map((r) => (
              <article
                key={r.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* gradient header */}
                <div className={`bg-gradient-to-r ${r.gradient} px-6 py-5 text-white`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-xl font-black">
                        <span className="text-2xl">{r.emoji}</span> {r.name}
                      </h3>
                      <p className="mt-1 text-sm text-white/90">{r.tagline}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur">
                      {r.stops.length} stops
                    </span>
                  </div>
                </div>

                {/* stops */}
                <ul className="divide-y divide-gray-100 px-2">
                  {r.stops.map((s, idx) => (
                    <li key={s.slug}>
                      <Link
                        href={`/deals/${s.slug}`}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-emerald-50"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                          {idx + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-gray-900">
                            {s.city}
                            {s.state ? <span className="font-normal text-gray-400">, {s.state}</span> : null}
                          </span>
                          <span className="block truncate text-xs text-gray-500">
                            {s.resort ?? "Resort preview"} · {s.nights} {s.nights === 1 ? "night" : "nights"}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-bold text-gray-900">{money(s.price)}</span>
                          {s.cashBack > 0 && (
                            <span className="block text-xs font-semibold text-emerald-600">
                              {money(s.cashBack)} back
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* tally */}
                <div className="mt-auto border-t border-gray-100 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span><strong className="text-gray-900">{r.totalNights}</strong> nights</span>
                    <span>·</span>
                    <span>you pay <strong className="text-gray-900">{money(r.totalCost)}</strong></span>
                    <span>·</span>
                    <span>get <strong className="text-emerald-600">{money(r.totalCashBack)}</strong> back</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-500">
                      Net cost
                      <span className={`ml-2 text-2xl font-black ${r.paysYou ? "text-emerald-600" : "text-gray-900"}`}>
                        {r.paysYou ? signedNet(r.netCash) : money(r.netCash)}
                      </span>
                    </div>
                    {r.paysYou ? (
                      <span className="gp-pays-badge">💸 IT PAYS YOU {money(r.netCash)}!</span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        Near-free trip
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. HALL OF FAME */}
      {/* ------------------------------------------------------------------ */}
      {hallOfFame.length > 0 && (
        <section className="mt-20">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">
              🏆 Hall of Fame
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-gray-600">
              The deals that pay you to show up — ranked by how far the gift card beats the price.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hallOfFame.map((v, i) => (
              <Link
                key={v.slug}
                href={`/deals/${v.slug}`}
                className="group relative flex flex-col rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-5 transition-shadow hover:shadow-md"
              >
                <span className="absolute right-4 top-4 text-xs font-black text-emerald-300">#{i + 1}</span>
                <div className="text-lg font-black text-gray-900">{v.city}</div>
                <div className="text-xs text-gray-500">
                  {v.state ? `${v.state} · ` : ""}{v.nights} {v.nights === 1 ? "night" : "nights"}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-sm text-gray-400 line-through">{money(v.price)}</span>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    {money(v.cashBack)} back
                  </span>
                </div>
                <div className="mt-3 text-2xl font-black text-emerald-600">
                  Net {v.netCash <= 0 ? signedNet(v.netCash) : money(v.netCash)}
                </div>
                <span className="mt-3 text-xs font-semibold text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
                  See the deal →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. HOW IT WORKS */}
      {/* ------------------------------------------------------------------ */}
      <section id="how" className="mt-20 scroll-mt-24">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">How it works</h2>
          <p className="mx-auto mt-2 max-w-2xl text-gray-600">Four steps from booking to banking the gift card.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "1", t: "Find a cheap vacpack", d: "Pick a discounted 3–5 night resort package where the gift-card perk is close to (or above) the price." },
            { n: "2", t: "Attend the ~90-min preview", d: "Show up to the required resort presentation with your partner. Listen politely — you're never obligated to buy." },
            { n: "3", t: "Pocket the gift card", d: "Collect your Visa or Mastercard gift card. That's real, spendable cash that offsets what you paid." },
            { n: "4", t: "Chain the next city", d: "Roll the gift card into your next stop. Stack enough and the whole trip nets around $0 — or pays you." },
          ].map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-black text-white">
                {s.n}
              </div>
              <h3 className="font-bold text-gray-900">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. HONESTY CALLOUT */}
      {/* ------------------------------------------------------------------ */}
      <section className="mt-16">
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-black text-amber-900">
            <span aria-hidden>⚖️</span> The honest fine print
          </h2>
          <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-amber-900/90 sm:grid-cols-2">
            <li className="flex gap-2">
              <span aria-hidden className="text-amber-600">•</span>
              <span><strong>Gift cards are real cash back</strong> — Visa/Mastercard cards you can spend anywhere. Those are the numbers we count.</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-amber-600">•</span>
              <span><strong>"Credits" are not cash.</strong> Resort, dining, and spa credits can only be spent at that property, so they're a bonus — not money in your pocket.</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-amber-600">•</span>
              <span><strong>Attendance is mandatory.</strong> You must sit through a ~90–120 minute timeshare sales presentation at each stop to get the rate and the card.</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-amber-600">•</span>
              <span><strong>Eligibility applies.</strong> Most require you to be 25+ (sometimes 30+), attend with a partner, and meet a minimum income. Singles and students are often excluded.</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-amber-600">•</span>
              <span><strong>Watch the extras.</strong> Resort fees, taxes, and gift-card activation fees can shrink the "free" math. Read every line.</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-amber-600">•</span>
              <span><strong>Verify everything with the provider.</strong> Offers change constantly. Confirm the price, the gift card, and the terms on the provider's own site before you pay.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7. FAQ */}
      {/* ------------------------------------------------------------------ */}
      <section className="mt-20">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">Questions, answered</h2>
        </div>
        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="divide-y divide-gray-100">
            {FAQS.map((f, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-semibold text-gray-900 select-none">
                  <span className="pr-4">{f.question}</span>
                  <span className="ml-auto shrink-0 text-gray-400 transition-transform group-open:rotate-180">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </summary>
                <p className="px-6 pb-5 text-sm leading-relaxed text-gray-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 8. SOFT CTA */}
      {/* ------------------------------------------------------------------ */}
      <section className="mt-20">
        <div className="gp-hero relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-10">
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-black text-white sm:text-4xl">Ready to bank a gift card?</h2>
            <p className="mx-auto mt-3 max-w-xl text-emerald-50/90">
              Browse every live vacpack, sorted so the ones that pay you back rise to the top.
            </p>
            <div className="mt-8">
              <Link href="/deals" className="gp-cta-gold">Browse all vacation deals →</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Scoped CSS (money theme + pure-CSS motion, reduced-motion aware)
// -----------------------------------------------------------------------------
const gpStyles = `
.gp-hero {
  background:
    radial-gradient(120% 120% at 15% 0%, rgba(16,185,129,0.35) 0%, transparent 55%),
    radial-gradient(120% 120% at 100% 100%, rgba(20,184,166,0.35) 0%, transparent 55%),
    linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%);
}
.gp-gold-text {
  background: linear-gradient(90deg, #fde68a 0%, #fbbf24 45%, #f59e0b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.gp-stat {
  border-radius: 1rem;
  padding: 1rem 0.75rem;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(4px);
}
.gp-stat-num { font-size: 1.9rem; line-height: 1; font-weight: 900; color: #fde68a; }
.gp-stat-label { margin-top: 0.4rem; font-size: 0.75rem; color: rgba(236,253,245,0.85); }
.gp-cta-gold {
  display: inline-flex; align-items: center; gap: 0.4rem;
  border-radius: 0.85rem;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  padding: 0.85rem 1.6rem;
  font-weight: 800; font-size: 0.95rem; color: #422006;
  box-shadow: 0 10px 30px -8px rgba(245,158,11,0.6);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.gp-cta-gold:hover { transform: translateY(-2px); box-shadow: 0 16px 36px -8px rgba(245,158,11,0.7); }
.gp-pulse-dot {
  width: 8px; height: 8px; border-radius: 9999px; background: #34d399;
  box-shadow: 0 0 0 0 rgba(52,211,153,0.7);
  animation: gp-dot 2s ease-in-out infinite;
}
.gp-pays-badge {
  display: inline-flex; align-items: center;
  border-radius: 9999px;
  background: linear-gradient(90deg, #10b981, #059669);
  padding: 0.4rem 0.8rem;
  font-size: 0.72rem; font-weight: 800; color: #fff; white-space: nowrap;
  box-shadow: 0 6px 18px -6px rgba(5,150,105,0.7);
  animation: gp-badge 1.8s ease-in-out infinite;
}
.gp-money-field { overflow: hidden; }
.gp-float {
  position: absolute; bottom: -2rem; font-size: 1.6rem; opacity: 0;
  animation: gp-rise 9s linear infinite;
}
.gp-float-0 { left: 6%;  animation-delay: 0s;    }
.gp-float-1 { left: 20%; animation-delay: 1.3s;  font-size: 2.2rem; }
.gp-float-2 { left: 34%; animation-delay: 3.1s;  }
.gp-float-3 { left: 48%; animation-delay: 0.7s;  font-size: 1.2rem; }
.gp-float-4 { left: 62%; animation-delay: 2.4s;  font-size: 2rem; }
.gp-float-5 { left: 74%; animation-delay: 4.2s;  }
.gp-float-6 { left: 86%; animation-delay: 1.9s;  font-size: 1.3rem; }
.gp-float-7 { left: 94%; animation-delay: 3.6s;  }
@keyframes gp-rise {
  0%   { transform: translateY(0) rotate(0deg);      opacity: 0; }
  10%  { opacity: 0.5; }
  90%  { opacity: 0.5; }
  100% { transform: translateY(-115%) rotate(24deg); opacity: 0; }
}
@keyframes gp-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.7); }
  50%      { box-shadow: 0 0 0 7px rgba(52,211,153,0); }
}
@keyframes gp-badge {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
}
@media (prefers-reduced-motion: reduce) {
  .gp-float, .gp-pulse-dot, .gp-pays-badge { animation: none; }
  .gp-float { opacity: 0.4; }
  .gp-cta-gold { transition: none; }
}
`;
