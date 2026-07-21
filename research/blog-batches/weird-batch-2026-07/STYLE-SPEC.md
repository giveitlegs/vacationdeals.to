# Weird Batch 2026-07 — Style Spec (all writer agents follow this exactly)

## Voice
Casual, fun, first-person, self-deprecating. Sounds like a real person who books $99 vacpacks and thinks about waffles too much. Short punchy sentences mixed with rambly ones. Contractions everywhere. Occasional ALL CAPS for emphasis. Never corporate. Never "delve", "unlock", "elevate", "in today's world", "look no further".

## Humanization (REQUIRED per post)
- 2-3 purposeful misspellings spread through the body (e.g. definately, seperate, recieve, untill, alot, wierd, occured, accomodations — pick different ones per post, weave naturally)
- 2-3 grammar slips: a your/you're swap, a their/they're swap, a "me and my wife went", a comma splice, "should of"
- Do NOT put errors in the title, metaTitle, metaDescription, or FAQ answers (those feed schema/AEO). Body + bluf only.

## Structure per post (HTML content field)
1. Cold open: first-person anecdote, 2-4 sentences, weird specific detail
2. BLUF box FIRST in content: <div class="my-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5"><strong>Bottom Line Up Front:</strong> [2-3 sentence direct answer/summary]</div> (this is IN ADDITION to the bluf DB field)
3. H2 sections — for AEO, phrase at least 2 H2s as natural questions, and answer them in the FIRST sentence below the heading (featured-snippet style)
4. One gradient image-break div: <div class="my-8 flex items-center justify-center rounded-xl bg-gradient-to-br GRADIENT p-12 text-center"><p class="text-2xl font-bold text-white drop-shadow-md">SHORT PHRASE</p></div>
5. One comparison/data table where it fits the topic (tailwind classes like the site uses)
6. One pro-tip callout: <div class="my-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900"><strong>Pro Tip:</strong> ...</div>
7. 900-1300 words body
8. 3-6 internal links woven into prose: /deals, /orlando, /las-vegas, /gatlinburg, /branson, /myrtle-beach, /williamsburg, /cancun, /westgate, /rate-recap, /deals-under-100, /3-night-packages, /destinations, /brands (use ones relevant to topic)
9. End with soft CTA to browse deals on the site. No hard sell.

## Facts you may use (real site data)
- Vacpacks run $49-$499 for 2-5 nights, require 90-120 min timeshare presentation
- Real prices: Westgate Orlando from $49-59, Vegas $49, Gatlinburg $49, Branson $49, HGV Vegas $249 3-night (retail $915), Cancun all-inclusive from $149-479, MRG Orlando $97
- Requirements: usually 25+, income $50K+, couples attend together
- Never invent specific resort review claims; keep rankings clearly personal-opinion flavored

## JSON output schema (array of post objects)
{
  "slug": "...", "title": "...", "metaTitle": "... | VacationDeals.to" (<=70 chars before pipe ideally),
  "metaDescription": "..." (140-160 chars, direct answer style for AEO),
  "category": "destinations"|"brands"|"interests"|"segments",
  "publishDate": "2026-07-14".."2026-07-20" (spread them),
  "author": "The VacationDeals.to Team",
  "readTime": "7 min read" (vary 6-11),
  "bluf": "..." (2-3 sentences, can contain one misspelling),
  "heroImageAlt": "...",
  "heroGradient": pick one: "from-orange-500 to-pink-600","from-blue-600 to-cyan-400","from-emerald-500 to-teal-700","from-purple-600 to-pink-500","from-amber-500 to-red-600","from-sky-500 to-indigo-600","from-rose-500 to-orange-400","from-teal-500 to-lime-500",
  "content": "FULL HTML per structure above",
  "faqs": [8-10 of {"question","answer"}] — questions phrased how people actually search (AEO), answers 1-3 sentences, direct, error-free,
  "internalLinks": [{"text","href"} x3],
  "relatedSlugs": [2-3 slugs from THIS batch],
  "tags": [4-6 strings incl "weird-batch"]
}
