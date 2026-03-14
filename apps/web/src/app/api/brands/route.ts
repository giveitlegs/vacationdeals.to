import { NextResponse } from "next/server";
import { db } from "@vacationdeals/db";
import { brands } from "@vacationdeals/db";
import { asc } from "drizzle-orm";

export async function GET() {
  const results = await db.select().from(brands).orderBy(asc(brands.name));
  return NextResponse.json({ brands: results });
}
