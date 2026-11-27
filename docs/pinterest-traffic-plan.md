# Pinterest Traffic Engine — Comprehensive Plan

**Goal:** drive referral traffic to vacationdeals.to from Pinterest using eye-catching
**retro AI "offer pins"** (NOT brand photos) — cool, vintage, animated, each with a
**pulsing CTA** — posted to optimized boards on a dedicated account, scheduled safely.

MVP proof: `research/pinterest/cancun-pin.gif` (retro synthwave Cancún poster, bold offer,
pulsing "SEE THE DEAL →" CTA; static preview `cancun-pin-preview.jpg`, builder `pin_build.py`,
retro base candidates `base-cancun-v{1,2}.png`). Aesthetic + CTA approved 2026-11-25.

v2 set approved 2026-11-27 (richer nuance: rotating sun-burst, climate text FX, lovemarks) —
**7 destination pins now live** across the core boards: `cancun-neon-pin.gif`,
`vegas-fire-pin.gif`, `gatlinburg-snow-pin.gif`, `orlando-neon-pin.gif`, `myrtle-fire-pin.gif`,
`branson-snow-pin.gif` (built with `pin_build2.py` + `build_pin.sh`, see Section 3). Still blocked
on Phase 0 (owner must connect a Pinterest business account to Blotato) before any can post.

---

## 1. Posting mechanism — Blotato (ban-safe), NOT the raw Pinterest API or browser automation

- **Blotato is already connected** to this account (it has Pinterest board listing + posting
  via `blotato_create_post` / `blotato_list_pinterest_boards`). It's an official integration —
  **far lower ban risk than browser automation or hand-rolled API calls.**
- **BLOCKER (owner action):** no Pinterest account is connected to Blotato yet — only YouTube
  channels. **Owner must (a) create a dedicated Pinterest business account for VacationDeals.to,
  then (b) connect it in Blotato.** Until then nothing can post.
- Fallback if Blotato ever drops Pinterest: the `stealth-browser-mcp` can post via the real
  web UI (used elsewhere in this project) — but keep it as a last resort; Blotato first.
- **Cadence discipline (avoid spam flags):** new accounts → 3–5 pins/day for the first 2 weeks,
  ramp to 10–15/day. Space pins 1–2h apart (Blotato scheduling). Never dump 50 at once.

## 2. Account + board architecture (SEO-optimized)

Pinterest is a visual search engine — boards and pin text are keyword real estate.

- **Account:** `VacationDeals.to` business account (enables Rich Pins + analytics + the
  website claim). Claim the domain so pins carry the logo + drive the `vacationdeals.to` attribution.
