import { db } from "@vacationdeals/db";
import { deals, destinations, brands, sources, dealPriceHistory } from "@vacationdeals/db";
import { eq, and } from "drizzle-orm";
import type { ScrapedDeal } from "@vacationdeals/shared";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function storeDeal(scrapedDeal: ScrapedDeal, sourceKey: string) {
  // Find or match brand
  const brand = await db.query.brands.findFirst({
    where: eq(brands.slug, scrapedDeal.brandSlug),
  });

  // Find or create destination
  let destination = await db.query.destinations.findFirst({
    where: eq(destinations.slug, slugify(scrapedDeal.city)),
  });

  if (!destination) {
    const [newDest] = await db
      .insert(destinations)
      .values({
        city: scrapedDeal.city,
        state: scrapedDeal.state || null,
        country: scrapedDeal.country || "US",
        slug: slugify(scrapedDeal.city),
      })
      .returning();
    destination = newDest;
  }

  // Find source
  const source = await db.query.sources.findFirst({
    where: eq(sources.scraperKey, sourceKey),
  });

  const dealSlug = slugify(
    `${scrapedDeal.brandSlug}-${scrapedDeal.city}-${scrapedDeal.durationNights}-night-${scrapedDeal.price}`,
  );

  // Upsert deal
  const existingDeal = await db.query.deals.findFirst({
    where: eq(deals.url, scrapedDeal.url),
  });

  if (existingDeal) {
    // Update existing deal and record price history if changed
    if (existingDeal.price !== String(scrapedDeal.price)) {
      await db.insert(dealPriceHistory).values({
        dealId: existingDeal.id,
        price: String(scrapedDeal.price),
      });
    }

    await db
      .update(deals)
      .set({
        title: scrapedDeal.title,
        price: String(scrapedDeal.price),
        originalPrice: scrapedDeal.originalPrice
          ? String(scrapedDeal.originalPrice)
          : null,
        description: scrapedDeal.description || null,
        imageUrl: scrapedDeal.imageUrl || null,
        inclusions: scrapedDeal.inclusions
          ? JSON.stringify(scrapedDeal.inclusions)
          : null,
        requirements: scrapedDeal.requirements
          ? JSON.stringify(scrapedDeal.requirements)
          : null,
        presentationMinutes: scrapedDeal.presentationMinutes || null,
        travelWindow: scrapedDeal.travelWindow || null,
        savingsPercent: scrapedDeal.savingsPercent || null,
        isActive: true,
        scrapedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(deals.id, existingDeal.id));

    return existingDeal.id;
  }

  // Insert new deal
  const [newDeal] = await db
    .insert(deals)
    .values({
      brandId: brand?.id || null,
      destinationId: destination?.id || null,
      sourceId: source?.id || null,
      title: scrapedDeal.title,
      slug: dealSlug,
      price: String(scrapedDeal.price),
      originalPrice: scrapedDeal.originalPrice
        ? String(scrapedDeal.originalPrice)
        : null,
      durationNights: scrapedDeal.durationNights,
      durationDays: scrapedDeal.durationDays,
      description: scrapedDeal.description || null,
      resortName: scrapedDeal.resortName || null,
      url: scrapedDeal.url,
      imageUrl: scrapedDeal.imageUrl || null,
      inclusions: scrapedDeal.inclusions
        ? JSON.stringify(scrapedDeal.inclusions)
        : null,
      requirements: scrapedDeal.requirements
        ? JSON.stringify(scrapedDeal.requirements)
        : null,
      presentationMinutes: scrapedDeal.presentationMinutes || null,
      travelWindow: scrapedDeal.travelWindow || null,
      savingsPercent: scrapedDeal.savingsPercent || null,
    })
    .returning();

  // Record initial price
  await db.insert(dealPriceHistory).values({
    dealId: newDeal.id,
    price: String(scrapedDeal.price),
  });

  return newDeal.id;
}
