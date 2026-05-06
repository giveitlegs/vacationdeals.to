# Visual QA — Overnight Pass

**Run date:** 2026-05-05
**Tool:** Playwright MCP (Chrome DevTools MCP unavailable — user's Chrome profile was running)
**Viewports:** Desktop 1440×900, Mobile 375×812
**Pages tested:** 25 / 25
**Screenshots:** 50 in this directory

## Critical issues

### 1. React hydration error on `/brands` (desktop only)
Console: `Minified React error #418` (HTML hydration mismatch). Stack pointed at the framework chunk `bbcba086-…`. Visuals still render but it throws on every desktop visit. Mobile is clean. Investigate brand-card list / breadcrumb / SEOPreFooter for date- or count-based content rendered server-side that diverges from client.

### 2. Bad/placeholder data leaking through to public pages
- `/wyndham` — multiple cards titled `Resort Information` (placeholder).
- `/marriott` — first 2 cards titled `special offer` (lowercase).
- `/westgate` — middle card destination string is `Unknown,` (city missing, comma kept).
- `/3-night-packages` — first card location `Various,` (trailing comma).
- `/hgv` — header reads "0 deals from $149 · 0 destinations" but body lists 1 deal. `getBrandStats()` is computing differently from the deal list. Slug mismatch likely.

### 3. Unicode escape rendered literally on `/destinations`
Map legend shows `$100–$199` instead of `$100–$199`. String double-escaped or escaped manually. Trivial fix.

## Notable, non-critical

### A. "PLAY NOW!" red sticker overlapping content (desktop only)
Inconsistent sticker appearing under the Roulette nav button on `/las-vegas`, `/myrtle-beach`, `/westgate`, `/hgv`, `/wyndham`, `/3-night-packages`, `/resort-roulette`, `/vacpack-games`, `/about` — but NOT on `/`, `/deals`, `/destinations`, `/brands`, `/will-it-hold-up`, `/reality-index`, `/forfeit`, `/pitch-diaries`, `/scout`, `/blog`, `/orlando`, `/gatlinburg`, `/branson`. Anchor with proper z-index or hide by default.

### B. Mobile horizontal page-scroll on `/blog` (375 viewport) — FIXED
`document.scrollWidth = 477px` vs viewport 375px — 102px of horizontal scroll. Offender is the `.deal-ticker`. Fix applied: `overflow-x: hidden` on `body` in `globals.css`.

### C. Resort-roulette wheel — bottom-half labels mirror-image
Wedge text below 180° reads upside-down (`66$`, `99$`, `299$`). Counter-rotate those wedges.

### D. Blog featured cards — identical gradient placeholders
All `/blog` featured cards use the same purple/orange gradient. Per `feedback_direction.md` user wants better images — wire `cover_image_url` into card render.

## Per-URL summary
| # | URL | DT | M | Notes |
|---|-----|----|----|-------|
| 1 | `/` | OK | OK | Clean |
| 2 | `/deals` | OK | OK | |
| 3 | `/destinations` | minor unicode literal | OK | |
| 4 | `/brands` | React #418 | OK | Hydration mismatch |
| 5 | `/will-it-hold-up` | OK | OK | |
| 6 | `/reality-index` | OK | OK | |
| 7 | `/forfeit` | OK | OK | Live counter animates |
| 8 | `/pitch-diaries` | OK | OK | Empty-state correct |
| 9 | `/scout` | OK | OK | |
| 10 | `/pitch-diaries/submit` | OK | OK | Did not submit |
| 11 | `/orlando` | OK | OK | |
| 12 | `/las-vegas` | sticker | OK | |
| 13 | `/gatlinburg` | OK | OK | |
| 14 | `/branson` | OK | OK | |
| 15 | `/myrtle-beach` | sticker | OK | |
| 16 | `/westgate` | sticker + bad city | OK | |
| 17 | `/hgv` | count mismatch | OK | |
| 18 | `/wyndham` | placeholder titles | OK | |
| 19 | `/marriott` | placeholder titles | OK | |
| 20 | `/deals-under-100` | OK | OK | |
| 21 | `/3-night-packages` | bad city | OK | |
| 22 | `/resort-roulette` | mirror text | OK | |
| 23 | `/vacpack-games` | sticker | OK | |
| 24 | `/blog` | gradient placeholders | **horiz overflow** (FIXED) | |
| 25 | `/about` | sticker, ticker absent | OK | |

## Performance/a11y
Did not run Lighthouse — Playwright MCP doesn't expose `lighthouse_audit`, and the agent prioritized covering all 25 URLs within budget. Recommend a follow-up CLI run: `npx lighthouse https://vacationdeals.to --form-factor=mobile`. No subjective LCP > 3s observed.

## Recommended fix order (for tomorrow)
1. Scraper title/city fallback (Wyndham, Marriott) + DB cleanup of `title IN ('Resort Information','special offer','')` and null cities. (Could be added to `scripts/nightly-data-quality.ts`.)
2. `/brands` hydration error — repro with non-minified React to read full #418 text. Likely a `new Date()` or counter rendered without a `suppressHydrationWarning` boundary.
3. `/hgv` stat/list count mismatch — check brand-id slug join in `getBrandStats`.
4. Unicode literal in destinations legend.
5. Decide on "PLAY NOW!" sticker — fix z-index or hide.
6. Roulette wheel bottom-half text — counter-rotate wedges below 180°.
7. Blog cards — wire `cover_image_url` into card render so each post has its own image.
