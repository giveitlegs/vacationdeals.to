/**
 * Social Auto-Posting — posts new/updated deals to social platforms.
 * Runs after scraper waves complete.
 *
 * Supported platforms (requires env vars):
 * - X/Twitter: X_BEARER_TOKEN, X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
 * - WebSub: No auth needed (pings Google's hub)
 *
 * Usage: npx tsx src/social-post.ts
 */

const SITE_URL = "https://vacationdeals.to";
const FEED_URL = `${SITE_URL}/feed.xml`;
const WEBSUB_HUB = "https://pubsubhubbub.appspot.com/";

// ---------------------------------------------------------------------------
// WebSub ping — notify Google's hub that our feed updated
// ---------------------------------------------------------------------------

async function pingWebSub(): Promise<void> {
  try {
    const res = await fetch(WEBSUB_HUB, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        "hub.mode": "publish",
        "hub.url": FEED_URL,
      }).toString(),
    });
    console.log(`WebSub ping: ${res.ok ? "OK" : `FAILED (${res.status})`}`);
  } catch (err: any) {
    console.error("WebSub ping failed:", err.message);
  }
}

// ---------------------------------------------------------------------------
// IndexNow fan-out — notify all 5 search engines
// ---------------------------------------------------------------------------

const INDEXNOW_ENDPOINTS = [
  { name: "Bing", url: "https://www.bing.com/indexnow" },
  { name: "Yandex", url: "https://yandex.com/indexnow" },
  { name: "Naver", url: "https://searchadvisor.naver.com/indexnow" },
  { name: "Seznam", url: "https://search.seznam.cz/indexnow" },
  { name: "Yep", url: "https://indexnow.yep.com/indexnow" },
];

async function pingIndexNow(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  const body = JSON.stringify({
    host: "vacationdeals.to",
    key: "vacationdeals",
    keyLocation: `${SITE_URL}/vacationdeals-indexnow-key.txt`,
    urlList: urls.slice(0, 10000), // IndexNow accepts up to 10K
  });

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      console.log(`IndexNow ${endpoint.name}: ${res.ok ? "OK" : `${res.status}`}`);
    } catch (err: any) {
      console.error(`IndexNow ${endpoint.name}: ${err.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// X/Twitter posting (v2 API, free tier: 1,500 tweets/month)
// ---------------------------------------------------------------------------

async function postToX(text: string): Promise<void> {
  const bearerToken = process.env.X_BEARER_TOKEN;
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.log("X/Twitter: Skipping (API keys not configured)");
    return;
  }

  try {
    // Use OAuth 1.0a User Context for posting
    // For simplicity, use the v2 tweet endpoint with Bearer token
    // Note: Free tier requires OAuth 1.0a, not app-only Bearer
    const { default: crypto } = await import("crypto");

    const oauth = {
      oauth_consumer_key: apiKey,
      oauth_nonce: crypto.randomBytes(16).toString("hex"),
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: accessToken,
      oauth_version: "1.0",
    };

    // Create signature base string
    const endpoint = "https://api.twitter.com/2/tweets";
    const params = new URLSearchParams(Object.entries(oauth).sort());
    const baseString = `POST&${encodeURIComponent(endpoint)}&${encodeURIComponent(params.toString())}`;
    const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`;
    const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

    const authHeader = `OAuth ${Object.entries({ ...oauth, oauth_signature: signature })
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`X/Twitter: Posted tweet ${data.data?.id}`);
    } else {
      const err = await res.text();
      console.error(`X/Twitter: ${res.status} — ${err}`);
    }
  } catch (err: any) {
    console.error(`X/Twitter: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Fetch latest deals for social posting
// ---------------------------------------------------------------------------

async function getLatestDeals(): Promise<Array<{
  title: string;
  price: number;
  brand: string;
  city: string;
  slug: string;
  nights: number;
}>> {
  try {
    const res = await fetch(`${SITE_URL}/api/deals?limit=5&sortBy=price-asc`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.deals || []).map((d: any) => ({
      title: d.title,
      price: d.price,
      brand: d.brandName,
      city: d.city,
      slug: d.slug,
      nights: d.durationNights,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Social + Indexing Post-Scrape ===");
  console.log(`Started at ${new Date().toISOString()}\n`);

  // 1. Ping WebSub
  await pingWebSub();

  // 2. Ping IndexNow with key pages
  const keyUrls = [
    `${SITE_URL}/`,
    `${SITE_URL}/deals`,
    `${SITE_URL}/rate-recap`,
    `${SITE_URL}/feed.xml`,
    `${SITE_URL}/blog`,
  ];
  await pingIndexNow(keyUrls);

  // 3. Post top deal to X/Twitter (if configured)
  const deals = await getLatestDeals();
  if (deals.length > 0) {
    const d = deals[0];
    const tweet = `${d.brand} has a ${d.nights}-night vacation deal in ${d.city} for just $${d.price}! \n\nBrowse more: ${SITE_URL}/deals/${d.slug}\n\n#VacationDeals #Travel #${d.city.replace(/\s/g, "")}`;
    await postToX(tweet);
  }

  console.log(`\nCompleted at ${new Date().toISOString()}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Social posting failed:", err);
  process.exit(1);
});
