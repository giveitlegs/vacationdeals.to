/**
 * Google Search Console Index Monitor
 * Checks which pages are indexed vs not, logs results.
 *
 * Requires: GOOGLE_SERVICE_ACCOUNT_JSON env var (path to service account key file)
 * The service account must be added as a user in Google Search Console.
 *
 * Usage: npx tsx src/gsc-monitor.ts
 * Cron: Run weekly to track indexing progress.
 *
 * Setup steps:
 * 1. Go to Google Cloud Console → Create project
 * 2. Enable "Google Search Console API"
 * 3. Create Service Account → Download JSON key
 * 4. In Google Search Console → Settings → Users and permissions → Add the service account email
 * 5. Set GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/key.json
 */

const SITE_URL = "https://vacationdeals.to";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

async function fetchSitemapUrls(): Promise<string[]> {
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) return [];
  const xml = await res.text();
  const urls: string[] = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

async function getAccessToken(keyPath: string): Promise<string | null> {
  try {
    const fs = await import("fs");
    const crypto = await import("crypto");

    const keyFile = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
    const now = Math.floor(Date.now() / 1000);

    // Create JWT
    const header = Buffer.from(JSON.stringify({
      alg: "RS256",
      typ: "JWT",
    })).toString("base64url");

    const claim = Buffer.from(JSON.stringify({
      iss: keyFile.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })).toString("base64url");

    const signature = crypto.createSign("RSA-SHA256")
      .update(`${header}.${claim}`)
      .sign(keyFile.private_key, "base64url");

    const jwt = `${header}.${claim}.${signature}`;

    // Exchange JWT for access token
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
    });

    if (!res.ok) {
      console.error(`Token exchange failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data.access_token;
  } catch (err: any) {
    console.error(`Auth failed: ${err.message}`);
    return null;
  }
}

async function inspectUrl(
  url: string,
  accessToken: string,
): Promise<{ indexed: boolean; verdict?: string; lastCrawl?: string }> {
  try {
    const res = await fetch(
      "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inspectionUrl: url,
          siteUrl: SITE_URL,
        }),
      },
    );

    if (res.status === 429) {
      return { indexed: false, verdict: "RATE_LIMITED" };
    }

    if (!res.ok) {
      return { indexed: false, verdict: `HTTP_${res.status}` };
    }

    const data = await res.json();
    const result = data.inspectionResult?.indexStatusResult;

    return {
      indexed: result?.verdict === "PASS",
      verdict: result?.verdict || "UNKNOWN",
      lastCrawl: result?.lastCrawlTime || undefined,
    };
  } catch (err: any) {
    return { indexed: false, verdict: `ERROR: ${err.message}` };
  }
}

async function main() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!keyPath) {
    console.error("GOOGLE_SERVICE_ACCOUNT_JSON env var not set.");
    console.log("Set it to the path of your Google Cloud service account JSON key file.");
    process.exit(1);
  }

  console.log("=== Google Search Console Index Monitor ===");
  console.log(`Started at ${new Date().toISOString()}\n`);

  const accessToken = await getAccessToken(keyPath);
  if (!accessToken) {
    console.error("Failed to get access token.");
    process.exit(1);
  }

  const urls = await fetchSitemapUrls();
  console.log(`Found ${urls.length} URLs in sitemap\n`);

  // GSC URL Inspection API has a quota of ~2000 requests/day
  const maxChecks = Math.min(urls.length, 100); // Check up to 100 per run
  const urlsToCheck = urls.slice(0, maxChecks);

  let indexed = 0;
  let notIndexed = 0;
  const issues: { url: string; verdict: string }[] = [];

  for (let i = 0; i < urlsToCheck.length; i++) {
    const url = urlsToCheck[i];
    process.stdout.write(`[${i + 1}/${maxChecks}] ${url.replace(SITE_URL, "")}... `);

    const result = await inspectUrl(url, accessToken);

    if (result.verdict === "RATE_LIMITED") {
      console.log("RATE LIMITED — stopping");
      break;
    }

    if (result.indexed) {
      console.log(`INDEXED ${result.lastCrawl ? `(last crawl: ${result.lastCrawl})` : ""}`);
      indexed++;
    } else {
      console.log(`NOT INDEXED (${result.verdict})`);
      notIndexed++;
      issues.push({ url, verdict: result.verdict || "UNKNOWN" });
    }

    // Rate limit: 1 second between requests
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\n=== Index Coverage Report ===");
  console.log(`Checked:     ${indexed + notIndexed} of ${urls.length}`);
  console.log(`Indexed:     ${indexed}`);
  console.log(`Not indexed: ${notIndexed}`);

  if (issues.length > 0) {
    console.log("\n--- Pages Not Indexed ---");
    for (const issue of issues) {
      console.log(`  ${issue.url} — ${issue.verdict}`);
    }
  }

  console.log(`\nCompleted at ${new Date().toISOString()}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("GSC monitor failed:", err);
  process.exit(1);
});
