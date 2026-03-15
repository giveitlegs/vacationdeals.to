/**
 * SEO Health Audit - runs every 48 hours via cron
 * Crawls all sitemap URLs, checks SEO elements, logs issues to DB
 *
 * Usage: npx tsx src/seo-audit.ts
 * No API keys required - pure fetch + HTML parsing + DB logging
 */

import * as cheerio from "cheerio";
import { db } from "@vacationdeals/db";
import { seoHealth } from "@vacationdeals/db";

const SITE_URL = "https://vacationdeals.to";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

// Rate limit: wait between fetches to avoid hammering own server
const DELAY_MS = 500;

interface SeoIssue {
  url: string;
  checkType: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  details?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Sitemap parsing
// ---------------------------------------------------------------------------

async function fetchSitemapUrls(): Promise<string[]> {
  console.log(`Fetching sitemap from ${SITEMAP_URL}...`);
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  const urls: string[] = [];
  $("url > loc").each((_, el) => {
    const loc = $(el).text().trim();
    if (loc) urls.push(loc);
  });
  console.log(`Found ${urls.length} URLs in sitemap`);
  return urls;
}

// ---------------------------------------------------------------------------
// SEO checks for a single page
// ---------------------------------------------------------------------------

async function auditPage(url: string): Promise<SeoIssue[]> {
  const issues: SeoIssue[] = [];

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "VacDeals-SEO-Audit/1.0" },
    });
  } catch (err: any) {
    issues.push({
      url,
      checkType: "status",
      severity: "critical",
      message: `Failed to fetch: ${err.message}`,
    });
    return issues;
  }

  // HTTP status check
  if (res.status >= 500) {
    issues.push({
      url,
      checkType: "status",
      severity: "critical",
      message: `Server error: HTTP ${res.status}`,
    });
    return issues; // No point parsing a 5xx response
  }

  if (res.status === 404) {
    issues.push({
      url,
      checkType: "status",
      severity: "critical",
      message: "Page not found (404)",
    });
    return issues;
  }

  if (res.status >= 300 && res.status < 400) {
    issues.push({
      url,
      checkType: "status",
      severity: "high",
      message: `Redirect detected: HTTP ${res.status}`,
      details: JSON.stringify({ location: res.headers.get("location") }),
    });
  }

  if (res.status !== 200) {
    issues.push({
      url,
      checkType: "status",
      severity: "high",
      message: `Unexpected status: HTTP ${res.status}`,
    });
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // ── Title tag ──────────────────────────────────────────
  const title = $("title").first().text().trim();
  if (!title) {
    issues.push({
      url,
      checkType: "title",
      severity: "critical",
      message: "Missing title tag",
    });
  } else {
    if (title.length > 60) {
      issues.push({
        url,
        checkType: "title",
        severity: "medium",
        message: `Title too long (${title.length} chars, max 60)`,
        details: JSON.stringify({ title }),
      });
    }
    if (title.length < 10) {
      issues.push({
        url,
        checkType: "title",
        severity: "medium",
        message: `Title too short (${title.length} chars)`,
        details: JSON.stringify({ title }),
      });
    }
  }

  // ── Meta description ───────────────────────────────────
  const metaDesc =
    $('meta[name="description"]').attr("content")?.trim() || "";
  if (!metaDesc) {
    issues.push({
      url,
      checkType: "meta",
      severity: "high",
      message: "Missing meta description",
    });
  } else {
    if (metaDesc.length < 100) {
      issues.push({
        url,
        checkType: "meta",
        severity: "medium",
        message: `Meta description too short (${metaDesc.length} chars, min 100)`,
        details: JSON.stringify({ metaDesc }),
      });
    }
    if (metaDesc.length > 160) {
      issues.push({
        url,
        checkType: "meta",
        severity: "medium",
        message: `Meta description too long (${metaDesc.length} chars, max 160)`,
        details: JSON.stringify({ metaDesc }),
      });
    }
  }

  // ── Canonical URL ──────────────────────────────────────
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() || "";
  if (!canonical) {
    issues.push({
      url,
      checkType: "canonical",
      severity: "high",
      message: "Missing canonical URL",
    });
  } else if (canonical !== url && canonical !== url.replace(/\/$/, "")) {
    issues.push({
      url,
      checkType: "canonical",
      severity: "medium",
      message: "Canonical URL does not match page URL",
      details: JSON.stringify({ canonical, expected: url }),
    });
  }

  // ── og:image ───────────────────────────────────────────
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim() || "";
  if (!ogImage) {
    issues.push({
      url,
      checkType: "meta",
      severity: "medium",
      message: "Missing og:image",
    });
  }

  // ── H1 tag ─────────────────────────────────────────────
  const h1Count = $("h1").length;
  if (h1Count === 0) {
    issues.push({
      url,
      checkType: "title",
      severity: "high",
      message: "No H1 tag found",
    });
  } else if (h1Count > 1) {
    issues.push({
      url,
      checkType: "title",
      severity: "medium",
      message: `Multiple H1 tags found (${h1Count})`,
    });
  }

  // ── Schema.org JSON-LD ─────────────────────────────────
  const jsonLdScripts = $('script[type="application/ld+json"]');
  if (jsonLdScripts.length === 0) {
    issues.push({
      url,
      checkType: "schema",
      severity: "high",
      message: "No Schema.org JSON-LD found",
    });
  } else {
    jsonLdScripts.each((_, el) => {
      const content = $(el).html()?.trim() || "";
      try {
        JSON.parse(content);
      } catch {
        issues.push({
          url,
          checkType: "schema",
          severity: "high",
          message: "Invalid JSON-LD (parse error)",
          details: JSON.stringify({ snippet: content.slice(0, 200) }),
        });
      }
    });
  }

  // ── Image alt text ─────────────────────────────────────
  const imgsWithoutAlt: string[] = [];
  $("img").each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt === "") {
      const src = $(el).attr("src") || $(el).attr("data-src") || "unknown";
      imgsWithoutAlt.push(src);
    }
  });
  if (imgsWithoutAlt.length > 0) {
    issues.push({
      url,
      checkType: "alt",
      severity: "medium",
      message: `${imgsWithoutAlt.length} image(s) missing alt text`,
      details: JSON.stringify({ images: imgsWithoutAlt.slice(0, 10) }),
    });
  }

  // ── Internal broken links ──────────────────────────────
  const internalLinks = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.startsWith("/") && !href.startsWith("//")) {
      internalLinks.add(`${SITE_URL}${href}`);
    } else if (href.startsWith(SITE_URL)) {
      internalLinks.add(href);
    }
  });

  // Check up to 20 internal links per page (to avoid excessive requests)
  const linksToCheck = Array.from(internalLinks).slice(0, 20);
  for (const link of linksToCheck) {
    try {
      const linkRes = await fetch(link, {
        method: "HEAD",
        redirect: "follow",
        headers: { "User-Agent": "VacDeals-SEO-Audit/1.0" },
      });
      if (linkRes.status === 404) {
        issues.push({
          url,
          checkType: "link",
          severity: "high",
          message: `Broken internal link: ${link} (404)`,
          details: JSON.stringify({ brokenLink: link }),
        });
      }
    } catch {
      // Network error checking link - not critical
    }
    await sleep(100); // Small delay between link checks
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== SEO Health Audit ===");
  console.log(`Started at ${new Date().toISOString()}\n`);

  const urls = await fetchSitemapUrls();

  let totalIssues = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const url of urls) {
    console.log(`Auditing: ${url}`);
    const issues = await auditPage(url);

    if (issues.length > 0) {
      // Insert all issues for this page
      for (const issue of issues) {
        await db.insert(seoHealth).values({
          url: issue.url,
          checkType: issue.checkType,
          severity: issue.severity,
          message: issue.message,
          details: issue.details || null,
        });

        totalIssues++;
        switch (issue.severity) {
          case "critical":
            criticalCount++;
            break;
          case "high":
            highCount++;
            break;
          case "medium":
            mediumCount++;
            break;
          case "low":
            lowCount++;
            break;
        }
      }

      console.log(`  -> ${issues.length} issue(s) found`);
    } else {
      console.log(`  -> OK`);
    }

    await sleep(DELAY_MS);
  }

  // Print summary
  console.log("\n=== Audit Summary ===");
  console.log(`Pages checked: ${urls.length}`);
  console.log(`Total issues: ${totalIssues}`);
  console.log(`  Critical: ${criticalCount}`);
  console.log(`  High:     ${highCount}`);
  console.log(`  Medium:   ${mediumCount}`);
  console.log(`  Low:      ${lowCount}`);

  if (criticalCount > 0) {
    console.log(
      `\n[ALERT] ${criticalCount} critical issue(s) detected! Consider investigating immediately.`
    );
    // Optionally ping the alert API
    try {
      await fetch(`${SITE_URL}/api/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: [SITE_URL],
          title: `SEO Audit Alert: ${criticalCount} critical issues found`,
        }),
      });
    } catch {
      // Fire and forget
    }
  }

  console.log(`\nCompleted at ${new Date().toISOString()}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("SEO audit failed:", err);
  process.exit(1);
});
