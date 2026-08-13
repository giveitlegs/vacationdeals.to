import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "provacation-group";
const BASE_URL = "https://www.provacationgroup.com";

// Pro Vacation Group (provacationgroup.com) — a Duda-built site selling gated
// all-inclusive "preview" packages to Mexico (Cancun, Cabo, Puerto Vallarta,
// Loreto, Riviera Maya, Cozumel, Huatulco) plus Punta Cana (DO), Curacao (CW)
// and Panama (PA). Every package requires attending a ~90-minute "Vacation
// Ownership Seminar" or retail rates are charged.
//
// RENDERING: SSR (CheerioCrawler). Verified 2026-08-13 — the package price is
// present in the fetched HTML with JS disabled, inside an <h1> heading, e.g.
//   <h1>...Code VG<Puerto Vallarta> - $1199</h1>   (6 Days / 5 Nights)
//   <h1>...Code VG - $999</h1>                      (5 Days / 4 Nights)
// The site nav (`a.unifiednav__item` -> `/newpage<hex>`) enumerates all 23
// package detail pages, so we seed the homepage, harvest the nav links, then
// parse each package page.
//
// PRICE-BUG guard: the PACKAGE "from" price is ONLY the "$999"/"$1199" figure
// in an <h1>. Every other dollar amount on the page lives in body/caption text,
// NOT in an <h1>:
//   - "$100/adult, $65/child per night" for extra guests  (per-night fee)
//   - "$29.95 per night" taxes                              (tax)
//   - "$75,000 USD" household income to qualify             (income requirement)
// So we read the price ONLY from <h1> text and require it inside the 39-9999
// band ($75,000 is excluded by the band; the fees/taxes never appear in an h1).
//
// DOM-verified only: destination, price, and duration are all parsed from the
// page's own <h1> text (rendered page = truth). Note the nav labels
// /newpage494dd6f8 as "Cabo" but that page's own <h1> reads "(Cancun)" — a
// site-side copy error; we trust the rendered page and store it as Cancun.

type Dest = { city: string; state?: string; country: string };

// Matched against the lowercased <h1> title text; order = most-specific first.
const DESTINATIONS: [RegExp, Dest][] = [
  [/riviera maya/, { city: "Riviera Maya", state: "Quintana Roo", country: "MX" }],
  [/punta cana/, { city: "Punta Cana", state: "La Altagracia", country: "DO" }],
  [/puerto vallarta|vallarta/, { city: "Puerto Vallarta", state: "Jalisco", country: "MX" }],
  [/cancun/, { city: "Cancun", state: "Quintana Roo", country: "MX" }],
  [/cabo/, { city: "Cabo San Lucas", state: "Baja California Sur", country: "MX" }],
  [/loreto/, { city: "Loreto", state: "Baja California Sur", country: "MX" }],
  [/cozumel/, { city: "Cozumel", state: "Quintana Roo", country: "MX" }],
  [/huatulco/, { city: "Huatulco", state: "Oaxaca", country: "MX" }],
  [/curacao|curaçao/, { city: "Willemstad", country: "CW" }],
  [/panama/, { city: "Panama City", country: "PA" }],
];

function validPrice(price: number): boolean {
  // Mexico all-inclusive runs high; band per task spec.
  return Number.isFinite(price) && price >= 39 && price <= 9999;
}

function matchDestination(title: string): Dest | undefined {
  const t = title.toLowerCase();
  for (const [re, dest] of DESTINATIONS) {
    if (re.test(t)) return dest;
  }
  return undefined;
}

