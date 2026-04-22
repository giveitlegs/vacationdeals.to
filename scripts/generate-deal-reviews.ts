/**
 * Generate unique AI-written reviews for active vacation deals.
 *
 * Uses Anthropic Claude API (cheap Haiku model) to produce 180-250 word
 * reviews tailored to each deal's brand + destination + price + duration.
 *
 * Skips deals that already have a review_html unless --force is passed.
 * Rate-limited to avoid API throttling.
 *
 * Run:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/generate-deal-reviews.ts
 *   ANTHROPIC_API_KEY=... npx tsx scripts/generate-deal-reviews.ts --limit=20
 *   ANTHROPIC_API_KEY=... npx tsx scripts/generate-deal-reviews.ts --force
 *
 * Cost estimate: ~$0.01-0.03 per review with claude-haiku-4-5. 100 deals ≈ $1-3.
 */

import Anthropic from "@anthropic-ai/sdk";
import { db, deals, brands, destinations } from "@vacationdeals/db";
import { eq, and, isNull, sql } from "drizzle-orm";

const FORCE = process.argv.includes("--force");
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : 999;

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY required");
  process.exit(1);
}

const client = new Anthropic({ apiKey });

interface DealForReview {
  id: number;
  slug: string;
  title: string;
  resortName: string | null;
  price: string;
  durationNights: number;
  durationDays: number;
  brandName: string | null;
  city: string | null;
  state: string | null;
  inclusions: string | null;
  reviewHtml: string | null;
}

async function fetchDeals(): Promise<DealForReview[]> {
  const query = db
    .select({
      id: deals.id,
      slug: deals.slug,
      title: deals.title,
      resortName: deals.resortName,
      price: deals.price,
      durationNights: deals.durationNights,
      durationDays: deals.durationDays,
      brandName: brands.name,
      city: destinations.city,
      state: destinations.state,
      inclusions: deals.inclusions,
      reviewHtml: deals.reviewHtml,
    })
    .from(deals)
    .leftJoin(brands, sql`${deals.brandId} = ${brands.id}`)
    .leftJoin(destinations, sql`${deals.destinationId} = ${destinations.id}`)
    .where(FORCE ? eq(deals.isActive, true) : and(eq(deals.isActive, true), isNull(deals.reviewHtml)))
    .limit(LIMIT);
  return await query;
}

async function generateReview(deal: DealForReview): Promise<string> {
  const resort = deal.resortName || deal.title;
  const location = [deal.city, deal.state].filter(Boolean).join(", ") || "a top US destination";
  const inclusionsList = deal.inclusions
    ? (() => { try { return JSON.parse(deal.inclusions).slice(0, 3).join(", "); } catch { return deal.inclusions.slice(0, 80); } })()
    : "resort amenities";

  const systemPrompt = `You are a travel editor writing concise, factual reviews of timeshare preview vacation packages for VacationDeals.to. Write in a warm, confident, first-person-plural voice ("we've reviewed", "we like"). Avoid hype. Cover: what makes this specific deal stand out, who it's best for, and one or two practical tips. 180-250 words. Output HTML only — use <p>, <strong> tags. No headings, no lists. No markdown.`;

  const userPrompt = `Write a unique review for this specific vacation deal:

Resort: ${resort}
Location: ${location}
Brand: ${deal.brandName || "Unknown"}
Duration: ${deal.durationDays} days / ${deal.durationNights} nights
Price: $${Number(deal.price)}
Includes: ${inclusionsList}

Write a 180-250 word HTML review (paragraphs only, no headings). Be specific to THIS deal, not generic.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text.trim();
}

async function main() {
  const batch = await fetchDeals();
  console.log(`Processing ${batch.length} deals${FORCE ? " (force-regenerate)" : " (without review)"}`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < batch.length; i++) {
    const deal = batch[i];
    process.stdout.write(`[${i + 1}/${batch.length}] ${deal.slug} ... `);

    try {
      const reviewHtml = await generateReview(deal);
      await db.update(deals)
        .set({ reviewHtml, reviewGeneratedAt: new Date(), updatedAt: new Date() })
        .where(eq(deals.id, deal.id));
      console.log(`✓ ${reviewHtml.length} chars`);
      successCount++;

      // Basic rate limit: ~1 req/sec = 3600/hr, well under Anthropic limits
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      console.log(`✗ ${(e as Error).message}`);
      failCount++;
    }
  }

  console.log(`\nDone. ${successCount} generated, ${failCount} failed.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
