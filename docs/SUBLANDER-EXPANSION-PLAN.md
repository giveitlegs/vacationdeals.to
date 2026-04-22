# Sublander Expansion + Blog Batch 4 — Plan

**Goal:** Publish ~240–360 child pages off existing city markets + 50 new blog
posts, using flat-root slugs, maximally interlinked, with strict schema hygiene
so we capture long-tail SEO around "vacation deals in {CITY} for {MODIFIER}".

Author: 2026-04-21  ·  Status: **awaiting approval** before implementation.

---

## 1. Scope summary

| Deliverable | Count | URL pattern |
| --- | --- | --- |
| Parent city landers (already exist) | ~12 live + 10 more | `/{city}` |
| City × modifier sublanders (new) | ~30 modifiers × ~12 cities ≈ 360, trimmed by applicability to ~240 | `/{city}-{modifier}` |
| New blog posts | 50 | `/{slug}` |
| New component — city sub-nav | 1 | — |
| Updated component — SEOPreFooter | 1 | — |

---

## 2. URL structure

**Flat-root, hyphen-joined:** `/{city-slug}-{modifier-slug}`

Examples:
- `/orlando-for-families`
- `/orlando-summer`
- `/orlando-under-100`
- `/las-vegas-bachelor-party`
- `/gatlinburg-fall-foliage`

