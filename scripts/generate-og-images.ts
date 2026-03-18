import * as fs from "fs";
import * as path from "path";

const FAL_API_KEY = process.env.falAI_API || "67f121f3-8cf7-4005-a9e3-481e317831e9:cee7023f74c7459090275ae732c512fc";
const OUTPUT_DIR = path.resolve(__dirname, "../apps/web/public/og");

const destinations = [
  { slug: "orlando", prompt: "Aerial view of Orlando Florida skyline with theme parks and resorts, golden hour, professional tourism photography, vibrant colors, wide angle" },
  { slug: "las-vegas", prompt: "Las Vegas Strip at dusk with neon lights, luxury hotels and casinos, professional travel photography, vibrant nightlife atmosphere" },
  { slug: "cancun", prompt: "Cancun Mexico turquoise Caribbean beach with luxury resort, palm trees, white sand, professional tourism photography, vivid tropical colors" },
  { slug: "gatlinburg", prompt: "Great Smoky Mountains with fall foliage, Gatlinburg Tennessee mountain town, misty peaks, professional nature photography" },
  { slug: "myrtle-beach", prompt: "Myrtle Beach South Carolina oceanfront with pier and boardwalk, sunrise, professional coastal photography, warm tones" },
  { slug: "branson", prompt: "Branson Missouri entertainment district with Table Rock Lake, Ozark mountains, professional travel photography, scenic" },
  { slug: "williamsburg", prompt: "Colonial Williamsburg Virginia historic buildings with cobblestone streets, autumn colors, professional architectural photography" },
  { slug: "cocoa-beach", prompt: "Cocoa Beach Florida with Kennedy Space Center rocket launch pad in background, tropical beach, professional photography" },
  { slug: "hilton-head", prompt: "Hilton Head Island South Carolina lighthouse with golf course and ocean, professional resort photography, lush green" },
  { slug: "park-city", prompt: "Park City Utah ski resort with snow-covered mountains and luxury lodges, winter wonderland, professional photography" },
  { slug: "daytona-beach", prompt: "Daytona Beach Florida with cars on the beach and pier, golden hour, professional coastal photography" },
  { slug: "cabo", prompt: "Cabo San Lucas Mexico with El Arco rock formation, luxury resort coastline, turquoise water, professional travel photography" },
  { slug: "puerto-vallarta", prompt: "Puerto Vallarta Mexico malecon boardwalk with mountains and bay, sunset, professional travel photography, vibrant" },
  { slug: "punta-cana", prompt: "Punta Cana Dominican Republic all-inclusive resort with palm trees and crystal clear water, professional tropical photography" },
  { slug: "key-west", prompt: "Key West Florida sunset at Mallory Square with sailing boats, colorful houses, professional island photography, warm tones" },
  { slug: "sedona", prompt: "Sedona Arizona red rock formations at sunset with desert landscape, professional nature photography, dramatic sky" },
  { slug: "galveston", prompt: "Galveston Texas historic Strand district with beach and pier, professional coastal photography, golden light" },
  { slug: "lake-tahoe", prompt: "Lake Tahoe crystal clear blue water with snow-capped Sierra Nevada mountains, professional landscape photography" },
  { slug: "new-york-city", prompt: "New York City skyline with Empire State Building and Central Park, professional urban photography, golden hour" },
  { slug: "san-diego", prompt: "San Diego California Coronado Bridge with harbor and downtown skyline, professional travel photography, sunset" },
  { slug: "san-antonio", prompt: "San Antonio Texas River Walk with restaurants and bridges lit up at night, professional travel photography" },
  { slug: "miami", prompt: "Miami Beach South Beach with art deco buildings and ocean, professional travel photography, vibrant colors, sunset" },
  { slug: "nashville", prompt: "Nashville Tennessee Broadway with neon honky-tonk signs at night, professional nightlife photography, vibrant" },
];

const defaultOg = {
  slug: "default",
  prompt: "Luxury vacation resort with infinity pool overlooking tropical ocean, palm trees, golden hour, professional tourism advertisement photography, wide angle, premium resort experience",
};

async function generateImage(slug: string, prompt: string): Promise<string> {
  console.log(`[${slug}] Generating image...`);
  const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: { width: 1200, height: 630 },
      num_images: 1,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`FAL API error for ${slug}: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const imageUrl: string = data.images[0].url;
  console.log(`[${slug}] Got image URL: ${imageUrl.substring(0, 80)}...`);
  return imageUrl;
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  const sizeKB = Math.round(buffer.length / 1024);
  console.log(`  Saved: ${outputPath} (${sizeKB} KB)`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const allItems = [...destinations, defaultOg];
  console.log(`\nGenerating ${allItems.length} OG images via FAL.ai FLUX Schnell...\n`);

  let success = 0;
  let failed = 0;

  for (const item of allItems) {
    const outputPath = path.join(OUTPUT_DIR, `${item.slug}.jpg`);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`[${item.slug}] Already exists, skipping.`);
      success++;
      continue;
    }

    try {
      const imageUrl = await generateImage(item.slug, item.prompt);
      await downloadImage(imageUrl, outputPath);
      success++;
    } catch (err: any) {
      console.error(`[${item.slug}] FAILED: ${err.message}`);
      failed++;
    }

    // Rate limit: 500ms between requests
    await sleep(500);
  }

  console.log(`\nDone! ${success} succeeded, ${failed} failed.`);
  console.log(`Images saved to: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
