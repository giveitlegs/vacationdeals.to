import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@vacationdeals/shared";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const { db } = await import("@vacationdeals/db");
  const { deals, brands, destinations } = await import("@vacationdeals/db");
  const { eq, and, or, gte, lte, desc, asc, sql, ilike } = await import("drizzle-orm");

  const searchParams = request.nextUrl.searchParams;

  const city = searchParams.get("city");
  const brand = searchParams.get("brand");
  const search = searchParams.get("search");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const duration = searchParams.get("duration");
  const sortBy = searchParams.get("sortBy") || "newest";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE))),
  );
  const offset = (page - 1) * limit;

  const conditions = [eq(deals.isActive, true)];

  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(deals.resortName, searchPattern),
        ilike(deals.title, searchPattern),
      )!,
    );
  }

  if (city) {
    const dest = await db.query.destinations.findFirst({
      where: eq(destinations.slug, city),
    });
    if (dest) conditions.push(eq(deals.destinationId, dest.id));
  }

  if (brand) {
    const br = await db.query.brands.findFirst({
      where: eq(brands.slug, brand),
    });
    if (br) conditions.push(eq(deals.brandId, br.id));
  }

  if (minPrice) conditions.push(gte(deals.price, minPrice));
  if (maxPrice) conditions.push(lte(deals.price, maxPrice));
  if (duration) conditions.push(eq(deals.durationNights, parseInt(duration)));

  const orderMap = {
    price: deals.price,
    duration: deals.durationNights,
    savings: deals.savingsPercent,
    newest: deals.scrapedAt,
  } as const;

  const orderColumn = orderMap[sortBy as keyof typeof orderMap] || deals.scrapedAt;
  const orderDir = sortOrder === "asc" ? asc : desc;

  const [results, countResult] = await Promise.all([
    db
      .select()
      .from(deals)
      .where(and(...conditions))
      .orderBy(orderDir(orderColumn))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(and(...conditions)),
  ]);

  const total = Number(countResult[0].count);

  return NextResponse.json(
    {
      deals: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    { headers: CORS_HEADERS },
  );
}