- **Boards (one per high-intent theme; keyword-named + described):**
  - *Cheap All-Inclusive Vacation Deals* · *Cancún & Riviera Maya Getaways* · *Orlando / Disney
    Vacation Deals* · *Las Vegas Getaway Deals* · *Smoky Mountains & Gatlinburg Cabins* ·
    *Myrtle Beach & Beach Getaways* · *Branson Family Trips* · *Timeshare Preview Deals* ·
    *Travel on a Budget* · *Retro Travel Posters* (aesthetic board that also carries pins).
  - Each board description = 1–2 keyword sentences ("Hand-picked cheap all-inclusive vacation
    deals and resort getaway packages, updated weekly — tap any pin for the live price.").
- **Map:** each deal/destination → its destination board + the "all-inclusive"/"timeshare
  preview" theme board (a pin can go to multiple boards over time, spaced out).

## 3. The creative system (retro AI offer pins)

- **Base art:** Higgsfield `gpt_image_2_6`, **2:3 vertical (1000×1500)**, retro/vintage/synthwave
  travel-poster aesthetic per destination (NOT the resort brand photos — a deliberately
  different, "scroll-stopping" look). Prompt recipe (proven): *"1980s retro synthwave travel
  poster, <destination>, vintage airline advertisement style, bold geometric sun, palm
  silhouettes, grainy risograph texture, clean negative space in lower third, vertical, no text."*
  Vary palette per destination (Cancún=pink/orange; Vegas=neon purple; Smokies=teal/green dusk;
  Orlando=sunset gold).
- **Overlay (local, free — PIL + ffmpeg, `pin_build.py`):** destination headline (Impact),
  "<N> NIGHTS · <type>", "FROM $<price>", and a **pulsing + glowing CTA pill** ("SEE THE DEAL →").
  Two animations (pulse scale + glow) like the site's FLASH SALE badge. Export **optimized GIF
  (~250–400 KB)** or MP4 (Pinterest accepts both; video pins get extra reach).
- **Price is live-sourced** from the `deals` table so pins never quote a stale number; regenerate
  when a deal's price moves materially (reuse the rate-swarm freshness signal).
- **Honesty:** the retro art is clearly stylized/illustrative (not a fake photo of the actual
  resort), and the offer/price is real — no fabricated resort imagery passed off as real.

## 4. Pin metadata (the SEO that makes pins rank)

Per pin, via Blotato `blotato_create_post`:
- **Title (100 char):** keyword-first — "Cancún All-Inclusive Vacation Deal — 5 Nights from $799".
- **Description (first 50 chars matter):** natural keywords + a soft CTA + 2–3 hashtags
  ("Cheap all-inclusive Cancún getaway, 5 nights from $799. Tap for the live deal.
  #vacationdeals #cancun #allinclusive").
- **Destination link:** the deal's top-level URL (`/cancun`, `/westgate-orlando-3-night-…`) with
  a `?utm_source=pinterest&utm_medium=social&utm_campaign=<board>` tag — **this feeds the Lead
  Backend v2 channel attribution** (pins will show up as `social-*`/`referral` in `/admin/leads`).
- **Alt text:** describe the pin for accessibility + image SEO.

## 5. Pipeline (how a batch of pins gets made + posted)

1. Pick N deals (prioritize high-savings, seasonal, high-traffic destinations).
2. Generate the retro base per destination (Higgsfield 2:3) — cache per destination (reuse the
   Cancún base for all Cancún deals; only the overlaid price/nights change).
3. Overlay offer + pulsing CTA (`pin_build.py`) → GIF/MP4.
4. Upload media to Blotato (presigned URL) → `blotato_create_post` to the mapped board(s),
   **scheduled** (not all at once), with the UTM-tagged deal link.
5. Log pin→deal mapping; track clicks via the UTM channel in `/admin/leads` + Pinterest analytics.

## 6. Measurement

- **Pinterest analytics** (impressions, saves, outbound clicks per pin/board).
- **Lead Backend v2** `/admin/leads` channel rollup — pins arrive UTM-tagged, so Pinterest
  referral → opt-in conversion is measurable end-to-end (which boards/destinations convert).
- Double down on the destinations/offers that save + click best; retire duds.

## 7. Rollout phases

- **Phase 0 (owner):** create the dedicated Pinterest business account + connect it to Blotato +
  claim the domain. *(Blocks everything.)*
- **Phase 1 (MVP, ~10 pins):** 5 destinations × retro base, overlay live offers, post 3–5/day to
  the matching boards; watch saves/clicks for 1–2 weeks.
- **Phase 2 (scale):** batch-generate per-destination bases, auto-overlay live prices for the top
  ~100 deals, schedule 10–15/day across boards; refresh prices weekly.
- **Phase 3 (optimize):** lean into winning aesthetics/destinations; add seasonal pins
  (Black Friday, Christmas-week, spring break) timed to Pinterest's search-trend calendar
  (Pinterest demand peaks 30–45 days BEFORE the event).

## 8. Costs

- Higgsfield base art ≈ a few credits/image, and bases are **reused per destination** (not
  per deal), so the art cost is tiny. Overlay + animation (PIL/ffmpeg) = free. Blotato = the
  existing subscription. No per-pin API cost.

## Open decisions for the owner
1. Create + connect the dedicated Pinterest account (the one true blocker).
2. Approve the board list (Section 2) or adjust.
3. Confirm the MVP aesthetic (`cancun-pin.gif`) or request tweaks (palette, CTA copy, font).
4. Pin cadence comfort level (conservative 3–5/day to start is recommended).
