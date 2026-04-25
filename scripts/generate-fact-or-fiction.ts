/**
 * Generate "Fact or Fiction" myth-busting articles via Claude Haiku.
 *
 * 100 articles covering vacation deals, vacpack, timeshare, airline,
 * travel-hack myths. Each article:
 *   - Verdicts a specific claim as Fact / Fiction / Mostly True / It Depends
 *   - 600-900 words HTML content
 *   - Pushes the vacpack agenda where relevant (every article ends with
 *     a soft CTA to vacationdeals.to)
 *   - Stores in blog_posts table with category="interests" and tag
 *     "fact-or-fiction"
 *
 * Cost estimate: ~$0.04 per article × 100 = ~$4 total at Haiku pricing.
 *
 * Run:
 *   ANTHROPIC_API_KEY=... npx tsx scripts/generate-fact-or-fiction.ts
 *   ... --limit=10              (just first 10 claims)
 *   ... --skip-existing         (don't regenerate ones already in DB)
 */

import Anthropic from "@anthropic-ai/sdk";
import { db, blogPosts } from "@vacationdeals/db";
import { eq } from "drizzle-orm";

const apiKey =
  process.env.ANTHROPIC_API_KEY ||
  process.env.ANTHROPIC_API ||
  process.env.anthropic_API ||
  process.env.anthropic_api_key;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY required");
  process.exit(1);
}

const SKIP_EXISTING = process.argv.includes("--skip-existing");
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : 999;

const client = new Anthropic({ apiKey });

interface Claim {
  question: string;
  category: "vacpack" | "timeshare" | "airline" | "travel-hack" | "deals";
  // Optional steer for the verdict (so the LLM doesn't waffle)
  verdictHint?: "Fact" | "Fiction" | "Mostly True" | "It Depends";
}

