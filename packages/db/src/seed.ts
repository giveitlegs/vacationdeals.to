import { db } from "./client.js";
import { brands, destinations, sources } from "./schema.js";

async function seed() {
  console.log("🌱 Seeding database...");

  // ── Brands ──────────────────────────────────────────
  await db.insert(brands).values([
    { name: "Westgate Resorts", slug: "westgate", type: "direct", website: "https://westgatereservations.com" },
    { name: "Hilton Grand Vacations", slug: "hgv", type: "direct", website: "https://hiltongrandvacations.com" },
    { name: "Bluegreen Vacations", slug: "bluegreen", type: "direct", website: "https://bluegreenvacations.com" },
    { name: "Club Wyndham", slug: "wyndham", type: "direct", website: "https://clubwyndham.wyndhamdestinations.com" },
    { name: "Holiday Inn Club Vacations", slug: "holiday-inn", type: "direct", website: "https://holidayinnclub.com" },
    { name: "Hyatt Vacation Club", slug: "hyatt", type: "direct", website: "https://hyattvacationclub.com" },
    { name: "Marriott Vacation Club", slug: "marriott", type: "direct", website: "https://marriottvacationclubs.com" },
    { name: "Capital Vacations", slug: "capital-vacations", type: "direct", website: "https://capitalvacations.com" },
    { name: "BookVIP", slug: "bookvip", type: "broker", website: "https://bookvip.com" },
    { name: "GetawayDealz", slug: "getawaydealz", type: "broker", website: "https://getawaydealz.com" },
    { name: "VacationVIP", slug: "vacationvip", type: "broker", website: "https://vacationvip.com" },
    { name: "BestVacationDealz", slug: "bestvacationdealz", type: "broker", website: "https://bestvacationdealz.com" },
    { name: "Monster Vacations", slug: "monster-vacations", type: "broker", website: "https://monstervacations.com" },
  ]).onConflictDoNothing();

  // ── Destinations ────────────────────────────────────
  await db.insert(destinations).values([
    { city: "Orlando", state: "FL", country: "US", slug: "orlando", region: "Southeast" },
    { city: "Las Vegas", state: "NV", country: "US", slug: "las-vegas", region: "West" },
    { city: "Gatlinburg", state: "TN", country: "US", slug: "gatlinburg", region: "Southeast" },
    { city: "Myrtle Beach", state: "SC", country: "US", slug: "myrtle-beach", region: "Southeast" },
    { city: "Branson", state: "MO", country: "US", slug: "branson", region: "Midwest" },
    { city: "Williamsburg", state: "VA", country: "US", slug: "williamsburg", region: "Mid-Atlantic" },
    { city: "Cocoa Beach", state: "FL", country: "US", slug: "cocoa-beach", region: "Southeast" },
    { city: "Hilton Head", state: "SC", country: "US", slug: "hilton-head", region: "Southeast" },
    { city: "Park City", state: "UT", country: "US", slug: "park-city", region: "West" },
    { city: "Daytona Beach", state: "FL", country: "US", slug: "daytona-beach", region: "Southeast" },
    { city: "Cancun", state: "Quintana Roo", country: "MX", slug: "cancun", region: "Mexico" },
    { city: "Cabo San Lucas", state: "BCS", country: "MX", slug: "cabo", region: "Mexico" },
    { city: "Puerto Vallarta", state: "Jalisco", country: "MX", slug: "puerto-vallarta", region: "Mexico" },
    { city: "Punta Cana", state: "La Altagracia", country: "DO", slug: "punta-cana", region: "Caribbean" },
    { city: "Key West", state: "FL", country: "US", slug: "key-west", region: "Southeast" },
    { city: "Sedona", state: "AZ", country: "US", slug: "sedona", region: "West" },
    { city: "Galveston", state: "TX", country: "US", slug: "galveston", region: "South" },
    { city: "Lake Tahoe", state: "CA", country: "US", slug: "lake-tahoe", region: "West" },
    { city: "New York City", state: "NY", country: "US", slug: "new-york-city", region: "Northeast" },
    { city: "San Diego", state: "CA", country: "US", slug: "san-diego", region: "West" },
  ]).onConflictDoNothing();

  // ── Sources ─────────────────────────────────────────
  await db.insert(sources).values([
    { name: "Westgate Reservations", baseUrl: "https://westgatereservations.com", scraperKey: "westgate" },
    { name: "BookVIP", baseUrl: "https://bookvip.com", scraperKey: "bookvip" },
    { name: "GetawayDealz", baseUrl: "https://getawaydealz.com", scraperKey: "getawaydealz" },
    { name: "VacationVIP", baseUrl: "https://vacationvip.com", scraperKey: "vacationvip" },
    { name: "BestVacationDealz", baseUrl: "https://bestvacationdealz.com", scraperKey: "bestvacationdealz" },
    { name: "Hilton Grand Vacations", baseUrl: "https://hiltongrandvacations.com", scraperKey: "hgv" },
    { name: "Bluegreen Vacations", baseUrl: "https://bluegreenvacations.com", scraperKey: "bluegreen" },
    { name: "Club Wyndham", baseUrl: "https://clubwyndham.wyndhamdestinations.com", scraperKey: "wyndham" },
    { name: "Holiday Inn Club Vacations", baseUrl: "https://holidayinnclub.com", scraperKey: "holiday-inn" },
    { name: "Marriott Vacation Club", baseUrl: "https://marriottvacationclubs.com", scraperKey: "marriott" },
    { name: "Monster Vacations", baseUrl: "https://monstervacations.com", scraperKey: "monster-vacations" },
  ]).onConflictDoNothing();

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
