// Probe specific Westgate URLs to see what's actually there.
const urls = [
  ["westgate #486 db=$769", "https://www.westgatereservations.com/specials/4-days-3-nights-4-disney-tickets/"],
  ["westgate #494 db=$1119", "https://www.westgatereservations.com/specials/branson-vacation-2-show-tickets-3-day-3-night/"],
  ["westgate #452 db=$159", "https://www.westgatereservations.com/specials/valentines-getaway/"],
  ["westgate #485 db=$279", "https://www.westgatereservations.com/specials/3-days-2-nights-3-disney-tickets/"],
  ["westgate #487 db=$519", "https://www.westgatereservations.com/specials/4-day-orlando-dream-vacation/"],
];

for (const [label, url] of urls) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15" },
      redirect: "follow",
    });
    const html = await res.text();
    console.log(`\n--- ${label} ---`);
    console.log(`  status=${res.status}  finalUrl=${res.url}`);
    console.log(`  htmlLen=${html.length}`);

    // Slug for APP_DATA lookup
    const slug = url.split("/specials/")[1].replace(/\/$/, "");
    const slugQuoted = JSON.stringify(slug);
    const sIdx = html.indexOf(slugQuoted);
    console.log(`  slug=${slug}  in-APP_DATA=${sIdx !== -1}`);
    if (sIdx !== -1) {
      const ctx = html.slice(sIdx, sIdx + 600).replace(/\s+/g, " ");
      console.log(`  APP_DATA ctx: ${ctx.slice(0, 400)}`);
    }

    // Stripped head visible prices
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");
    const head = stripped.slice(0, 5000);
    const dollars = [...head.matchAll(/\$([0-9,]+)/g)].map((m) => m[1]).slice(0, 20);
    console.log(`  visible head dollars: ${dollars.join(", ")}`);
    // Look for headline
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    console.log(`  title: ${titleMatch?.[1]?.slice(0, 100)}`);
  } catch (e) {
    console.log(`${label} ERROR: ${e.message}`);
  }
}
