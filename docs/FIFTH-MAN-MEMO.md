# Fifth-Man Memo: VacPack Marketing Things Nobody Else Is Doing

Most affiliate aggregators in this space (BookVIP, MRG, StayPromo, etc.) all
play the same SEO game: keyword-stuff destination pages, run paid Google Ads
on "vacation deals", buy backlinks. The whole vertical is in a homogeneous
race to the bottom on price and identical pitches.

Here's what nobody is doing — that we should.

---

## 1. Be the **post-purchase truth-teller**, not the pre-purchase pitcher

Every site shouts "$59 Orlando!" Nobody says "here's what *actually* happens
when you check in." Build a public, structured **VacPack Reality Index**:

- For each brand: average 90-min presentation actual length (data point), most
  common upsells they pitch, percentage of guests who report being held past
  the advertised window, mystery-shopper transcripts, average time from
  arrival to first sales pressure.
- Make it indexed, scored, and citable. Brands will hate it. Press will love
  it. Google AI Overviews will surface it because nobody else has structured
  this data.
- This becomes the most-linked-to page in the entire vertical.

**Why competitors won't:** they make money from the brands. We can be
neutral because our affiliate take is a smaller share of the pie if we win
on volume + trust.

---

## 2. **VacPack Day Pass** — vouchers, not packages

Reframe the product. Don't sell "vacation packages" — sell **redeemable day
passes** for the exact things people actually want in those cities.

- "$49 Orlando Day Pass: 3 nights at Westgate + 4 SeaWorld tickets" reframes
  the same offer but commits to *what's included* up front, not *what's a
  bonus*. Trust signal increases massively.
- Each pass gets a unique URL, schema, and tracking code. Brands that don't
  honor the bundle on arrival get publicly flagged on item #1 above.

---

## 3. **The "Will My VacPack Hold Up?" tool**

A single-input tool: paste any vacpack URL → we score it.

- Resort licensing status (state DBPR/equivalent lookup, programmatic).
- Better Business Bureau rating + complaint volume.
- Recent customer reviews (Trustpilot, Google, Yelp, Reddit r/timeshare).
- Recent FTC actions, state AG actions.
- Historical pricing (we already have it from `deal_price_history`).
- Hidden fees ($79 "resort fee" mandatory at checkout, $49 deposit
  forfeiture rules).

Output: a single 1-100 score + a one-paragraph plain-English verdict. Email
+ phone capture for "watch this deal" alerts. This becomes the entry point
to the funnel because **everyone googling a specific deal will find it**.

---

## 4. **VacPack Insurance / Refund Guarantee** as a paid layer

Pure margin play. Sell a $19 add-on that:
- Refunds your $49 deposit if the property doesn't honor the advertised deal.
- Auto-files BBB + state-AG complaints if they pull a bait-and-switch (we
  pre-fill the forms with the data we already have on these brands).

Nobody wants to fight Westgate after-the-fact. Most people pay $19 to know
they don't have to. Our cost to deliver this is a Zapier-tier autoflow + an
LLM-drafted complaint letter. Operates as a moat: every refund event we
handle becomes another data point for Reality Index.

---

## 5. **Reverse the timeshare presentation**

Build a **30-minute counter-presentation** people watch *before* they go to
their VacPack: "Here are the 7 things they'll say. Here's what each one
actually means. Here are the magic words to say no without leaving early."

