/**
 * Executive contact research for our brand+broker prospects.
 *
 * For each brand in the DB, looks up:
 *   - Likely org name (parent company)
 *   - Probable executives by title (CMO, VP Marketing, Affiliate Manager,
 *     Director of Consumer Marketing, Sales Director)
 *   - LinkedIn profile URLs
 *   - Public corporate emails + email guess patterns (firstname@, fl@, etc.)
 *   - Phone numbers from contact pages
 *   - Contact form URLs
 *
 * Approach: this is research scaffolding, not magic. We populate fields we
 * can find programmatically (corporate site contact pages, LinkedIn search
 * URLs) and leave fields that need human verification flagged.
 *
 * For LinkedIn at scale, the user will need to manually open profiles.
 * For email finders (Hunter.io, Apollo, RocketReach) — those are paid APIs
 * the user can hook in later via env vars.
 *
 * Output: research/exec-contacts.json + a markdown report per brand.
 *
 * Run:  npx tsx scripts/research-execs.ts
 *       npx tsx scripts/research-execs.ts --brand=westgate (single brand)
 */

import fs from "node:fs";
import path from "node:path";

const BRAND_ARG = process.argv.find((a) => a.startsWith("--brand="));
const SINGLE = BRAND_ARG ? BRAND_ARG.split("=")[1] : null;

interface ExecProfile {
  // Filled programmatically
  name?: string;
  title: string;
  // Permalink helpers (search URLs that will surface candidates fast)
  linkedinSearch: string;
  linkedinDirect?: string;
  // Email guesses based on common corporate patterns
  emailGuesses: string[];
  // Public contact paths
  contactFormUrl?: string;
  phone?: string;
  // Status tagging
  source: "search-url" | "verified-from-public-page" | "needs-human-verification";
  notes?: string;
}

interface BrandResearch {
  brandSlug: string;
  brandName: string;
  parentCompany?: string;
  corporateSite?: string;
  baseSiteUrl: string;
  contactPageUrl?: string;
  affiliatePageUrl?: string;
  pressContactUrl?: string;
  primaryPhone?: string;
  hqAddress?: string;
  domainsForEmailGuess: string[];
  bestRolesToTarget: string[];
  execs: ExecProfile[];
}

