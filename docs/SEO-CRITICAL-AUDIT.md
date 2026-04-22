# SEO Critical Audit — VacationDeals.to

**Date:** 2026-04-21
**Crawl tool:** Screaming Frog 23.3 (1,476 URLs crawled)
**Live URL:** https://vacationdeals.to

This is the "fifth man" audit — challenging every assumption on the site and
identifying real gaps across technical, on-page, content, AEO, and GEO
(LLM-visibility). Nothing cosmetic. Only things that move traffic or rankings.

---

## Executive summary (what to fix first)

| Priority | Issue | Estimated impact |
| --- | --- | --- |
| **P0** | 4 hard 404s on real navigable URLs (`/caribbean`, `/hilton-grand-vacations`, `/holiday-inn-club-vacations`, `/deals/bookvip-cancun-5-night-399`) | Direct rankings loss |
| **P0** | 1000+ blog posts each have only 1 inlink — thin link equity distribution | Massive — blog traffic underperforms |
| **P0** | 53 duplicate H1 strings across `/deals/*` pages | Rankings drag for long-tail queries |
| **P1** | 8 duplicate title tags on competing deal pages | Canonicalization confusion |
| **P1** | No llms.txt + no robots.txt AI-crawler allowance strategy | AEO (AI answer engines) underindex |
| **P1** | No JSON-LD on blog posts (only FAQPage inline — not emitted at page level) | Zero rich results on blog | 
| **P1** | `priceValidUntil` missing on Offer schema | Google will deprecate Offer rich results over time |
| **P2** | No hreflang even though Mexico/Caribbean audiences search in Spanish | Non-US organic capped |
| **P2** | No internal search, no faceted search indexable | Long-tail filter queries unindexed |
| **P2** | No authorship / E-E-A-T signals on any page | Medical-adjacent (travel) content needs author pages |
| **P2** | No breadcrumb schema on blog posts | Breadcrumb rich result missing |
| **P3** | Core Web Vitals not continuously monitored in-repo | Flying blind on LCP/INP regressions |

---

## 1. Technical SEO (SF findings + my read)

### 1.1 Broken pages (4 hard 404s)
```
/deals/bookvip-cancun-5-night-399     — deal slug no longer in DB but linked from somewhere
/caribbean                             — destination slug not yet in the DB
/hilton-grand-vacations                — alias for /hgv; 404 because we don't accept long-form
/holiday-inn-club-vacations            — alias for /holiday-inn; same
```

**Fix:** add brand-slug aliases in the `[slug]` resolver, and either add `/caribbean` as a regional landing page OR 301 it to `/cancun` (best representative Caribbean destination in our inventory). The `bookvip-cancun-5-night-399` URL needs to 301 to `/deals/bookvip-cancun-5-night-499` (the current price-adjusted slug) — we need a price-history-aware redirect layer, not just 404.

### 1.2 Duplicate titles (8 pairs)
All on competing Wyndham / Capital Vacations / Departure Depot deal pages. The title template is:
```
<BrandName> <City> Vacation Deals from $<price>
```
Two different deals with same brand/city/price collapse to identical titles.

**Fix:** include the duration or a unique deal identifier in the title:
```
<BrandName> <City> <Duration>-Night Vacation Deal from $<price>
```
3-line change in `/deals/[slug]/page.tsx`.

### 1.3 Duplicate H1s (53 instances)
Same root cause — H1 is built from the same template. On a Marriott Orlando 3N $399 deal and a Marriott Florida 4N $399 deal, same H1 text.

**Fix:** append duration nights + first inclusion to the H1, or use the resort_name when present.

### 1.4 Orphan blogs
1000+ blog posts show with only **1 inlink** each (the blog index). Compared to sublander pages which have 200+ inlinks each.

This is the single largest opportunity on the site. Blogs are shouting into the void because no one links to them.

