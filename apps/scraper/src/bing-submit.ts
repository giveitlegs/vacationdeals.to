/**
 * Bing URL Submission API — pushes up to 10,000 URLs/day for free.
 * Requires a Bing Webmaster Tools API key in BING_API_KEY env var.
 *
 * Usage: npx tsx src/bing-submit.ts
 * Cron: Run daily after scraper waves complete.
 */

const SITE_URL = "https://vacationdeals.to";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const BATCH_SIZE = 500; // Bing accepts up to 500 per request

async function fetchSitemapUrls(): Promise<string[]> {
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) {
    console.error(`Failed to fetch sitemap: ${res.status}`);
    return [];
  }
  const xml = await res.text();
  // Extract all <loc> URLs from sitemap
  const urls: string[] = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

async function submitBatch(urls: string[], apiKey: string): Promise<{ submitted: number; error?: string }> {
  const endpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlBatch?apikey=${apiKey}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      siteUrl: SITE_URL,
      urlList: urls,
    }),
  });

  if (res.ok) {
    return { submitted: urls.length };
  }

  const text = await res.text();
  return { submitted: 0, error: `${res.status}: ${text}` };
}

async function main() {
  const apiKey = process.env.BING_API_KEY;
  if (!apiKey) {
    console.error("BING_API_KEY env var not set. Get it from Bing Webmaster Tools.");
    console.log("Steps: Go to https://www.bing.com/webmasters → Settings → API Access → API Key");
    process.exit(1);
  }

  console.log("=== Bing URL Submission ===");
  console.log(`Started at ${new Date().toISOString()}\n`);

  const urls = await fetchSitemapUrls();
  console.log(`Found ${urls.length} URLs in sitemap\n`);

  if (urls.length === 0) {
    console.log("No URLs to submit.");
    process.exit(0);
  }

  let totalSubmitted = 0;
  let totalFailed = 0;

  // Submit in batches of 500
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    process.stdout.write(`Submitting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} URLs)... `);

    const result = await submitBatch(batch, apiKey);
    if (result.error) {
      console.log(`FAILED — ${result.error}`);
      totalFailed += batch.length;
    } else {
      console.log(`OK (${result.submitted} submitted)`);
      totalSubmitted += result.submitted;
    }

    // Rate limit: 1 second between batches
    if (i + BATCH_SIZE < urls.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Submitted: ${totalSubmitted}`);
  console.log(`Failed:    ${totalFailed}`);
  console.log(`Completed at ${new Date().toISOString()}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Bing submission failed:", err);
  process.exit(1);
});