const BRANDS: Array<{
  slug: string;
  name: string;
  parent?: string;
  corporateSite?: string;
  domains: string[];
  contactPaths?: string[];
  hqHints?: { phone?: string; address?: string };
}> = [
  { slug: "westgate", name: "Westgate Reservations", parent: "Westgate Resorts (CFI Resorts Management)", corporateSite: "westgateresorts.com", domains: ["westgateresorts.com", "westgatereservations.com"], contactPaths: ["/contact-us"], hqHints: { phone: "1-888-808-7410", address: "5601 Windhover Dr, Orlando, FL 32819" } },
  { slug: "hgv", name: "Hilton Grand Vacations", parent: "Hilton Grand Vacations Inc. (NYSE: HGV)", corporateSite: "hiltongrandvacations.com", domains: ["hiltongrandvacations.com", "hgv.com"], hqHints: { address: "5323 Millenia Lakes Blvd, Orlando, FL 32839" } },
  { slug: "bluegreen", name: "Bluegreen Vacations", parent: "Hilton Grand Vacations (acquired Bluegreen 2024)", corporateSite: "bluegreenvacations.com", domains: ["bluegreenvacations.com"], hqHints: { address: "4960 Conference Way N, Boca Raton, FL 33431" } },
  { slug: "wyndham", name: "Club Wyndham", parent: "Travel + Leisure Co. (NYSE: TNL)", corporateSite: "travelandleisureco.com", domains: ["travelandleisureco.com", "wyndhamdestinations.com", "clubwyndham.com"], hqHints: { phone: "+1 407-626-5200", address: "6277 Sea Harbor Dr, Orlando, FL 32821" } },
  { slug: "holiday-inn", name: "Holiday Inn Club Vacations", parent: "Orange Lake Resorts (Holiday Inn Club brand license from IHG)", corporateSite: "holidayinnclub.com", domains: ["holidayinnclub.com", "orangelake.com"], hqHints: { address: "8505 W Irlo Bronson Memorial Hwy, Kissimmee, FL 34747" } },
  { slug: "hyatt", name: "Hyatt Vacation Ownership", parent: "Marriott Vacations Worldwide (acquired Hyatt VO from ILG 2018)", corporateSite: "marriottvacationsworldwide.com", domains: ["mvwc.com", "marriottvacationsworldwide.com", "hyattvacationclub.com"] },
  { slug: "marriott", name: "Marriott Vacation Club", parent: "Marriott Vacations Worldwide (NYSE: VAC)", corporateSite: "marriottvacationsworldwide.com", domains: ["mvwc.com", "marriottvacationsworldwide.com", "marriottvacationclub.com"], hqHints: { address: "6649 Westwood Blvd, Orlando, FL 32821" } },
  { slug: "capital-vacations", name: "Capital Vacations", corporateSite: "capitalvacations.com", domains: ["capitalvacations.com"], hqHints: { address: "1980 Festival Plaza Dr, Las Vegas, NV 89135" } },
  { slug: "bookvip", name: "BookVIP", domains: ["bookvip.com"], hqHints: { address: "Coral Springs, FL" } },
  { slug: "getawaydealz", name: "GetawayDealz", domains: ["getawaydealz.com"] },
  { slug: "vacationvip", name: "VacationVIP", domains: ["vacationvip.com"] },
  { slug: "bestvacationdealz", name: "BestVacationDealz", domains: ["bestvacationdealz.com"] },
  { slug: "mrg", name: "Monster Reservations Group", domains: ["mrgvacationpackages.com", "monsterreservations.com"] },
  { slug: "westgate-events", name: "Westgate Events", parent: "Westgate Resorts", domains: ["westgateevents.com", "westgateresorts.com"] },
  { slug: "staypromo", name: "StayPromo", domains: ["staypromo.com"] },
  { slug: "vacation-village", name: "Vacation Village Resorts", parent: "Berkley Group / Daily Management Inc.", corporateSite: "vacationvillage.com", domains: ["vacationvillage.com", "vacationvillagedeals.com"] },
  { slug: "spinnaker", name: "Spinnaker Resorts", domains: ["spinnakerresorts.com"], hqHints: { address: "2 Tanglewood Dr, Hilton Head Island, SC 29928" } },
  { slug: "govip", name: "GoVIP", domains: ["govip.com"] },
  { slug: "departure-depot", name: "Departure Depot", domains: ["departuredepot.com"] },
  { slug: "vegas-timeshare", name: "Las Vegas Timeshare", domains: ["las-vegas-timeshare.com"] },
  { slug: "premier-travel", name: "Premier Travel Resorts", domains: ["premiertravelresorts.com"] },
  { slug: "discount-vacation", name: "Discount Vacation Hotels (Villa Group)", parent: "Villa Group Resorts", domains: ["discountvacationhotels.com", "villagroupresorts.com"] },
  { slug: "legendary", name: "Legendary Vacation Club", parent: "Hard Rock Hotels / Palace Resorts affiliate", domains: ["legendaryvacationclub.com"] },
  { slug: "festiva", name: "Festiva Hospitality Group", corporateSite: "festiva.com", domains: ["festiva.com"], hqHints: { address: "Asheville, NC" } },
  { slug: "el-cid", name: "El Cid Vacations Club", domains: ["elcidvacationsclub.com", "elcid.com"] },
  { slug: "pueblo-bonito", name: "Pueblo Bonito Resorts", domains: ["pueblobonito.com"] },
  { slug: "divi", name: "Divi Resorts", domains: ["diviresorts.com"] },
  { slug: "bahia-principe", name: "Bahia Principe Privilege Club", domains: ["bpprivilegeclub.com", "bahia-principe.com"] },
  { slug: "tafer", name: "TAFER Hotels & Resorts", domains: ["taferresorts.com", "taferhotels.com"] },
  { slug: "villa-group", name: "Villa Group Resorts", domains: ["villagroupresorts.com"] },
  { slug: "sheraton-vc", name: "Sheraton Vacation Club", parent: "Marriott Vacations Worldwide", domains: ["sheratonvacationclub.marriott.com"] },
  { slug: "westin-vc", name: "Westin Vacation Club", parent: "Marriott Vacations Worldwide", domains: ["westinvacationclub.marriott.com"] },
  { slug: "exploria", name: "Exploria Resorts", domains: ["exploriavacations.com", "exploriaresorts.com"] },
  { slug: "massanutten", name: "Massanutten Resort", domains: ["massresort.com"], hqHints: { address: "1822 Resort Dr, Massanutten, VA 22840" } },
  { slug: "margaritaville", name: "Margaritaville Vacation Club", parent: "Wyndham Destinations / Margaritaville Holdings", domains: ["margaritavillevacationclub.com", "margaritavillevcrentals.com"] },
  { slug: "iwanttotravelto", name: "I Want To Travel To", domains: ["iwanttotravelto.com"] },
  { slug: "vacation-offer", name: "Vacation Offer", domains: ["vacationoffer.com"] },
  { slug: "monster-vacations", name: "Monster Vacations", domains: ["monstervacations.com"] },
  { slug: "all-inclusive-promotions", name: "All Inclusive Promotions", domains: ["allinclusivepromotions.com"] },
  { slug: "payvibe", name: "PayVibe Travel", domains: ["payvibe.com", "travel.payvibe.com"] },
  { slug: "timeshare-presentation-deals", name: "Timeshare Presentation Deals", domains: ["timesharepresentationdeals.com"] },
];

