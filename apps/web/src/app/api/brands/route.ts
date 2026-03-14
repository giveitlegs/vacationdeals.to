import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { db } = await import("@vacationdeals/db");
  const { brands } = await import("@vacationdeals/db");
  const { asc } = await import("drizzle-orm");

  const results = await db.select().from(brands).orderBy(asc(brands.name));
  return NextResponse.json({ brands: results });
}
