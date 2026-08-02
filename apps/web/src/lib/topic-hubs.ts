import type { ClusterKey } from "@/lib/queries";

/**
 * Topical hub registry (2026-08-02 internal-linking plan S1).
 *
 * Each hub is a dynamic pillar page that queries its cluster and links DOWN
 * to every child page — the fix for the orphan tail that the per-page sibling
 * resolver (lib/internal-links.ts) can only partially reach. The resolver
 * adds the reciprocal UP-link from each child to its hub (via HUB_BY_CLUSTER).
 *
 * These render through the catch-all router at top-level slugs, same as blog
 * posts. `legal: true` hubs carry the mandatory not-legal-advice disclaimer.
 */
export interface TopicHub {
  slug: string;
  cluster: ClusterKey;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string; // plain text, rendered as lead paragraph
  legal?: boolean;
  faqs: { question: string; answer: string }[];
}

export const HUBS: TopicHub[] = [
  {
    slug: "timeshare-presentation-guide",
    cluster: "requirements",
    title: "Timeshare Presentation Requirements: Complete Guide",
    metaTitle: "Timeshare Presentation Requirements Guide | VacationDeals.to",
    metaDescription: "Every timeshare presentation requirement explained — income, age, marital status, ID, credit card and eligibility rules, with a page for each specific question.",
    h1: "Timeshare Presentation Requirements: The Complete Guide",
    intro: "Timeshare presentation deals (vacpacks) usually require you to be 25+, have a household income around $50,000+, bring a valid credit card, and have couples attend together. The exact rules vary by brand and situation. Below is every specific eligibility question, answered on its own page.",
    faqs: [
      { question: "What are the basic requirements for a timeshare presentation deal?", answer: "Typically age 25+, household income around $50,000+, a valid credit card, and married or cohabiting couples attending together. You also generally cannot already own with that brand." },
      { question: "Do they verify my income?", answer: "Most sellers use an honor-system qualification call rather than documentary proof, but requirements vary. See the specific pages below for each scenario." },
      { question: "Can I attend without my spouse?", answer: "Some brands require both partners of a couple to attend; others allow one. It varies by seller — see the dedicated page." },
    ],
  },
  {
    slug: "vacation-deal-glossary",
    cluster: "glossary",
    title: "Vacation Deal & Timeshare Glossary",
    metaTitle: "Vacation Deal & Timeshare Glossary A-Z | VacationDeals.to",
    metaDescription: "Plain-English definitions of every vacation-deal and timeshare term — vacpack, rescission period, maintenance fee, owner update, rack rate and more.",
    h1: "The Vacation Deal & Timeshare Glossary",
    intro: "Confused by timeshare and vacation-deal jargon? This glossary defines every term in plain English, from \"vacpack\" to \"rescission period\" to \"owner update.\" Each term has its own page with a full explanation.",
    faqs: [
      { question: "What is a vacpack?", answer: "A vacpack is a discounted vacation package (usually 2-5 nights, $49-$599) offered in exchange for attending a timeshare preview presentation. See the full definition page below." },
      { question: "What is a rescission period?", answer: "The legally-mandated window after signing a timeshare contract during which you can cancel for a full refund. Length varies by state — see our glossary and legal pages." },
    ],
  },
  {
    slug: "timeshare-cancellation-laws",
    cluster: "legal",
    title: "Timeshare Cancellation Laws by State",
    metaTitle: "Timeshare Cancellation Laws by State | VacationDeals.to",
    metaDescription: "Timeshare rescission and cancellation windows by state, in plain English with links to the official statutes. Information only — not legal advice.",
    h1: "Timeshare Cancellation Laws by State",
    intro: "Every U.S. state sets its own timeshare rescission period — the window after signing during which you can cancel. Below is a plain-English page for each state, each linking to the official statute. This is general information, not legal advice.",
    legal: true,
    faqs: [
      { question: "How long do I have to cancel a timeshare?", answer: "It depends on the state where you signed — commonly 3 to 15 days. Find your state's page below and confirm against the official statute it links to. This is information, not legal advice." },
      { question: "Is the rescission period the same everywhere?", answer: "No. Each state sets its own window and rules. Always verify the current statute for the state where you signed and consult a licensed attorney." },
    ],
  },
  {
    slug: "resort-fee-databases",
    cluster: "fees",
    title: "Resort & Timeshare Fee Databases",
    metaTitle: "Resort Fee Databases by City & Brand | VacationDeals.to",
    metaDescription: "Searchable resort-fee, parking-fee, maintenance-fee and hidden-fee databases by destination and brand, aggregated from publicly available sources.",
    h1: "Resort & Timeshare Fee Databases",
    intro: "The advertised price is rarely the out-the-door price. These databases aggregate publicly available resort fees, parking fees, maintenance fees and hidden charges by city and brand so you can see the true cost before you book.",
    faqs: [
      { question: "What is a resort fee?", answer: "A mandatory daily charge added on top of the room rate, often covering wifi, pool, and amenities whether you use them or not. Our per-city databases list them." },
      { question: "Are these fees official?", answer: "We aggregate fees from publicly available sources; they change often. Always confirm the current fee with the property before booking." },
    ],
  },
  {
    slug: "vacation-deals-by-audience",
    cluster: "audiences",
    title: "Vacation Deals by Traveler Type",
    metaTitle: "Vacation Deals by Traveler Type & Audience | VacationDeals.to",
    metaDescription: "Vacation deal guides tailored to your situation — travel nurses, military, teachers, single parents, seniors, remote workers and many more.",
    h1: "Vacation Deals by Traveler Type",
    intro: "Different travelers face different constraints — schedules, budgets, eligibility, headcount rules. These guides tailor vacation-deal strategy to your specific situation, from travel nurses to military families to grandparents traveling with grandkids.",
    faqs: [
      { question: "Are there vacation deals for my profession or situation?", answer: "Yes — we have tailored guides for dozens of traveler types covering scheduling, eligibility and the best deal windows for each. Browse the list below." },
    ],
  },
  {
    slug: "vacation-deal-showdowns",
    cluster: "showdowns",
    title: "Vacation Deal Showdowns & Cheapest-Ranked Lists",
    metaTitle: "Vacation Deal Showdowns & Cheapest Rankings | VacationDeals.to",
    metaDescription: "Head-to-head brand comparisons and cheapest-deal rankings by city — Westgate vs Wyndham, cheapest Orlando/Vegas/Branson presentation deals, and more.",
    h1: "Vacation Deal Showdowns & Cheapest-Ranked Lists",
    intro: "Deciding between two brands or hunting the single cheapest deal in a city? These head-to-head showdowns and ranked lists use our live price tracking to call it, so you don't have to compare a dozen sellers yourself.",
    faqs: [
      { question: "Which brand has the cheapest vacation deals?", answer: "It depends on the market. Our showdowns and cheapest-ranked pages compare live prices city by city — browse the list below." },
    ],
  },
  {
    slug: "vacation-deal-data",
    cluster: "data",
    title: "Vacation Deal Data & Price Reports",
    metaTitle: "Vacation Deal Data, Price Index & Reports | VacationDeals.to",
    metaDescription: "Proprietary vacation-deal price data — the price index, per-city price histories, price-drop leaderboard and per-night rankings from tens of thousands of tracked prices.",
    h1: "Vacation Deal Data & Price Reports",
    intro: "We track tens of thousands of vacation-deal prices over time. These data reports — the price index, per-city histories, the price-drop leaderboard and per-night rankings — turn that into numbers you can cite. Based on publicly available listing data.",
    faqs: [
      { question: "Where does this data come from?", answer: "We aggregate publicly available vacation-deal listing prices over time. The reports are computed from that tracked data and updated regularly." },
    ],
  },
  {
    slug: "seasonal-vacation-deals",
    cluster: "seasonal",
    title: "Seasonal & Event Vacation Deals",
    metaTitle: "Seasonal & Event Vacation Deals Calendar | VacationDeals.to",
    metaDescription: "When to book by season and event — Christmas lights, fall foliage, hurricane-season savings, spring training and more, with the best deal windows for each.",
    h1: "Seasonal & Event Vacation Deals",
    intro: "Timing is everything. These guides map the best vacation-deal windows to seasons and events — from Branson Christmas lights to Gatlinburg fall foliage to hurricane-season savings — so you book when prices and crowds work in your favor.",
    faqs: [
      { question: "When is the cheapest time to book a vacation deal?", answer: "Shoulder seasons and specific event windows offer the best value. Each seasonal guide below covers the timing for its destination or event." },
    ],
  },
];

