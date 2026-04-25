/**
 * Generate banner images via Google's Gemini image model.
 *
 * Reads prompts from research/banner-prompts/<slug>.md, calls Gemini's image
 * generation API, saves resulting PNGs to apps/web/public/banners/.
 *
 * Defaults to header (970x90) + hero (728x90) sizes for all 40 brands.
 * Pass --all-sizes to also generate sidebar (300x600) and inline (300x250).
 *
 * Run:
 *   GEMINI_API_KEY=AIza... npx tsx scripts/generate-banner-images.ts
 *   ... --brands=westgate,hgv,wyndham
 *   ... --all-sizes
 *   ... --skip-existing
 */

import fs from "node:fs";
import path from "node:path";

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.gemini_API ||
  process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY (or gemini_API) required");
  process.exit(1);
}

const ALL_SIZES = process.argv.includes("--all-sizes");
const SKIP_EXISTING = process.argv.includes("--skip-existing");
const brandArg = process.argv.find((a) => a.startsWith("--brands="));
const BRAND_FILTER = brandArg ? brandArg.split("=")[1].split(",") : null;

const SIZES_DEFAULT = [
  { w: 970, h: 90 },
  { w: 728, h: 90 },
];
const SIZES_ALL = [
  { w: 970, h: 90 },
  { w: 728, h: 90 },
  { w: 300, h: 250 },
  { w: 300, h: 600 },
];
const SIZES = ALL_SIZES ? SIZES_ALL : SIZES_DEFAULT;

const PROMPTS_DIR = path.join(process.cwd(), "research", "banner-prompts");
const OUT_DIR = path.join(process.cwd(), "apps", "web", "public", "banners");
fs.mkdirSync(OUT_DIR, { recursive: true });

interface BrandPromptFile {
  slug: string;
  promptsBySize: Record<string, string>;
}

function parsePromptFile(filePath: string): BrandPromptFile {
  const content = fs.readFileSync(filePath, "utf-8");
  const slug = path.basename(filePath, ".md");
  const promptsBySize: Record<string, string> = {};
  const sectionRe = /## .*?—\s*(\d+)[×x](\d+)[^\n]*\n+```text\n([\s\S]*?)\n```/gi;
  let m;
  while ((m = sectionRe.exec(content)) !== null) {
    promptsBySize[`${m[1]}x${m[2]}`] = m[3].trim();
  }
  return { slug, promptsBySize };
}

async function generateImage(prompt: string, w: number, h: number): Promise<Buffer | null> {
  const candidates = ["gemini-3-pro-image-preview", "gemini-2.5-flash-image-preview"];
  const aspect = w > h ? `${w}x${h} wide horizontal banner (aspect ratio ~${(w / h).toFixed(2)}:1)` : `${w}x${h} vertical banner`;
  const fullPrompt = `${prompt}\n\nIMPORTANT: produce a ${aspect}. Final dimensions exactly ${w}x${h} pixels.`;

  for (const model of candidates) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn(`    ${model} -> ${res.status}: ${errText.slice(0, 200)}`);
        continue;
      }
      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }>;
      };
      const inline = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (inline?.inlineData?.data) {
        return Buffer.from(inline.inlineData.data, "base64");
      }
      console.warn(`    ${model} -> no image in response`);
    } catch (e) {
      console.warn(`    ${model} -> error: ${(e as Error).message}`);
    }
  }
  return null;
}

async function main() {
  const files = fs.readdirSync(PROMPTS_DIR).filter((f) => f.endsWith(".md") && f !== "INDEX.md");
  const brands = files
    .map((f) => parsePromptFile(path.join(PROMPTS_DIR, f)))
    .filter((b) => !BRAND_FILTER || BRAND_FILTER.includes(b.slug));

  console.log(`Generating ${brands.length} brands x ${SIZES.length} sizes = ${brands.length * SIZES.length} images`);
  console.log(`Output: ${OUT_DIR}\n`);

  let ok = 0, skipped = 0, failed = 0;
  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];
    console.log(`[${i + 1}/${brands.length}] ${brand.slug}`);
    for (const s of SIZES) {
      const sizeKey = `${s.w}x${s.h}`;
      const outPath = path.join(OUT_DIR, `${brand.slug}-${sizeKey}.png`);

      if (SKIP_EXISTING && fs.existsSync(outPath)) {
        console.log(`  ${sizeKey} -> skipped (exists)`);
        skipped++;
        continue;
      }
      const prompt = brand.promptsBySize[sizeKey];
      if (!prompt) {
        console.log(`  ${sizeKey} -> no prompt found`);
        continue;
      }

      process.stdout.write(`  ${sizeKey} -> generating ... `);
      const img = await generateImage(prompt, s.w, s.h);
      if (img) {
        fs.writeFileSync(outPath, img);
        console.log(`OK ${img.length} bytes`);
        ok++;
      } else {
        console.log(`FAIL`);
        failed++;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  console.log(`\nDone. ${ok} generated, ${skipped} skipped, ${failed} failed.`);
  console.log(`Files in: ${OUT_DIR}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