export async function runProvacationGroupCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 100,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    preNavigationHooks: [
      async (_ctx, gotOptions) => {
        gotOptions.headers = {
          ...(gotOptions.headers || {}),
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        };
      },
    ],
    async requestHandler({ request, $, log, enqueueLinks }) {
      const label = request.label;
      log.info(`Processing ${request.url} (label=${label ?? "LIST"})`);

      // --- LIST page: harvest every package (/newpage*) link from the nav. ---
      if (label !== "PACKAGE") {
        const urls = new Set<string>();
        $("a.unifiednav__item, a[href^='/newpage']").each((_i, el) => {
          const href = $(el).attr("href") || "";
          const path = href.split("#")[0]; // drop in-page anchors
          if (/^\/newpage[0-9a-f]*$/.test(path)) {
            urls.add(`${BASE_URL}${path}`);
          }
        });
        const list = [...urls];
        log.info(`[${SOURCE_KEY}] Found ${list.length} package pages`);
        if (list.length) {
          await enqueueLinks({ urls: list, label: "PACKAGE" });
        } else {
          log.warning(`[${SOURCE_KEY}] No package links found on ${request.url}`);
        }
        return;
      }

      // --- PACKAGE page: price + title live in <h1> text. ---
      // Concatenate all h1 text (title, price, and ★ stars can be split across
      // separate h1s or merged into one). This keeps us inside headings and away
      // from the fee/tax/income traps that live in body/caption copy.
      const h1Text = $("h1")
        .map((_i, el) => $(el).text().replace(/\s+/g, " ").trim())
        .get()
        .join(" | ");

      const pending: Promise<unknown>[] = [];
      let stored = 0;

      // PACKAGE price = the $ figure in the h1 band (e.g. $999 / $1199).
      let price = NaN;
      for (const m of h1Text.matchAll(/\$\s*([\d,]+)/g)) {
        const n = parseInt(m[1].replace(/,/g, ""), 10);
        if (validPrice(n)) {
          price = n;
          break;
        }
      }

      // Duration, e.g. "6 Days and 5 Nights".
      const durMatch = h1Text.match(/(\d+)\s*Days?\s*and\s*(\d+)\s*Nights?/i);
      const durationDays = durMatch ? parseInt(durMatch[1], 10) : NaN;
      const durationNights = durMatch ? parseInt(durMatch[2], 10) : NaN;

      const dest = matchDestination(h1Text);

      if (!validPrice(price) || !dest || !Number.isFinite(durationNights)) {
        log.warning(
          `[${SOURCE_KEY}] Skipping ${request.url} — price=${price} dest=${dest?.city} nights=${durationNights} (h1="${h1Text.slice(0, 120)}")`,
        );
      } else {
        // Clean description from the title h1 (strip the "Code .. $" price tail
        // and the star rating), DOM-derived.
        const description =
          h1Text
            .split("|")
            .map((s) => s.trim())
            .find((s) => /All Inclusive/i.test(s) && !/\$/.test(s)) ||
          h1Text.split("|")[0].trim() ||
          undefined;

        // Hero image: first CDN content photo (skip the logo PNG).
        let img: string | undefined;
        $("img").each((_i, el) => {
          if (img) return;
          const src = $(el).attr("src") || "";
          if (
            /irp\.cdn-website\.com/.test(src) &&
            /\.(jpe?g|png)/i.test(src) &&
            !/logo/i.test(src)
          ) {
            img = src;
          }
        });

        const title = `${dest.city} All-Inclusive Vacation Package — ${durationDays} Days / ${durationNights} Nights`;

        pending.push(
          storeDeal(
            {
              title,
              price,
              durationNights,
              durationDays,
              description: description?.slice(0, 500),
              city: dest.city,
              state: dest.state,
              country: dest.country,
              brandSlug: SOURCE_KEY,
              url: request.url,
              imageUrl: img,
              presentationMinutes: 90,
              requirements: ["Attend a ~90-minute vacation ownership seminar"],
            },
            SOURCE_KEY,
          ),
        );
        stored++;
      }

      await Promise.all(pending);
      if (stored === 0) {
        log.warning(`[${SOURCE_KEY}] No DOM-verified deal from ${request.url}`);
      } else {
        log.info(`[${SOURCE_KEY}] Stored ${stored} deal from ${request.url}`);
      }
    },
  });

  await crawler.run([{ url: BASE_URL, label: "LIST" }]);
}
