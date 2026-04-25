/**
 * Generate Nano Banana Pro prompts for mock branded banners — one per brand,
 * at three standard ad sizes. Outputs research/banner-prompts/<brand>.md
 * containing copy-paste-ready prompts + the marketing pitch to send the prospect.
 *
 * Then once you generate the images, drop them into apps/web/public/banners/
 * named like <brand>-728x90.png and run the SQL seed in
 * scripts/seed-prospect-banners.sql to wire UTM-trigger banners into ad_banners.
 *
 * Run: npx tsx scripts/generate-banner-prompts.ts
 */

import fs from "node:fs";
import path from "node:path";

interface BrandStyle {
  slug: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  visualMotif: string;     // hero/scene description
  toneline: string;        // their voice
  signatureCallout: string; // brand-specific feature
}

const BRANDS: BrandStyle[] = [
  { slug: "westgate", name: "Westgate Reservations", primaryColor: "#0066B3 (Westgate blue)", secondaryColor: "#F8B900 (gold)", visualMotif: "Florida resort pool with palms, lazy river, golden-hour lighting", toneline: "Bold, family-first, sun-and-fun", signatureCallout: "From $59 — 3 nights" },
  { slug: "hgv", name: "Hilton Grand Vacations", primaryColor: "#11385A (Hilton navy)", secondaryColor: "#A4A8AB (silver)", visualMotif: "Modern Hilton-quality resort suite, balcony view of city or beach, sunset gold/navy", toneline: "Premium, refined, aspirational", signatureCallout: "Hilton Honors points + $99 stays" },
  { slug: "bluegreen", name: "Bluegreen Vacations", primaryColor: "#005A9C (deep blue)", secondaryColor: "#7DC242 (lime green)", visualMotif: "Drive-to mountain or lake vacation cabin scene, family kayaking", toneline: "Approachable, drive-to, family-friendly", signatureCallout: "60+ resorts within driving distance" },
  { slug: "wyndham", name: "Club Wyndham", primaryColor: "#005DAA (Wyndham blue)", secondaryColor: "#F2A900 (warm yellow)", visualMotif: "Multiple destinations split-screen montage (Vegas + Orlando + cabin) — Wyndham's network", toneline: "Massive variety, points-flexible", signatureCallout: "230+ resorts with one membership" },
  { slug: "holiday-inn", name: "Holiday Inn Club Vacations", primaryColor: "#00833E (IHG green)", secondaryColor: "#FFFFFF (white)", visualMotif: "Family-friendly Orlando resort pool with kid-focused activities, sunny day", toneline: "Family-trusted, IHG-backed", signatureCallout: "IHG One Rewards integrated" },
  { slug: "hyatt", name: "Hyatt Vacation Ownership", primaryColor: "#0064A4 (Hyatt blue)", secondaryColor: "#B58E5C (warm gold)", visualMotif: "Spa-quality Hyatt suite, mountain or beach view, calm minimalist palette", toneline: "Quiet luxury, World of Hyatt", signatureCallout: "World of Hyatt member perks" },
  { slug: "marriott", name: "Marriott Vacation Club", primaryColor: "#FF4D00 (Marriott red-orange)", secondaryColor: "#3E1E1F (deep brown)", visualMotif: "Vistana Villages-style Orlando villa with full kitchen + family poolside", toneline: "Premium-but-real, Bonvoy points integration", signatureCallout: "Bonvoy points + premium villas" },
  { slug: "capital-vacations", name: "Capital Vacations", primaryColor: "#003366 (deep navy)", secondaryColor: "#F0AD4E (gold accent)", visualMotif: "East-coast beach resort with families on the sand, late afternoon sun", toneline: "Boutique East-Coast / Carolinas focus", signatureCallout: "30+ East Coast destinations" },
  { slug: "bookvip", name: "BookVIP", primaryColor: "#C8102E (broker red)", secondaryColor: "#FFD700 (gold)", visualMotif: "Multi-resort split-screen with prices visible, urgent-deal vibe", toneline: "Aggressive deal-maker, urgent FOMO", signatureCallout: "Up to 80% off retail" },
  { slug: "getawaydealz", name: "GetawayDealz", primaryColor: "#0098DA (sky blue)", secondaryColor: "#F58220 (orange)", visualMotif: "Bright, casual destination collage with deal prices floating in", toneline: "Casual deal-aggregator, friendly", signatureCallout: "From $99 across major US destinations" },
  { slug: "vacationvip", name: "VacationVIP", primaryColor: "#1F4E79 (navy)", secondaryColor: "#FFC000 (gold)", visualMotif: "Resort exterior with VIP signage, slightly aspirational deal-broker vibe", toneline: "Mid-tier broker, decent breadth", signatureCallout: "Multi-brand broker access" },
  { slug: "bestvacationdealz", name: "BestVacationDealz", primaryColor: "#E8092C (deep red)", secondaryColor: "#FFFFFF (white)", visualMotif: "Discount-heavy montage with bold percent-off badges over destinations", toneline: "Discount-focused broker", signatureCallout: "Major brand deals consolidated" },
  { slug: "mrg", name: "Monster Reservations Group", primaryColor: "#71BE43 (lime green)", secondaryColor: "#000000 (black)", visualMotif: "Bold green branding, families enjoying multiple destinations", toneline: "Aggressive value broker", signatureCallout: "Up to 6 guests per package" },
  { slug: "westgate-events", name: "Westgate Events", primaryColor: "#0066B3 (Westgate blue)", secondaryColor: "#E91E63 (event accent)", visualMotif: "Westgate resort + concert/show event in foreground (Princess Diana exhibit, Cirque, Branson Stampede)", toneline: "Resort + entertainment combo", signatureCallout: "Show tickets + 3-night stay" },
  { slug: "staypromo", name: "StayPromo", primaryColor: "#0084C7 (Florida blue)", secondaryColor: "#FFA500 (orange)", visualMotif: "Cancun all-inclusive beach with bright sun, drinks", toneline: "Florida-licensed broker, all-inclusive focus", signatureCallout: "Florida-licensed since 2010" },
  { slug: "vacation-village", name: "Vacation Village Resorts", primaryColor: "#005EB8 (resort blue)", secondaryColor: "#FBC91B (yellow)", visualMotif: "Mid-tier Florida or Williamsburg resort, pool + kids, bright daylight", toneline: "Direct resort brand, value-tier", signatureCallout: "From $49 — direct resort pricing" },
  { slug: "spinnaker", name: "Spinnaker Resorts", primaryColor: "#003366 (Hilton Head navy)", secondaryColor: "#5BC2E7 (sky blue)", visualMotif: "Hilton Head Island sailboat with family on dock, ocean breeze", toneline: "Coastal, family-trusted, beach-focused", signatureCallout: "$269 + entertainment credits" },
  { slug: "departure-depot", name: "Departure Depot", primaryColor: "#003B5C (deep blue)", secondaryColor: "#F5A623 (orange-gold)", visualMotif: "Modern travel-deal aggregator with cruise ship + Caribbean montage", toneline: "Modern broker with 150+ destinations", signatureCallout: "Cruise + resort packages" },
  { slug: "vegas-timeshare", name: "Las Vegas Timeshare", primaryColor: "#000000 (black)", secondaryColor: "#FFD700 (gold)", visualMotif: "Vegas Strip skyline at night, neon lights, casino-luxe", toneline: "Vegas-focused, casino-adjacent", signatureCallout: "SAHARA + Planet Hollywood + Westgate Vegas" },
  { slug: "premier-travel", name: "Premier Travel Resorts", primaryColor: "#D90000 (red)", secondaryColor: "#FFFFFF (white)", visualMotif: "Costa Rica + Orlando + Vegas montage, broker-style", toneline: "Florida-based broker, multi-destination", signatureCallout: "Orlando + Vegas + Costa Rica deals" },
  { slug: "discount-vacation", name: "Discount Vacation Hotels (Villa Group)", primaryColor: "#0072BA (Villa blue)", secondaryColor: "#F8C300 (sunny yellow)", visualMotif: "Mexico beach resort, all-inclusive vibe, sunset", toneline: "Villa Group's promotional arm", signatureCallout: "Mexico all-inclusive — Villa Group properties" },
  { slug: "legendary", name: "Legendary Vacation Club", primaryColor: "#000000 (black)", secondaryColor: "#FF6600 (Hard Rock orange)", visualMotif: "Hard Rock Hotel pool with rock-star vibe, Cancun sunset", toneline: "Hard Rock + UNICO + Nobu cool", signatureCallout: "Hard Rock + Palace Resorts + UNICO" },
  { slug: "festiva", name: "Festiva Hospitality Group", primaryColor: "#005A30 (forest green)", secondaryColor: "#E0AC1B (gold)", visualMotif: "Asheville cabin + Cape Cod cottage + Wisconsin Dells montage", toneline: "Boutique destinations, off-the-beaten path", signatureCallout: "21 unique destinations" },
  { slug: "el-cid", name: "El Cid Vacations Club", primaryColor: "#1B3F6B (royal blue)", secondaryColor: "#D4AF37 (gold)", visualMotif: "Mazatlan + Riviera Maya beach scenes with Spanish colonial accents", toneline: "Mexico-focused, all-inclusive heritage brand", signatureCallout: "Mazatlan + Riviera Maya all-inclusive" },
  { slug: "pueblo-bonito", name: "Pueblo Bonito Resorts", primaryColor: "#8B0000 (deep terracotta)", secondaryColor: "#F4D03F (sunny gold)", visualMotif: "Cabo San Lucas + Mazatlan resort architecture, Pacific sunset", toneline: "Premium Mexico destination", signatureCallout: "Cabo + Mazatlan luxury" },
  { slug: "divi", name: "Divi Resorts", primaryColor: "#FF6F61 (coral)", secondaryColor: "#0099B3 (Caribbean teal)", visualMotif: "Caribbean (Aruba, Bonaire, Barbados) crystal-clear water, beach", toneline: "Caribbean destination expert", signatureCallout: "9 Caribbean destinations" },
  { slug: "bahia-principe", name: "Bahia Principe Privilege Club", primaryColor: "#003366 (deep blue)", secondaryColor: "#FFC72C (Bahia gold)", visualMotif: "Punta Cana + Riviera Maya all-inclusive resort with crystal water", toneline: "Caribbean + Mexico all-inclusive Spanish brand", signatureCallout: "Caribbean all-inclusive — Bahia signature" },
  { slug: "tafer", name: "TAFER Hotels & Resorts", primaryColor: "#1F2933 (deep slate)", secondaryColor: "#C9A14C (warm gold)", visualMotif: "Garza Blanca-style luxury Mexico beach with infinity pool", toneline: "Modern luxury Mexico", signatureCallout: "Garza Blanca + Hotel Mousai" },
  { slug: "villa-group", name: "Villa Group Resorts", primaryColor: "#0072BA (Villa blue)", secondaryColor: "#F8C300 (sunny yellow)", visualMotif: "Cabo + Cancun + Loreto resort montage", toneline: "Mexico all-inclusive multi-destination", signatureCallout: "Cabo + Cancun + Loreto" },
  { slug: "sheraton-vc", name: "Sheraton Vacation Club", primaryColor: "#005EB8 (Sheraton blue)", secondaryColor: "#FFFFFF (white)", visualMotif: "Sheraton-quality resort with Bonvoy elite touches", toneline: "Marriott Bonvoy-integrated", signatureCallout: "Sheraton + Bonvoy points" },
  { slug: "westin-vc", name: "Westin Vacation Club", primaryColor: "#5C7C9D (Westin slate)", secondaryColor: "#FFFFFF (white)", visualMotif: "Westin Heavenly bed in resort suite, calm spa-like aesthetic", toneline: "Wellness-luxe Westin DNA", signatureCallout: "Westin Heavenly Beds + Bonvoy" },
  { slug: "exploria", name: "Exploria Resorts", primaryColor: "#0F4C75 (deep blue)", secondaryColor: "#3282B8 (medium blue)", visualMotif: "Orlando + Williamsburg resort pool, family-friendly Disney-area branded", toneline: "Family-friendly Florida + East Coast", signatureCallout: "Orlando area + Williamsburg" },
  { slug: "massanutten", name: "Massanutten Resort", primaryColor: "#005236 (forest green)", secondaryColor: "#F2A900 (autumn gold)", visualMotif: "Virginia ski/water park resort with mountains in fall foliage", toneline: "Virginia mountain resort", signatureCallout: "Year-round VA resort + waterpark" },
  { slug: "margaritaville", name: "Margaritaville Vacation Club", primaryColor: "#00A551 (Margaritaville green)", secondaryColor: "#FFD700 (sunny yellow)", visualMotif: "Beach at sunset with margaritas, cabana, parrot vibe", toneline: "Buffett-fan beach lifestyle", signatureCallout: "Margaritaville-branded beach resorts" },
  { slug: "iwanttotravelto", name: "I Want To Travel To", primaryColor: "#FF6B35 (warm orange)", secondaryColor: "#004E89 (deep blue)", visualMotif: "Wishlist-style destination collage, casual broker", toneline: "Casual broker, accessible", signatureCallout: "Multi-brand vacation packages" },
  { slug: "vacation-offer", name: "Vacation Offer", primaryColor: "#0066CC (broker blue)", secondaryColor: "#FFA500 (orange)", visualMotif: "Limited-time-offer overlay on tropical destinations", toneline: "Time-sensitive deal broker", signatureCallout: "Limited-time vacpack offers" },
  { slug: "monster-vacations", name: "Monster Vacations", primaryColor: "#71BE43 (lime green)", secondaryColor: "#000000 (black)", visualMotif: "Bold-typography travel-deal aggregator", toneline: "MRG-affiliated; high-volume broker", signatureCallout: "Affordable group + family packages" },
  { slug: "all-inclusive-promotions", name: "All Inclusive Promotions", primaryColor: "#0DB39E (Caribbean teal)", secondaryColor: "#F8B400 (sand gold)", visualMotif: "Cancun + Punta Cana resort beach, all-inclusive vibe", toneline: "Caribbean all-inclusive specialist", signatureCallout: "All-inclusive Mexico + Caribbean" },
  { slug: "payvibe", name: "PayVibe Travel", primaryColor: "#7B2CBF (PayVibe purple)", secondaryColor: "#3DCCC7 (mint)", visualMotif: "Modern fintech-meets-travel aesthetic, gradient + bright destinations", toneline: "Fintech-styled travel-deal site", signatureCallout: "Save money, live better, travel more" },
  { slug: "timeshare-presentation-deals", name: "Timeshare Presentation Deals", primaryColor: "#1565C0 (broker blue)", secondaryColor: "#FFB300 (warm gold)", visualMotif: "Generic vacation-deal aggregator hero", toneline: "Plain broker, no-nonsense", signatureCallout: "Multi-brand presentation packages" },
];

