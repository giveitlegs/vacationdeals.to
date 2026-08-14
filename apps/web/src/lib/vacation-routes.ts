// ---------------------------------------------------------------------------
// "Get Paid to Go on Vacation" — master vacpack table + route engine
//
// Every active, geo-located vacpack is enriched into a normalized record with
// its dimensions (nights, days, price), its PERKS parsed into structured cash
// / credit values, and a net-cost after perks. Routes chain cities into 1–2
// week itineraries and sum the math so we can honestly say "pay $X, get $Y
// back." Computed at render time from live `deals` (ISR), so it stays current
// as scrapers update — no separate materialized table to drift.
//
// HONESTY RULE: we only count a $ figure as a perk you RECEIVE (Visa/MC gift
// card = cash; resort/dining/entertainment credit = credit). Retail "value",
// "save", "regularly", fees, deposits, and taxes are never counted as perks.
// ---------------------------------------------------------------------------

export type PerkType = "cash" | "credit";
export interface Perk {
  label: string;
  value: number;
  type: PerkType;
}
export interface Vacpack {
  id: number;
  slug: string;
  price: number;
  nights: number;
  days: number;
  resort: string | null;
  city: string;
  state: string | null;
  lat: number;
  lng: number;
  brand: string | null;
  perks: Perk[];
  cashBack: number; // sum of cash (gift-card) perks — real money back
  perkValue: number; // cashBack + credits
  netCash: number; // price - cashBack  (what it truly costs you)
  netAfterPerks: number; // price - perkValue
}

// A $ amount only counts when the phrase is a perk you RECEIVE …
const PERK_RE =
  /(visa|mastercard|master ?card|amex|american express|prepaid).{0,20}(gift ?card|card)|gift ?card|cash ?back|resort credit|dining credit|entertainment credit|spa credit|food credit|savings card|dining dollars/i;
// … and never when it's a marketing / retail / fee figure.
const EXCLUDE_RE =
  /value|retail|save|worth|reg(ular)?|rack|origin|normal|\bup to\b|per night|per person|per couple|deposit|processing|\bfee\b|\btax|coupon book|sweepstake/i;

function classifyPerk(s: string): PerkType {
  return /(visa|mastercard|master ?card|amex|american express|prepaid).{0,20}card|gift ?card|cash ?back/i.test(s)
    ? "cash"
    : "credit";
}

export function parsePerks(inclusions: string | null): Perk[] {
  let arr: unknown[] = [];
  try {
    arr = JSON.parse(inclusions || "[]");
  } catch {
    arr = [];
  }
  if (!Array.isArray(arr)) return [];
  const perks: Perk[] = [];
  for (const raw of arr) {
    const s = String(raw);
    if (!PERK_RE.test(s)) continue;
    if (EXCLUDE_RE.test(s) && !/in lieu|instead/i.test(s)) continue;
    const amounts = [...s.matchAll(/\$\s?([\d,]+)(?:\.\d+)?/g)]
      .map((m) => parseInt(m[1].replace(/,/g, ""), 10))
      .filter((n) => n >= 10 && n <= 500);
    if (amounts.length === 0) continue;
    // "$X or …in lieu of tickets" → single option worth max; else sum.
    const value = /\bor\b|in lieu/i.test(s)
      ? Math.max(...amounts)
      : amounts.reduce((a, b) => a + b, 0);
    perks.push({ label: s.replace(/\s+/g, " ").trim().slice(0, 80), value, type: classifyPerk(s) });
  }
  return perks;
}