- Free, gated by email.
- Co-branded "VacPack Survival Kit" PDF mailed to inbox.
- Affiliate links to the deals at the end ("now you're armed — go book the
  cheapest one").

Conversion: massively higher than cold deal-page traffic, because we've
de-risked the experience for them.

---

## 6. **Programmatic SEO at the *town* level, not city level**

Everyone targets "Orlando vacation deals." Nobody targets:
- "Vacation deals near Pigeon Forge $99"
- "Hotels with kitchens for under $100 in Williamsburg"
- "Pet-friendly Westgate vacation packages"
- "Vacpacks within 30 minutes of Disney World"
- "$59 vacation deals available **this weekend**" (live inventory hook)

We have all the data. Generate ~5,000 sublander variants programmatically
keyed on: town + neighborhood + amenity + interest + duration + price-tier
+ availability-window. Each page is real, indexable, and unique because
backed by live DB queries. This is order-of-magnitude more long-tail
coverage than competitors run.

---

## 7. **YouTube "VacPack Diaries" — content-as-distribution**

Pay 5-10 actual travelers $500 each to film their full VacPack experience —
unedited 4-hour bodycam-style recording of the 90-minute presentation +
honest reactions afterward. Each video becomes:
- The most authentic content in the entire vertical
- Massively SEO-rich (transcripts indexed, brand names in titles)
- Pre-built into reality-index scoring
- Distributable across TikTok, Reels, Shorts as 30-second hooks

Cost: ~$5K total. Outranks every competitor's marketing copy on every
brand-name search.

---

## 8. **The "VacPack Ad Spy" as a *paid* product to brokers**

We're already scraping Meta Ad Library for VacPack ads (per the project
notes). Productize that as a B2B offering:

- $199/mo subscription for vacation-deal brokers/marketers
- Real-time alerts: "Westgate just launched a new $99 Orlando ad — here it
  is, here's the landing page, here's the presumed bid"
- White-label competitor intelligence service
- Pays for the rest of the operation, makes us not solely dependent on
  affiliate commission

This is the **most defensible move** because we're the only player with the
data + the audience that cares about it. A B2C site that also runs B2B
intelligence is a known-good model (cf. SimilarWeb, SEMrush).

---

## 9. **One-pager pitches to each timeshare CMO**

Most resort marketing teams know they're losing money on bad affiliate
traffic but can't tell which affiliates are sending it. We build a free
"affiliate audit" landing page that says:
- "We can show you which of your X affiliate partners is sending fraudulent
  / never-converting traffic for free. In exchange, we'd like to pitch you
  on a direct partnership."

Drives the entire enterprise-sales conversation. Every marketing exec
returns these emails because the audit is useful even if they don't sign.

---

## 10. **The "Where Is My Resort On This?" overlay**

A Chrome extension (we already have v2 of one) that, when a user is browsing
the BookVIP/Westgate/etc. site, **overlays our reality score, recent price
history, and known complaints right on top of their listing**.

Browser extensions have a low conversion rate but produce extreme brand
recall + word-of-mouth in the segment. Each install is a long-term
relationship — they see our verdict on every deal they evaluate, forever.

---

## What to ignore (the failure modes nobody admits)

- Don't run paid Google Ads on vacation-deals keywords. The CAC is broken
  and the brands themselves are bidding against you with deeper pockets.
- Don't try to compete on "$49 lowest" — race to bottom, you'll always be
  outflanked by Westgate Reservations directly.
- Don't try to be "neutral" about ALL brands. Pick the 5-6 that are
  reliably worth recommending and sing their praises. Be honest about the
  rest. The aggregator-as-credible-authority model only works if you take
  positions.
- Don't write SEO blog spam. Google's stripping affiliate spam from search
  in 2026. The articles that survive are first-person, source-cited,
  contrarian. Build for that future, not the past.

---

## 60-day sequencing

| Week | Build |
|------|-------|
| 1 | Reality Index data structure + first 6 brands scored |
| 2 | "Will My VacPack Hold Up?" tool MVP (read-only, no email gate) |
| 3 | Programmatic town-level sublanders (start with 500) |
| 4 | First 3 VacPack Diaries videos commissioned |
| 5 | Outbound to 36 brand CMOs with affiliate audit hook |
| 6 | "VacPack Insurance" $19 add-on launches |
| 7 | Ad Spy B2B subscription opens to first 20 paid users |
| 8 | Counter-presentation video published, gated funnel live |

---

## What this requires me to do, that nobody at the brands wants

1. Be honest publicly about which brands are bait-and-switch operators.
2. Take legal flak from at least one brand (we'll get a C&D within 6 months).
   Plan: have a press relationship pre-built so the C&D *itself* becomes a
   story.
3. Stop framing this site as "affiliate links to deals" and start framing
   it as "consumer-protection journalism with shopping links". Different
   incentive, different outcome.