const SIZES = [
  { name: "leaderboard", w: 970, h: 90, placement: "Header banner — wide" },
  { name: "billboard", w: 728, h: 90, placement: "Hero / inline — standard" },
  { name: "medium-rectangle", w: 300, h: 250, placement: "Sidebar / inline" },
  { name: "wide-skyscraper", w: 300, h: 600, placement: "Sidebar — full column" },
];

function makePromptForSize(brand: BrandStyle, w: number, h: number): string {
  return `Create a ${w}x${h} pixel display ad banner for "${brand.name}" advertising vacation packages on VacationDeals.to.

REQUIRED ELEMENTS:
- Brand logo treatment "${brand.name}" prominently on the LEFT (or top if vertical), in a clean modern sans-serif (DO NOT copy actual trademarked logo — original wordmark in brand palette)
- Headline: "${brand.signatureCallout}"
- Sub-headline: "Book Your Stay Today"
- CTA button: "Book Now" or "View Deal"
- Tasteful "vacationdeals.to" attribution at bottom-right in small text
- Background: ${brand.visualMotif}

VISUAL STYLE:
- Tone: ${brand.toneline}
- Primary color: ${brand.primaryColor}
- Secondary/accent color: ${brand.secondaryColor}
- High-quality marketing photography aesthetic; no stock-photo cliches
- Composition optimized for ${w}x${h} (${h > w ? "vertical" : w > 800 ? "wide horizontal" : "horizontal"})
- Text must be legible against background — use overlay tints if needed
- No watermarks, no Shutterstock/Getty marks
- Photorealistic, premium feel — NOT cartoon or AI-obvious

NEGATIVE: no text errors, no garbled words, no extra random logos, no ${brand.name === "Westgate Reservations" ? "actual Westgate trademark" : "trademarked third-party logos"}, no people staring directly at camera, no slogans not listed above.

Output: a single ${w}x${h} PNG, transparent background OK if it improves placement contrast.`;
}

