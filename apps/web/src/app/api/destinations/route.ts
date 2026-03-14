import { NextResponse } from "next/server";
import { db } from "@vacationdeals/db";
import { destinations } from "@vacationdeals/db";
import { asc } from "drizzle-orm";

export async function GET() {
  const results = await db
    .select()
    .from(destinations)
    .orderBy(asc(destinations.city));
  return NextResponse.json({ destinations: results });
}