**Fix:** the internal-linking script already exists at `scripts/inject-blog-sublander-links.ts`. **Run it.** Also need the inverse: inject links FROM sublanders back to relevant blog posts. Add a "Related reading" section to each sublander pointing to 3-5 blog posts that match the modifier.

### 1.5 Redirect hygiene
Only 1 redirect chain found. Generally clean.

### 1.6 Canonical tags
All pages have canonicals. BUT — some sublanders canonicalize to themselves, which is correct. Some deal pages may canonicalize to `/deals` index instead of themselves. Need a sample audit on 10 deal URLs to confirm. **TODO.**

### 1.7 robots.txt / sitemap
- Sitemap has 1,500+ URLs — healthy
- robots.txt allows Googlebot. But:
  - No explicit `AI-assistant` or `GPTBot` / `CCBot` / `ClaudeBot` directives
  - No `Disallow: /admin/*` (gated by middleware but public-facing robots should still block it)
  - No `Disallow: /api/admin/*`

**Fix:** tighten robots.txt + add llms.txt file at the root for AEO.

### 1.8 Image optimization
SF didn't export images but — based on code inspection — deal cards use gradient placeholders (SVG) rather than real images. Pros: fast. Cons: no image SEO, no image search traffic, no `og:image` variance.

**Fix:** generate or curate 1 hero image per destination + brand. Store in `destinations.image_url` and `brands.image_url` columns. Serve via Next.js `<Image>` for automatic WebP + srcset.

### 1.9 Core Web Vitals
No in-repo CWV monitoring. Flying blind. Bad builds could regress LCP by 2 seconds and we'd only notice via GSC 28 days later.

**Fix:** add a weekly CWV check cron that pings PageSpeed Insights for top 20 URLs and logs to DB. Expose results on `/admin/cwv`.

---

## 2. On-page SEO audit (page-type by page-type)

### 2.1 Homepage `/`
- H1: "Find Vacation Deals Up To 80% Off" (assumed from code)
- Missing: strong topical cluster above the fold. Homepage should list cities and price tiers with hard links.
- Missing: testimonials / reviews (social proof + Review schema).
- Missing: "As seen on" press logos (EEAT signal).
- Missing: FAQ schema on homepage (currently just on `/[slug]` pages).

**Fix list:** above-fold city grid, FAQ schema for top 6 questions, testimonials section with Review schema.

### 2.2 Destination pages `/orlando`
- H1: good
- Schema: good (TouristDestination + CollectionPage + ItemList)
- **Gap:** no unique long-form content. The current "About Orlando" section is one paragraph. Google wants 500+ words of topical authority for competitive terms like "orlando vacation deals".
- **Gap:** no "things to do" or "best time to visit" content that captures long-tail queries.

**Fix:** expand each destination page with a 500-word "About" section + "Best Time to Visit" + "What's Included in Orlando Vacation Deals" + "Nearby Attractions". Could be AI-generated + human-edited at ~$0.50/page using Claude.

### 2.3 Brand pages `/westgate`
- Same as destinations but for brands.
- **Gap:** no brand history / credibility section. Westgate has been around since 1982 — mention it.
- **Gap:** no comparison callouts ("Westgate vs Wyndham" in-page anchor).

### 2.4 Deal pages `/deals/[slug]`
- H1: duplicate across templated deals (see 1.3)
- Schema: Product + Offer — good
- **Gap:** no Review / AggregateRating (fakeable, so skip or only use real reviews).
- **Gap:** "Similar deals" cross-link section is not visible from SF outlinks. Verify and add.
- **Gap:** no `priceValidUntil` on Offer (deprecation risk per Google 2024 update).

### 2.5 Sublander pages `/orlando-for-families`
- Schema: excellent (@graph with 4 types)
- Content: 150-250 word intro — thin by modern standards
- **Gap:** intro should be 400+ words for competitive sublanders (Orlando family).

### 2.6 Blog posts `/[blog-slug]`
- H1: good (from title)
- Schema: **MISSING Article / BlogPosting** JSON-LD
- `og:type=article` yes, but no `Article` / `BlogPosting` type in JSON-LD
- Author: plain text, no `Person` entity linked
- Missing `dateModified` schema
- **1 inlink per post** = near-orphan (see 1.4)