**Why flat:**
- SEO-clean (one level deep, matches Google's keyword pattern)
- Doesn't require new dynamic route file — extends existing `[slug]` catchall resolver with a new "sublander" match type
- Canonical is always `https://vacationdeals.to/{city}-{modifier}`

**Resolver priority** (ordered in `resolveSlug()`):
1. rate-recap-\* prefix (existing)
2. Static price/duration ranges (existing)
3. **NEW: Sublander** `{citySlug}-{modifierSlug}` — match if the slug starts with a known city slug and the remainder is a known modifier slug
4. Blog posts (existing)
5. Destination (existing — plain `/orlando`)
6. Brand (existing)

Collision-proofing: the sublander check only fires if the full tail matches a registered modifier. Unknown tails fall through to 404.

---

## 3. Modifier taxonomy (40 total; per-city applicability trims to ~30 each)

Grouped for UI purposes (sub-nav sections). The `applicability` column lists cities where the modifier makes sense — populated below the list.

### Audience (10)
| Slug | H1 fragment | Filter |
| --- | --- | --- |
| `for-families` | `for Families` | no age-restricted brands; prefer waterpark/pool inclusions |
| `for-couples` | `for Couples` | 2-adult deals, no kid inclusions required |
| `for-seniors` | `for Seniors (55+)` | low-key brands (Bluegreen, HGV) |
| `solo-travelers` | `for Solo Travelers` | price ascending, single-occ permitted |
| `for-groups` | `for Groups` | 2BR+ units, 4+ occupancy |
| `bachelor-party` | `for a Bachelor Party` | Vegas-heavy; 2-night close-in |
| `bachelorette-party` | `for a Bachelorette Party` | Vegas-heavy |
| `honeymoon` | `for Honeymoons` | premium brands, all-inclusive |
| `destination-wedding` | `for a Destination Wedding` | resorts with wedding packages |
| `girls-trip` | `for a Girls' Trip` | mid-range, shopping-adjacent |

### Season (6)
| Slug | H1 fragment | Notes |
| --- | --- | --- |
| `summer` | `in Summer` | all cities |
| `fall` | `in Fall` | skew mountain destinations |
| `spring` | `in Spring` | all cities |
| `winter` | `in Winter` | skew ski/beach extremes |
| `spring-break` | `for Spring Break` | FL/Mexico/Vegas |
| `shoulder-season` | `in Shoulder Season` | all cities |

### Occasion (7)
| Slug | H1 fragment |
| --- | --- |
| `last-minute` | `Last-Minute` |
| `memorial-day-weekend` | `for Memorial Day Weekend` |
| `july-4th` | `for July 4th` |
| `labor-day-weekend` | `for Labor Day Weekend` |
| `thanksgiving` | `for Thanksgiving` |
| `christmas` | `for Christmas` |
| `new-years` | `for New Year's` |

### Budget (5)
| Slug | Filter |
| --- | --- |
| `under-99` | price ≤ 99 |
| `under-149` | price ≤ 149 |
| `under-199` | price ≤ 199 |
| `cheap` | price ≤ 149 (copy angle: "cheapest") |
| `luxury` | price ≥ 399 |

### Duration (4)
| Slug | Filter |
| --- | --- |
| `weekend` | durationNights ∈ {2,3} |
| `2-night` | durationNights = 2 |
| `3-night` | durationNights = 3 |
| `5-night` | durationNights = 5 |

### Interest (8, highly city-filtered)
| Slug | Applicability |
| --- | --- |
| `all-inclusive` | Cancun, Cabo, Puerto Vallarta, Punta Cana, Nassau |
| `near-disney` | Orlando |
| `near-universal` | Orlando |
| `oceanfront` | coastal cities |
| `with-waterpark` | Orlando, Gatlinburg, Williamsburg |
| `ski-in-ski-out` | Park City, Lake Tahoe |
| `pet-friendly` | all cities (small subset of deals) |
| `adults-only` | Cancun, Cabo, Vegas |

**Per-city modifier count** (enforced via allowlist):
- Orlando: 32 (all audience, all season, all occasion, budget, duration, Disney/Universal/waterpark/pet/family)
- Las Vegas: 28 (adds bachelor/bachelorette/adults-only; removes mountain/coastal)
- Gatlinburg: 25
- Cancun / Cabo / Puerto Vallarta: 22 each (all-inclusive + honeymoon skew)
- Myrtle Beach / Daytona / Cocoa / Hilton Head / Galveston: 24 each (oceanfront)
- Park City / Lake Tahoe: 20 (ski-skew)
- Branson / Williamsburg: 24
- Smaller/internationals: 18 each

**Total sublanders:** ~240 high-quality pages.

---

## 4. Data layer

### 4.1 Modifier config (new file)
`packages/shared/sublanders.ts`:
```ts
export type ModifierType = "audience" | "season" | "occasion" | "budget" | "duration" | "interest";
export interface Modifier {
  slug: string;
  label: string;                 // "For Families"
  h1Fragment: string;            // "for Families"
  type: ModifierType;
  filter: DealFilterSpec;        // e.g., { maxPrice: 149 } or { tag: "waterpark" }
  applicableCities?: string[];   // if set, only those cities; else all
  introTemplate: string;         // 150-250 word template with {{city}} + {{dealCount}} tokens
  faqs: { q: string; a: string }[]; // 5-8 FAQs unique to this modifier
}

export const MODIFIERS: Record<string, Modifier> = { /* ~40 entries */ };
export const CITY_SUBLANDERS: Record<string, string[]> = { /* per-city modifier allowlist */ };
```

### 4.2 Query extension
`queries.getDeals` already supports `destinationSlug`, `maxPrice`, `durationNights`. Add optional `minPrice`, `brandSlugs[]` (exclude list), `includesAny[]` (for "waterpark", "all-inclusive" inclusion tokens). Sublander filters map to these.

For audience/occasion/interest modifiers that don't have structured fields, the filter is a post-query predicate over `inclusions` JSON.

### 4.3 Schema notes
No DB schema changes. Everything lives in code.

---

## 5. Catchall resolver update (`apps/web/src/app/(frontend)/[slug]/page.tsx`)

Insert a new resolver step between "duration" and "blog":

```ts
// 2.5 Check sublander {city}-{modifier} pattern
for (const citySlug of knownCitySlugs) {
  if (slug === citySlug) continue; // parent, handled later
  if (slug.startsWith(citySlug + "-")) {
    const modifierSlug = slug.slice(citySlug.length + 1);
    const modifier = MODIFIERS[modifierSlug];
    const allowed = CITY_SUBLANDERS[citySlug]?.includes(modifierSlug);
    if (modifier && allowed) {
      return { type: "sublander", data: { citySlug, modifier } };
    }
  }
}
```

Sublander page renders a dedicated `<SublanderPage>` component with intro + subnav + deals + FAQ + prefooter + schema.

---

## 6. Components

### 6.1 `<CityModifierSubnav>` — new
Injected on both parent `/orlando` and all children `/orlando-*`. 

Props: `cityName`, `citySlug`, `currentModifier?`, `modifiers: Modifier[]`

Behavior:
- Horizontal scrollable row of chip buttons (pill-style)
- Each chip → `/{city}-{modifier.slug}`, current one highlighted (gradient background)
- Parent chip always first: `All {CityName}` → `/{city}`
- Left/right gradient fades overlay the scroll container
- Arrow buttons (left/right) — visible only if overflow detected; scroll ±300px
- Touch-swipe works via native overflow-x:auto + scroll-snap
- Sticky positioned below global navbar (optional, controlled by prop)
- Keyboard accessible (arrow keys when focused)

CSS-only fade gradient via pseudo-elements:
```css
.subnav::before { background: linear-gradient(to right, white, transparent); ... }
.subnav::after  { background: linear-gradient(to left,  white, transparent); ... }
```

### 6.2 `<SublanderPreFooter>` — extends SEOPreFooter
Three blocks:
1. **All {City} sublanders** — every sibling modifier for same city (grouped by modifier type with section headers)
2. **Back to {City} parent** — big CTA card
3. **Related cities** — same modifier in other applicable cities (e.g., "Summer deals in Las Vegas, Cancun, Myrtle Beach")

### 6.3 `<SublanderSchema>` — JSON-LD
See §7.

---

## 7. Schema JSON-LD

### 7.1 Parent `/orlando`
Emit a single `@graph` with these entities (existing city page gains the `ItemList`):

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "TouristDestination",
      "@id": "https://vacationdeals.to/orlando#destination",
      "name": "Orlando, FL",
      "description": "...",
      "geo": { "@type": "GeoCoordinates", "latitude": 28.5, "longitude": -81.4 }
    },
    {
      "@type": "CollectionPage",
      "@id": "https://vacationdeals.to/orlando#page",
      "name": "Orlando Vacation Deals",
      "url": "https://vacationdeals.to/orlando",
      "mainEntity": { "@id": "...#itemList" }
    },
    {
      "@type": "ItemList",
      "@id": "https://vacationdeals.to/orlando#itemList",
      "name": "Orlando Vacation Deal Categories",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "url": "https://vacationdeals.to/orlando-for-families", "name": "Orlando Vacation Deals for Families" },
        { "@type": "ListItem", "position": 2, "url": "https://vacationdeals.to/orlando-summer", "name": "Orlando Vacation Deals in Summer" },
        "…all 32 sublanders"
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [ "…existing FAQs…" ]
    },
    {
      "@type": "ItemList",
      "@id": "…#offers",
      "itemListElement": [ "…Offer entities for each DealCard on page…" ]
    }
  ]
}
```

### 7.2 Child `/orlando-for-families`
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "position": 1, "name": "Vacation Deals", "item": "https://vacationdeals.to/" },
        { "position": 2, "name": "Orlando", "item": "https://vacationdeals.to/orlando" },
        { "position": 3, "name": "Orlando for Families" }
      ]
    },
    {
      "@type": "CollectionPage",
      "name": "Orlando Vacation Deals for Families",
      "about": { "@type": "TouristDestination", "name": "Orlando, FL" },
      "isPartOf": { "@id": "https://vacationdeals.to/orlando#page" }
    },
    {
      "@type": "ItemList",
      "name": "Family-Friendly Orlando Vacation Deals",
      "itemListElement": [ "…Offer ListItems for visible deals…" ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [ "…modifier-specific FAQs…" ]
    }
  ]
}
```