const CLAIMS: Claim[] = [
  // ── Vacpack-specific (push the vacpack agenda) ────────────────────────────
  { question: "$59 vacation packages are scams", category: "vacpack", verdictHint: "Fiction" },
  { question: "You can't get a real vacation for under $100 a night", category: "vacpack", verdictHint: "Fiction" },
  { question: "VacPack timeshare presentations are exactly 90 minutes", category: "vacpack", verdictHint: "Mostly True" },
  { question: "You have to buy a timeshare to leave the presentation", category: "vacpack", verdictHint: "Fiction" },
  { question: "Vacpack resorts give you the worst rooms in the property", category: "vacpack", verdictHint: "It Depends" },
  { question: "Vacpacks always require married couples", category: "vacpack", verdictHint: "Fiction" },
  { question: "You can keep the deposit even if you skip the presentation", category: "vacpack", verdictHint: "Fiction" },
  { question: "Vacpack deals are better than booking the same hotel direct", category: "vacpack", verdictHint: "Fact" },
  { question: "The presenters are paid commission only", category: "vacpack", verdictHint: "Mostly True" },
  { question: "Vacpacks include free meals", category: "vacpack", verdictHint: "Fiction" },
  { question: "You need an income of $75,000 to qualify for a vacpack", category: "vacpack", verdictHint: "It Depends" },
  { question: "Vacpacks always include theme park tickets", category: "vacpack", verdictHint: "Fiction" },
  { question: "Westgate offers cheaper packages on Tuesday", category: "vacpack", verdictHint: "Mostly True" },
  { question: "You can use a vacpack to test out a destination before retiring there", category: "vacpack", verdictHint: "Fact" },
  { question: "Vacpacks are only for first-time visitors to the resort brand", category: "vacpack", verdictHint: "Mostly True" },
  { question: "Multi-destination vacpacks are always a worse deal", category: "vacpack", verdictHint: "It Depends" },
  { question: "The 'free' bonus night usually has restrictions", category: "vacpack", verdictHint: "Fact" },
  { question: "Resort fees are extra on top of vacpack pricing", category: "vacpack", verdictHint: "It Depends" },
  { question: "You can transfer your vacpack to a friend", category: "vacpack", verdictHint: "Fiction" },
  { question: "Vacpacks have hidden fees that double the cost", category: "vacpack", verdictHint: "Fiction" },

  // ── Timeshare ─────────────────────────────────────────────────────────────
  { question: "Timeshares always go down in value", category: "timeshare", verdictHint: "Mostly True" },
  { question: "You can sell a timeshare back to the developer", category: "timeshare", verdictHint: "It Depends" },
  { question: "Timeshare exit companies charge $10,000+ to get you out", category: "timeshare", verdictHint: "Fact" },
  { question: "Timeshare presentations use high-pressure sales tactics", category: "timeshare", verdictHint: "Fact" },
  { question: "Points-based timeshares are more flexible than week-based ones", category: "timeshare", verdictHint: "Fact" },
  { question: "Timeshare maintenance fees never go up", category: "timeshare", verdictHint: "Fiction" },
  { question: "You can rent out your timeshare to cover the maintenance fees", category: "timeshare", verdictHint: "It Depends" },
  { question: "Timeshares are inherited by your heirs whether they want them or not", category: "timeshare", verdictHint: "Mostly True" },
  { question: "You can deed-back a timeshare to the resort for free", category: "timeshare", verdictHint: "It Depends" },
  { question: "Timeshares are a real estate investment", category: "timeshare", verdictHint: "Fiction" },
  { question: "Florida and Tennessee have the strictest timeshare consumer laws", category: "timeshare", verdictHint: "Fact" },
  { question: "You have a 10-day rescission period in Florida", category: "timeshare", verdictHint: "Fact" },
  { question: "Reseller scams target former timeshare owners", category: "timeshare", verdictHint: "Fact" },
  { question: "Timeshare upgrades are a scam to get more money out of you", category: "timeshare", verdictHint: "Mostly True" },
  { question: "RCI and Interval International make timeshares 'travel anywhere'", category: "timeshare", verdictHint: "It Depends" },
  { question: "You can stay in your timeshare unit anytime, not just your week", category: "timeshare", verdictHint: "Fiction" },
  { question: "Timeshares are cheaper than renting a hotel for the same week", category: "timeshare", verdictHint: "It Depends" },
  { question: "The IRS lets you write off timeshare property tax", category: "timeshare", verdictHint: "Fact" },
  { question: "Foreclosure on a timeshare ruins your credit just like a house", category: "timeshare", verdictHint: "Fact" },
  { question: "Timeshare developer financing is the worst loan you can take", category: "timeshare", verdictHint: "Fact" },

  // ── Airline / flight hacks ────────────────────────────────────────────────
  { question: "Booking flights on Tuesday is cheaper", category: "airline", verdictHint: "Fiction" },
  { question: "Incognito mode hides flight prices from airlines", category: "airline", verdictHint: "Fiction" },
  { question: "Booking exactly 21 days out gets the lowest fare", category: "airline", verdictHint: "Fiction" },
  { question: "Hidden city ticketing can get you cheaper flights", category: "airline", verdictHint: "Fact" },
  { question: "Airlines charge more if you've searched a route before", category: "airline", verdictHint: "Fiction" },
  { question: "Southwest's 'Bags Fly Free' is genuinely free", category: "airline", verdictHint: "Mostly True" },
  { question: "Flight prices drop dramatically on Tuesdays at 3 PM", category: "airline", verdictHint: "Fiction" },
  { question: "You can get bumped voluntarily for $1000+ vouchers", category: "airline", verdictHint: "Fact" },
  { question: "Carry-on size limits are getting stricter every year", category: "airline", verdictHint: "Fact" },
  { question: "Airlines must compensate you for delays over 3 hours (US)", category: "airline", verdictHint: "Fiction" },
  { question: "You can sneak through TSA with snacks and toiletries", category: "airline", verdictHint: "It Depends" },
  { question: "Aisle seats are quieter than window seats", category: "airline", verdictHint: "Fiction" },
  { question: "Booking direct from the airline is always cheaper than OTAs", category: "airline", verdictHint: "Mostly True" },
  { question: "Frequent flyer miles expire if you don't use them", category: "airline", verdictHint: "It Depends" },
  { question: "Premium economy is worth the extra $200-500", category: "airline", verdictHint: "It Depends" },
  { question: "You can get free upgrades by being polite to the gate agent", category: "airline", verdictHint: "Fiction" },
  { question: "Lap children are not safer than properly restrained children", category: "airline", verdictHint: "Fact" },
  { question: "Spirit Airlines is cheaper if you don't bring luggage", category: "airline", verdictHint: "Fact" },
  { question: "Flying out of a smaller airport is always cheaper", category: "airline", verdictHint: "Fiction" },
  { question: "Booking a multi-city itinerary saves more than two one-ways", category: "airline", verdictHint: "It Depends" },

  // ── Travel hacks (broad) ──────────────────────────────────────────────────
  { question: "All-inclusive resorts are cheaper than booking everything separately", category: "travel-hack", verdictHint: "It Depends" },
  { question: "Travel insurance is worth it for international trips", category: "travel-hack", verdictHint: "Fact" },
  { question: "Hotel loyalty programs are worth joining", category: "travel-hack", verdictHint: "It Depends" },
  { question: "Tap water in Mexico is safe at all-inclusive resorts", category: "travel-hack", verdictHint: "It Depends" },
  { question: "You should tip 20% in cash at all-inclusive resorts", category: "travel-hack", verdictHint: "Mostly True" },
  { question: "International data plans are always a rip-off vs local SIMs", category: "travel-hack", verdictHint: "It Depends" },
  { question: "Cruise day-of-sailing prices are cheaper than booking ahead", category: "travel-hack", verdictHint: "Fiction" },
  { question: "AAA discounts beat AARP discounts at most hotels", category: "travel-hack", verdictHint: "Fiction" },
  { question: "Travel agents are obsolete in 2026", category: "travel-hack", verdictHint: "Fiction" },
  { question: "You should always lock in fixed exchange rates", category: "travel-hack", verdictHint: "Fiction" },
  { question: "Resorts charge less if you book directly", category: "travel-hack", verdictHint: "It Depends" },
  { question: "Hotel rates always drop closer to check-in date", category: "travel-hack", verdictHint: "Fiction" },
  { question: "Airbnbs are cheaper than hotels for families of 4+", category: "travel-hack", verdictHint: "Mostly True" },
  { question: "You should never use the hotel safe", category: "travel-hack", verdictHint: "Fiction" },
  { question: "Connecting flights are riskier in winter", category: "travel-hack", verdictHint: "Fact" },
  { question: "All-inclusive food at Mexico resorts is the same quality as Caribbean", category: "travel-hack", verdictHint: "Fiction" },
  { question: "You can use credit card travel insurance instead of buying separate coverage", category: "travel-hack", verdictHint: "It Depends" },
  { question: "Travel days on Tuesday/Wednesday are cheaper", category: "travel-hack", verdictHint: "Mostly True" },
  { question: "Cell phone unlocking is required for international travel", category: "travel-hack", verdictHint: "Fiction" },
  { question: "You should bring a portable safe for cruise cabins", category: "travel-hack", verdictHint: "It Depends" },

  // ── Deals & pricing myths ─────────────────────────────────────────────────
  { question: "Travel deal sites mark up rates and call them 'deals'", category: "deals", verdictHint: "It Depends" },
  { question: "The 'best deals' are always at the back of search results", category: "deals", verdictHint: "Fiction" },
  { question: "Sale prices on travel sites are calculated against inflated retail", category: "deals", verdictHint: "Mostly True" },
  { question: "You can negotiate hotel rates over the phone", category: "deals", verdictHint: "Mostly True" },
  { question: "Last-minute beach deals are always cheaper than booking 6 months out", category: "deals", verdictHint: "Fiction" },
  { question: "Black Friday and Cyber Monday have the year's best travel deals", category: "deals", verdictHint: "It Depends" },
  { question: "Bidding on Priceline is still a way to score discount hotels", category: "deals", verdictHint: "Fiction" },
  { question: "The 'price match guarantee' on hotels actually works", category: "deals", verdictHint: "It Depends" },
  { question: "Cash-back travel cards beat points cards for most travelers", category: "deals", verdictHint: "It Depends" },
  { question: "$49 deposits on vacation deals are non-refundable", category: "deals", verdictHint: "Fiction" },
  { question: "Tuesday at 3pm is the cheapest time to book a vacation", category: "deals", verdictHint: "Fiction" },
  { question: "Off-season Caribbean is always rainy and miserable", category: "deals", verdictHint: "Fiction" },
  { question: "The 'free upgrade' offered at check-in is always a sales pitch", category: "deals", verdictHint: "Mostly True" },
  { question: "You can get free champagne by saying it's your honeymoon", category: "deals", verdictHint: "Mostly True" },
  { question: "Booking a corner room is worth requesting", category: "deals", verdictHint: "Fact" },
  { question: "You'll save more by booking 60-90 days ahead than at the last minute", category: "deals", verdictHint: "Fact" },
  { question: "Group hotel bookings get a discount automatically", category: "deals", verdictHint: "Fiction" },
  { question: "You can call after booking and ask for a price match", category: "deals", verdictHint: "Fact" },
  { question: "Booking a vacpack on Sunday gets you Sunday-Wednesday floor pricing", category: "deals", verdictHint: "Fact" },
  { question: "Vacation packages from brokers are always more expensive than the resort direct", category: "deals", verdictHint: "Fiction" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/'s\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

interface Generated {
  title: string;
  metaTitle: string;
  metaDescription: string;
  bluf: string;
  contentHtml: string;
  faqs: Array<{ question: string; answer: string }>;
  tags: string[];
}

async function generateArticle(claim: Claim): Promise<Generated> {
  const systemPrompt = `You are a travel + consumer-protection journalist writing for VacationDeals.to. Style: warm, confident, first-person-plural ("we've covered", "our take"). Aim: combine clear myth-busting with subtle promotion of vacation packages (vacpacks) as a legitimate budget travel option.

Output a JSON object exactly matching this shape (no markdown, no commentary):
{
  "title": "Fact or Fiction: <restated claim as a question or short statement>",
  "metaTitle": "<55-65 character SEO title>",
  "metaDescription": "<150-160 character SEO description>",
  "bluf": "<one-sentence verdict + reason, ~25 words>",
  "contentHtml": "<a 600-900 word HTML article using <h2>, <p>, <ul>/<li>, <strong>; no inline styles, no <script>, no headings above h2; weave a single natural mention of vacationdeals.to where relevant>",
  "faqs": [{"question":"...","answer":"..."}, ...] // 4-6 FAQs
,
  "tags": ["fact-or-fiction", "<category-tag>", ...] // 3-5 tags
}

The article must:
1. Lead with the verdict (FACT, FICTION, MOSTLY TRUE, IT DEPENDS) in an <h2> and a one-sentence justification.
2. Have an "<h2>The myth</h2>" section restating the claim and where it comes from.
3. Have an "<h2>What's actually true</h2>" section with sources cited inline (mention agencies like FTC, BBB, state AG, FAA, IATA — make sources plausible without fabricating specific URLs).
4. Have an "<h2>What this means for travelers</h2>" practical-takeaway section.
5. End with an "<h2>Bottom line</h2>" 2-3 sentence wrap that, where relevant, gently nods to vacation packages as a budget option (not a hard sell).`;

  const userPrompt = `Write a 600-900 word "Fact or Fiction" article on this claim:

CLAIM: "${claim.question}"
CATEGORY: ${claim.category}
${claim.verdictHint ? `LIKELY VERDICT: ${claim.verdictHint} (use unless your research strongly contradicts)` : ""}

Be specific and useful, not vague. Cite real-feeling agencies/regulators where appropriate. Output ONLY the JSON object — no markdown fence, no preamble.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("non-text response");
  const jsonText = block.text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(jsonText);
}

async function articleExists(slug: string): Promise<boolean> {
  const rows = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return rows.length > 0;
}

async function main() {
  const items = CLAIMS.slice(0, LIMIT);
  console.log(`Generating ${items.length} fact-or-fiction articles...`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i++) {
    const claim = items[i];
    const slug = `fact-or-fiction-${slugify(claim.question)}`;
    process.stdout.write(`[${i + 1}/${items.length}] ${slug.slice(0, 60)} ... `);

    if (SKIP_EXISTING && (await articleExists(slug))) {
      console.log("skipped (exists)");
      skipped++;
      continue;
    }

    try {
      const a = await generateArticle(claim);
      await db.insert(blogPosts).values({
        slug,
        title: a.title.slice(0, 500),
        metaTitle: a.metaTitle.slice(0, 200),
        metaDescription: a.metaDescription,
        category: "interests",
        publishDate: new Date(),
        author: "VacationDeals.to Editorial",
        readTime: "4 min read",
        bluf: a.bluf,
        heroImageAlt: a.title,
        heroGradient: "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500",
        content: a.contentHtml,
        faqs: JSON.stringify(a.faqs),
        internalLinks: JSON.stringify([]),
        relatedSlugs: JSON.stringify([]),
        tags: JSON.stringify(a.tags),
        isPublished: true,
      });
      console.log(`✓ ${a.contentHtml.length} chars`);
      ok++;
    } catch (e) {
      console.log(`✗ ${(e as Error).message}`);
      failed++;
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\nDone. ${ok} generated, ${skipped} skipped, ${failed} failed.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
