/**
 * Medium Content Syndication — auto-republishes blog posts to Medium
 * with canonical URL pointing back to vacationdeals.to.
 *
 * Medium has DA 96 and respects canonical tags, so this creates
 * high-authority backlinks without duplicate content penalties.
 *
 * Requires: MEDIUM_TOKEN env var (get from Medium Settings → Integration tokens)
 * Optionally: MEDIUM_USER_ID (fetched automatically if not set)
 *
 * Usage: npx tsx src/medium-syndicate.ts
 * Cron: Run weekly or after new blog posts are published.
 */

const SITE_URL = "https://vacationdeals.to";

interface MediumPost {
  title: string;
  contentFormat: "html";
  content: string;
  canonicalUrl: string;
  tags: string[];
  publishStatus: "public" | "draft";
}

async function getMediumUserId(token: string): Promise<string | null> {
  const userId = process.env.MEDIUM_USER_ID;
  if (userId) return userId;

  try {
    const res = await fetch("https://api.medium.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(`Failed to get Medium user: ${res.status}`);
      return null;
    }
    const data = await res.json();
    return data.data?.id ?? null;
  } catch (err: any) {
    console.error(`Medium API error: ${err.message}`);
    return null;
  }
}

async function publishToMedium(
  token: string,
  userId: string,
  post: MediumPost,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const res = await fetch(
      `https://api.medium.com/v1/users/${userId}/posts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(post),
      },
    );

    if (res.ok) {
      const data = await res.json();
      return { success: true, url: data.data?.url };
    }

    const text = await res.text();
    return { success: false, error: `${res.status}: ${text}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function fetchBlogPosts(): Promise<
  Array<{
    title: string;
    slug: string;
    content: string;
    tags: string[];
    bluf: string;
  }>
> {
  try {
    const res = await fetch(`${SITE_URL}/api/blog-posts?limit=10`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts || [];
  } catch {
    return [];
  }
}

async function main() {
  const token = process.env.MEDIUM_TOKEN;
  if (!token) {
    console.error("MEDIUM_TOKEN env var not set.");
    console.log("Steps: Go to Medium → Settings → Security and apps → Integration tokens");
    process.exit(1);
  }

  console.log("=== Medium Content Syndication ===");
  console.log(`Started at ${new Date().toISOString()}\n`);

  const userId = await getMediumUserId(token);
  if (!userId) {
    console.error("Could not determine Medium user ID.");
    process.exit(1);
  }
  console.log(`Medium user ID: ${userId}\n`);

  // Fetch recent blog posts
  const posts = await fetchBlogPosts();
  console.log(`Found ${posts.length} blog posts to syndicate\n`);

  let successCount = 0;
  let skipCount = 0;

  for (const post of posts) {
    // Add canonical link and attribution to the content
    const content = `
      <p><em>This article was originally published on <a href="${SITE_URL}/${post.slug}">VacationDeals.to</a>.</em></p>
      <hr>
      ${post.content}
      <hr>
      <p><em>Find more vacation deals at <a href="${SITE_URL}">${SITE_URL}</a></em></p>
    `;

    const mediumPost: MediumPost = {
      title: post.title,
      contentFormat: "html",
      content,
      canonicalUrl: `${SITE_URL}/${post.slug}`,
      tags: (post.tags || []).slice(0, 5), // Medium allows max 5 tags
      publishStatus: "public",
    };

    process.stdout.write(`Publishing "${post.title}"... `);
    const result = await publishToMedium(token, userId, mediumPost);

    if (result.success) {
      console.log(`OK → ${result.url}`);
      successCount++;
    } else {
      // 429 or duplicate content = skip gracefully
      if (result.error?.includes("429")) {
        console.log("RATE LIMITED — stopping");
        break;
      }
      console.log(`SKIPPED — ${result.error}`);
      skipCount++;
    }

    // Rate limit: 2 seconds between posts
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n=== Summary ===");
  console.log(`Published: ${successCount}`);
  console.log(`Skipped:   ${skipCount}`);
  console.log(`Completed at ${new Date().toISOString()}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Medium syndication failed:", err);
  process.exit(1);
});
