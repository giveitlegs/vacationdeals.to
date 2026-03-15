/**
 * Bing URL Submission API
 * Submits URLs directly to Bing's index (up to 10,000/day)
 * Uses API key from Bing Webmaster Tools
 *
 * Note: Requires BING_API_KEY env var (not yet configured)
 * For now, this module is ready but inactive until the user
 * creates a Bing Webmaster Tools account and generates an API key
 */

export async function submitUrlsToBing(urls: string[]): Promise<void> {
  const apiKey = process.env.BING_API_KEY;
  if (!apiKey) {
    console.log("[bing] BING_API_KEY not set, skipping URL submission");
    return;
  }

  try {
    const response = await fetch(
      "https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl: "https://vacationdeals.to",
          urlList: urls.slice(0, 500), // Max 500 per batch
        }),
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      console.error(
        `[bing] Submission failed with status ${response.status}: ${response.statusText}`,
      );
      return;
    }

    console.log(`[bing] Submitted ${Math.min(urls.length, 500)} URLs`);
  } catch (e) {
    console.error("[bing] Submission failed:", e);
  }
}
