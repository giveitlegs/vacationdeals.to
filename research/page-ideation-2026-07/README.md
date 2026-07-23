# 225 Ultra-Niche Commercial Pages — Ideation (2026-07-22)

Goal: commercial, super-niche, ultra-low-competition pages engineered for rank + link-bait in the dealbuster/vacpack space. Files:

- `part-a-data-statbait.md` — A: Proprietary data & stat-bait (30) · B: Requirements micro-answers / AEO (30)
- `part-b-legal-fees-tools.md` — C: State legal pages (22) · D: Fee databases (18) · E: Calculators (15)
- `part-c-showdowns-audiences.md` — F: Brand×destination showdowns (25) · G: Ultra-niche audiences (30)
- `part-d-seasonal-watchdog-glossary.md` — H: Seasonal/event pegs (20) · I: Dealbuster watchdog (15) · J: Glossary (20)

DataForSEO note: account creds 401'd on 2026-07-22 (need refresh at app.dataforseo.com — probe script ready at `scripts/probe-niche-keywords.ts`, ~$0.05/run, re-run to attach volumes). Strategy holds regardless: these target query classes where tools report near-zero volume — exactly where a page with real data ranks with zero link building.

## Global on-page spec (applies to EVERY page below)
- **Title tag:** ≤60 chars, primary keyword front-loaded, number/year/dollar where honest. No clickbait mismatch.
- **H1:** matches title intent, not identical string. One per page.
- **H2s:** at least 2 phrased as natural questions (AEO), answered in their first sentence. Include the primary keyword in one H2.
- **Body:** 700–1,500 words, BLUF box first (site convention), one data table minimum, internal links: relevant lander (/orlando etc.), /deals, /rate-recap, 1-2 sibling pages from the same category (hub-and-spoke).
- **Images/alt:** hero gradient (site convention, zero-weight) with alt = "<page keyword> — <concrete descriptor>"; every data table gets a caption. If real charts: alt describes the finding, not the chart ("Orlando vacpack prices fell 18% from March to July 2026"), because that string is quotable/linkable.
- **FAQ:** 6–10 FAQPage-schema questions in the phrasing people actually type; answers 1-3 sentences, standalone-quotable.
- **JSON-LD stack:** WebPage + BreadcrumbList always; plus per category: Dataset (A), FAQPage (all), Product/Offer (commercial), HowTo (E where stepwise), ItemList (D/F/J), SpecialAnnouncement never.
- **Link-bait mechanics:** every A/D/I page ends with a "Cite this data" block (canonical URL + one-sentence citation) and a downloadable CSV where applicable — journalists link to sources that make citing effortless.
- **Freshness:** stat pages carry "Last updated <date> · based on N price observations" pulled live from the DB — auto-updating stats (feedback_dynamic_seo memory).

## MANDATORY legal disclaimer policy (owner directive 2026-07-22)
We are NOT a legal site. Any page touching law (all of Category C, watchdog pages citing statutes/FTC, glossary terms like rescission/ROFR) MUST carry:
1. A prominent disclaimer box at TOP of content (before the BLUF): "**This is not legal advice.** VacationDeals.to is a deal-comparison site, not a law firm. Laws change and have exceptions — verify with the official statute linked below and consult a licensed attorney in your state before acting."
2. A repeat one-liner disclaimer above the FAQ block.
3. Statute links go to OFFICIAL sources only (state legislature sites, FTC.gov) — never summarize without linking the primary source.
4. No page phrases anything as advice ("you should file...") — only as information ("Florida's statute provides..."). Rescission calculators/templates carry an extra "informational tool only — deadlines are jurisdiction-specific, confirm with counsel" line.
5. JSON-LD for legal pages: plain WebPage — do NOT use schema types implying legal-service authority.

## Why we win these
1. **We own the data**: 71K+ price snapshots, 4,800 price-change events, 54 brands, scrape provenance — nobody else in the vacpack space publishes primary data.
2. **Nobody targets the fringe**: "timeshare presentation income requirements self employed" has no dedicated page anywhere — the SERP is forum scraps.
3. **The dealbuster/watchdog angle earns links**: consumer-protection framing gets cited by exit companies, attorneys, journalists, Reddit.