Each deal card gets an `Offer` with price, priceCurrency, availability, validThrough (from `expiresAt`), url (canonical `/deals/{slug}`).

---

## 8. Content generation (non-thin, non-duplicate)

### 8.1 Intro template (150–250 unique words per page)
For each modifier, `introTemplate` uses variable substitution + a pool of 3-5 pre-written paragraphs rotated by city. Guarantees uniqueness at scale.

Example (family modifier):
```
"{{city}} with kids is one of those trips that sounds easy until you're 
packing for four people in a rented sedan. {{dealCount}} family-ready 
vacpacks currently live on VacationDeals.to for {{city}}, starting 
around ${{lowPrice}} for {{durationSample}} — and every one of them 
comes with a resort room large enough that nobody has to share a bed 
with a six-year-old.
{{cityBlurb}}
Here's what the {{dealCount}} current family-friendly {{city}} deals 
share: {{commonInclusions}}..."
```

`{{cityBlurb}}` pulls from a per-city pool of 4-5 hand-written 50-word paragraphs so repeats are rare even at ~30 modifiers per city. Not AI slop — written once per pool, reused deliberately.

### 8.2 FAQs (5–8 per modifier, city-agnostic)
Each modifier ships 5-8 FAQs in `faqs` array. Example for `for-families`:
```
Q: Do timeshare vacpacks work for families with young kids?
A: Yes — most brands allow 2 adults + 2–4 kids. Westgate and Wyndham specifically design units with bunk rooms and kitchens for families.

Q: Is the sales presentation safe to attend with kids?
A: Kids aren't allowed in the presentation room, but most resorts have free supervised activities or a kids' club during the 90 minutes.
...
```