function renderBrandFile(brand: BrandStyle): string {
  const lines: string[] = [];
  lines.push(`# ${brand.name} — banner mockup spec\n`);
  lines.push(`**Slug:** \`${brand.slug}\`\n`);
  lines.push(`**Tone:** ${brand.toneline}\n`);
  lines.push(`**Primary color:** ${brand.primaryColor}\n`);
  lines.push(`**Secondary color:** ${brand.secondaryColor}\n`);
  lines.push(`**Signature callout:** ${brand.signatureCallout}\n\n`);

  lines.push(`## How to use these prompts\n`);
  lines.push(`1. Open Nano Banana Pro (or your image gen of choice)\n`);
  lines.push(`2. Paste each prompt below\n`);
  lines.push(`3. Save the output as \`apps/web/public/banners/${brand.slug}-<W>x<H>.png\`\n`);
  lines.push(`4. After all four are generated, run \`scripts/seed-prospect-banners.sql\` to wire them up\n`);
  lines.push(`5. Send the prospect: \`https://vacationdeals.to/?utm_content=${brand.slug}-prospect\` — they see only their banner at the top of every page\n\n`);

  lines.push(`## Prospect-pitch one-liner\n`);
  lines.push(`> "We're seeing significant ${brand.name} traffic on VacationDeals.to. We mocked up what your branded placement would look like — view it live with your unique link below.\n>\n> https://vacationdeals.to/?utm_content=${brand.slug}-prospect\n>\n> First month placement: free. Email me back if you'd like to discuss expanding."\n\n`);

  for (const s of SIZES) {
    lines.push(`## ${s.name} — ${s.w}×${s.h} (${s.placement})\n`);
    lines.push("```text");
    lines.push(makePromptForSize(brand, s.w, s.h));
    lines.push("```\n");
  }

  return lines.join("\n");
}

