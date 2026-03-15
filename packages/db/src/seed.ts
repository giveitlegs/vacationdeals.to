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
    { name: "Monster Reservations Group", slug: "mrg", type: "broker", website: "https://mrgvacationpackages.com" },
    { name: "Westgate Events", slug: "westgate-events", type: "direct", website: "https://westgateevents.com" },
    { name: "GoVIP", slug: "govip", type: "broker", website: "https://govip.com" },
    { name: "StayPromo", slug: "staypromo", type: "broker", website: "https://staypromo.com" },
    { name: "Vacation Village Resorts", slug: "vacation-village", type: "direct", website: "https://vacationvillagedeals.com" },
    { name: "Spinnaker Resorts", slug: "spinnaker", type: "direct", website: "https://spinnakerresorts.com" },
    { name: "Departure Depot", slug: "departure-depot", type: "broker", website: "https://departuredepot.com" },
    { name: "Las Vegas Timeshare", slug: "vegas-timeshare", type: "broker", website: "https://las-vegas-timeshare.com" },
    { name: "Premier Travel Resorts", slug: "premier-travel", type: "broker", website: "https://premiertravelresorts.com" },
    { name: "Discount Vacation Hotels", slug: "discount-vacation", type: "broker", website: "https://discountvacationhotels.com" },
    { name: "Legendary Vacation Club", slug: "legendary", type: "direct", website: "https://legendaryvacationclub.com" },
    { name: "Festiva Hospitality Group", slug: "festiva", type: "direct", website: "https://festiva.com" },
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
    { city: "New Orleans", state: "LA", country: "US", slug: "new-orleans", region: "South" },
    { city: "Charleston", state: "SC", country: "US", slug: "charleston", region: "Southeast" },
    { city: "Ormond Beach", state: "FL", country: "US", slug: "ormond-beach", region: "Southeast" },
    { city: "Weston", state: "FL", country: "US", slug: "weston", region: "Southeast" },
    { city: "New Smyrna Beach", state: "FL", country: "US", slug: "new-smyrna-beach", region: "Southeast" },
    { city: "Savannah", state: "GA", country: "US", slug: "savannah", region: "Southeast" },
    { city: "St. Thomas", state: null, country: "USVI", slug: "st-thomas", region: "Caribbean" },
    { city: "Fort Lauderdale", state: "FL", country: "US", slug: "fort-lauderdale", region: "Southeast" },
    { city: "Atlantic Beach", state: "NC", country: "US", slug: "atlantic-beach", region: "Southeast" },
    { city: "Ocean City", state: "MD", country: "US", slug: "ocean-city", region: "Mid-Atlantic" },
    { city: "Orange Beach", state: "AL", country: "US", slug: "orange-beach", region: "South" },
    { city: "St. Augustine", state: "FL", country: "US", slug: "st-augustine", region: "Southeast" },
    { city: "Rangeley", state: "ME", country: "US", slug: "rangeley", region: "Northeast" },
    { city: "Garden City", state: "SC", country: "US", slug: "garden-city", region: "Southeast" },
    { city: "Mashpee", state: "MA", country: "US", slug: "mashpee", region: "Northeast" },
    { city: "Wisconsin Dells", state: "WI", country: "US", slug: "wisconsin-dells", region: "Midwest" },
    { city: "Hot Springs Village", state: "AR", country: "US", slug: "hot-springs-village", region: "South" },
    { city: "North Myrtle Beach", state: "SC", country: "US", slug: "north-myrtle-beach", region: "Southeast" },
    { city: "Simpson Bay", state: null, country: "St Maarten", slug: "simpson-bay", region: "Caribbean" },
    { city: "Los Cabos", state: "BCS", country: "MX", slug: "los-cabos", region: "Mexico" },
    { city: "Riviera Maya", state: "Quintana Roo", country: "MX", slug: "riviera-maya", region: "Mexico" },
    { city: "Montego Bay", state: null, country: "JM", slug: "montego-bay", region: "Caribbean" },
    { city: "Chicago", state: "IL", country: "US", slug: "chicago", region: "Midwest" },
    { city: "Miami Beach", state: "FL", country: "US", slug: "miami-beach", region: "Southeast" },
    { city: "Nassau", state: null, country: "BS", slug: "nassau", region: "Caribbean" },
    { city: "Costa Rica", state: null, country: "CR", slug: "costa-rica", region: "Central America" },
    { city: "Miami", state: "FL", country: "US", slug: "miami", region: "Southeast" },
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
    { name: "Monster Reservations Group", baseUrl: "https://mrgvacationpackages.com", scraperKey: "mrg" },
    { name: "Westgate Events", baseUrl: "https://westgateevents.com", scraperKey: "westgate-events" },
    { name: "GoVIP", baseUrl: "https://govip.com", scraperKey: "govip" },
    { name: "StayPromo", baseUrl: "https://staypromo.com", scraperKey: "staypromo" },
    { name: "Vacation Village Deals", baseUrl: "https://vacationvillagedeals.com", scraperKey: "vacation-village" },
    { name: "Spinnaker Resorts", baseUrl: "https://spinnakerresorts.com", scraperKey: "spinnaker" },
    { name: "Departure Depot", baseUrl: "https://departuredepot.com", scraperKey: "departure-depot" },
    { name: "Las Vegas Timeshare", baseUrl: "https://las-vegas-timeshare.com", scraperKey: "vegas-timeshare" },
    { name: "Premier Travel Resorts", baseUrl: "https://premiertravelresorts.com", scraperKey: "premier-travel" },
    { name: "Discount Vacation Hotels", baseUrl: "https://discountvacationhotels.com", scraperKey: "discount-vacation" },
    { name: "Legendary Vacation Club", baseUrl: "https://legendaryvacationclub.com", scraperKey: "legendary" },
    { name: "Festiva Hospitality Group", baseUrl: "https://festiva.com", scraperKey: "festiva" },
  ]).onConflictDoNothing();

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
