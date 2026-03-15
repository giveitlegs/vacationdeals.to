// ---------------------------------------------------------------------------
// Ping services for SEO indexing
// Notifies search engines and blog directories when new content is published.
// ---------------------------------------------------------------------------

const XMLRPC_SERVICES = [
  "http://rpc.pingomatic.com/",
  "http://ping.feedburner.com/",
  "http://blogsearch.google.com/ping/RPC2",
  "http://rpc.technorati.com/rpc/ping",
  "http://ping.blo.gs/",
  "http://rpc.weblogs.com/RPC2",
  "http://www.blogdigger.com/RPC2",
  "http://api.moreover.com/RPC2",
  "http://www.blogshares.com/rpc.php",
  "http://ping.weblogalive.com/rpc/",
];

/**
 * Send XML-RPC pings to major blog ping services.
 * Failures on individual services are silently ignored.
 */
export async function pingServices(
  url: string,
  title?: string,
): Promise<void> {
  const siteName = title || "VacationDeals.to";

  const promises = XMLRPC_SERVICES.map(async (service) => {
    try {
      const xmlBody = `<?xml version="1.0"?>
<methodCall>
  <methodName>weblogUpdates.ping</methodName>
  <params>
    <param><value>${siteName}</value></param>
    <param><value>${url}</value></param>
  </params>
</methodCall>`;

      await fetch(service, {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: xmlBody,
        signal: AbortSignal.timeout(5000),
      }).catch(() => {});
    } catch {
      // Ignore individual ping failures
    }
  });

  await Promise.allSettled(promises);
}

/**
 * Ping IndexNow API (Bing, Yandex, Seznam, Naver).
 * Submits up to 10,000 URLs in a single request.
 */
export async function pingIndexNow(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: "vacationdeals.to",
        key: "vacationdeals-indexnow-key",
        urlList: urls.slice(0, 10000),
      }),
      signal: AbortSignal.timeout(10000),
    }).catch(() => {});
  } catch {
    // Ignore failures
  }
}

/**
 * Ping Google with the sitemap URL to request re-crawl.
 */
export async function pingGoogle(
  sitemapUrl: string = "https://vacationdeals.to/sitemap.xml",
): Promise<void> {
  try {
    await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      {
        signal: AbortSignal.timeout(5000),
      },
    ).catch(() => {});
  } catch {
    // Ignore failures
  }
}
