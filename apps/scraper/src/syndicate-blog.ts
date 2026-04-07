/**
 * Blog Syndication Script — auto-posts new blog posts to social platforms.
 * Run after blog seeding to syndicate new posts.
 *
 * Platforms:
 * - Dev.to (DEV_TO_API_KEY) — full article with canonical URL
 * - X/Twitter (X_API_KEY + friends) — title + link tweet
 * - Hashnode (HASHNODE_TOKEN) — full article with canonical
 * - IndexNow — ping search engines about new blog URLs
 *
 * Usage: npx tsx src/syndicate-blog.ts
 * Cron: Run after blog seed completes
 */

const SITE_URL = "https://vacationdeals.to";

// Track what's been syndicated to avoid duplicates
import * as fs from "fs";
import * as path from "path";

const STORAGE_DIR = path.join(__dirname, "../storage");
const SYNDICATED_FILE = path.join(STORAGE_DIR, "syndicated-posts.json");

interface SyndicatedRecord {
  slug: string;
  devto?: string;
  hashnode?: string;
  x?: string;
  syndicatedAt: string;
}

function loadSyndicated(): Record<string, SyndicatedRecord> {
  try {
    if (fs.existsSync(SYNDICATED_FILE)) {
      return JSON.parse(fs.readFileSync(SYNDICATED_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function saveSyndicated(records: Record<string, SyndicatedRecord>) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  fs.writeFileSync(SYNDICATED_FILE, JSON.stringify(records, null, 2));
}

// ---------------------------------------------------------------------------
// Dev.to API — free, no approval needed, canonical URLs supported
// ---------------------------------------------------------------------------

async function postToDevTo(
  title: string,
  slug: string,
  content: string,
  tags: string[],
): Promise<string | null> {
  const apiKey = process.env.DEV_TO_API_KEY;
  if (!apiKey) return null;

  // Strip HTML to markdown-ish (Dev.to accepts HTML too)
  const body = `*This article was originally published on [VacationDeals.to](${SITE_URL}/${slug}).*\n\n---\n\n${content}\n\n---\n\n*Find more vacation deals at [VacationDeals.to](${SITE_URL})*`;

  try {
    const res = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        article: {
          title,
          body_markdown: body,
          published: true,
          canonical_url: `${SITE_URL}/${slug}`,
          tags: tags.slice(0, 4), // Dev.to allows max 4 tags
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`  Dev.to: Published → ${data.url}`);
      return data.url;
    }

    const err = await res.text();
    if (err.includes("already been taken")) {
      console.log(`  Dev.to: Already exists (skipping)`);
      return "EXISTS";
    }
    console.error(`  Dev.to: ${res.status} — ${err}`);
  } catch (err: any) {
    console.error(`  Dev.to: ${err.message}`);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Hashnode API (GraphQL) — free, canonical URLs supported
// ---------------------------------------------------------------------------

async function postToHashnode(
  title: string,
  slug: string,
  content: string,
  tags: string[],
): Promise<string | null> {
  const token = process.env.HASHNODE_TOKEN;
  const pubId = process.env.HASHNODE_PUBLICATION_ID;
  if (!token || !pubId) return null;

  const mutation = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        post { url }
      }
    }
  `;

  try {
    const res = await fetch("https://gql.hashnode.com", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            title,
            contentMarkdown: content,
            publicationId: pubId,
            originalArticleURL: `${SITE_URL}/${slug}`,
            tags: tags.slice(0, 5).map((t) => ({ name: t, slug: t.toLowerCase().replace(/\s+/g, "-") })),
          },
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const url = data?.data?.createPost?.post?.url;
      if (url) {
        console.log(`  Hashnode: Published → ${url}`);
        return url;
      }
    }
    console.error(`  Hashnode: ${res.status}`);
  } catch (err: any) {
    console.error(`  Hashnode: ${err.message}`);
  }
  return null;
}

// ---------------------------------------------------------------------------
// X/Twitter API v2 — requires developer account (free tier: 1,500 tweets/month)
// ---------------------------------------------------------------------------

async function postToX(title: string, slug: string): Promise<string | null> {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;
  if (!apiKey || !apiSecret || !accessToken || !accessSecret) return null;

  const crypto = await import("crypto");
  const url = `${SITE_URL}/${slug}`;
  const text = `${title}\n\n${url}\n\n#VacationDeals #Travel`;

  const endpoint = "https://api.twitter.com/2/tweets";
  const oauth: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const params = new URLSearchParams(Object.entries(oauth).sort());
  const baseString = `POST&${encodeURIComponent(endpoint)}&${encodeURIComponent(params.toString())}`;
  const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  const authHeader = `OAuth ${Object.entries({ ...oauth, oauth_signature: signature })
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(", ")}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const data = await res.json();
      const tweetUrl = `https://x.com/GiveitL/status/${data.data?.id}`;
      console.log(`  X: Posted → ${tweetUrl}`);
      return tweetUrl;
    }
    console.error(`  X: ${res.status}`);
  } catch (err: any) {
    console.error(`  X: ${err.message}`);
  }
  return null;
}

// ---------------------------------------------------------------------------
// IndexNow ping for new blog URLs
// ---------------------------------------------------------------------------

async function pingIndexNow(urls: string[]) {
  if (urls.length === 0) return;

  const body = JSON.stringify({
    host: "vacationdeals.to",
    key: "vacationdeals",
    keyLocation: `${SITE_URL}/vacationdeals-indexnow-key.txt`,
    urlList: urls,
  });

  const endpoints = [
    "https://www.bing.com/indexnow",
    "https://yandex.com/indexnow",
    "https://searchadvisor.naver.com/indexnow",
  ];

  for (const ep of endpoints) {
    try {
      await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
    } catch {}
  }
  console.log(`  IndexNow: Pinged ${urls.length} URLs to 3 engines`);
}

// ---------------------------------------------------------------------------
// Main — fetch blog posts and syndicate new ones
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Blog Syndication ===");
  console.log(`Started at ${new Date().toISOString()}\n`);

  // Load blog posts from the site API
  let posts: Array<{ slug: string; title: string; content: string; tags: string[]; bluf: string }> = [];
  try {
    const res = await fetch(`${SITE_URL}/api/deals`); // We need a blog API endpoint
    // For now, load from the local TypeScript files
    console.log("Loading blog posts from local files...");

    // Dynamically import all blog post files
    const blogTypes = await import("../../apps/web/src/lib/blog-types");
    const allPosts = await blogTypes.getAllBlogPosts();
    posts = allPosts.map((p: any) => ({
      slug: p.slug,
      title: p.title,
      content: p.content,
      tags: p.tags || [],
      bluf: p.bluf || "",
    }));
  } catch (err: any) {
    console.error(`Failed to load posts: ${err.message}`);
    process.exit(1);
  }

  console.log(`Found ${posts.length} blog posts\n`);

  const syndicated = loadSyndicated();
  const newUrls: string[] = [];
  let newCount = 0;

  for (const post of posts) {
    // Skip already-syndicated posts
    if (syndicated[post.slug]) continue;

    newCount++;
    console.log(`[${newCount}] ${post.title}`);

    const record: SyndicatedRecord = {
      slug: post.slug,
      syndicatedAt: new Date().toISOString(),
    };

    // Post to each platform
    const devtoUrl = await postToDevTo(post.title, post.slug, post.content, post.tags);
    if (devtoUrl) record.devto = devtoUrl;

    const hashnodeUrl = await postToHashnode(post.title, post.slug, post.content, post.tags);
    if (hashnodeUrl) record.hashnode = hashnodeUrl;

    const xUrl = await postToX(post.title, post.slug);
    if (xUrl) record.x = xUrl;

    syndicated[post.slug] = record;
    newUrls.push(`${SITE_URL}/${post.slug}`);

    // Rate limit between posts
    await new Promise((r) => setTimeout(r, 2000));

    // Save progress after each post (in case of crash)
    saveSyndicated(syndicated);
  }

  // Ping IndexNow with all new blog URLs
  if (newUrls.length > 0) {
    await pingIndexNow(newUrls);
  }

  console.log(`\n=== Summary ===`);
  console.log(`New posts syndicated: ${newCount}`);
  console.log(`Total syndicated: ${Object.keys(syndicated).length}`);
  console.log(`Completed at ${new Date().toISOString()}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Syndication failed:", err);
  process.exit(1);
});