function enrich(row: {
  id: number; slug: string; price: number; nights: number; days: number;
  inclusions: string | null; resort: string | null; city: string;
  state: string | null; lat: number; lng: number; brand: string | null;
}): Vacpack {
  const perks = parsePerks(row.inclusions);
  const cashBack = perks.filter((p) => p.type === "cash").reduce((a, p) => a + p.value, 0);
  const perkValue = perks.reduce((a, p) => a + p.value, 0);
  return {
    ...row,
    perks,
    cashBack,
    perkValue,
    netCash: Math.round((row.price - cashBack) * 100) / 100,
    netAfterPerks: Math.round((row.price - perkValue) * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Curated routes — the citySequence drives which cities chain together; the
// engine picks the single best (lowest net-cash) geo deal in each city live.
// ---------------------------------------------------------------------------
export interface RouteDef {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  gradient: string; // tailwind from-x to-y
  region: "us" | "mexico";
  cities: string[];
}

export const ROUTE_DEFS: RouteDef[] = [
  {
    id: "free-florida-loop",
    name: "The Free Florida Loop",
    emoji: "🌴",
    tagline: "Theme parks, beaches, and gift cards that cover the whole trip.",
    gradient: "from-orange-500 to-pink-600",
    region: "us",
    cities: ["Orlando", "Cocoa Beach", "Daytona Beach", "Myrtle Beach"],
  },
  {
    id: "smokies-ozarks-cash-run",
    name: "Smokies & Ozarks Cash Run",
    emoji: "🏞️",
    tagline: "Two mountain towns that literally pay you $1 to visit.",
    gradient: "from-emerald-500 to-teal-700",
    region: "us",
    cities: ["Gatlinburg", "Branson"],
  },
  {
    id: "vegas-southwest",
    name: "Vegas & the Wild Southwest",
    emoji: "🎰",
    tagline: "Neon nights, red rocks, and a gift card that beats the house.",
    gradient: "from-amber-500 to-red-600",
    region: "us",
    cities: ["Las Vegas", "Sedona"],
  },
  {
    id: "east-coast-history",
    name: "East Coast History Run",
    emoji: "🏛️",
    tagline: "Colonial Williamsburg to the Carolina coast — near free.",
    gradient: "from-sky-500 to-indigo-600",
    region: "us",
    cities: ["Williamsburg", "Myrtle Beach", "Hilton Head"],
  },
  {
    id: "mexico-caribbean-luxury",
    name: "Mexico Caribbean Luxury",
    emoji: "🐠",
    tagline: "All-inclusive resorts for less than a night at a chain hotel.",
    gradient: "from-teal-500 to-cyan-500",
    region: "mexico",
    cities: ["Cancun", "Playa Del Carmen", "Puerto Vallarta", "Cabo San Lucas"],
  },
  {
    id: "grand-american-two-week",
    name: "The Grand American (2 Weeks)",
    emoji: "🇺🇸",
    tagline: "The ultimate chain — four legendary stops, gift cards all the way.",
    gradient: "from-purple-600 to-pink-500",
    region: "us",
    cities: ["Orlando", "Gatlinburg", "Branson", "Las Vegas"],
  },
];

export interface RouteStop extends Vacpack {}
export interface ComputedRoute extends RouteDef {
  stops: RouteStop[];
  totalNights: number;
  totalDays: number;
  totalCost: number;
  totalCashBack: number;
  totalPerkValue: number;
  netCash: number; // totalCost - totalCashBack
  paysYou: boolean;
}

function computeRoute(def: RouteDef, byCity: Map<string, Vacpack[]>): ComputedRoute | null {
  const stops: RouteStop[] = [];
  for (const city of def.cities) {
    const ds = byCity.get(city.toLowerCase());
    if (!ds || ds.length === 0) continue;
    // Best stop = lowest net-cash (what it truly costs after gift cards).
    const best = ds.slice().sort((a, b) => a.netCash - b.netCash)[0];
    stops.push(best);
  }
  if (stops.length < 2) return null;
  const totalNights = stops.reduce((a, s) => a + s.nights, 0);
  const totalCost = Math.round(stops.reduce((a, s) => a + s.price, 0));
  const totalCashBack = Math.round(stops.reduce((a, s) => a + s.cashBack, 0));
  const totalPerkValue = Math.round(stops.reduce((a, s) => a + s.perkValue, 0));
  const netCash = totalCost - totalCashBack;
  return {
    ...def,
    stops,
    totalNights,
    totalDays: totalNights + stops.length,
    totalCost,
    totalCashBack,
    totalPerkValue,
    netCash,
    paysYou: netCash <= 0,
  };
}

// ---------------------------------------------------------------------------
// Live data — fetch active geo deals, enrich, build routes + a "hall of fame"
// of the deals that pay you the most. Graceful empty fallback like queries.ts.
// ---------------------------------------------------------------------------
export interface VacationRoutesData {
  routes: ComputedRoute[];
  hallOfFame: Vacpack[]; // top deals by lowest net-cash (they pay you)
  stats: { totalVacpacks: number; payYouCount: number; maxCashBack: number };
}

export async function getVacationRoutes(): Promise<VacationRoutesData> {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq, and, isNotNull, sql } = await import("drizzle-orm");

    const rows = await db
      .select({
        id: schema.deals.id,
        slug: schema.deals.slug,
        price: schema.deals.price,
        nights: schema.deals.durationNights,
        days: schema.deals.durationDays,
        inclusions: schema.deals.inclusions,
        resort: schema.deals.resortName,
        city: schema.destinations.city,
        state: schema.destinations.state,
        lat: schema.destinations.latitude,
        lng: schema.destinations.longitude,
        brand: schema.brands.slug,
      })
      .from(schema.deals)
      .innerJoin(schema.destinations, sql`${schema.deals.destinationId} = ${schema.destinations.id}`)
      .leftJoin(schema.brands, sql`${schema.deals.brandId} = ${schema.brands.id}`)
      .where(and(eq(schema.deals.isActive, true), isNotNull(schema.destinations.latitude)));

    const vacpacks: Vacpack[] = rows.map((r) =>
      enrich({
        id: r.id,
        slug: r.slug,
        price: Number(r.price),
        nights: r.nights,
        days: r.days,
        inclusions: r.inclusions,
        resort: r.resort,
        city: r.city,
        state: r.state,
        lat: Number(r.lat),
        lng: Number(r.lng),
        brand: r.brand,
      }),
    );

    const byCity = new Map<string, Vacpack[]>();
    for (const v of vacpacks) {
      const k = v.city.toLowerCase();
      const list = byCity.get(k) ?? [];
      list.push(v);
      byCity.set(k, list);
    }

    const routes = ROUTE_DEFS.map((d) => computeRoute(d, byCity)).filter(
      (r): r is ComputedRoute => r !== null,
    );

    const hallOfFame = vacpacks
      .filter((v) => v.cashBack > 0)
      .sort((a, b) => a.netCash - b.netCash)
      .slice(0, 8);

    return {
      routes,
      hallOfFame,
      stats: {
        totalVacpacks: vacpacks.length,
        payYouCount: vacpacks.filter((v) => v.netCash <= 0).length,
        maxCashBack: Math.max(0, ...vacpacks.map((v) => v.cashBack)),
      },
    };
  } catch (e) {
    console.error("[vacation-routes] getVacationRoutes failed:", e);
    return { routes: [], hallOfFame: [], stats: { totalVacpacks: 0, payYouCount: 0, maxCashBack: 0 } };
  }
}
