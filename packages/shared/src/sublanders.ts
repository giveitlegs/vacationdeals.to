// ---------------------------------------------------------------------------
// Sublander taxonomy — "Vacation Deals in {City} for {Modifier}" pages
//
// URL pattern:  /{citySlug}-{modifierSlug}   (flat, root-level)
// Example:      /orlando-for-families, /las-vegas-bachelor-party
//
// Each sublander:
//   - filters the city's deal pool via `filter`
//   - gets a unique intro (template + city blurb pool)
//   - gets modifier-specific FAQs
//   - uplinks to /{citySlug} parent
//   - sidelinks to sibling sublanders via CityModifierSubnav
//
// No new DB tables — all config is here. The `sublanders` DB table exists
// only for admin overrides (enable/disable per pair, custom intro).
// ---------------------------------------------------------------------------

export type ModifierType =
  | "audience"
  | "season"
  | "occasion"
  | "budget"
  | "duration"
  | "interest";

export interface DealFilterSpec {
  maxPrice?: number;
  minPrice?: number;
  durationNights?: number | number[];
  brandSlugsInclude?: string[];
  brandSlugsExclude?: string[];
  /** Any of these keywords must appear in the deal's inclusions JSON */
  inclusionsIncludeAny?: string[];
  /** Sort order — defaults to cheapest */
  sort?: "price-asc" | "price-desc" | "savings" | "duration";
}

export interface Modifier {
  slug: string;                    // kebab case, used in URL
  label: string;                   // "For Families"
  h1Fragment: string;              // used in H1: "Vacation Deals in Orlando {h1Fragment}"
  metaBlurb: string;               // used in meta title/description variant
  type: ModifierType;
  filter: DealFilterSpec;
  /** If set, only these citySlugs get this modifier. Unset = all priority cities. */
  applicableCities?: string[];
  /** Short label for sub-nav chip (defaults to `label`) */
  chipLabel?: string;
  /** Intro template — supports {{city}}, {{cityState}}, {{dealCount}}, {{lowPrice}}, {{brandCount}}, {{durationSample}}, {{cityBlurb}}, {{commonInclusions}} */
  introTemplate: string;
  /** FAQs for this modifier, city-agnostic */
  faqs: { q: string; a: string }[];
}

// ---------------------------------------------------------------------------
// City blurb pools — 4-5 unique 50-word paragraphs per city, rotated so
// sublanders within the same city don't repeat verbatim.
// ---------------------------------------------------------------------------

export const CITY_BLURB_POOLS: Record<string, string[]> = {
  orlando: [
    "Orlando is the theme-park capital, and it's built for vacpacks. Westgate, Wyndham, Holiday Inn Club, and Hilton Grand Vacations all have full resort complexes here — every one runs preview rates because there's always a new tower to sell timeshares in.",
    "Every major timeshare brand operates an Orlando flagship, which means the supply of preview packages here is deeper than anywhere else in the country. On a typical week we track 80 to 100 active Orlando deals, from Kissimmee to Lake Buena Vista to International Drive.",
    "Orlando runs on preview inventory. Disney's close enough to justify the stay, Universal's closer, and the weather cooperates roughly eight months a year — which is why $59 and $79 Orlando vacpacks never quite run out.",
    "Nothing else moves vacation packages like Orlando does. With Walt Disney World, Universal Epic Universe, and a half-dozen springs within driving distance, the resorts here have no trouble filling preview rooms at 80%+ off rack.",
  ],
  "las-vegas": [
    "Vegas is the other great vacpack market. Westgate Las Vegas Resort & Casino, Club Wyndham Grand Desert, and HGV on the Boulevard all run presentations off the Strip, and the deals follow a predictable cycle — weekend prices climb, mid-week stays collapse to $79-$99.",
    "Las Vegas vacpacks are engineered for the mid-week traveler. Most Vegas previews are 2- or 3-night Sunday-through-Wednesday stays, which lets the resorts fill rooms that would otherwise sit empty. That's why the Strip-adjacent deal floor here is $59.",
    "Vegas vacpacks include a twist most cities don't: gambling credit. Many Club Wyndham and Westgate packages add $50-$200 in table play or resort credit when you finish the presentation, which softens the 90-minute tradeoff considerably.",
    "The Las Vegas timeshare complex is bigger than most visitors realize — Westgate, Wyndham, HGV, Marriott, Hilton, and Worldmark all pitch off the Strip. That competition keeps preview prices permanently low and the inclusions generous.",
  ],
  gatlinburg: [
    "Gatlinburg's timeshare market is dominated by Westgate Smoky Mountain Resort and Wild Bear Inn, both running preview rates that include their in-house waterpark. It's one of the few cabin-style vacpack markets in the country.",
    "Great Smoky Mountains National Park runs right up to Gatlinburg, and the preview resorts here lean into the cabin aesthetic — fireplace suites, wraparound decks, and indoor/outdoor pools are standard. Deals run $59-$99 off-season.",
    "Gatlinburg vacpacks peak in fall during leaf season — and that's when the price premium hits. Summer and winter weeks usually deliver $59 Westgate deals plus Wild Bear Falls waterpark access.",
  ],
  "myrtle-beach": [
    "Myrtle Beach's Grand Strand has oceanfront vacpack inventory year-round. Westgate, Bluegreen, Hilton Grand Vacations, and Spinnaker all run preview rates here, and the off-season prices are some of the lowest beach deals in the country.",
    "If you want a cheap beach week, Myrtle Beach is usually the answer. The 60-mile Grand Strand is dense with timeshare resorts, and the preview packages rotate through $59, $79, and $99 price points depending on travel dates.",
    "Most Myrtle Beach vacpacks are 3 or 4 nights from Sunday to Thursday, which dodges the peak weekend pricing. Pair that with the oceanfront room category most brands offer and you're at a full beach vacation for under $200.",
  ],
  branson: [
    "Branson has a surprisingly deep vacpack market for its size — Westgate Branson Lakes Resort runs year-round previews with entertainment-hub bonuses (free show tickets bundled into some packages). Most deals here are $59 to $99 for 2-3 nights.",
    "The Ozarks draw timeshare traffic because Branson's live-entertainment economy is built for short stays. That's why the preview resorts here — primarily Westgate — keep 2- and 3-night vacpack rates low and steady.",
  ],
  williamsburg: [
    "Williamsburg's colonial character pulls history travelers, and the timeshare resorts lean into it. Westgate, Bluegreen, and Holiday Inn Club all run preview rates here, often bundling Busch Gardens or Colonial Williamsburg tickets into the package.",
    "Between Busch Gardens, Water Country USA, and Colonial Williamsburg, there's easily a week of activities in greater Williamsburg. Vacpacks here tend to be 3- to 5-night stays priced from $79.",
  ],
  "cocoa-beach": [
    "Cocoa Beach is Florida's Space Coast — oceanfront surfing, Kennedy Space Center, and a steady stream of timeshare previews, especially from Westgate and Vacation Village. Prices start at $59 for 3-night stays.",
    "If you want Florida beach access without Orlando traffic, Cocoa Beach is the move. The oceanfront resorts here run vacation previews that sit around $59-$99 for 3 nights, with direct beach access in most units.",
  ],
  cancun: [
    "Cancun vacpacks are all-inclusive territory. Most Cancun preview packages bundle meals, drinks, and airport transfers into the base price, which is why the headline rate climbs to $399-$699 but still undercuts anything you'd book direct.",
    "The Cancun market is split between direct-booked resort previews and broker packages (BookVIP, Monster Reservations, StayPromo). Either way, you're getting all-inclusive 4-5 night stays at 70%+ off retail.",
  ],
  "puerto-vallarta": [
    "Puerto Vallarta's preview market is dominated by Villa Group and Pueblo Bonito — both running all-inclusive vacpacks that bundle meals and beach-club access. Deals hit $499-$699 for 4 nights, which is less than a single night at most oceanfront Mexican resorts.",
    "Pacific-coast Mexico vacpacks in Puerto Vallarta trend toward luxury: private beach clubs, sunset cruises, and concierge service are standard inclusions, which is why the entry price is higher than Cancun.",
  ],
  "cabo-san-lucas": [
    "Cabo's preview market is smaller and pricier than Cancun's, but the properties are top-tier. Pueblo Bonito, Villa Group, and TAFER all run 4-night all-inclusive vacpacks from $699 — still well under typical Cabo nightly rates.",
    "Cabo vacpacks are engineered for sport-fishing and beach-club travelers. Most 4-night packages include airport transfers, unlimited meals and premium drinks, and access to golf, pools, and excursions.",
  ],
  "punta-cana": [
    "Punta Cana's Bahia Principe and broker packages (BookVIP, StayPromo) deliver 4-5 night all-inclusive vacpacks from $499. The Caribbean beach, pool complexes, and unlimited meals get included on the base price.",
  ],
  "daytona-beach": [
    "Daytona's beach is a 23-mile hard-packed expanse, and the timeshare resorts here run $59-$99 vacpacks that include oceanfront room categories. Preview inventory stays consistent through the year.",
  ],
  nashville: [
    "Nashville's preview market is growing but still small compared to Orlando or Vegas. Most deals here start at $99 for 2-3 night stays, with Holiday Inn Club and Wyndham running the bulk of the inventory.",
  ],
  charleston: [
    "Charleston's historic downtown plus Wild Dunes and Kiawah Island means the preview market here is a mix of in-town boutique and beach resorts. Deals run $79-$199 for 3 nights.",
  ],
  "park-city": [
    "Park City's ski preview market runs peak-season pricing ($199-$399 for 3 nights), but shoulder-season vacpacks drop to $99. Westgate Park City is the anchor, with ski-in/ski-out units included in most packages.",
  ],
  "lake-tahoe": [
    "Lake Tahoe preview inventory splits between winter ski vacpacks and summer lake-access packages. Off-peak weeks from Sunday-Thursday routinely hit $99 for 3 nights.",
  ],
  "key-west": [
    "Key West preview stays run higher than most Florida markets because the island is small and demand is year-round. Expect $199-$399 vacpack rates for 3-4 nights.",
  ],
  maui: [
    "Maui preview inventory is dominated by Hilton Grand Vacations' Ocean Tower on Ka'anapali Beach. 4-night vacpacks from $599-$899 — a fraction of the $549+ public nightly rate. Premium brand, gentle presentation.",
    "Hawaii's Maui market is small but high-value. HGV and Marriott Vacation Club both operate preview programs on Ka'anapali, with beachfront suites, whale-watching seasons, and 50,000+ Hilton Honors point bonuses bundled in.",
  ],
  "hilton-head": [
    "Hilton Head's upscale beach vacpacks come from Marriott's Monarch at Sea Pines and a handful of Westgate/Bluegreen oceanfront properties. $199-$349 for 3-4 nights with golf + beach access.",
  ],
  "ormond-beach": [
    "Ormond Beach sits just north of Daytona with calmer beaches and lower vacpack prices. Westgate and Vacation Village both run $99-$149 3-night stays year-round.",
  ],
  "new-smyrna-beach": [
    "New Smyrna Beach is Florida's secret surf town with preview inventory from Vacation Village at Weston Beach Resort. 3-night stays from $99-$179.",
  ],
  cozumel: [
    "Cozumel all-inclusive vacpacks leverage the island's snorkel and dive scene. Bahia Principe Grand Cozumel and Occidental Cozumel both run preview packages from $599-$899 for 4-5 nights.",
  ],
  atlanta: [
    "Atlanta has a small but growing preview market anchored by Club Wyndham Atlanta. Most vacpacks here are 2-3 night urban packages from $149-$249 — ideal for events and short getaways.",
  ],
  "river-ranch": [
    "Westgate River Ranch is a unique dude-ranch-style Florida preview resort. 3-night vacpacks from $99 include horseback riding, archery, and a working-ranch experience not found at other timeshare properties.",
  ],
};