### 8.3 Uniqueness enforcement
QA script (already exists in scope: `scripts/qa-blog-posts.ts` style) will be added: `scripts/qa-sublanders.ts` that cross-checks every generated sublander's intro + FAQs for ≥70% token uniqueness vs siblings.

---

## 9. Sitemap additions

`sitemap.ts` gains:
```ts
// Sublanders
for (const [citySlug, modifierSlugs] of Object.entries(CITY_SUBLANDERS)) {
  for (const modSlug of modifierSlugs) {
    urls.push({
      url: `${baseUrl}/${citySlug}-${modSlug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
}
```

~240 new URLs added to sitemap.xml.

---

## 10. 50 new blog posts

Continue the humanized style already in `blog-posts/humanized-100.ts`:
- 2+ intentional misspellings
- 3+ grammar imperfections  
- First-person opener
- 10 FAQs each
- Internal links to ≥3 sublanders or deal pages
- 800–1,200 words each

### 10.1 Topic mix (50 posts)

| Bucket | Count | Examples |
| --- | --- | --- |
| Modifier × city hybrids | 15 | "I Took My Family to Orlando on a $199 Vacpack in Summer", "Why Vegas Bachelor Parties Are Cheaper in Fall" |
| Survival / playbook | 8 | "Exact Script: How I Walked Out of a Westgate Presentation in 74 Minutes", "The One Line That Stops the 'Manager Comes In' Ploy" |
| Brand deep-dives | 7 | "Wyndham vs Bluegreen: Which Vacpack Is Better for Families?", "Holiday Inn Club Vacations: What You Don't See on the Site" |
| Money + math | 6 | "I Spent $487 Total on 4 Nights in Orlando — Here's the Receipt Breakdown", "Vacpacks vs Airbnb: When Each Actually Wins" |
| Seasonal timing | 6 | "Best Weeks of the Year to Book Gatlinburg Vacpacks", "Why Spring Break Vacpacks Hit $499 and How to Avoid Paying It" |
| Quirky / viral | 8 | "I Played VacPack Bingo During a Real Pitch — Here's the Full Card", "The Weird Reason Timeshare Sales Reps Bring Out Their Grandkids' Photos" |

### 10.2 File
`apps/web/src/lib/blog-posts/humanized-batch-300.ts` (50 posts, same BlogPost[] shape). Auto-loaded by existing loader.

### 10.3 SEO rigor per post
- Unique meta title ≤ 60 chars, unique meta description ≤ 155 chars
- Primary keyword in H1 + first 100 words + ≥1 H2
- 1 internal link to a related sublander, 1 to a brand page, 1 to another blog
- 1 external authoritative link (if relevant — e.g., FTC cooling-off rule)
- `heroGradient` + `heroImageAlt` as in existing posts
- Hook the post to a specific sublander via the `relatedSublander` field (new optional on BlogPost)

---

## 11. Build sequence

1. **Modifier config** (`packages/shared/sublanders.ts`) — 40 modifiers, per-city allowlists, intro templates, FAQs. ~1 day of writing.
2. **Query extension** — add `minPrice`, `brandSlugs[] exclude`, `includesAny[]` predicate to `getDeals`.
3. **Sublander resolver + page component** — extend `[slug]/page.tsx`, create `<SublanderPage>`.
4. **`<CityModifierSubnav>`** — horizontal scroll with fade + arrows; inject on parent cities first.
5. **`<SublanderPreFooter>`** — sibling modifiers + uplink + related-city block.
6. **Schema** — update parent city pages with `ItemList` of children; add child schema emitter.
7. **Sitemap** — 240 new URLs.
8. **Uniqueness QA script** — abort publish if ≥30% duplicate content detected.
9. **50 new blog posts** — one big batch file + loader registration.
10. **Ping sitemap + crawl via Screaming Frog** — confirm all 240+50 return 200.
11. **Deploy to VPS.**

Estimated implementation time: **~2 focused sessions**. Session 1 = sections 1–7 (infrastructure). Session 2 = sections 8–11 (content volume + QA).

---

## 12. Risks + mitigations

| Risk | Mitigation |
| --- | --- |
| Thin-content penalty on 240+ pages | 150+ unique words + unique FAQ set per page; QA script enforces |
| Slug collisions (`/orlando-events` conflicts with a blog) | Resolver order puts sublander check before blog; explicit allowlist of modifiers |
| Duplicate content vs parent `/orlando` | Sublanders filter deal set + have modifier-specific intro/FAQ — different enough |
| Sitemap bloat (now ~1,500 URLs) | Still well under Google's 50k limit; split into `sitemap-*.xml` if we reach ~10k |
| Sub-nav mobile UX | Test with swipe + arrow clicks on actual phone; no lib, pure CSS |
| Schema validation | Run Google's Rich Results Test on 5 sample pages before full rollout |
| Crawl budget impact | `changeFrequency: "weekly"` (not daily) on sublanders reduces waste |

---

## 13. Success metrics (check 30, 60, 90 days post-launch)

- **Indexation**: ≥80% of 240 sublanders indexed within 14 days (GSC)
- **Impressions**: +2× total monthly impressions within 60 days
- **Long-tail clicks**: ≥15% of organic clicks from queries containing a modifier term within 90 days
- **Internal link equity**: PageRank-like internal juice flowing to sublanders — verified via Screaming Frog inlinks report

---

## 14. Open questions for you before I start

1. **URL pattern confirm**: `/{city}-{modifier}` (short) vs `/vacation-deals-{city}-{modifier}` (keyword-rich but longer)? I recommend the short form.
2. **Priority cities for launch**: all 12+ at once, or phased (Orlando + Vegas + Gatlinburg first, rest follow)? I recommend **all 12 at once** to maximize internal link density.
3. **Sub-nav sticky or not**: stick below navbar while scrolling the page, or static-top only?
4. **Blog post batch timing**: ship all 50 with the sublanders, or 25 before / 25 after?

Once you answer these 4, I start with section 1 and ship the whole thing across ~2 sessions.
