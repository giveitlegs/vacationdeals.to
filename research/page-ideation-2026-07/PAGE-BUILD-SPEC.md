# Page Build Spec — 225 niche commercial/data pages

These ship through the CMS blog_posts pipeline (top-level slugs, FAQPage schema auto-rendered). They are NOT casual blog posts — they are authoritative, commercial, citable pages. Follow this EXACTLY.

## Voice & quality (DIFFERENT from the weird blog batches)
- Authoritative, clear, confident, genuinely useful. Professional but readable.
- **NO purposeful misspellings, NO grammar errors.** These must rank and be citable. Clean copy only.
- Second person ("you"), concrete, specific. Lead with the answer.
- No fluff, no "in today's world", no "look no further", no "delve/unlock/elevate".

## JSON schema (array of page objects) — matches insert-blog-batch-json.ts
{
  "slug": "<exact slug from ideation doc, no leading slash>",
  "title": "<= 60 chars incl. keyword; the DB metaTitle appends ' | VacationDeals.to' via the pipe already in metaTitle>",
  "metaTitle": "<title text> | VacationDeals.to",
  "metaDescription": "140-160 chars, direct-answer AEO style, includes the primary keyword",
  "category": "<assigned per category below: interests|brands|segments|destinations>",
  "publishDate": "2026-07-21" .. "2026-07-23" (spread),
  "author": "The VacationDeals.to Team",
  "readTime": "6 min read" (vary 5-10),
  "bluf": "2-3 sentence direct answer/summary (clean, no errors)",
  "heroImageAlt": "<primary keyword> — <concrete quotable descriptor, e.g. a finding or number>",
  "heroGradient": one of: "from-blue-600 to-cyan-400","from-emerald-500 to-teal-700","from-purple-600 to-pink-500","from-amber-500 to-red-600","from-sky-500 to-indigo-600","from-rose-500 to-orange-400","from-slate-600 to-slate-800","from-teal-500 to-lime-500",
  "content": "<full HTML per structure below>",
  "faqs": [6-10 {"question","answer"}], AEO-phrased questions, standalone-quotable 1-3 sentence answers, error-free,
  "internalLinks": [{"text","href"} x3],
  "relatedSlugs": [2-3 sibling slugs from the SAME category],
  "tags": [4-6 strings incl "niche-2026" and the category letter tag e.g. "data-pages"]
}

## content HTML structure (every page)
1. **[LEGAL PAGES ONLY]** Disclaimer box FIRST, before everything:
   `<div class="my-4 rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><strong>This is not legal advice.</strong> VacationDeals.to is a vacation-deal comparison site, not a law firm. Laws change and have exceptions. Verify against the official statute linked on this page and consult a licensed attorney in your state before acting.</div>`
2. BLUF box: `<div class="my-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5"><strong>Bottom Line Up Front:</strong> ...</div>`
3. H2 sections — >= 2 phrased as natural questions (AEO), answered in the FIRST sentence below the heading. Put the primary keyword in one H2.
4. At least ONE data table (Tailwind classes like existing pages: `<table class="my-6 w-full border-collapse text-sm">...`) with a `<caption class="text-xs text-gray-500 mt-2">` stating the finding + "Source: VacationDeals.to, <date>".
5. One gradient callout div (optional) and/or a Pro-Tip/Key-Fact box: `<div class="my-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900"><strong>Key fact:</strong> ...</div>`
6. **[DATA/STAT + SHOWDOWN + FEE pages]** end with a "Cite this data" block:
   `<div class="my-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm"><strong>Cite this page:</strong> VacationDeals.to — "<Title>". Based on <N> tracked vacation-deal prices, updated <date>. <code>https://vacationdeals.to/<slug></code></div>`
7. **[LEGAL PAGES]** repeat one-line disclaimer directly above the FAQ section.
8. 700-1300 words body. 3-6 internal links woven in prose to: /deals, relevant lander (/orlando /las-vegas /branson /gatlinburg /myrtle-beach /williamsburg /cancun /westgate /wyndham etc.), /rate-recap, and 1-2 sibling pages (hub-and-spoke).
9. Soft commercial CTA to browse deals. No hard sell on legal/watchdog pages (keep those trust-first).

## Legal-page rules (Category C + any page citing statutes/FTC)
- Disclaimer box at top + repeat above FAQ (mandatory).
- Link statutes to OFFICIAL sources only (state legislature .gov / ftc.gov). If you don't know the exact URL, link the state legislature homepage and name the statute number in text — do NOT invent a deep URL.
- Information, never advice: "Florida's statute provides a 10-day rescission period" NOT "you should cancel within 10 days".
- Do NOT state a rescission day-count as fact unless it's well-established; where unsure, say "commonly cited as X days — confirm the current statute". Better to hedge than misstate law.

## Real data to cite (from live-stats.json, pulled 2026-07-24) — USE THESE EXACT NUMBERS
- 617 active deals tracked; 74,440 total price snapshots; 1,102 deals tracked over time; ~4,794 price-change events; 35 brands, 80 destinations.
- Average deal price $301; median $199; average price-per-night $94; cheapest live $48.86 (PayVibe Williamsburg); 168 deals under $100.
- 47% of deals disclose a required presentation; average disclosed presentation 116 minutes.
- Per-city averages (avg / min / count): Orlando $258/$49/181, Las Vegas $240/$51/53, Branson $177/$50/49, Gatlinburg $141/$49/42, Cancun $533/$260/37, Myrtle Beach $177/$50/30, Williamsburg $175/$49/24, Cabo $492/$100/10, Punta Cana $489/$347/9, Daytona $165/$49/8, Cocoa Beach $208/$149/8, Playa del Carmen $543/$310/11.
- Per-brand (avg / min / per-night / n): Westgate $201/$49/$71/159, StayPromo $249/$99/$73/65, GetawayDealz $285/$79/$95/59, MRG $255/$97/$59/29, Departure Depot $969/$449/$300/23, PayVibe $118/$49/$41/15, VacationVIP $90/$50/$29/13, Marriott $590/$299/$146/12, Hyatt $156/$100/$52/9, Discover Branson $174/$59/$58/10, Wyndham $224/$199/$75/6, Spinnaker $314/$269/$105/12, Capital Vacations $199/$199/$66/13, All-Inclusive Promotions $582/$479/$143/9.
- Clean recent price drops you MAY cite: Ocean Cay Bahamas cruise $1,299→$899; Charleston Food & Wine getaway $1,699→$1,299; AC/DC Atlanta concert package $899→$599. Do NOT cite the Hyatt "$3,199→$200" or "$499→$100/$200" entries — those are a known scraper artifact being corrected; instead, ON THE PRICE-DROP page, use a "how we verify drops (and reject false ones)" section that mentions we filter out data artifacts.
- When you need a number not listed here, describe the method and say "based on our tracked inventory" — round and hedge, never invent a precise fake statistic.

## Universal facts (safe to state)
- Vacpacks run ~$49-$1,899 for 2-5 nights; most require a 90-120 min timeshare/resort "preview" presentation; typical requirements age 25+, household income $50K+, married/cohabiting couples attend together, valid credit card, can't currently own with that brand.
- "Travel club / resort preview" sites (e.g. Discover Branson) are marketed without the word "timeshare" but function similarly.

## Freshness line
Data/stat pages: include "Last updated July 2026 · based on 74,440 tracked price observations" near the top or in the cite block.
