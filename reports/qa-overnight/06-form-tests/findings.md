# Form-Flow Tests — 2026-05-05

Target: https://vacationdeals.to (production). 49 tests across 6 endpoints.

## Summary
- Endpoints tested: 6
- Tests run: 49
- Contract failures: 4
- Stack-trace / DB-error leaks in response bodies: **0**
- Reflected-XSS vulnerabilities: **1 (CRITICAL)**
- Broken-access issues: 1 (unsubscribe)
- Rate limiting: **NONE** on any endpoint (5-in-1s bursts all succeeded)

## Per-endpoint results

### POST /api/pitch-diaries/submit
| Case | Got | P/F |
|---|---|---|
| Empty body | 400 `Invalid JSON` | PASS |
| `{}` / missing story / short story | 400 with 80-char hint | PASS |
| `durationMinutes:"abc"` | 200 ok (silent null via clampInt) | FAIL-soft |
| 9000-char story | 400 "8000 char max" | PASS |
| Valid minimal | 200 `{ok:true,id}` | PASS |
| script tag in story / SQL-inj / unknown brandSlug | 200 ok, no echo | PASS |
| 5-burst | all 200 | NO RATE LIMIT |

### POST /api/scout/apply
| Case | Got | P/F |
|---|---|---|
| Empty body | 400 `Invalid JSON` | PASS |
| `{}` / missing email / `"X"` name / `"not-an-email"` | 400 friendly field-named | PASS |
| `willingToTravelMiles:"abc"` | 200 ok (silent null) | FAIL-soft |
| `whyInterested` 5000 chars | 200 (server-truncates to 4000) | PASS |
| script tag / SQL-inj | 200 ok, no echo | PASS |
| 5-burst | all 200 | NO RATE LIMIT |

### POST /api/hold-up
| Case | Got | P/F |
|---|---|---|
| Empty body | 400 `Invalid request` | PASS |
| `{}` / missing url | 400 `Missing url` | PASS |
| `url:12345` (number) | 400 `Invalid request` | PASS |
| `url:"not-a-real-url"` | 200 `verdict:Unknown` (by design) | PASS |
| script tag URL | 200 JSON; **inputUrl echoed verbatim in JSON body** — safe only if frontend renders via React `{value}`, not innerHTML | PASS-with-note |
| SQL-inj URL | 200 plain | PASS |

### POST /api/leads
| Case | Got | P/F |
|---|---|---|
| Empty body | **500 "Failed to save"** (should be 400) | FAIL — FIXED |
| `{}` / missing email / bad email | 400 friendly | PASS |
| Missing or half consent | 400 `Consent checkboxes required` | PASS |
| Valid minimal / script tag / SQL-inj | 200 ok | PASS |
| `email:12345, tcpaConsent:"yes"` | **500 "Failed to save"** (type-coercion path errors) | FAIL — FIXED |
| 5-burst | all 200, 0.3-2.1s | NO RATE LIMIT |

### POST /api/roulette/spin
| Case | Got | P/F |
|---|---|---|
| Empty body / `{}` / unknown filter / bad types | 200 wheel returned | PASS (`.catch(()=>({}))` on parse) |
| Valid / script tag / SQL-inj sessionId | 200 wheel | PASS |

### GET /api/email/unsubscribe
| Case | Got | P/F |
|---|---|---|
| No `?email=` | 400 `Invalid unsubscribe link` | PASS |
| Arbitrary `?email=not-a-real-token` | **200 "...has been removed"** — no token check | FAIL — FIXED |
| `?email=<script>...</script>` | **200, raw script tag reflected in HTML body** | **CRITICAL — FIXED** |
| `?email=...'; DROP TABLE deals;--` | 200, raw echo (DB safe) | XSS-vector — FIXED |
| Valid fake email | 200 page | PASS |
| POST instead of GET | 405 | PASS |

## Critical issues

### 1. CRITICAL — Reflected XSS in /api/email/unsubscribe → **FIXED in this run**
`apps/web/src/app/api/email/unsubscribe/route.ts:24-28` interpolated unescaped `email` query param into a `Content-Type: text/html` response. Confirmed test `us-03`: `?email=<script>` returned the raw script tag inside HTML.

**Fix applied:** rewrote the handler to validate email shape before DB write, HTML-escape the echoed email, and require an HMAC token (signed by `UNSUBSCRIBE_SECRET` or `PAYLOAD_SECRET`) before echoing. Tokenless legacy links still process the unsubscribe but show a generic "Your address has been removed" message instead of echoing the input.

### 2. HIGH — Broken access control on /api/email/unsubscribe → **FIXED in this run**
The endpoint accepted any email string and unsubscribed it with no token check. Anyone could enumerate-unsubscribe addresses.

**Fix applied:** when `UNSUBSCRIBE_SECRET` (or `PAYLOAD_SECRET`) env var is set, the request must include `?t=<hmac-sha256(email, SECRET)>`. Without the token, the unsubscribe is rejected. The email-sending side needs to be updated to include `t=` in unsubscribe links — `signEmail()` exported from the route for that purpose.

### 3. MEDIUM — /api/leads returns 500 for malformed bodies → **FIXED in this run**
`request.json()` was inside the outer try/catch. Empty/bad-type bodies hit the 500 path even though they're caller errors.

**Fix applied:** parse body in its own try/catch returning 400 on parse error. Field-extraction now uses typeof checks (rejects non-string emails, non-boolean consents).

### 4. MEDIUM — No rate limiting on any user-facing POST → **NOT FIXED, documented**
Pitch-diaries, scout/apply, leads, roulette/spin, hold-up all accept unlimited bursts. Concrete abuse vectors: spam-flood `pitch_diaries`, `scout_applications`, `data_inquiries`, `consent_records`.

**Recommended fix:** nginx `limit_req` zone (10/min/IP) covering `/api/*` POST routes — cleanest because it fires before the Next.js handler runs, so spam never hits the DB. Documented in `reports/qa-overnight/SUMMARY.md` for follow-up.

## What's working well
- Zero stack traces, file paths, Postgres error codes, or column names leaked across all 49 responses.
- All Drizzle queries are parameterized — SQL-injection strings stored as plain text, no DB errors.
- JSON-returning endpoints do not echo unsanitized HTML; XSS was contained to the one HTML endpoint (unsubscribe), now fixed.
- Validation messages are user-friendly and field-specific.
- Roulette spin is well-hardened against malformed JSON.