// ---------------------------------------------------------------------------
// Modifier definitions
// ---------------------------------------------------------------------------

// Reusable FAQ fragments
const faqDeposit = {
  q: "Is there a deposit required?",
  a: "Yes — most vacpacks require a $49-$199 refundable deposit at booking, which is returned after you attend the 90-minute presentation. It's not an extra charge; it's a no-show deterrent.",
};
const faqSingleParent = {
  q: "Can I attend as a single parent?",
  a: "Yes, though about a third of brands require both members of a married couple to attend together. Single parents (divorced, widowed, single) generally qualify on their own.",
};
const faqAgeLimit = {
  q: "Do I need to be 28 or over?",
  a: "Most brands require age 25+, a few require 28+, and Wyndham bumps to 30 in some markets. Photo ID is checked at the presentation.",
};
const faqIncomeFloor = {
  q: "What's the income requirement?",
  a: "Standard floor is $50K household income; Marriott, HGV, and Hyatt use $75K. You won't be asked for pay stubs — verbal confirmation at check-in is enough.",
};

export const MODIFIERS: Record<string, Modifier> = {
  // ===================== AUDIENCE (10) =====================
  "for-families": {
    slug: "for-families",
    label: "For Families",
    h1Fragment: "for Families",
    metaBlurb: "family-friendly",
    type: "audience",
    chipLabel: "Families",
    filter: { brandSlugsExclude: ["westgate-events"], sort: "price-asc" },
    introTemplate:
      "Family vacations in {{city}} are the exact category vacpacks were built for. {{dealCount}} family-ready packages are live right now starting around \\${{lowPrice}} for {{durationSample}}, and each one comes with a resort unit roomy enough that nobody has to share a pull-out.\n\n{{cityBlurb}}\n\nWhat every family-friendly {{city}} vacpack on this page shares: at least 2 adults plus children allowed, kitchen or kitchenette (so you can skip the $60 resort breakfast), and a pool or waterpark on-site. The 90-minute presentation is adults-only — resorts run a supervised kids' club or activity slot during it — so the pitch doesn't eat into actual vacation time.",
    faqs: [
      { q: "Can I bring kids on a vacpack?", a: "Yes. Every deal on this page allows children. Most units sleep 4-6, and bunk rooms are common at Westgate, Wyndham, and Holiday Inn Club properties." },
      { q: "Are kids allowed in the sales presentation?", a: "Not in the room, but resorts provide free supervised childcare or a kids' club during the 90-minute pitch. Bring something to keep them occupied just in case." },
      { q: "Which brand has the most family-focused units?", a: "Holiday Inn Club Vacations and Westgate both purpose-build 2-bedroom suites with bunk rooms. Wyndham's larger Orlando properties (Bonnet Creek, Star Island) are also strong picks." },
      faqSingleParent,
      faqDeposit,
      { q: "Can I book a family vacpack without a partner?", a: "Single parents and widowed/divorced travelers book solo at most brands. A small number of brands require both spouses for married couples, but singles are fine." },
    ],
  },
  "for-couples": {
    slug: "for-couples",
    label: "For Couples",
    h1Fragment: "for Couples",
    metaBlurb: "couples-friendly",
    type: "audience",
    chipLabel: "Couples",
    filter: { sort: "price-asc" },
    introTemplate:
      "Couples travel in {{city}} is the bread and butter of the vacpack business. {{dealCount}} packages designed for 2 adults are available right now from \\${{lowPrice}}, and most run 2-4 nights — enough for a full weekend escape without burning a full PTO week.\n\n{{cityBlurb}}\n\nEvery deal on this page allows 2 adults as the booking party. Brands like HGV, Marriott, and Hyatt lean into the couples market with ocean-view suites and resort-credit inclusions; Westgate and Wyndham dominate the budget end.",
    faqs: [
      { q: "Do I need a marriage certificate?", a: "No. Unmarried couples book vacpacks constantly. About a third of brands do require both members of a legal marriage to attend the presentation together, but that's the only relationship check." },
      { q: "Can same-sex couples book these deals?", a: "Absolutely. Brands verify income and age, not relationship structure." },
      faqAgeLimit,
      faqIncomeFloor,
      faqDeposit,
      { q: "What's the best couples brand?", a: "For under $150, Westgate and Wyndham. For $200-$400 premium experiences, HGV and Marriott Vacation Club." },
    ],
  },
  "for-seniors": {
    slug: "for-seniors",
    label: "For Seniors",
    h1Fragment: "for Seniors (55+)",
    metaBlurb: "senior-friendly",
    type: "audience",
    chipLabel: "Seniors",
    filter: { brandSlugsInclude: ["bluegreen", "hgv", "wyndham", "hyatt", "marriott", "westgate"], sort: "price-asc" },
    introTemplate:
      "Retired-traveler vacpacks in {{city}} favor slower-paced resorts and less-aggressive sales floors. {{dealCount}} packages that lean senior-friendly are live right now from \\${{lowPrice}}, and most run quiet 3-night Sunday-through-Wednesday stays.\n\n{{cityBlurb}}\n\nBluegreen, Hilton Grand Vacations, and Hyatt Vacation Club have the most respectful presentations for the 55+ demographic — typically finishing inside 75 minutes and skipping the high-pressure manager drop-in.",
    faqs: [
      { q: "Is there an upper age limit on vacpacks?", a: "No. As long as you meet the income floor (usually $50K household), age doesn't disqualify you." },
      { q: "Do Medicare or Social Security count as income?", a: "Yes. Pension, Social Security, annuity payments, and investment income all count toward the income requirement." },
      { q: "Which brands have the lowest-pressure presentations?", a: "Bluegreen, Hyatt Vacation Club, and HGV are reported as the most respectful. Westgate and Wyndham run harder closes but still finish at 90 minutes if you stay firm." },
      faqDeposit,
      { q: "Can I bring an adult child on the vacpack?", a: "Yes — additional adults in the unit are fine. Only the booking couple/single is required to attend the presentation." },
    ],
  },
  "solo-travelers": {
    slug: "solo-travelers",
    label: "Solo Travelers",
    h1Fragment: "for Solo Travelers",
    metaBlurb: "solo-friendly",
    type: "audience",
    chipLabel: "Solo",
    filter: { sort: "price-asc" },
    introTemplate:
      "Solo vacpacks in {{city}} work, but the field is narrower — about a third of brands require a married couple to attend the pitch together. {{dealCount}} deals on this page accept single-booking travelers for \\${{lowPrice}} and up.\n\n{{cityBlurb}}\n\nDivorced, widowed, or never-married travelers qualify at most major brands. Unmarried couples where only one is traveling usually also qualify — the restriction is specifically on married travelers attending solo.",
    faqs: [
      { q: "Which brands accept solo bookings?", a: "BookVIP, Westgate, Wyndham, Holiday Inn Club, Spinnaker, and Vacation Village all accept single travelers. Marriott, HGV, and Hyatt sometimes require a partner." },
      { q: "Do I have to be single?", a: "You have to be either single (unmarried) OR married-but-traveling-alone-with-approval. Most brands won't let legally-married couples send one spouse." },
      faqIncomeFloor,
      faqDeposit,
    ],
  },
  "for-groups": {
    slug: "for-groups",
    label: "For Groups",
    h1Fragment: "for Groups",
    metaBlurb: "group-friendly",
    type: "audience",
    chipLabel: "Groups",
    filter: { sort: "price-asc" },
    introTemplate:
      "Group trips in {{city}} work well with vacpacks when one person in the group qualifies for the booking. {{dealCount}} packages here sleep 4-6+ in a single 2-bedroom unit starting at \\${{lowPrice}}, so the per-person cost can drop under $30 for the whole stay.\n\n{{cityBlurb}}\n\nThe qualifying traveler goes to the 90-minute presentation; the rest of the group enjoys the pool. Resorts don't limit non-booked guests as long as occupancy stays under the unit's max.",
    faqs: [
      { q: "How many people can sleep in a vacpack unit?", a: "Most 2-bedroom units sleep 6-8 with pull-outs. 3-bedroom Westgate and Wyndham units sleep 10." },
      { q: "Do all group members need to attend the pitch?", a: "No — only the booking party (1 or 2 people). The rest of the group is free." },
      faqDeposit,
      { q: "Can multiple families share a unit?", a: "Yes, as long as you don't exceed posted occupancy. Two families in a 2BR with bunk rooms works well." },
    ],
  },
  "bachelor-party": {
    slug: "bachelor-party",
    label: "Bachelor Party",
    h1Fragment: "for a Bachelor Party",
    metaBlurb: "bachelor-party",
    type: "audience",
    chipLabel: "Bachelor",
    filter: { durationNights: [2, 3], sort: "price-asc" },
    applicableCities: ["las-vegas", "nashville", "miami", "orlando", "new-orleans"],
    introTemplate:
      "Bachelor-party vacpacks in {{city}} hit a sweet spot: a 2- or 3-night resort unit cheaper than four hotel rooms, plus the inclusions are usually compatible with group-trip chaos (late checkout, comp drinks, resort credit). {{dealCount}} packages are live right now from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nBooking a 2-bedroom or 3-bedroom unit gets the whole crew under one roof. The qualifying member does the 90-minute pitch, the groomsmen sleep it off.",
    faqs: [
      { q: "Can I book a bachelor party with all single guys?", a: "Yes. One of them books, brings a valid ID for the presentation, and the rest are guests. Most vacpacks don't care who's in the unit." },
      { q: "Will resort staff care if we're loud?", a: "Normal pool and property behavior is fine. Full hotel rules apply — if the front desk gets noise complaints after quiet hours, same consequences as any other hotel." },
      faqDeposit,
      { q: "Which brand is best for bachelor parties?", a: "Westgate Las Vegas Resort & Casino, Club Wyndham Grand Desert, and HGV Elara are the top Vegas picks. All run 2-3 night preview stays from $59-$99." },
    ],
  },
  "bachelorette-party": {
    slug: "bachelorette-party",
    label: "Bachelorette Party",
    h1Fragment: "for a Bachelorette Party",
    metaBlurb: "bachelorette-party",
    type: "audience",
    chipLabel: "Bachelorette",
    filter: { durationNights: [2, 3], sort: "price-asc" },
    applicableCities: ["las-vegas", "nashville", "miami", "charleston", "new-orleans"],
    introTemplate:
      "Bachelorette vacpacks in {{city}} unlock a full 2-bedroom or 3-bedroom resort unit for less than one night at a downtown hotel. {{dealCount}} packages are live right now from \\${{lowPrice}} — enough room for 6-8 attendees without paying per-room premiums.\n\n{{cityBlurb}}\n\nOne party member books and does the presentation. Everyone else rolls in for the pool deck and downtown. The kitchen cuts $150/day in breakfast and mimosa costs.",
    faqs: [
      { q: "How many people sleep in a 2BR vacpack?", a: "Usually 6-8 with pull-out sofas and bunks. 3BR Wyndham and Westgate units sleep 10." },
      { q: "Do all attendees need to attend the sales pitch?", a: "No. The booking traveler (or booking couple) attends. The rest are free." },
      faqDeposit,
      { q: "Which city is best for a bachelorette vacpack?", a: "Nashville and Las Vegas have the deepest bachelorette inventory. Charleston and Miami have smaller but higher-end preview markets." },
    ],
  },
  "honeymoon": {
    slug: "honeymoon",
    label: "Honeymoon",
    h1Fragment: "for a Honeymoon",
    metaBlurb: "honeymoon",
    type: "audience",
    chipLabel: "Honeymoon",
    filter: { brandSlugsInclude: ["hgv", "marriott", "hyatt", "bahia-principe", "villa-group", "pueblo-bonito", "divi", "bookvip"], sort: "price-asc" },
    applicableCities: ["cancun", "cabo-san-lucas", "puerto-vallarta", "punta-cana", "las-vegas", "key-west", "orlando", "maui"],
    introTemplate:
      "Honeymoon vacpacks in {{city}} skew premium. {{dealCount}} packages on this page target newlywed travelers with oceanfront suites, all-inclusive options, and couples-activity inclusions, starting at \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nPremium brands (HGV, Marriott Vacation Club, Villa Group, Pueblo Bonito) run 4-5 night honeymoon packages that include spa credit, private beach dinners, or couples' massages on top of the standard resort stay.",
    faqs: [
      { q: "Is a vacpack honeymoon weird?", a: "Only if the 90-minute pitch bothers you. The resort stays themselves are identical to what you'd book direct — often at the exact same premium properties." },
      { q: "Can we get a suite upgrade on a vacpack?", a: "Frequently. Resorts like to stage upgrade tours for honeymooners because it doubles as a sales pitch. Ask at check-in." },
      faqDeposit,
      { q: "Best honeymoon cities for vacpacks?", a: "Cancun, Cabo, Puerto Vallarta, and Maui for beach honeymoons. Key West and Las Vegas for domestic. Expect $399-$999 for 4-5 night premium packages." },
    ],
  },
  "destination-wedding": {
    slug: "destination-wedding",
    label: "Destination Wedding",
    h1Fragment: "for a Destination Wedding",
    metaBlurb: "destination wedding",
    type: "audience",
    chipLabel: "Wedding",
    filter: { brandSlugsInclude: ["bahia-principe", "villa-group", "pueblo-bonito", "divi", "bookvip"], sort: "price-asc" },
    applicableCities: ["cancun", "cabo-san-lucas", "puerto-vallarta", "punta-cana"],
    introTemplate:
      "Destination-wedding vacpacks in {{city}} aren't for the wedding couple — they're for the guests. {{dealCount}} all-inclusive packages here give attendees 4-5 nights at the wedding resort (or a sister property) from \\${{lowPrice}}, which undercuts the wedding's group rate by 30-50%.\n\n{{cityBlurb}}\n\nBrokers like BookVIP and Villa Group list most of these. The guest books the vacpack, attends the pitch on a non-wedding day, and uses the other 4 nights for the ceremony, reception, and hangover recovery.",
    faqs: [
      { q: "Can wedding guests use vacpacks instead of the bride's group rate?", a: "Usually yes, if the couple's resort runs a preview program or has a broker partnership. BookVIP and Monster Reservations both list Cancun/Cabo options." },
      { q: "Will the resort honor the wedding block's amenities?", a: "Generally yes for public events (reception, beach ceremony). Private dinners may be block-only." },
      faqDeposit,
    ],
  },
  "girls-trip": {
    slug: "girls-trip",
    label: "Girls Trip",
    h1Fragment: "for a Girls' Trip",
    metaBlurb: "girls-trip",
    type: "audience",
    chipLabel: "Girls Trip",
    filter: { sort: "price-asc" },
    applicableCities: ["las-vegas", "nashville", "miami", "charleston", "myrtle-beach", "orlando", "key-west"],
    introTemplate:
      "Girls-trip vacpacks in {{city}} deliver a full resort suite for a group of 4-6 at a per-person cost under $25-$50 for the stay. {{dealCount}} packages are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nOne member books and handles the 90-minute presentation; everyone else pools for groceries and goes to the pool. The math on a 3-night, 2-bedroom Westgate unit at $99 total split across 6 people is $16.50 per person.",
    faqs: [
      { q: "Does everyone need to attend the presentation?", a: "No. Only the booking party. The rest are guests." },
      { q: "Which brand has the most girls-trip-ready units?", a: "Westgate and Wyndham 2BR suites are standard. For premium trips, HGV Elara (Vegas) and HGV Grand Islander (Honolulu)." },
      faqDeposit,
    ],
  },

  // ===================== SEASON (6) =====================
  "summer": {
    slug: "summer",
    label: "Summer",
    h1Fragment: "in Summer",
    metaBlurb: "summer",
    type: "season",
    chipLabel: "Summer",
    filter: { sort: "price-asc" },
    introTemplate:
      "Summer vacpacks in {{city}} are the seasonal sweet spot for family travel and pool weather. {{dealCount}} packages valid for summer stays are live right now from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nJune through August is peak-demand but also peak-supply — the resorts need to fill preview rooms too, so $59-$129 {{city}} deals stay available if you book Sunday-Thursday check-ins. Weekend summer stays carry a modest premium.",
    faqs: [
      { q: "Are vacpacks cheaper in summer or winter?", a: "Depends on the destination. Mountain markets (Gatlinburg, Park City) are cheaper in summer. Beach and theme-park markets charge their highest summer rates but still beat hotels substantially." },
      { q: "Which {{city}} summer weeks sell out first?", a: "4th of July week and the first two weeks of August. Book 60+ days ahead for those; other weeks have flexible availability." },
      faqDeposit,
      { q: "Does the kids' pool stay open year-round?", a: "At theme-park and beach resorts, yes. Mountain resorts (Gatlinburg, Park City) run seasonal pools — summer is peak." },
    ],
  },
  "fall": {
    slug: "fall",
    label: "Fall",
    h1Fragment: "in Fall",
    metaBlurb: "fall",
    type: "season",
    chipLabel: "Fall",
    filter: { sort: "price-asc" },
    introTemplate:
      "Fall vacpacks in {{city}} hit the shoulder-season sweet spot — summer crowds gone, winter weather still far away, and the preview-package resorts still need to move inventory. {{dealCount}} packages are live right now from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nSeptember through early November is frequently the cheapest quarter of the year for {{city}} vacpacks. Exceptions: Gatlinburg during leaf peak (mid-October) runs higher.",
    faqs: [
      { q: "When is the cheapest fall week in {{city}}?", a: "Typically the weeks after Labor Day (early September) and the 2-3 weeks before Thanksgiving. Mid-October leaf weeks in mountain cities are the exception." },
      { q: "Do Halloween events get bundled in?", a: "Orlando vacpacks frequently bundle Halloween Horror Nights discounts during September-October. Ask at booking." },
      faqDeposit,
    ],
  },
  "spring": {
    slug: "spring",
    label: "Spring",
    h1Fragment: "in Spring",
    metaBlurb: "spring",
    type: "season",
    chipLabel: "Spring",
    filter: { sort: "price-asc" },
    introTemplate:
      "Spring vacpacks in {{city}} hit before the summer crowds and after winter rates drop. {{dealCount}} packages are live right now from \\${{lowPrice}} for spring check-ins.\n\n{{cityBlurb}}\n\nMid-March through mid-May is the shoulder season for most vacpack markets. Exceptions: spring-break weeks (the two weeks around Easter) carry a premium in Florida, Texas, and Arizona cities.",
    faqs: [
      { q: "Are vacpacks good for spring break?", a: "Yes — see our spring-break sublander. Book 60-90 days ahead; the 2-week peak sells out." },
      { q: "Is spring cheaper than summer?", a: "For most cities, yes. Mountain markets run similar prices both seasons." },
      faqDeposit,
    ],
  },
  "winter": {
    slug: "winter",
    label: "Winter",
    h1Fragment: "in Winter",
    metaBlurb: "winter",
    type: "season",
    chipLabel: "Winter",
    filter: { sort: "price-asc" },
    introTemplate:
      "Winter vacpacks in {{city}} split into two categories: warm-weather escape or snow destination. {{dealCount}} packages are valid for winter stays right now from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nJanuary-February are typically the cheapest months for {{city}} vacpacks. December holiday weeks and ski-season weeks at mountain resorts carry premiums; late-January dips are often the lowest-price weeks of the year.",
    faqs: [
      { q: "Is January a good month for vacpacks?", a: "Yes — for beach and theme-park destinations, January-early February are often the cheapest weeks of the year." },
      { q: "Are ski vacpacks a thing?", a: "Yes. Park City and Lake Tahoe run ski-in/ski-out preview stays with lift-ticket bundles, typically $299-$499 for 3-4 nights." },
      faqDeposit,
    ],
  },
  "spring-break": {
    slug: "spring-break",
    label: "Spring Break",
    h1Fragment: "for Spring Break",
    metaBlurb: "spring-break",
    type: "season",
    chipLabel: "Spring Break",
    filter: { sort: "price-asc" },
    applicableCities: ["orlando", "cocoa-beach", "daytona-beach", "miami", "myrtle-beach", "cancun", "cabo-san-lucas", "punta-cana", "puerto-vallarta", "las-vegas"],
    introTemplate:
      "Spring-break vacpacks in {{city}} hit the two-week stretch around Easter — the highest-demand window of the non-summer year. {{dealCount}} packages are live right now from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nInventory for the peak two weeks usually locks in 60-90 days ahead. Booking in January or February for an April spring-break check-in gets the best selection.",
    faqs: [
      { q: "When do spring-break vacpacks sell out?", a: "The two weeks before Easter typically sell to 90% capacity by early February." },
      { q: "Are college students welcome?", a: "Yes, if they meet the age requirement (usually 25+). If not, a parent can book and the students are guests." },
      faqDeposit,
    ],
  },
  "shoulder-season": {
    slug: "shoulder-season",
    label: "Shoulder Season",
    h1Fragment: "in Shoulder Season",
    metaBlurb: "shoulder-season",
    type: "season",
    chipLabel: "Shoulder",
    filter: { sort: "price-asc" },
    introTemplate:
      "Shoulder-season vacpacks in {{city}} target the weeks between peak demand windows — when resorts need to move preview inventory and prices bottom out. {{dealCount}} packages are live right now from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nTypical shoulder windows: late August to mid-December (excluding Thanksgiving/Christmas), and January 2-mid-February.",
    faqs: [
      { q: "What's the cheapest week of the year?", a: "Historically, the first full week of December and the second week of January are the absolute lowest for most US cities." },
      faqDeposit,
    ],
  },

  // ===================== OCCASION (7) =====================
  "last-minute": {
    slug: "last-minute",
    label: "Last Minute",
    h1Fragment: "(Last Minute)",
    metaBlurb: "last-minute",
    type: "occasion",
    chipLabel: "Last Minute",
    filter: { sort: "price-asc" },
    introTemplate:
      "Last-minute vacpacks in {{city}} come down to what the resort needs to fill this week. {{dealCount}} packages are live right now from \\${{lowPrice}}, most bookable for check-ins within 14-45 days.\n\n{{cityBlurb}}\n\nLast-minute rates are usually the same as far-out rates on vacpacks — the preview-pricing model doesn't mark up for urgency the way regular hotels do. You get the same $59-$99 floor whether you book 6 months or 6 days ahead.",
    faqs: [
      { q: "How close to check-in can I book?", a: "Most brands allow booking up to 14-30 days out. A few (StayPromo, BookVIP) accept 3-day-out bookings." },
      { q: "Are last-minute vacpacks more expensive?", a: "No. The preview rate structure is flat — same $59-$199 whether you book 180 days or 14 days out." },
      faqDeposit,
    ],
  },
  "memorial-day-weekend": {
    slug: "memorial-day-weekend",
    label: "Memorial Day Weekend",
    h1Fragment: "for Memorial Day Weekend",
    metaBlurb: "memorial-day",
    type: "occasion",
    chipLabel: "Memorial Day",
    filter: { durationNights: [3, 4], sort: "price-asc" },
    introTemplate:
      "Memorial Day Weekend vacpacks in {{city}} kick off the summer travel season. {{dealCount}} 3- and 4-night packages valid for the long weekend are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nMemorial Day weekend runs at ~10-20% premium vs adjacent weeks. Book 45-60 days ahead — inventory thins aggressively after mid-April.",
    faqs: [
      { q: "Is Memorial Day weekend more expensive?", a: "Usually a small premium (10-20%) vs adjacent weekends. Still far below peak summer pricing." },
      { q: "Can I book a Saturday check-in?", a: "Most vacpacks prefer Sunday-Thursday check-ins. A small subset support Friday/Saturday starts at a premium." },
      faqDeposit,
    ],
  },
  "july-4th": {
    slug: "july-4th",
    label: "July 4th",
    h1Fragment: "for July 4th",
    metaBlurb: "july-4th",
    type: "occasion",
    chipLabel: "July 4th",
    filter: { sort: "price-asc" },
    introTemplate:
      "July 4th vacpacks in {{city}} hit peak summer demand. {{dealCount}} packages valid for Independence Day week are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nMost July 4th weeks sell out by mid-May. Book early or be flexible with check-in dates (Sunday-Wednesday starts over the holiday).",
    faqs: [
      { q: "How early should I book July 4th week?", a: "60-90 days is ideal. 45 days out is workable but limited inventory." },
      faqDeposit,
    ],
  },
  "labor-day-weekend": {
    slug: "labor-day-weekend",
    label: "Labor Day Weekend",
    h1Fragment: "for Labor Day Weekend",
    metaBlurb: "labor-day",
    type: "occasion",
    chipLabel: "Labor Day",
    filter: { durationNights: [3, 4], sort: "price-asc" },
    introTemplate:
      "Labor Day Weekend vacpacks in {{city}} close out the summer travel season. {{dealCount}} 3- and 4-night packages are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nLabor Day is the last major summer window, and resorts typically run a small premium (~10%) but less than July 4th. Book 30-45 days ahead.",
    faqs: [
      faqDeposit,
      { q: "Is Labor Day weekend cheaper than July 4th?", a: "Usually by 5-10%. Labor Day is the end-of-season window, so inventory is more stable." },
    ],
  },
  "thanksgiving": {
    slug: "thanksgiving",
    label: "Thanksgiving",
    h1Fragment: "for Thanksgiving",
    metaBlurb: "thanksgiving",
    type: "occasion",
    chipLabel: "Thanksgiving",
    filter: { sort: "price-asc" },
    introTemplate:
      "Thanksgiving vacpacks in {{city}} work for warm-weather escape or family reunion trips. {{dealCount}} packages with Thanksgiving-week availability are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nThe actual Thanksgiving Thursday-Sunday window is premium; Monday-Wednesday of Thanksgiving week is often cheaper than normal weeks.",
    faqs: [
      { q: "Can we cook Thanksgiving dinner in the unit?", a: "Yes — most 2BR+ units have full kitchens with ovens. Worth doing if the group is 4+." },
      faqDeposit,
    ],
  },
  "christmas": {
    slug: "christmas",
    label: "Christmas",
    h1Fragment: "for Christmas",
    metaBlurb: "christmas",
    type: "occasion",
    chipLabel: "Christmas",
    filter: { sort: "price-asc" },
    introTemplate:
      "Christmas vacpacks in {{city}} run at peak-of-peak demand. {{dealCount}} packages valid for Christmas week are live from \\${{lowPrice}} — book 90-120 days ahead if you can.\n\n{{cityBlurb}}\n\nChristmas week (Dec 22-28) is the most constrained inventory of the year. The week before and after run at normal rates with full availability.",
    faqs: [
      { q: "How far ahead should I book Christmas week?", a: "90-120 days is ideal. Inside 45 days is usually sold out." },
      faqDeposit,
    ],
  },
  "new-years": {
    slug: "new-years",
    label: "New Year's",
    h1Fragment: "for New Year's",
    metaBlurb: "new-years",
    type: "occasion",
    chipLabel: "New Year's",
    filter: { sort: "price-asc" },
    introTemplate:
      "New Year's vacpacks in {{city}} hit the final peak travel window of the year. {{dealCount}} packages valid for New Year's week are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nDec 29-Jan 2 is premium. Jan 3-6 usually drops back to normal rates and can be a great shoulder-of-peak play.",
    faqs: [
      faqDeposit,
      { q: "Is NYE cheaper in January 3-6?", a: "Yes. The three days after New Year's typically run at standard rates with full availability." },
    ],
  },

  // ===================== BUDGET (5) =====================
  "under-99": {
    slug: "under-99",
    label: "Under $99",
    h1Fragment: "Under $99",
    metaBlurb: "under $99",
    type: "budget",
    chipLabel: "Under $99",
    filter: { maxPrice: 99, sort: "price-asc" },
    introTemplate:
      "Vacpacks in {{city}} under $99 represent the absolute floor of the preview-package market. {{dealCount}} packages under $99 are live right now — usually Sunday-Wednesday 2- and 3-night stays from the legacy brands.\n\n{{cityBlurb}}\n\nAt this price point the brand mix is almost entirely Westgate, Wyndham, and broker packages (StayPromo, Monster Reservations). Premium brands (HGV, Marriott) don't typically operate below $99.",
    faqs: [
      { q: "Is $59 a real vacpack price?", a: "Yes — Westgate runs $59 packages year-round for 2- and 3-night Sunday-through-Wednesday stays in Orlando, Vegas, Branson, Gatlinburg, and Myrtle Beach." },
      { q: "What's the catch on a $59 vacpack?", a: "The 90-minute presentation is the only catch. The room category is legit, the resort is legit, and the deposit comes back after you attend." },
      faqDeposit,
    ],
  },
  "under-149": {
    slug: "under-149",
    label: "Under $149",
    h1Fragment: "Under $149",
    metaBlurb: "under $149",
    type: "budget",
    chipLabel: "Under $149",
    filter: { maxPrice: 149, sort: "price-asc" },
    introTemplate:
      "Vacpacks in {{city}} under $149 are the sweet spot of the market — most Westgate, Wyndham, Holiday Inn Club, and Bluegreen preview stays land here. {{dealCount}} packages under $149 are live right now.\n\n{{cityBlurb}}\n\nThis price range unlocks 3- and 4-night stays plus upgraded room categories (oceanfront, waterpark view, 1-bedroom suites) that $99 packages don't include.",
    faqs: [
      faqDeposit,
      { q: "How much more do I get in the $100-$149 range vs under $99?", a: "Usually one extra night, a better room category (oceanfront vs standard), or both." },
    ],
  },
  "under-199": {
    slug: "under-199",
    label: "Under $199",
    h1Fragment: "Under $199",
    metaBlurb: "under $199",
    type: "budget",
    chipLabel: "Under $199",
    filter: { maxPrice: 199, sort: "price-asc" },
    introTemplate:
      "Vacpacks in {{city}} under $199 open up the premium brands — HGV, Marriott, Hyatt — plus longer 4- and 5-night stays. {{dealCount}} packages under $199 are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nAt this price point you're often looking at 4 nights in a 1- or 2-bedroom suite at a flagship property. The per-night cost ($40-$50) is a fraction of comparable hotel rates.",
    faqs: [
      faqDeposit,
      { q: "Is it worth paying more than $99?", a: "Depends on your trip. The $99 floor gets you 2-3 nights in a good room. $149-$199 gets you 4-5 nights or a premium brand like Marriott or HGV." },
    ],
  },
  "cheap": {
    slug: "cheap",
    label: "Cheapest",
    h1Fragment: "(Cheapest)",
    metaBlurb: "cheap",
    type: "budget",
    chipLabel: "Cheapest",
    filter: { maxPrice: 149, sort: "price-asc" },
    introTemplate:
      "The cheapest vacpacks in {{city}} bottom out around \\${{lowPrice}}, ranked by price ascending. {{dealCount}} packages under $149 are live right now — these are the actual cheap deals, not marketing-copy cheap.\n\n{{cityBlurb}}\n\nCheap vacpack rules: Sunday-Wednesday check-in, 2-3 nights, Westgate or Wyndham or broker package. Follow those three and the price floor holds.",
    faqs: [
      { q: "What's the single cheapest vacpack in {{city}} right now?", a: "Check the top card on this page — it's sorted price-ascending. The absolute floor refreshes every 6 hours as we re-scrape." },
      faqDeposit,
    ],
  },
  "luxury": {
    slug: "luxury",
    label: "Luxury",
    h1Fragment: "(Luxury)",
    metaBlurb: "luxury",
    type: "budget",
    chipLabel: "Luxury",
    filter: { minPrice: 399, brandSlugsInclude: ["hgv", "marriott", "hyatt", "villa-group", "pueblo-bonito", "bahia-principe"], sort: "price-desc" },
    introTemplate:
      "Luxury vacpacks in {{city}} exist — the premium brands (HGV, Marriott Vacation Club, Hyatt Residence Club, Villa Group, Pueblo Bonito) run preview programs at their top-tier properties. {{dealCount}} luxury packages are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nLuxury vacpacks typically include 4-5 nights in a 1- or 2-bedroom suite, resort credits ($100-$500), spa credits, and premium concierge access. The price-per-night is still 60-70% off direct rack rate.",
    faqs: [
      { q: "Are luxury vacpacks worth it?", a: "If you'd otherwise spend $1,500+ for 4 nights at the same property, absolutely. The 90-minute pitch is the same regardless of the package tier." },
      faqDeposit,
      { q: "Can I use hotel loyalty points?", a: "Not on vacpacks — these are preview-program stays, not loyalty bookings. You can still earn points on add-ons (dining, spa)." },
    ],
  },

  // ===================== DURATION (4) =====================
  "weekend": {
    slug: "weekend",
    label: "Weekend",
    h1Fragment: "for a Weekend",
    metaBlurb: "weekend",
    type: "duration",
    chipLabel: "Weekend",
    filter: { durationNights: [2, 3], sort: "price-asc" },
    introTemplate:
      "Weekend vacpacks in {{city}} are 2- and 3-night resort stays priced for quick getaways. {{dealCount}} weekend packages are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nMost weekend vacpacks want Sunday-Tuesday or Sunday-Wednesday check-ins. Friday-Sunday weekends are available but run a small premium.",
    faqs: [
      faqDeposit,
      { q: "Are Friday-Sunday vacpacks available?", a: "Yes but scarce. Most brands prefer Sunday-Thursday starts because that's when resort occupancy is lowest." },
    ],
  },
  "2-night": {
    slug: "2-night",
    label: "2-Night",
    h1Fragment: "(2-Night Stays)",
    metaBlurb: "2-night",
    type: "duration",
    chipLabel: "2 Nights",
    filter: { durationNights: 2, sort: "price-asc" },
    introTemplate:
      "2-night vacpacks in {{city}} are the shortest preview-stay category. {{dealCount}} 2-night packages are live from \\${{lowPrice}}, most running Sunday-Tuesday.\n\n{{cityBlurb}}\n\n2-night stays are the entry tier. If the resort/brand fits, 3-night upgrades are usually only $20-$40 more and worth considering.",
    faqs: [
      faqDeposit,
      { q: "Is 2 nights enough?", a: "For a single-focus trip (one concert, one wedding, one sports event) yes. For full vacation mode, 3-4 nights works better." },
    ],
  },
  "3-night": {
    slug: "3-night",
    label: "3-Night",
    h1Fragment: "(3-Night Stays)",
    metaBlurb: "3-night",
    type: "duration",
    chipLabel: "3 Nights",
    filter: { durationNights: 3, sort: "price-asc" },
    introTemplate:
      "3-night vacpacks in {{city}} are the most common preview-stay category — enough time for a full weekend plus a buffer day. {{dealCount}} 3-night packages are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\n3-night stays sit in the industry sweet spot: resorts maximize presentation attendance and guests maximize actual vacation time.",
    faqs: [
      faqDeposit,
      { q: "Should I pick 3 nights over 2?", a: "For most trips, yes. The $20-$40 extra unlocks a full day of actual relaxation between arrival and the presentation." },
    ],
  },
  "5-night": {
    slug: "5-night",
    label: "5-Night",
    h1Fragment: "(5-Night Stays)",
    metaBlurb: "5-night",
    type: "duration",
    chipLabel: "5 Nights",
    filter: { durationNights: 5, sort: "price-asc" },
    introTemplate:
      "5-night vacpacks in {{city}} are the longest preview-stay category most brands offer. {{dealCount}} 5-night packages are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\n5-night stays are typically reserved for premium brands (HGV, Marriott, Villa Group) and all-inclusive markets (Cancun, Cabo). At $399-$699 for 5 nights, per-night cost is remarkable.",
    faqs: [
      faqDeposit,
      { q: "Can I extend a 3-night vacpack to 5?", a: "Usually yes, at the resort's nightly rate. Ask at check-in — sometimes they'll match the vacpack per-night rate for the extension." },
    ],
  },

  // ===================== INTEREST (8) =====================
  "all-inclusive": {
    slug: "all-inclusive",
    label: "All-Inclusive",
    h1Fragment: "(All-Inclusive)",
    metaBlurb: "all-inclusive",
    type: "interest",
    chipLabel: "All-Inclusive",
    filter: { inclusionsIncludeAny: ["all-inclusive", "all meals", "drinks", "unlimited"], sort: "price-asc" },
    applicableCities: ["cancun", "cabo-san-lucas", "puerto-vallarta", "punta-cana", "nassau"],
    introTemplate:
      "All-inclusive vacpacks in {{city}} bundle meals, drinks, and often airport transfers into the base price. {{dealCount}} AI packages are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nTrue all-inclusive coverage varies by brand — Bahia Principe and Villa Group typically include all meals + premium drinks + on-property activities. BookVIP and broker packages may tier inclusions by room category.",
    faqs: [
      { q: "What does 'all-inclusive' actually include?", a: "Standard: all meals, domestic drinks, non-motorized water sports. Premium: international drinks, motorized sports, à la carte restaurants. Confirm at booking." },
      faqDeposit,
    ],
  },
  "near-disney": {
    slug: "near-disney",
    label: "Near Disney",
    h1Fragment: "Near Disney",
    metaBlurb: "near Disney",
    type: "interest",
    chipLabel: "Near Disney",
    filter: { sort: "price-asc" },
    applicableCities: ["orlando"],
    introTemplate:
      "Near-Disney vacpacks in Orlando put you within 5-15 minutes of the Walt Disney World main gates. {{dealCount}} packages are live from \\${{lowPrice}}, mostly clustered around Lake Buena Vista, Kissimmee, and Celebration.\n\n{{cityBlurb}}\n\nBonnet Creek (Wyndham), Hilton Grand Vacations Orlando, and Holiday Inn Club Orange Lake are the three closest flagship preview resorts to Disney gates.",
    faqs: [
      { q: "Which resorts are closest to Disney?", a: "Wyndham Bonnet Creek (inside Disney property), HGV Orlando (Tuscany Village), Holiday Inn Club Orange Lake Resort (4 miles to Magic Kingdom)." },
      { q: "Do vacpacks include Disney tickets?", a: "Rarely bundled. A few brands offer discounted ticket add-ons; Disney controls its own pricing tightly." },
      faqDeposit,
    ],
  },
  "near-universal": {
    slug: "near-universal",
    label: "Near Universal",
    h1Fragment: "Near Universal",
    metaBlurb: "near Universal",
    type: "interest",
    chipLabel: "Near Universal",
    filter: { sort: "price-asc" },
    applicableCities: ["orlando"],
    introTemplate:
      "Near-Universal vacpacks in Orlando cluster around International Drive and Sand Lake Road — 5-10 minutes from Universal Studios and Epic Universe. {{dealCount}} packages are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nWestgate Lakes Resort & Spa and HGV Tuscany Village are both ~1.5 miles from Universal's main gate.",
    faqs: [
      { q: "Which resorts are closest to Universal?", a: "Westgate Lakes Resort & Spa (1.5 mi), Hilton Grand Vacations Tuscany Village (1.5 mi), Holiday Inn Orlando Resort (3 mi)." },
      { q: "Are Universal tickets bundled?", a: "Some Universal-proximity vacpacks include CityWalk dining credits or ticket discounts. Full park tickets are rarely included." },
      faqDeposit,
    ],
  },
  "oceanfront": {
    slug: "oceanfront",
    label: "Oceanfront",
    h1Fragment: "(Oceanfront)",
    metaBlurb: "oceanfront",
    type: "interest",
    chipLabel: "Oceanfront",
    filter: { inclusionsIncludeAny: ["oceanfront", "beach", "ocean view"], sort: "price-asc" },
    applicableCities: ["myrtle-beach", "cocoa-beach", "daytona-beach", "cancun", "cabo-san-lucas", "puerto-vallarta", "punta-cana", "miami", "key-west", "hilton-head", "galveston", "nassau"],
    introTemplate:
      "Oceanfront vacpacks in {{city}} put you on the water, usually with balcony ocean views. {{dealCount}} oceanfront packages are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nBrands with the most oceanfront preview inventory: Westgate, Bluegreen, Spinnaker, Hilton Grand Vacations, and Vacation Village.",
    faqs: [
      { q: "Is 'oceanfront' guaranteed?", a: "Yes on packages labeled oceanfront. Partial-view and side-view units are labeled separately. Confirm view category on the booking confirmation." },
      faqDeposit,
    ],
  },
  "with-waterpark": {
    slug: "with-waterpark",
    label: "With Waterpark",
    h1Fragment: "with Waterpark",
    metaBlurb: "with on-site waterpark",
    type: "interest",
    chipLabel: "Waterpark",
    filter: { inclusionsIncludeAny: ["waterpark", "water park", "slides"], sort: "price-asc" },
    applicableCities: ["orlando", "gatlinburg", "williamsburg", "branson"],
    introTemplate:
      "{{city}} vacpacks with on-site waterpark access cover the theme-park and mountain-resort markets. {{dealCount}} packages with waterpark inclusion are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nWestgate Smoky Mountain Resort (Gatlinburg) includes Wild Bear Falls; Westgate Town Center Orlando includes a full waterpark on-site; Great Wolf Lodge operates separately but is frequently cross-referenced.",
    faqs: [
      { q: "Is the waterpark free for vacpack guests?", a: "Yes — included in the resort stay when it's on-property. External waterparks (Great Wolf Lodge) are separate paid admission." },
      faqDeposit,
    ],
  },
  "ski-in-ski-out": {
    slug: "ski-in-ski-out",
    label: "Ski-In/Ski-Out",
    h1Fragment: "(Ski-In/Ski-Out)",
    metaBlurb: "ski-in/ski-out",
    type: "interest",
    chipLabel: "Ski-In/Out",
    filter: { inclusionsIncludeAny: ["ski", "mountain"], sort: "price-asc" },
    applicableCities: ["park-city", "lake-tahoe"],
    introTemplate:
      "Ski-in/ski-out vacpacks in {{city}} put the lift line at your door. {{dealCount}} ski preview packages are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nPeak ski season (Dec-Mar) runs premium pricing; shoulder season (late March, early December) drops to ~$199 for 3 nights.",
    faqs: [
      { q: "Are lift tickets included?", a: "Occasionally — some Westgate Park City packages bundle discounted lift tickets. Most require separate purchase." },
      faqDeposit,
    ],
  },
  "pet-friendly": {
    slug: "pet-friendly",
    label: "Pet-Friendly",
    h1Fragment: "(Pet-Friendly)",
    metaBlurb: "pet-friendly",
    type: "interest",
    chipLabel: "Pet-Friendly",
    filter: { inclusionsIncludeAny: ["pet", "dog-friendly"], sort: "price-asc" },
    introTemplate:
      "Pet-friendly vacpacks in {{city}} exist but are a subset of the overall inventory. {{dealCount}} pet-permitting packages are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nPet fees (typically $50-$150 non-refundable) apply at most pet-friendly resorts. Confirm pet policy and fee at booking, not just at check-in.",
    faqs: [
      { q: "Can I bring a cat?", a: "Policies vary. Most pet-friendly resorts accept dogs specifically; cats require a separate confirmation." },
      { q: "Is there a pet fee?", a: "Yes, usually $50-$150 non-refundable, sometimes per-night." },
      faqDeposit,
    ],
  },
  "adults-only": {
    slug: "adults-only",
    label: "Adults Only",
    h1Fragment: "(Adults Only)",
    metaBlurb: "adults-only",
    type: "interest",
    chipLabel: "Adults Only",
    filter: { sort: "price-asc" },
    applicableCities: ["cancun", "cabo-san-lucas", "las-vegas", "puerto-vallarta", "punta-cana"],
    introTemplate:
      "Adults-only vacpacks in {{city}} lean into the couples and group-trip market. {{dealCount}} adults-only or adult-leaning packages are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nVillas-section properties within all-inclusive resorts frequently operate adults-only with separate pool and bar access. Las Vegas off-Strip vacpacks are inherently adult-focused.",
    faqs: [
      { q: "Are kids allowed at adults-only resorts?", a: "No — these properties enforce 18+ or 21+ minimums. If booking for a group, confirm all travelers meet the age minimum." },
      faqDeposit,
    ],
  },

  // ===================== DataForSEO-discovered modifiers (high commercial volume) =====================
  "bundles": {
    slug: "bundles",
    label: "Vacation Bundles",
    h1Fragment: "Vacation Bundles",
    metaBlurb: "vacation bundles",
    type: "interest",
    chipLabel: "Bundles",
    filter: { sort: "price-asc" },
    introTemplate:
      "{{city}} vacation bundles combine resort stays with add-ons — car rental, dining credits, event tickets, or spa. {{dealCount}} bundled packages are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nThe bundle math usually beats booking each piece separately by 15-30%, and the resort handles the coordination so you're not juggling 3 confirmation numbers.",
    faqs: [
      { q: "What's typically bundled?", a: "Resort stay + one or more of: car rental, dining credit, spa credit, event ticket, airport transfer. Every bundle is different — confirm inclusions at booking." },
      { q: "Can I unbundle?", a: "Not usually. Bundles are priced as a unit; separating pieces loses the discount." },
      { q: "Is the bundle cheaper than booking separately?", a: "Usually 15-30% less. Always run the math — check each item's retail price before assuming." },
      faqDeposit,
    ],
  },
  "specials": {
    slug: "specials",
    label: "Current Specials",
    h1Fragment: "Current Specials",
    metaBlurb: "current vacation specials",
    type: "occasion",
    chipLabel: "Specials",
    filter: { sort: "price-asc" },
    introTemplate:
      "{{city}} vacation specials are time-bound promotional packages — flash sales, seasonal drops, or just-announced deals. {{dealCount}} current specials are live from \\${{lowPrice}}.\n\n{{cityBlurb}}",
    faqs: [
      { q: "How long do specials last?", a: "Most specials run 7-30 days. Some are week-of-booking only. Confirm expiration at booking." },
      { q: "Can I combine specials?", a: "Rarely. Most resorts limit to one promotional rate per booking." },
      faqDeposit,
    ],
  },
  "timeshare-promotions": {
    slug: "timeshare-promotions",
    label: "Timeshare Promotions",
    h1Fragment: "Timeshare Promotions",
    metaBlurb: "timeshare promotion",
    type: "interest",
    chipLabel: "Promotions",
    filter: { sort: "price-asc" },
    introTemplate:
      "{{city}} timeshare promotions are the industry term for vacpack preview stays. {{dealCount}} promotional packages from \\${{lowPrice}} — you attend a 90-minute sales presentation, they cover the lion's share of the resort rate.\n\n{{cityBlurb}}",
    faqs: [
      { q: "Are 'timeshare promotions' the same as 'vacpacks'?", a: "Yes — different words for the same product. The industry calls them preview stays, promotions, or sampler packages." },
      { q: "Is there any obligation to buy?", a: "No. The presentation is the only tradeoff; purchase is entirely optional." },
      faqDeposit,
    ],
  },
  "flight-and-hotel": {
    slug: "flight-and-hotel",
    label: "Flight + Hotel",
    h1Fragment: "(Flight + Hotel)",
    metaBlurb: "flight and hotel bundle",
    type: "interest",
    chipLabel: "Flight+Hotel",
    filter: { sort: "price-asc" },
    applicableCities: ["cancun", "cabo-san-lucas", "puerto-vallarta", "punta-cana", "cozumel", "maui", "nassau"],
    introTemplate:
      "Flight + hotel bundles for {{city}} combine airfare with resort preview pricing. {{dealCount}} packages from \\${{lowPrice}} — often bundled via broker partners (BookVIP, Apple Vacations).\n\n{{cityBlurb}}",
    faqs: [
      { q: "Are flights from my airport included?", a: "Most bundles originate from major US hubs (ATL, DFW, MIA, ORD, LAX, JFK). Feeder markets may require separate connector fare." },
      { q: "Can I choose my own flight times?", a: "Limited. Bundle fares are usually on the operator's preferred carrier and time window." },
      faqDeposit,
    ],
  },

  // ===================== Tier-2 city-specific interest modifiers =====================
  "near-beach": {
    slug: "near-beach",
    label: "Near Beach",
    h1Fragment: "Near the Beach",
    metaBlurb: "near-beach",
    type: "interest",
    chipLabel: "Near Beach",
    filter: { sort: "price-asc" },
    applicableCities: ["hilton-head", "ormond-beach", "new-smyrna-beach"],
    introTemplate:
      "Near-beach vacpacks in {{city}} put you within walking distance of the sand without the oceanfront premium. {{dealCount}} packages are live from \\${{lowPrice}}.\n\n{{cityBlurb}}\n\nThese properties are 2-10 minute walks to the beach with shuttle access where applicable.",
    faqs: [
      { q: "How close is 'near-beach' exactly?", a: "Usually 2-10 minute walk. Call the resort directly to confirm exact distance." },
      { q: "Is beach access free?", a: "Public beaches — yes. Private-resort beach sections — included for resort guests." },
      faqDeposit,
    ],
  },
  "historic-district": {
    slug: "historic-district",
    label: "Historic District",
    h1Fragment: "Near Historic District",
    metaBlurb: "historic district",
    type: "interest",
    chipLabel: "Historic",
    filter: { sort: "price-asc" },
    applicableCities: ["charleston", "williamsburg", "savannah", "new-orleans"],
    introTemplate:
      "Historic-district-adjacent vacpacks in {{city}} put you near colonial architecture, walkable old towns, and cultural attractions. {{dealCount}} packages from \\${{lowPrice}}.\n\n{{cityBlurb}}",
    faqs: [
      { q: "Are the resorts themselves historic?", a: "Generally no — the resorts are modern properties near historic walkable districts, not inside them." },
      { q: "Is parking included?", a: "Usually yes at the resort. Street parking in historic districts varies." },
      faqDeposit,
    ],
  },
  "golf-included": {
    slug: "golf-included",
    label: "Golf Included",
    h1Fragment: "(Golf Included)",
    metaBlurb: "golf-included",
    type: "interest",
    chipLabel: "Golf",
    filter: { sort: "price-asc", inclusionsIncludeAny: ["golf", "course", "greens"] },
    applicableCities: ["hilton-head", "park-city", "myrtle-beach", "williamsburg"],
    introTemplate:
      "Golf vacpacks in {{city}} bundle greens fees with the resort stay. {{dealCount}} golf-inclusive packages from \\${{lowPrice}}.\n\n{{cityBlurb}}",
    faqs: [
      { q: "How many rounds are included?", a: "Varies by package — usually 1-2 rounds per stay. Additional rounds at discounted member rates." },
      { q: "Are cart + greens fees both covered?", a: "Most packages include both. Confirm at booking." },
      faqDeposit,
    ],
  },
  "dude-ranch": {
    slug: "dude-ranch",
    label: "Dude Ranch",
    h1Fragment: "(Dude Ranch Style)",
    metaBlurb: "dude-ranch",
    type: "interest",
    chipLabel: "Dude Ranch",
    filter: { sort: "price-asc" },
    applicableCities: ["river-ranch"],
    introTemplate:
      "Dude-ranch-style vacpacks in {{city}} include horseback riding, archery, and working-ranch experiences alongside standard resort amenities. {{dealCount}} packages from \\${{lowPrice}}.\n\n{{cityBlurb}}",
    faqs: [
      { q: "Is horseback riding included?", a: "Yes at Westgate River Ranch. Multiple trail rides per stay typically included." },
      { q: "Is this kid-friendly?", a: "Yes — kid-specific riding lessons and ranch activities offered." },
      faqDeposit,
    ],
  },
  "beachfront-hawaii": {
    slug: "beachfront-hawaii",
    label: "Beachfront Hawaii",
    h1Fragment: "Beachfront",
    metaBlurb: "beachfront Hawaii",
    type: "interest",
    chipLabel: "Beachfront",
    filter: { sort: "price-asc" },
    applicableCities: ["maui", "oahu", "waikoloa-beach"],
    introTemplate:
      "Beachfront Hawaii vacpacks put you directly on the sand. {{dealCount}} packages from \\${{lowPrice}} — a fraction of Hawaii's public nightly rates.\n\n{{cityBlurb}}",
    faqs: [
      { q: "Is this really beachfront?", a: "Yes on packages labeled beachfront. HGV Ocean Tower sits directly on Ka'anapali Beach." },
      { q: "Whale-watching season?", a: "December to April. Visible from many units in winter months." },
      faqDeposit,
    ],
  },
  "snorkeling": {
    slug: "snorkeling",
    label: "Snorkeling",
    h1Fragment: "(Snorkeling)",
    metaBlurb: "snorkeling",
    type: "interest",
    chipLabel: "Snorkeling",
    filter: { sort: "price-asc" },
    applicableCities: ["cozumel", "maui", "cancun", "nassau"],
    introTemplate:
      "Snorkeling vacpacks in {{city}} bundle beach access with reef experiences. {{dealCount}} packages from \\${{lowPrice}}.\n\n{{cityBlurb}}",
    faqs: [
      { q: "Is gear included?", a: "Often yes at resorts with snorkel inclusions. Otherwise rental is $15-$25/day." },
      { q: "What's the best snorkel time?", a: "Early morning — calmer water, better visibility, fewer crowds." },
      faqDeposit,
    ],
  },
  "urban-event": {
    slug: "urban-event",
    label: "Urban Event Trip",
    h1Fragment: "(Urban Event)",
    metaBlurb: "urban event",
    type: "interest",
    chipLabel: "Urban",
    filter: { durationNights: [2, 3], sort: "price-asc" },
    applicableCities: ["atlanta", "nashville", "new-orleans", "austin"],
    introTemplate:
      "Urban event-trip vacpacks in {{city}} handle the 2-3 night concert/conference/wedding pattern. {{dealCount}} short-stay packages from \\${{lowPrice}}.\n\n{{cityBlurb}}",
    faqs: [
      { q: "Is downtown close?", a: "Most urban vacpack resorts are 10-20 min from downtown. Uber/Lyft are cheap and abundant in these markets." },
      { q: "Can we book for one night?", a: "Rarely. Most vacpacks require 2+ nights minimum." },
      faqDeposit,
    ],
  },
};

