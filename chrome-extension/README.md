# VacationDeals.to — Hidden Resort Rates (Chrome extension)

Chrome MV3 extension that injects the lowest active (non-expired) vacpack rate
for a resort directly above the "Check availability" button in Google Business
Profile panels (Search + Maps, desktop + mobile).

## Files

| File | Purpose |
| --- | --- |
| `manifest.json` | MV3 manifest (v2.0.0) |
| `content.js` | Detects business name, finds the Check-availability anchor, injects the banner |
| `content.css` | Scoped banner styles (desktop + mobile + dark mode) |
| `background.js` | Service worker — calls `vacationdeals.to/api/extension/match`, caches 1h |
| `popup.html` | Action popup |
| `icons/icon.svg` | Source icon |
| `icons/icon{16,48,128}.png` | Built PNGs for the toolbar + web store |
| `build-icons.mjs` | Regenerates the PNGs from SVG via sharp |

## API dependency

The extension calls a single endpoint on vacationdeals.to:

```
GET https://vacationdeals.to/api/extension/match?resort=<name>
→ { deal: { slug, price, durationNights, durationDays, brandName, resortName,
            tag, tagColor, landerUrl, matchConfidence, ... } }
   or { deal: null } when no confident match (<40% token overlap) or no
   active non-expired deal exists.
```

The API already:
- filters `isActive=true` AND expiresAt in the future
- excludes brands flagged `is_suppressed`
- returns the cheapest deal within the top-confidence tier
- tags the deal (NEW DEAL / FLASH SALE / LOWEST EVER / EXCLUSIVE RATE) based on price history

## Local testing

1. `node build-icons.mjs` to regenerate PNGs if the SVG changed.
2. Chrome → `chrome://extensions` → Developer mode → Load unpacked → select this folder.
3. Search "Westgate Lakes Resort" on google.com.
4. Banner should appear above the blue "Check availability" button.

If no banner renders, check the service-worker console in `chrome://extensions`
for the API response.

## Publishing to Chrome Web Store

See `STORE-LISTING.md` for the listing copy and marketing details.
Minimum submission requires:
- this folder zipped (`manifest.json` must be at the root)
- icon128.png + store promo tiles (1400×560 marquee, 440×280 small tile)
- 4+ screenshots (1280×800) — one showing the banner above a real GBP
- privacy policy URL → `https://vacationdeals.to/privacy`

## Version history

- 2.0.0 — Rewrite. Dedicated `/api/extension/match` endpoint, DOM-only construction,
  SPA navigation handling, responsive + dark-mode styles, tag derivation from
  price history, accurate Check-availability anchoring.
- 1.0.0 — Initial prototype (blue banner + /api/deals?search=).