function generateSeedSql(): string {
  const lines: string[] = [];
  lines.push("-- Seed prospect-banner rows for every brand we have a mockup for.");
  lines.push("-- Run AFTER you've placed the PNG files in apps/web/public/banners/.");
  lines.push("-- The utm_content_match column gates these to ?utm_content=<slug>-prospect URLs only.");
  lines.push("");
  for (const brand of BRANDS) {
    for (const s of [{ pos: "header", w: 970, h: 90 }, { pos: "hero", w: 728, h: 90 }]) {
      lines.push(`INSERT INTO ad_banners (name, position, image_url, link_url, utm_content_match, prospect_brand_slug, width, height, is_active, sort_order)`);
      lines.push(`VALUES ('${brand.name.replace(/'/g, "''")} prospect ${s.w}x${s.h}', '${s.pos}', '/banners/${brand.slug}-${s.w}x${s.h}.png', NULL, '${brand.slug}-prospect', '${brand.slug}', ${s.w}, ${s.h}, true, 0)`);
      lines.push(`ON CONFLICT DO NOTHING;`);
    }
  }
  return lines.join("\n");
}

function main() {
  const root = path.join(process.cwd(), "research", "banner-prompts");
  fs.mkdirSync(root, { recursive: true });

  for (const brand of BRANDS) {
    fs.writeFileSync(path.join(root, `${brand.slug}.md`), renderBrandFile(brand));
  }

  // Master index
  const index = [
    `# Banner mockup prompts — index\n`,
    `Generated ${new Date().toISOString()}.\n`,
    `Open each brand file. Run prompts through Nano Banana Pro. Save outputs to \`apps/web/public/banners/\`.\n`,
    ``,
    ...BRANDS.map((b) => `- [${b.name}](./${b.slug}.md)`),
  ].join("\n");
  fs.writeFileSync(path.join(root, "INDEX.md"), index);
  fs.writeFileSync(path.join(process.cwd(), "scripts", "seed-prospect-banners.sql"), generateSeedSql());

  console.log(`Wrote ${BRANDS.length} brand prompt files to ${root}/`);
  console.log(`Wrote SQL seed to scripts/seed-prospect-banners.sql`);
  console.log(`\nNext steps:`);
  console.log(`  1. Open research/banner-prompts/INDEX.md`);
  console.log(`  2. For each brand, run the 4 prompts through Nano Banana Pro`);
  console.log(`  3. Save outputs to apps/web/public/banners/<slug>-<W>x<H>.png`);
  console.log(`  4. psql -f scripts/seed-prospect-banners.sql`);
  console.log(`  5. Test: visit /?utm_content=westgate-prospect — your mock banner appears at top`);
}

main();