export const HUB_BY_SLUG: Record<string, TopicHub> = Object.fromEntries(
  HUBS.map((h) => [h.slug, h]),
);

// Cluster -> hub slug + rotated up-link anchors, used by the link resolver so
// every child page links UP to its topical hub.
export const HUB_BY_CLUSTER: Record<ClusterKey, { slug: string; anchors: string[] }> = {
  requirements: { slug: "timeshare-presentation-guide", anchors: ["timeshare presentation requirements", "presentation eligibility guide"] },
  glossary: { slug: "vacation-deal-glossary", anchors: ["vacation deal glossary", "timeshare terms explained"] },
  legal: { slug: "timeshare-cancellation-laws", anchors: ["timeshare cancellation laws by state", "rescission laws by state"] },
  fees: { slug: "resort-fee-databases", anchors: ["resort fee databases", "resort & timeshare fees"] },
  audiences: { slug: "vacation-deals-by-audience", anchors: ["vacation deals by traveler type", "deals for your situation"] },
  showdowns: { slug: "vacation-deal-showdowns", anchors: ["vacation deal showdowns", "cheapest-ranked deals"] },
  data: { slug: "vacation-deal-data", anchors: ["vacation deal data & reports", "our price data"] },
  seasonal: { slug: "seasonal-vacation-deals", anchors: ["seasonal vacation deals", "best time to book"] },
};

// Classify a page slug/tags into a cluster (for the resolver up-link).
export function clusterForSlug(slug: string, tags: string[]): ClusterKey | null {
  if (slug.startsWith("glossary-")) return "glossary";
  if (/-timeshare-cancellation-rights$|rescission|^timeshare-laws|-cancellation-rights$/.test(slug)) return "legal";
  if (/-resort-fee-database$|maintenance-fee|hidden-fees|fee-database/.test(slug)) return "fees";
  if (slug.startsWith("timeshare-presentation-")) return "requirements";
  if (slug.startsWith("vacation-deals-")) return "audiences";
  if (/-ranked$|-vs-/.test(slug)) return "showdowns";
  if (tags.includes("data-pages")) return "data";
  if (tags.some((t) => t.includes("seasonal"))) return "seasonal";
  return null;
}
