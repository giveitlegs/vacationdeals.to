# Chrome Web Store listing — VacationDeals.to

## Name (45 chars max)
`VacationDeals.to — Hidden Resort Rates`

## Summary (132 chars max)
`See the lowest active vacation-package rate for any resort while browsing it on Google. Free. Independent. No data collection.`

## Description (detailed — up to 16,000 chars; keep it scannable)

Ever searched for a resort on Google and felt sure you could pay less somewhere else? You can — and you already do. Timeshare "preview packages" (vacpacks) quietly sell 3–5 night stays at major resorts for 60–80% off nightly rack rates, but Google has no reason to show them. This extension surfaces them.

**What it does**
When you browse a resort's Google Business Profile — in Search or Maps — we instantly check whether any active (non-expired) vacpack exists for that resort. If one does, you'll see a small blue banner directly above the "Check availability" button with the lowest current rate. Click it to see the full offer on VacationDeals.to.

**What it covers**
- 33 timeshare brands (Westgate, Wyndham, Hilton Grand Vacations, Marriott Vacation Club, Holiday Inn Club, Bluegreen, Hyatt, Spinnaker, Vacation Village, and more)
- 64+ destinations — Orlando, Las Vegas, Cancun, Gatlinburg, Myrtle Beach, Daytona, Branson, Williamsburg, Park City, and growing
- Rates are refreshed every few hours. Expired deals never show.

**Why we built it**
VacationDeals.to is an independent aggregator. We're not affiliated with Google or any hotel chain. The banner is designed to be small, scoped, and never collects your browsing history.

**Privacy**
- No telemetry, no analytics inside the extension
- No tracking cookies
- We only see a resort name when you land on a resort's Google panel — it's sent to our match API to find a deal, and discarded
- Full policy: https://vacationdeals.to/privacy

**Not affiliated**
This extension is not endorsed by or affiliated with Google, Alphabet, or any hotel / resort brand mentioned. "Google", "Google Maps" are trademarks of Google LLC.

## Category
`Shopping`

## Language
`English`

## Screenshots (1280×800 recommended, 5 minimum)

1. **Hero** — Chrome browsing Google Search for "Westgate Lakes Resort", blue banner visible above Check availability showing "3D/2N · $99 · via Westgate"
2. **Mobile** — Chrome on a phone (320w) showing same banner fitted to the narrower GBP
3. **Tag variations** — Composite showing the 4 tag types (FLASH SALE, NEW DEAL, LOWEST EVER, EXCLUSIVE RATE)
4. **Lander** — After click, the VacationDeals.to deal page with the same offer details
5. **Popup** — Clicking the extension icon to show the popup explanation

## Promotional tiles
- Small tile (440×280) — "See hidden resort rates" tagline on blue gradient
- Marquee (1400×560) — Full-bleed screenshot with banner highlighted + tagline

## Support email
`support@vacationdeals.to`

## Single-purpose justification (required for Chrome Web Store)
"This extension's single purpose is to display the lowest active vacation-package price for a resort the user is actively viewing on Google Search or Maps. It does not interact with any other sites, store personal data, or modify behavior outside of adding a non-intrusive banner to resort pages."

## Host permissions justification
- `*.google.com/search*`, `*.google.com/maps*` — required to detect the resort being viewed and inject the banner
- `vacationdeals.to/*` — required to query the match endpoint for active deals

## Remote code statement
"This extension does not load or execute remote code. All JavaScript ships in the package. Only JSON responses from vacationdeals.to are used to render the banner."