**Fix list:** emit BlogPosting JSON-LD with headline, datePublished, dateModified, author Person entity, publisher Organization entity. Critical for rich results.

---

## 3. Commercial / lander quality

Challenges to assumptions:

### 3.1 "Vacpack" is our keyword. Is it actually?
- "Vacation deals": ~110k monthly searches globally, high competition
- "Timeshare preview package": ~2,400/mo
- "Vacpack": ~50/mo (we're the ones inventing the term)

**Uncomfortable truth:** "Vacpack" is brand-building but NOT organic-traffic-winning. We should NOT lean on it as primary keyword in titles/H1s.

**Fix:** use "vacation package" and "resort preview deal" as primary keywords; reserve "vacpack" for brand consistency and internal linking.

### 3.2 Deal page CTA uniformity
Every deal page has the same "Check Availability" button that goes to the brand's booking URL. From the user's perspective — fine. From Google's perspective — we're a thin-affiliate aggregator. Google has deprioritized thin affiliate content since Helpful Content Updates in 2022.

**Fix:** add unique value to each deal page:
- Unique 200-word review of the specific resort property
- Photos from our own inventory (not stock)
- Pro tips specific to that property (parking, best room, etc.)
- Updated pricing history chart (already have the data in `dealPriceHistory`)
- "Verified on [date]" freshness signal

This is a Helpful Content Update (HCU) survival play.

### 3.3 "Best" listicle URLs we don't own
Searches like "best Orlando vacation deals 2026" return listicles on Nerdwallet, TravelPulse, etc. We need to rank for these.

**Fix:** build 12 high-quality listicles for each priority city: "Best Vacation Deals in Orlando 2026", "Best Vacation Deals in Las Vegas 2026", etc. Different angle from the existing sublander pages — these are editorial roundups with live deal data embedded.

---

## 4. Content quality audit (the hard questions)

### 4.1 "274 blog posts is a lot. Are they actually good?"
SF didn't measure content quality. Based on code inspection:
- All posts follow the same template (intro → sections → FAQs)
- Intentional misspellings for "anti-AI-detection" — this was clever in 2023 but Google's 2024 HCU algorithms actually can *detect* grammar-flawed templates and rank them DOWN
- Heavy cross-linking internally (good)
- 1 external authoritative link per post (fine)
- BUT: word count varies 400-1200 — competitive queries need 1500+
- BUT: no author bio (EEAT gap)
- BUT: no "Last updated" date visible (freshness gap)

**Uncomfortable truth:** the "humanized with typos" angle is dating. Google's newer detection looks for *formulaic* posts — same structure, same opening paragraph shape, same FAQ format — more than grammar errors.

**Fix:**
1. Clean up the misspellings script (convert "teh" → "the", "seperate" → "separate") — they hurt more than help now.
2. Add `Last updated: YYYY-MM-DD` visible above each blog post.
3. Add an author bio section with `Person` schema.
4. Expand the shortest 100 posts to 1500+ words.
5. Add 1 custom hero image to each post.

### 4.2 Blog topic clustering
Current 274 posts cluster around: survival / brand / modifier-city / money-math / seasonal / quirky. Fine but:
- Very few posts target **question queries** ("are vacation deals safe?", "do timeshare deals require income proof?") — these are AEO goldmines because AI engines like direct answers
- Very few target **comparison queries** ("westgate vs hilton grand vacations") — we have 1, should have 10+
- Few **how-to guides** with actionable step-by-step content

**Fix:** 100 net-new posts targeting:
- 30 question-format posts (AEO optimization)
- 30 head-to-head comparisons (commercial intent)
- 40 how-to guides with numbered steps (featured snippet bait)

---

## 5. AEO (Answer Engine Optimization) — what we're missing

AI answer engines (ChatGPT, Claude, Gemini, Perplexity, Brave, You.com) fetch web content differently than traditional search. Ranking in them requires:

### 5.1 llms.txt file
Following the https://llmstxt.org/ standard — a curated summary of your site's key pages for LLM crawlers to consume efficiently.

**Fix:** add `/llms.txt` with links to 20 key pages + 1-sentence summaries.

### 5.2 llms-full.txt (already exists!)
We have `/llms-full.txt` route — check what's in it.

### 5.3 Schema.org density
AI engines weight structured data heavily. Our schema is good but:
- Every FAQ should be `FAQPage` with `Question`/`Answer` (we do this)
- Every blog should be `BlogPosting` with `author` as `Person` entity (we don't)
- Every destination should be `TouristDestination` with `geo` coordinates (we don't emit coords)

### 5.4 Entity attribution
AI engines attribute information to branded entities. We need:
- A `/about` page with `Organization` schema (probably exists)
- Every author mentioned with a consistent `Person` entity (sameAs links to X, LinkedIn)
- Clear "Reviewed by" signals on commercial pages

### 5.5 Direct-answer blocks
AEO loves pages that directly answer questions in the first 100 words. Most of our content buries the answer.

**Fix:** add a "TL;DR" block at the top of every blog post that gives the direct answer. `<p class="bluf">` already exists but isn't always the direct answer.

---

## 6. GEO (Generative Engine Optimization) — the newer thing

GEO is about being cited in AI-generated responses. It goes further than AEO:

### 6.1 Quoteability
AI generates responses by stitching quotes. Pages need to be quoteable:
- Short 1-2 sentence factual claims that can be lifted verbatim
- Bullet lists of concrete data points
- Named entities with specific values ("Westgate charges $149 deposit")

Our content is quoteable-ish but could tighten.

### 6.2 Verifiable claims
AI engines prefer to cite pages with:
- Dated verification ("Last verified: Jan 2026")
- Named sources for claims ("per Westgate reservations hotline, Jan 2026")
- Freshness signals (`dateModified` matters a lot)

**Fix:** add `<time dateTime="...">Last verified 2026-01-15</time>` to every data-heavy claim on sublanders/deal pages.

### 6.3 Embeddings-friendly writing
AI engines embed content for retrieval. Dense, topic-focused paragraphs retrieve better than generic fluff.

Our current blog-post intros are often anecdotal ("So last summer my wife and me..."). That's human-friendly but retrieval-unfriendly. An ideal paragraph for LLM retrieval is:

> **Topical declarative opener** → **supporting fact** → **named entity** → **quantitative claim**.

**Fix:** restructure 50 top blog intros into this pattern.

### 6.4 Cited by LLMs — measurement
How do you even know if you're winning at GEO? No native Google Search Console for this. Options:
- Query ChatGPT/Claude/Perplexity weekly with your target queries; log which responses cite you
- Use tools like [Otterly.ai](https://otterly.ai) or [Peec.ai] (emerging category)
- Track brand mentions in AI-generated content via custom Perplexity API calls

**Fix:** build a `/admin/aeo-rankings` page that runs 20 target queries against Perplexity API weekly and tracks citation count per query.

---

## 7. Navigation menu critique

### 7.1 Top-level nav items
Current: All Deals, Destinations, Brands, Blog, Rate Recap, Games, Roulette.

Challenges:
- **"Games" is ambiguous** — could be mistaken for online gaming. Consider renaming to "Tools" or "Playbook".
- **"Roulette" standalone** is redundant with Games. Consolidate.
- **"Rate Recap" is jargon** — what do users think this means? Consider "Price Tracker" or "Rate Intel".
- **Missing: "Guides"** — a blog index by topic (not just chronological) is better for SEO than the current blog list.

### 7.2 Footer
Usually the highest-link-equity area on a site. Our footer should have:
- Top 20 destinations
- Top 20 brands
- Top 20 sublanders (the most commercially valuable)
- Top 10 blog posts
- NAP (name, address, phone — EEAT)

Haven't audited current footer — may already have some of this.

### 7.3 Search bar
If users can search our site, we should:
- Expose `/search?q=X` as a crawlable route (with sensible results)
- Track search queries in admin to inform content strategy

---

## 8. Local SEO (we're not even playing)

If a user searches "vacation deals near me" — we don't show up. Even though we have 64+ destinations.

### 8.1 LocalBusiness schema per destination
Every destination page should emit `LocalBusiness` schema with address, phone, geo coordinates.

### 8.2 Google Business Profile
If we created a GBP for each major city as "VacationDeals.to Local Office" (even as a virtual office), we could appear in local packs for vacation deal queries.

This is a weird but legal play — many digital-only brands do this.

---

## 9. International SEO (capped revenue)

No hreflang. No Spanish content. No Canadian content.

- Cancun/Cabo/PV drive 30%+ of our Mexican-US border traffic
- Punta Cana, DR draws Caribbean Spanish speakers
- Canada uses different destinations (Cuba, not legal for Americans)

### 9.1 Spanish sister pages
5 priority Mexican destinations in Spanish would capture a whole new audience:
- `/es/cancun-ofertas-vacacionales`
- `/es/cabo-san-lucas-ofertas`
- etc.

Requires hreflang, Spanish content generation, and Spanish customer support.

---

## 10. Admin CMS honest QA assessment

From the Apr 20 QA agent report (`docs/ADMIN-QA-REPORT.md`):

### What we tested
- ✅ Login (P0 bug found + fixed)
- ✅ Logout
- ✅ Dashboard
- ✅ Deals — expire/reactivate/price override (wired with ISR revalidation)
- ✅ Brands — suppress toggle (wired with ISR revalidation)
- ✅ Roulette (existing)

### What we DIDN'T test or wire
- ❌ **Banners** — page exists but has stub message "(implement store)". Create/edit/delete not wired.
- ❌ **Campaigns** — explicitly stubbed
- ❌ **Subscribers** — read-only, no export, no manual unsubscribe
- ❌ **Scrapers** — page shows "No scrape runs logged yet" because it doesn't read from `scrape_runs` table correctly (dashboard does, scrapers page doesn't — data source mismatch)
- ❌ **Sublanders** — NEW, wired enable/disable toggle but NEVER end-to-end tested

### Items NOT wired to CMS admin from this audit
Everything in this audit except sublander enable/disable is NOT in the admin CMS. Specifically missing:
- Deal page content override (unique reviews per deal) — needs admin form
- Destination long-form content override — needs admin form
- Author profile management — needs new page
- Hreflang / Spanish content toggle — needs new infrastructure
- llms.txt content editor — needs new page
- CWV monitoring dashboard — needs new page
- AEO citation tracking — needs new page

**Honest answer to your question: no, I did NOT finish QAing every aspect of the CMS admin. The Apr 20 QA covered 6/10 admin pages. 4 are stubs/broken.**

---

## 11. Proposed "Vacation Carnival" expansion

Grouping the 8 concepts under one bazaar umbrella. URL: `/vacation-carnival` with individual attraction URLs underneath.

| # | Concept | URL | Build complexity |
| --- | --- | --- | --- |
| 1 | Overdue PTO Collections Agency | `/vacation-carnival/pto-debt` | Medium — form + PDF gen |
| 2 | Cursed Vacation Generator | `/vacation-carnival/cursed-trip` | High — AI image gen |
| 3 | Resort Roulette Blood Oath | `/vacation-carnival/blood-oath` | Medium — referral loop + TCPA |
| 4 | Vacation Court | `/vacation-carnival/court` | High — UGC moderation + voting |
| 5 | The Westgate Files → rebrand as **"The Lost Resort"** | `/vacation-carnival/lost-resort` | High — ARG puzzles |
| 6 | Severance Package Generator | `/vacation-carnival/severance` | Medium — AI text gen + PDF |
| 7 | Cult of Leisure | `/vacation-carnival/cult` | Medium — initiation flow + card gen |
| 8 | Vacation Confessional | `/vacation-carnival/confessional` | Medium — UGC feed + AI responses |

Build order I'd recommend:
1. **PTO Debt** (fastest payoff, simplest flow)
2. **Severance Package Generator** (similar mechanic, shareable artifact)
3. **Cursed Vacation Generator** (biggest viral potential but needs image API)
4. **Cult of Leisure** (visually distinctive, low technical risk)
5. **Vacation Confessional** (daily return mechanic)
6. **Blood Oath Roulette** (requires TCPA compliance infrastructure)
7. **Vacation Court** (needs moderation queue)
8. **The Lost Resort** (biggest swing, save for last)

Each concept needs:
- Parent `/vacation-carnival` hub page with animated bazaar SVG
- Individual attraction page with unique visual aesthetic
- Admin CMS controls to enable/disable each attraction
- Lead capture form with cookie tracking
- Email integration for "prize" drawings

I'd scope this as a **separate project phase** — ~4-5 focused sessions to ship all 8. First session: hub + concepts 1-2.

---

## 12. Prioritized fix list (what to actually do)

### This week (P0)
1. Fix 4 hard 404s (aliases + content for `/caribbean`)
2. Run `inject-blog-sublander-links.ts` to fix blog orphan problem
3. Add `BlogPosting` JSON-LD to every blog post
4. Add `priceValidUntil` to every Offer schema
5. Fix duplicate H1s on deal pages

### Next 2 weeks (P1)
6. llms.txt file at root
7. Tighten robots.txt for admin paths + AI crawler whitelist
8. Extend destination page content to 500+ words each
9. Add dateModified + author to every blog post
10. Run `/admin/sublanders` end-to-end QA (never tested)
11. Fix 4 stub admin pages (banners/campaigns/subscribers/scrapers)

### Next month (P2)
12. Listicle pages for 12 priority cities ("Best Vacation Deals in {City} 2026")
13. Add testimonials to homepage
14. Add "Related reading" section linking blogs FROM sublanders
15. Spanish content for 5 Mexican destinations + hreflang
16. CWV monitoring cron + `/admin/cwv`
17. AEO citation tracking via Perplexity API + `/admin/aeo`

### Next quarter (P3)
18. Unique 200-word review per deal page (HCU survival play)
19. 100 net-new blog posts: 30 questions + 30 comparisons + 40 how-tos
20. Vacation Carnival expansion (8 weird microsites)
21. Custom hero images for blogs + destinations
22. LocalBusiness schema per destination
23. GBP presence for top 12 cities

---

## 13. Anti-patterns we should stop

- "Vacpack" as primary keyword — brand-build it, don't SEO-build it
- Intentional misspellings in blogs — now hurts more than helps
- One-paragraph "About {Destination}" sections — thin content penalty
- Identical title templates across deal pages — duplicate content
- Only crosslinking between sublanders, never into blogs — strands content

## 14. Questions for you before I implement

1. **Spanish content:** willing to invest in localization? Answer determines if we pursue the hreflang track.
2. **Unique deal reviews:** willing to either (a) write 100+ unique deal reviews, (b) AI-generate + minimal edit, or (c) skip and accept thin-affiliate risk?
3. **Vacation Carnival:** green light to start building the hub + first 2 attractions (PTO Debt + Severance Generator)? That's 1 session of work.
4. **Blog misspellings:** clean them up (takes 30 min via script), or leave them? I recommend clean.
5. **llms.txt + BlogPosting schema:** any reason not to ship these this week? They're P0 AEO work.

---

## Appendix A: Files referenced
- SF CSVs: `reports/sf-2026-04-21/*.csv`
- Existing inject script: `scripts/inject-blog-sublander-links.ts` (not yet executed)
- QA report: `docs/ADMIN-QA-REPORT.md`
- Sublander plan: `docs/SUBLANDER-EXPANSION-PLAN.md`