const TARGET_ROLES = [
  "Chief Marketing Officer",
  "VP Marketing",
  "Director of Marketing",
  "VP Affiliate Marketing",
  "Affiliate Manager",
  "Director of Partnerships",
  "Director of Consumer Marketing",
  "Head of Digital",
  "Senior Director, Sales & Marketing",
  "VP Sales",
];

function emailGuesses(domains: string[], firstName?: string, lastName?: string): string[] {
  const out = new Set<string>();
  for (const d of domains) {
    out.add(`info@${d}`);
    out.add(`marketing@${d}`);
    out.add(`partnerships@${d}`);
    out.add(`affiliates@${d}`);
    out.add(`press@${d}`);
    out.add(`media@${d}`);
    if (firstName && lastName) {
      const f = firstName.toLowerCase();
      const l = lastName.toLowerCase();
      out.add(`${f}.${l}@${d}`);
      out.add(`${f[0]}${l}@${d}`);
      out.add(`${f}${l}@${d}`);
      out.add(`${f}@${d}`);
      out.add(`${l}@${d}`);
    }
  }
  return [...out];
}

function linkedinSearchUrl(brand: string, role: string): string {
  // LinkedIn doesn't allow programmatic queries reliably, but user can paste
  // the URL into a logged-in browser and immediately get a candidate list.
  const q = `${role} ${brand}`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}`;
}

function googleSiteSearch(domain: string, query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`site:${domain} ${query}`)}`;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VacationDealsResearch/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function discoverContactInfo(brand: typeof BRANDS[number]): Promise<{
  contactFormUrl?: string;
  phone?: string;
  affiliatePageUrl?: string;
  pressContactUrl?: string;
}> {
  const result: ReturnType<typeof discoverContactInfo> extends Promise<infer R> ? R : never = {};
  for (const domain of brand.domains) {
    for (const path of ["/contact-us", "/contact", "/about/contact", "/about-us/contact-us", "/affiliates", "/press", "/media", "/about/press"]) {
      const url = `https://www.${domain}${path}`;
      const html = await fetchText(url);
      if (!html) continue;
      // Verify it's a real contact-ish page (not a 404 with status 200)
      if (!/contact|email|press|affiliate|media|partner/i.test(html.slice(0, 4000))) continue;
      if (path.includes("contact") && !result.contactFormUrl) result.contactFormUrl = url;
      if (path.includes("affiliate") && !result.affiliatePageUrl) result.affiliatePageUrl = url;
      if ((path.includes("press") || path.includes("media")) && !result.pressContactUrl) result.pressContactUrl = url;
      // Phone extraction
      if (!result.phone) {
        const phoneMatch = html.match(/(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
        if (phoneMatch) result.phone = phoneMatch[1];
      }
    }
  }
  return result;
}

function execProfilesFor(brand: typeof BRANDS[number]): ExecProfile[] {
  return TARGET_ROLES.map((role) => ({
    title: role,
    linkedinSearch: linkedinSearchUrl(brand.name, role),
    emailGuesses: emailGuesses(brand.domains),
    source: "search-url" as const,
    notes: `Open the LinkedIn search URL while logged in; pick the top result with brand match. Then refine email guess once name is known.`,
  }));
}

async function researchBrand(brand: typeof BRANDS[number]): Promise<BrandResearch> {
  const contactInfo = await discoverContactInfo(brand);
  return {
    brandSlug: brand.slug,
    brandName: brand.name,
    parentCompany: brand.parent,
    corporateSite: brand.corporateSite,
    baseSiteUrl: `https://${brand.domains[0]}`,
    contactPageUrl: contactInfo.contactFormUrl,
    affiliatePageUrl: contactInfo.affiliatePageUrl,
    pressContactUrl: contactInfo.pressContactUrl,
    primaryPhone: contactInfo.phone ?? brand.hqHints?.phone,
    hqAddress: brand.hqHints?.address,
    domainsForEmailGuess: brand.domains,
    bestRolesToTarget: TARGET_ROLES,
    execs: execProfilesFor(brand),
  };
}

function renderMarkdown(r: BrandResearch): string {
  const lines: string[] = [];
  lines.push(`# ${r.brandName}\n`);
  if (r.parentCompany) lines.push(`**Parent:** ${r.parentCompany}\n`);
  lines.push(`**Brand site:** ${r.baseSiteUrl}\n`);
  if (r.corporateSite) lines.push(`**Corporate site:** https://${r.corporateSite}\n`);
  if (r.hqAddress) lines.push(`**HQ:** ${r.hqAddress}\n`);
  if (r.primaryPhone) lines.push(`**Primary phone:** ${r.primaryPhone}\n`);
  lines.push("");

  lines.push(`## Public contact paths`);
  if (r.contactPageUrl) lines.push(`- Contact form: ${r.contactPageUrl}`);
  if (r.affiliatePageUrl) lines.push(`- Affiliate program: ${r.affiliatePageUrl}`);
  if (r.pressContactUrl) lines.push(`- Press / media: ${r.pressContactUrl}`);
  if (!r.contactPageUrl && !r.affiliatePageUrl && !r.pressContactUrl) {
    lines.push(`- *No public contact pages auto-discovered. Try Google: ${googleSiteSearch(r.domainsForEmailGuess[0], "contact OR press OR affiliate")}*`);
  }
  lines.push("");

  lines.push(`## Generic email guesses (for cold outreach)`);
  for (const e of emailGuesses(r.domainsForEmailGuess)) lines.push(`- ${e}`);
  lines.push("");

  lines.push(`## Targets — search LinkedIn while logged in`);
  for (const exec of r.execs) {
    lines.push(`- **${exec.title}** — [LinkedIn search](${exec.linkedinSearch})`);
  }
  lines.push("");

  lines.push(`## Email patterns to try once a name is identified`);
  lines.push("Common patterns at corporate domains: `firstname.lastname@`, `flastname@`, `firstinitiallastname@`. Verify with [Hunter.io](https://hunter.io/) or [RocketReach](https://rocketreach.co/) before sending.\n");

  lines.push(`## Suggested first-touch sequence`);
  lines.push(`1. **LinkedIn DM** with a 2-line hook referencing a specific deal of theirs we currently rank #1 for.`);
  lines.push(`2. **Cold email** 48h later if no LinkedIn response, repeating the hook + one-line pitch ("we have ${r.brandName} traffic — would you like the audit").`);
  lines.push(`3. **Phone call** to ${r.primaryPhone || "main switchboard"}, ask reception for "marketing" or "affiliates", reference your previous outreach.\n`);

  lines.push(`## Hooks they care about`);
  lines.push(`- We rank #1 for several of their brand-name + city queries (we do).`);
  lines.push(`- We can show them which affiliates send junk traffic (Reality Index data).`);
  lines.push(`- Banner placement at top of their highest-traffic landing page on our site.`);
  lines.push(`- Free first month of placement to validate fit.`);

  return lines.join("\n");
}

async function main() {
  const list = SINGLE ? BRANDS.filter((b) => b.slug === SINGLE) : BRANDS;
  if (list.length === 0) {
    console.error(`No brand matches --brand=${SINGLE}`);
    process.exit(1);
  }
  console.log(`Researching ${list.length} brands...`);

  const out: BrandResearch[] = [];
  for (let i = 0; i < list.length; i++) {
    const brand = list[i];
    process.stdout.write(`  [${i + 1}/${list.length}] ${brand.slug} ... `);
    const data = await researchBrand(brand);
    out.push(data);
    console.log(`✓ (contact: ${data.contactPageUrl ? "found" : "missing"}, phone: ${data.primaryPhone ?? "none"})`);
  }

  const root = path.join(process.cwd(), "research");
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, "exec-contacts.json"), JSON.stringify(out, null, 2));
  fs.mkdirSync(path.join(root, "brands"), { recursive: true });
  for (const r of out) {
    fs.writeFileSync(path.join(root, "brands", `${r.brandSlug}.md`), renderMarkdown(r));
  }

  // Master index
  const index = [
    `# Executive contact research index`,
    ``,
    `Generated ${new Date().toISOString()}. Open each brand file for LinkedIn search URLs, email guesses, and outreach sequence.`,
    ``,
    ...out.map((r) => `- [${r.brandName}](./brands/${r.brandSlug}.md)${r.parentCompany ? ` — *${r.parentCompany}*` : ""}`),
  ].join("\n");
  fs.writeFileSync(path.join(root, "INDEX.md"), index);

  console.log(`\nDone. Wrote ${out.length} brand files to ${root}/brands/.`);
  console.log(`Index: ${path.join(root, "INDEX.md")}`);
  console.log(`JSON: ${path.join(root, "exec-contacts.json")}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
