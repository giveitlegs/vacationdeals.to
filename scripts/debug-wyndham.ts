import * as cheerio from "cheerio";

async function main() {
  const url = "https://clubwyndham.wyndhamdestinations.com/vacationpreview/vacation-getaways";
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  console.log("Status:", res.status);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Find ALL prices on page
  const prices = html.match(/\$\d{2,4}/g) || [];
  console.log("Prices found:", [...new Set(prices)].join(", "));

  // Check title
  console.log("Title:", $("title").text().trim());

  // Check a specific destination page
  const noUrl = "https://clubwyndham.wyndhamdestinations.com/vacationpreview/vacation-getaways/new-orleans";
  const noRes = await fetch(noUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  console.log("\n--- New Orleans page ---");
  console.log("Status:", noRes.status);
  const noHtml = await noRes.text();
  const noPrices = noHtml.match(/\$\d{2,4}/g) || [];
  console.log("Prices:", [...new Set(noPrices)].join(", "));
  console.log("Contains $199:", noHtml.includes("$199"));
  console.log("Contains $249:", noHtml.includes("$249"));
  console.log("Contains $299:", noHtml.includes("$299"));
}

main().catch(console.error);