// ---------------------------------------------------------------------------
// Per-city modifier allowlists
// ---------------------------------------------------------------------------

/** Cities with sublander rollout (Tier 1: full ~30 modifiers, Tier 2: ~12 modifiers + city-specific interests). */
export const PRIORITY_CITIES: string[] = [
  // Tier 1 — full rollout
  "orlando",
  "las-vegas",
  "gatlinburg",
  "myrtle-beach",
  "branson",
  "williamsburg",
  "cocoa-beach",
  "cancun",
  "cabo-san-lucas",
  "puerto-vallarta",
  "punta-cana",
  "daytona-beach",
  // Tier 2 — audience + season + budget + duration + city-specific interest
  "maui",
  "charleston",
  "park-city",
  "hilton-head",
  "ormond-beach",
  "new-smyrna-beach",
  "cozumel",
  "atlanta",
  "river-ranch",
];

/** Per-city: which modifier slugs are allowed. Trims ~40 modifiers → ~30 per city. */
export const CITY_SUBLANDERS: Record<string, string[]> = {
  orlando: [
    "for-families", "for-couples", "for-seniors", "solo-travelers", "for-groups",
    "honeymoon", "girls-trip",
    "summer", "fall", "spring", "winter", "spring-break", "shoulder-season",
    "last-minute", "memorial-day-weekend", "july-4th", "labor-day-weekend", "thanksgiving", "christmas", "new-years",
    "under-99", "under-149", "under-199", "cheap", "luxury",
    "weekend", "2-night", "3-night", "5-night",
    "near-disney", "near-universal", "with-waterpark",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  "las-vegas": [
    "for-couples", "for-seniors", "solo-travelers", "for-groups",
    "bachelor-party", "bachelorette-party", "honeymoon", "girls-trip",
    "summer", "fall", "spring", "winter", "shoulder-season",
    "last-minute", "memorial-day-weekend", "july-4th", "labor-day-weekend", "new-years",
    "under-99", "under-149", "under-199", "cheap", "luxury",
    "weekend", "2-night", "3-night",
    "adults-only",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  gatlinburg: [
    "for-families", "for-couples", "for-seniors", "for-groups",
    "summer", "fall", "spring", "winter", "shoulder-season",
    "last-minute", "memorial-day-weekend", "july-4th", "labor-day-weekend", "thanksgiving", "christmas",
    "under-99", "under-149", "under-199", "cheap",
    "weekend", "2-night", "3-night",
    "with-waterpark", "pet-friendly",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  "myrtle-beach": [
    "for-families", "for-couples", "for-seniors", "for-groups",
    "summer", "fall", "spring", "winter", "spring-break", "shoulder-season",
    "last-minute", "memorial-day-weekend", "july-4th", "labor-day-weekend",
    "under-99", "under-149", "under-199", "cheap",
    "weekend", "2-night", "3-night", "5-night",
    "oceanfront", "pet-friendly",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  branson: [
    "for-families", "for-couples", "for-seniors", "for-groups",
    "summer", "fall", "spring", "winter", "shoulder-season",
    "last-minute", "memorial-day-weekend", "july-4th", "thanksgiving", "christmas",
    "under-99", "under-149", "under-199", "cheap",
    "weekend", "2-night", "3-night",
    "with-waterpark",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  williamsburg: [
    "for-families", "for-couples", "for-seniors", "for-groups",
    "summer", "fall", "spring", "shoulder-season",
    "last-minute", "memorial-day-weekend", "july-4th", "labor-day-weekend", "thanksgiving",
    "under-99", "under-149", "under-199", "cheap",
    "weekend", "2-night", "3-night",
    "with-waterpark",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  "cocoa-beach": [
    "for-families", "for-couples", "for-seniors", "for-groups",
    "summer", "fall", "spring", "winter", "spring-break", "shoulder-season",
    "last-minute", "memorial-day-weekend", "july-4th",
    "under-99", "under-149", "under-199", "cheap",
    "weekend", "2-night", "3-night",
    "oceanfront",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  cancun: [
    "for-couples", "solo-travelers", "for-groups",
    "honeymoon", "destination-wedding",
    "summer", "fall", "winter", "spring-break",
    "last-minute", "christmas", "new-years",
    "under-199", "luxury",
    "3-night", "5-night",
    "all-inclusive", "oceanfront", "adults-only",
  
    "bundles", "specials", "timeshare-promotions", "flight-and-hotel",
  ],
  "cabo-san-lucas": [
    "for-couples", "for-groups",
    "honeymoon", "destination-wedding",
    "summer", "fall", "winter",
    "last-minute", "christmas", "new-years",
    "luxury",
    "3-night", "5-night",
    "all-inclusive", "oceanfront", "adults-only",
  
    "bundles", "specials", "timeshare-promotions", "flight-and-hotel",
  ],
  "puerto-vallarta": [
    "for-couples", "for-groups",
    "honeymoon", "destination-wedding",
    "summer", "fall", "winter", "spring-break",
    "last-minute",
    "luxury",
    "3-night", "5-night",
    "all-inclusive", "oceanfront", "adults-only",
  
    "bundles", "specials", "timeshare-promotions", "flight-and-hotel",
  ],
  "punta-cana": [
    "for-couples", "for-groups",
    "honeymoon", "destination-wedding",
    "summer", "fall", "winter", "spring-break",
    "luxury",
    "3-night", "5-night",
    "all-inclusive", "oceanfront", "adults-only",
  
    "bundles", "specials", "timeshare-promotions", "flight-and-hotel",
  ],
  "daytona-beach": [
    "for-families", "for-couples", "for-seniors", "for-groups",
    "summer", "fall", "spring", "winter", "spring-break", "shoulder-season",
    "last-minute", "memorial-day-weekend", "july-4th",
    "under-99", "under-149", "under-199", "cheap",
    "weekend", "2-night", "3-night",
    "oceanfront",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  // ── Tier 2 cities ─────────────────────────────────────────
  maui: [
    "for-couples", "honeymoon", "destination-wedding",
    "summer", "fall", "winter", "spring",
    "last-minute", "christmas", "new-years",
    "luxury", "under-199",
    "3-night", "5-night",
    "oceanfront", "beachfront-hawaii", "snorkeling",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  charleston: [
    "for-couples", "for-seniors", "for-groups",
    "girls-trip", "honeymoon",
    "summer", "fall", "spring", "shoulder-season",
    "last-minute", "memorial-day-weekend",
    "under-199", "cheap",
    "weekend", "2-night", "3-night",
    "historic-district", "oceanfront", "golf-included",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  "park-city": [
    "for-couples", "for-groups",
    "honeymoon",
    "winter", "summer", "fall", "shoulder-season",
    "christmas", "new-years",
    "under-199", "luxury",
    "weekend", "3-night", "5-night",
    "ski-in-ski-out", "golf-included",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  "hilton-head": [
    "for-families", "for-couples", "for-seniors",
    "summer", "fall", "spring", "shoulder-season",
    "last-minute", "memorial-day-weekend", "july-4th", "labor-day-weekend",
    "under-199", "luxury",
    "weekend", "3-night",
    "oceanfront", "near-beach", "golf-included",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  "ormond-beach": [
    "for-families", "for-couples", "for-seniors",
    "summer", "fall", "spring", "winter", "shoulder-season",
    "last-minute",
    "under-99", "under-149", "cheap",
    "weekend", "2-night", "3-night",
    "oceanfront", "near-beach",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  "new-smyrna-beach": [
    "for-families", "for-couples", "for-seniors",
    "summer", "fall", "spring", "winter", "shoulder-season",
    "last-minute",
    "under-99", "under-149", "cheap",
    "weekend", "2-night", "3-night",
    "oceanfront", "near-beach",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  cozumel: [
    "for-couples", "for-groups",
    "honeymoon", "destination-wedding",
    "summer", "fall", "winter", "spring-break",
    "last-minute",
    "luxury",
    "3-night", "5-night",
    "all-inclusive", "oceanfront", "snorkeling", "adults-only",
  
    "bundles", "specials", "timeshare-promotions", "flight-and-hotel",
  ],
  atlanta: [
    "for-couples", "for-groups", "solo-travelers",
    "bachelor-party", "bachelorette-party", "girls-trip",
    "summer", "fall", "spring", "winter",
    "last-minute", "memorial-day-weekend", "july-4th",
    "under-149", "under-199",
    "weekend", "2-night", "3-night",
    "urban-event",
  
    "bundles", "specials", "timeshare-promotions",
  ],
  "river-ranch": [
    "for-families", "for-groups",
    "summer", "fall", "spring", "winter", "shoulder-season",
    "last-minute", "thanksgiving", "christmas",
    "under-99", "under-149", "cheap",
    "weekend", "2-night", "3-night",
    "dude-ranch", "pet-friendly",
  
    "bundles", "specials", "timeshare-promotions",
  ],
};

/** Count of enabled sublanders (for sanity checks). */
export const TOTAL_SUBLANDERS = Object.values(CITY_SUBLANDERS).reduce((sum, arr) => sum + arr.length, 0);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Is `slug` a valid sublander pattern `{citySlug}-{modifierSlug}` with active combo? */
export function parseSublanderSlug(slug: string): { citySlug: string; modifierSlug: string } | null {
  for (const citySlug of PRIORITY_CITIES) {
    if (slug === citySlug) return null; // parent, not sublander
    if (slug.startsWith(citySlug + "-")) {
      const modifierSlug = slug.slice(citySlug.length + 1);
      if (MODIFIERS[modifierSlug] && (CITY_SUBLANDERS[citySlug] || []).includes(modifierSlug)) {
        return { citySlug, modifierSlug };
      }
    }
  }
  return null;
}

/** Seeded rotation of blurb pool so the same (city, modifier) always gets the same blurb. */
export function pickBlurb(citySlug: string, modifierSlug: string): string {
  const pool = CITY_BLURB_POOLS[citySlug] || [];
  if (pool.length === 0) return "";
  // Deterministic hash of modifierSlug to pick index — keeps sublanders distinct within a city
  let hash = 0;
  for (let i = 0; i < modifierSlug.length; i++) {
    hash = (hash * 31 + modifierSlug.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length];
}

/** All modifier slugs allowed for a city, in canonical order (grouped by type). */
export function getModifiersForCity(citySlug: string): Modifier[] {
  const allowed = CITY_SUBLANDERS[citySlug] || [];
  const order: ModifierType[] = ["audience", "season", "occasion", "budget", "duration", "interest"];
  const mods = allowed.map((s) => MODIFIERS[s]).filter(Boolean);
  return mods.sort((a, b) => {
    const ai = order.indexOf(a.type);
    const bi = order.indexOf(b.type);
    if (ai !== bi) return ai - bi;
    return a.label.localeCompare(b.label);
  });
}
