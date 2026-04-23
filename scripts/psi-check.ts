/**
 * Hit PageSpeed Insights for a curated set of URLs and store results in cwv_results.
 *
 * The PSI API is free for anonymous use (25k queries/day) but rate-limits hard at
 * roughly 10 req/sec. We throttle to 1 req/sec and run mobile+desktop sequentially.
 *
 * Run: npx tsx scripts/psi-check.ts
 *      PSI_API_KEY=... npx tsx scripts/psi-check.ts         # higher quota
 *      npx tsx scripts/psi-check.ts --urls=https://...      # override URL list
 */

import { db, cwvResults } from "@vacationdeals/db";

const API_KEY = process.env.PSI_API_KEY || process.env.GOOGLE_API_KEY || "";

const DEFAULT_URLS = [
  // Top entry pages
  "https://vacationdeals.to/",
  "https://vacationdeals.to/deals",
  "https://vacationdeals.to/destinations",
  "https://vacationdeals.to/brands",
  // Top destinations (traffic drivers)
  "https://vacationdeals.to/orlando",
  "https://vacationdeals.to/las-vegas",
  "https://vacationdeals.to/cancun",
  "https://vacationdeals.to/gatlinburg",
  "https://vacationdeals.to/myrtle-beach",
  // Top brands
  "https://vacationdeals.to/westgate",
  "https://vacationdeals.to/hgv",
  // Top sublanders (high-intent keywords)
  "https://vacationdeals.to/orlando-for-families",
  "https://vacationdeals.to/las-vegas-under-199",
  // Listicles
  "https://vacationdeals.to/best-vacation-deals-orlando-2026",
  // Deal detail (pick a stable one — homepage first-deal will change)
  "https://vacationdeals.to/deals",
];

interface PsiResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score: number | null };
      accessibility?: { score: number | null };
      "best-practices"?: { score: number | null };
      seo?: { score: number | null };
    };
    audits?: {
      "largest-contentful-paint"?: { numericValue?: number };
      "cumulative-layout-shift"?: { numericValue?: number };
      "interaction-to-next-paint"?: { numericValue?: number };
      "first-contentful-paint"?: { numericValue?: number };
      "server-response-time"?: { numericValue?: number };
    };
  };
  error?: { message: string };
}

async function checkPsi(url: string, strategy: "mobile" | "desktop"): Promise<void> {
  const params = new URLSearchParams({
    url,
    strategy,
    category: "performance",
  });
  // Include extra categories on one of the runs (keeps calls light)
  if (strategy === "mobile") {
    params.append("category", "accessibility");
    params.append("category", "best-practices");
    params.append("category", "seo");
  }
  if (API_KEY) params.set("key", API_KEY);

  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`;

  try {
    const res = await fetch(endpoint);
    const json: PsiResponse = await res.json();

    if (json.error || !json.lighthouseResult) {
      console.log(`[${strategy}] ${url} - ERROR: ${json.error?.message ?? "no lighthouseResult"}`);
      await db.insert(cwvResults).values({
        url,
        strategy,
        errorMessage: json.error?.message ?? "no lighthouseResult",
      });
      return;
    }

    const cats = json.lighthouseResult.categories ?? {};
    const audits = json.lighthouseResult.audits ?? {};
    const score = (v: number | null | undefined) => (v == null ? null : Math.round(v * 100));
    const ms = (v: number | undefined) => (v == null ? null : v.toFixed(2));

    await db.insert(cwvResults).values({
      url,
      strategy,
      lcp: ms(audits["largest-contentful-paint"]?.numericValue),
      cls: audits["cumulative-layout-shift"]?.numericValue != null
        ? audits["cumulative-layout-shift"]!.numericValue!.toFixed(4)
        : null,
      inp: ms(audits["interaction-to-next-paint"]?.numericValue),
      fcp: ms(audits["first-contentful-paint"]?.numericValue),
      ttfb: ms(audits["server-response-time"]?.numericValue),
      performanceScore: score(cats.performance?.score),
      accessibilityScore: score(cats.accessibility?.score),
      bestPracticesScore: score(cats["best-practices"]?.score),
      seoScore: score(cats.seo?.score),
    });

    console.log(`[${strategy}] ${url} - perf=${score(cats.performance?.score)} LCP=${ms(audits["largest-contentful-paint"]?.numericValue)}ms CLS=${audits["cumulative-layout-shift"]?.numericValue?.toFixed(3)}`);
  } catch (e) {
    console.log(`[${strategy}] ${url} - FETCH ERROR: ${(e as Error).message}`);
    await db.insert(cwvResults).values({
      url,
      strategy,
      errorMessage: `Fetch error: ${(e as Error).message}`,
    });
  }
}

async function main() {
  const urlsArg = process.argv.find((a) => a.startsWith("--urls="));
  const urls = urlsArg ? urlsArg.split("=")[1].split(",") : DEFAULT_URLS;

  console.log(`PSI checking ${urls.length} URLs x 2 strategies = ${urls.length * 2} calls`);
  console.log(`API key: ${API_KEY ? "set" : "not set (anonymous quota)"}`);

  for (const url of urls) {
    for (const strategy of ["mobile", "desktop"] as const) {
      await checkPsi(url, strategy);
      await new Promise((r) => setTimeout(r, 1100)); // gentle throttle
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
