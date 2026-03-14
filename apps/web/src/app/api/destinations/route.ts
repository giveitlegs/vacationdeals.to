import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { db } = await import("@vacationdeals/db");
  const { destinations } = await import("@vacationdeals/db");
  const { asc } = await import("drizzle-orm");

  const results = await db
    .select()
    .from(destinations)
    .orderBy(asc(destinations.city));
  return NextResponse.json({ destinations: results });
}
