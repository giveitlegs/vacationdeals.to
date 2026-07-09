import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "iwanttotravelto";
const BASE_URL = "https://iwanttotravelto.com";

// Blog-style MRG affiliate site with vacation deal articles
export async function runIWantToTravelToCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 40,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);

      // Blog post deal extraction
      $("article, .post, .entry, [class*='post'], [class*='deal']").each((_, el) => {
        const card = $(el);
        const title = card.find("h2, h3, h1, .entry-title").first().text().trim();
        const bodyText = card.text();
        // Prefer the advertised "From $X" figure — cards on /deals/ mix in a
        // $150 refundable deposit and retail values that Math.max would grab.
        const fromMatch = bodyText.match(/From\s*\$([\d,]+)/i);
        // Comma-aware: old /\$(\d+)/ stopped at "," in "$1,408" → captured "1"
        const priceCandidates = Array.from(bodyText.matchAll(/\$([\d,]+)/g))
          .map((m) => parseInt(m[1].replace(/,/g, ""), 10))
          .filter((n) => Number.isFinite(n) && n >= 50);
        const price = fromMatch
          ? parseInt(fromMatch[1].replace(/,/g, ""), 10)
          : priceCandidates.length
            ? Math.max(...priceCandidates)
            : NaN;
        const nightsMatch = bodyText.match(/(\d+)\s*(?:night|nite)/i) || bodyText.match(/(\d+)\s*days?\s*[\/&]\s*(\d+)\s*night/i);

        if (title && Number.isFinite(price) && title.length > 5) {
          if (price < 50 || price > 5000) return; // Skip non-deal prices
          const nights = nightsMatch ? parseInt(nightsMatch[nightsMatch.length > 2 ? 2 : 1]) : 3;
          const link = card.find("a").first().attr("href");
          let url = request.url;
          if (link) {
            try {
              url = new URL(link, request.url).toString();
            } catch {
              /* keep request.url */
            }
          }
          const imageUrl = card.find("img").first().attr("src");

          // Detect destination from title
          const cityPatterns: Record<string, { city: string; state: string }> = {
            orlando: { city: "Orlando", state: "FL" },
            "las vegas": { city: "Las Vegas", state: "NV" },
            cancun: { city: "Cancun", state: "QR" },
            gatlinburg: { city: "Gatlinburg", state: "TN" },
            branson: { city: "Branson", state: "MO" },
            "myrtle beach": { city: "Myrtle Beach", state: "SC" },
            williamsburg: { city: "Williamsburg", state: "VA" },
            miami: { city: "Miami", state: "FL" },
          };

          let dest = { city: "Various", state: "" };
          for (const [key, val] of Object.entries(cityPatterns)) {
            if (title.toLowerCase().includes(key) || bodyText.toLowerCase().includes(key)) {
              dest = val; break;
            }
          }

          storeDeal({
            title, price, durationNights: nights, durationDays: nights + 1,
            city: dest.city, state: dest.state, brandSlug: SOURCE_KEY,
            url, imageUrl: imageUrl || undefined,
          }, SOURCE_KEY);
        }
      });

      // Enqueue linked pages. Resolve relative hrefs — the homepage links to
      // /deals/ (the actual price grid) relatively, and the old absolute-only
      // filter never enqueued it, so this crawler stored 0 deals for months.
      $("a[href]").each((_, el) => {
        const raw = $(el).attr("href") || "";
        if (!raw || raw.startsWith("#") || raw.includes("?")) return;
        let abs: string;
        try {
          abs = new URL(raw, request.url).toString();
        } catch {
          return;
        }
        if (abs.startsWith(BASE_URL) && !abs.includes("#")) {
          crawler.addRequests([abs]);
        }
      });
    },
  });
  await crawler.run([`${BASE_URL}/deals/`, BASE_URL]);
}
