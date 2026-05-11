import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

// Spinnaker Resorts runs two destination-specific marketing subdomains using
// WooCommerce. Each lists vacpack products with title + price + retail.
// Distinct from the main spinnakerresorts.com (catalog-fallback only).
const SOURCE_KEY = "spinnaker-subdomains";

interface Site {
  baseUrl: string;
  city: string;
  state: string;
}

const SITES: Site[] = [
  { baseUrl: "https://branson.spinnakervacations.com", city: "Branson", state: "MO" },
  { baseUrl: "https://hiltonhead.spinnakervacations.com", city: "Hilton Head Island", state: "SC" },
];

export async function runSpinnakerSubdomainsCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 10,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      const site = (request.userData as { site?: Site }).site;
      if (!site) return;

      const products = $(".woocommerce-loop-product__title, h2.woocommerce-loop-product__title");
      log.info(`[${site.city}] Found ${products.length} products`);
      let stored = 0;

      products.each((_, el) => {
        const titleEl = $(el);
        const title = titleEl.text().trim().replace(/\s+/g, " ");
        if (!title) return;

        // Walk up to the product wrapper.
        const product = titleEl.closest("li.product, .product, .wc-block-grid__product").first();
        if (!product.length) return;

        // Price block: <span class="price"><del>$899.00</del> $99.00</span>
        const priceBlock = product.find(".price").first();
        const priceTexts = priceBlock.find(".woocommerce-Price-amount").map((__, p) => $(p).text().trim()).get();

        let retailPrice: number | null = null;
        let salePrice: number | null = null;
        if (priceTexts.length >= 2) {
          // <del> first, sale second
          retailPrice = parseFloat(priceTexts[0].replace(/[$,]/g, ""));
          salePrice = parseFloat(priceTexts[1].replace(/[$,]/g, ""));
        } else if (priceTexts.length === 1) {
          salePrice = parseFloat(priceTexts[0].replace(/[$,]/g, ""));
        }
        if (salePrice == null || !Number.isFinite(salePrice) || salePrice < 50) return;

        // Nights from title (e.g. "4-Days/3-Nights")
        const nightsMatch = title.match(/(\d+)\s*[/-]?\s*Nights?/i);
        const nights = nightsMatch ? parseInt(nightsMatch[1], 10) : 3;

        const linkHref = product.find("a.woocommerce-LoopProduct-link").first().attr("href") ||
          titleEl.closest("a").attr("href") || site.baseUrl;
        const url = linkHref.startsWith("http") ? linkHref : `${site.baseUrl}${linkHref}`;

        const imageUrl = product.find("img").first().attr("data-src") || product.find("img").first().attr("src");

        storeDeal(
          {
            title: `${title}`,
            price: salePrice,
            originalPrice: retailPrice && Number.isFinite(retailPrice) ? retailPrice : undefined,
            durationNights: nights,
            durationDays: nights + 1,
            city: site.city,
            state: site.state,
            country: "US",
            brandSlug: SOURCE_KEY,
            url,
            resortName: title.split(",")[0]?.trim() || title,
            imageUrl: imageUrl || undefined,
            inclusions: ["Spinnaker Resorts preview tour required"],
            presentationMinutes: 120,
          },
          SOURCE_KEY,
        );
        stored += 1;
      });

      log.info(`[${site.city}] Stored ${stored} deals`);
    },
  });

  await crawler.run(
    SITES.map((site) => ({ url: site.baseUrl, userData: { site } })),
  );
}
