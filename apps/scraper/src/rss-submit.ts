/**
 * RSS Auto-Submission - runs every 48 hours via cron
 * Submits the site's RSS feed URL to directories that accept automated submissions.
 *
 * Usage: npx tsx src/rss-submit.ts
 * No API keys required - pure HTTP requests.
 */

const FEED_URL = "https://vacationdeals.to/feed.xml";
const SITE_URL = "https://vacationdeals.to";
const SITE_TITLE = "VacationDeals.to - Best Vacation Deals & Packages";

// Rate limit: 1 request per second
const DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Directories that accept automated GET/POST submissions
// Many RSS directories require manual signup, so we focus on those that
// accept a feed URL via query parameter or simple POST.
// ---------------------------------------------------------------------------

interface RssTarget {
  name: string;
  /** The URL to hit. Use {{FEED_URL}} as placeholder for the feed URL. */
  url: string;
  method: "GET" | "POST" | "XML-RPC";
  /** For POST, form body key-value pairs */
  body?: Record<string, string>;
}

const SUBMITTABLE_TARGETS: RssTarget[] = [
  // ── WebSub / PubSubHubbub ──
  // Notifies Google's hub when our RSS updates — subscribers get pinged instantly
  {
    name: "WebSub (Google Hub)",
    url: "https://pubsubhubbub.appspot.com/",
    method: "POST",
    body: { "hub.mode": "publish", "hub.url": FEED_URL },
  },
  // ── IndexNow fan-out to all 5 engines ──
  {
    name: "IndexNow (Bing)",
    url: `https://www.bing.com/indexnow?url=${encodeURIComponent(FEED_URL)}&key=vacationdeals`,
    method: "GET",
  },
  {
    name: "IndexNow (Yandex)",
    url: `https://yandex.com/indexnow?url=${encodeURIComponent(FEED_URL)}&key=vacationdeals`,
    method: "GET",
  },
  {
    name: "IndexNow (Naver)",
    url: `https://searchadvisor.naver.com/indexnow?url=${encodeURIComponent(FEED_URL)}&key=vacationdeals`,
    method: "GET",
  },
  {
    name: "IndexNow (Seznam)",
    url: `https://search.seznam.cz/indexnow?url=${encodeURIComponent(FEED_URL)}&key=vacationdeals`,
    method: "GET",
  },
  {
    name: "IndexNow (Yep)",
    url: `https://indexnow.yep.com/indexnow?url=${encodeURIComponent(FEED_URL)}&key=vacationdeals`,
    method: "GET",
  },
  // ── Feed directories ──
  {
    name: "Feedly",
    url: `https://feedly.com/i/discover/sources/search/feed/${encodeURIComponent(FEED_URL)}`,
    method: "GET",
  },
  {
    name: "W3C Feed Validator",
    url: `https://validator.w3.org/feed/check.cgi?url=${encodeURIComponent(FEED_URL)}`,
    method: "GET",
  },
  {
    name: "Plazoo",
    url: `https://www.plazoo.com/en/addfeed.asp?url=${encodeURIComponent(FEED_URL)}`,
    method: "GET",
  },
  // ── XML-RPC pings (live services only) ──
  {
    name: "Ping-o-Matic",
    url: "http://rpc.pingomatic.com/",
    method: "XML-RPC",
  },
  {
    name: "Weblogs.com",
    url: "http://rpc.weblogs.com/RPC2",
    method: "XML-RPC",
  },
  {
    name: "Twingly",
    url: "https://ping.twingly.com/RPC2",
    method: "XML-RPC",
  },
  {
    name: "Blo.gs",
    url: "http://ping.blo.gs/",
    method: "XML-RPC",
  },
];

// ---------------------------------------------------------------------------
// XML-RPC ping payload (weblogUpdates.ping)
// ---------------------------------------------------------------------------

function buildXmlRpcPing(): string {
  return `<?xml version="1.0"?>
<methodCall>
  <methodName>weblogUpdates.ping</methodName>
  <params>
    <param><value><string>${SITE_TITLE}</string></value></param>
    <param><value><string>${SITE_URL}</string></value></param>
    <param><value><string>${FEED_URL}</string></value></param>
  </params>
</methodCall>`;
}

// ---------------------------------------------------------------------------
// Submit to a single target
// ---------------------------------------------------------------------------

async function submitToTarget(
  target: RssTarget
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    if (target.method === "XML-RPC") {
      const res = await fetch(target.url, {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: buildXmlRpcPing(),
      });
      return { success: res.ok, status: res.status };
    }

    if (target.method === "POST" && target.body) {
      const formData = new URLSearchParams(target.body);
      const res = await fetch(target.url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      return { success: res.ok, status: res.status };
    }

    // GET request
    const res = await fetch(target.url, {
      headers: { "User-Agent": "VacDeals-RSS-Submit/1.0" },
    });
    return { success: res.ok, status: res.status };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== RSS Feed Auto-Submission ===");
  console.log(`Feed URL: ${FEED_URL}`);
  console.log(`Started at ${new Date().toISOString()}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const target of SUBMITTABLE_TARGETS) {
    process.stdout.write(`Submitting to ${target.name}... `);
    const result = await submitToTarget(target);

    if (result.success) {
      console.log(`OK (${result.status})`);
      successCount++;
    } else {
      console.log(
        `FAILED (${result.status || "N/A"})${result.error ? ` - ${result.error}` : ""}`
      );
      failCount++;
    }

    await sleep(DELAY_MS);
  }

  console.log("\n=== Submission Summary ===");
  console.log(`Total targets: ${SUBMITTABLE_TARGETS.length}`);
  console.log(`Successful:    ${successCount}`);
  console.log(`Failed:        ${failCount}`);
  console.log(`\nCompleted at ${new Date().toISOString()}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("RSS submission failed:", err);
  process.exit(1);
});
