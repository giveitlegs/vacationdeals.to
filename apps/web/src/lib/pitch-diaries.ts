import "server-only";

export interface PitchDiaryEntry {
  id: number;
  brandSlug: string | null;
  brandName: string | null;
  locationCity: string | null;
  resortName: string | null;
  attendedAt: Date | null;
  durationMinutes: number | null;
  pressureLevel: number | null;
  presenterCount: number | null;
  managersBroughtIn: number | null;
  closingOffer: string | null;
  pricesQuoted: string[];
  notableQuotes: string[];
  story: string;
  didTheyBuy: boolean;
  approvedAt: Date | null;
}

export async function getApprovedDiaries(opts?: {
  brandSlug?: string;
  limit?: number;
}): Promise<PitchDiaryEntry[]> {
  try {
    const { db } = await import("@vacationdeals/db");
    const { sql } = await import("drizzle-orm");
    const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 200);
    const where = opts?.brandSlug
      ? sql`AND p.brand_slug = ${opts.brandSlug}`
      : sql``;
    const rows = (await db.execute(sql`
      SELECT
        p.id,
        p.brand_slug AS "brandSlug",
        b.name AS "brandName",
        p.location_city AS "locationCity",
        p.resort_name AS "resortName",
        p.attended_at AS "attendedAt",
        p.duration_minutes AS "durationMinutes",
        p.pressure_level AS "pressureLevel",
        p.presenter_count AS "presenterCount",
        p.managers_brought_in AS "managersBroughtIn",
        p.closing_offer AS "closingOffer",
        p.prices_quoted AS "pricesQuoted",
        p.notable_quotes AS "notableQuotes",
        p.story AS "story",
        p.did_they_buy AS "didTheyBuy",
        p.approved_at AS "approvedAt"
      FROM pitch_diaries p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'approved'
      ${where}
      ORDER BY COALESCE(p.approved_at, p.created_at) DESC
      LIMIT ${limit}
    `)) as unknown as { rows?: PitchDiaryRow[] } | PitchDiaryRow[];
    const list = (Array.isArray(rows) ? rows : rows.rows ?? []) as PitchDiaryRow[];
    return list.map(parseDiaryRow);
  } catch {
    return [];
  }
}

export async function getDiaryById(id: number): Promise<PitchDiaryEntry | null> {
  try {
    const { db } = await import("@vacationdeals/db");
    const { sql } = await import("drizzle-orm");
    const rows = (await db.execute(sql`
      SELECT
        p.id,
        p.brand_slug AS "brandSlug",
        b.name AS "brandName",
        p.location_city AS "locationCity",
        p.resort_name AS "resortName",
        p.attended_at AS "attendedAt",
        p.duration_minutes AS "durationMinutes",
        p.pressure_level AS "pressureLevel",
        p.presenter_count AS "presenterCount",
        p.managers_brought_in AS "managersBroughtIn",
        p.closing_offer AS "closingOffer",
        p.prices_quoted AS "pricesQuoted",
        p.notable_quotes AS "notableQuotes",
        p.story AS "story",
        p.did_they_buy AS "didTheyBuy",
        p.approved_at AS "approvedAt"
      FROM pitch_diaries p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ${id} AND p.status = 'approved'
      LIMIT 1
    `)) as unknown as { rows?: PitchDiaryRow[] } | PitchDiaryRow[];
    const list = (Array.isArray(rows) ? rows : rows.rows ?? []) as PitchDiaryRow[];
    return list[0] ? parseDiaryRow(list[0]) : null;
  } catch {
    return null;
  }
}

export async function getBrandDiaryCounts(): Promise<Array<{ slug: string; name: string; count: number }>> {
  try {
    const { db } = await import("@vacationdeals/db");
    const { sql } = await import("drizzle-orm");
    const rows = (await db.execute(sql`
      SELECT b.slug, b.name, COUNT(p.id)::int AS count
      FROM pitch_diaries p
      JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'approved'
      GROUP BY b.slug, b.name
      ORDER BY count DESC, b.name ASC
    `)) as unknown as
      | { rows?: Array<{ slug: string; name: string; count: number }> }
      | Array<{ slug: string; name: string; count: number }>;
    return (Array.isArray(rows) ? rows : rows.rows ?? []) as Array<{
      slug: string;
      name: string;
      count: number;
    }>;
  } catch {
    return [];
  }
}

interface PitchDiaryRow {
  id: number;
  brandSlug: string | null;
  brandName: string | null;
  locationCity: string | null;
  resortName: string | null;
  attendedAt: string | Date | null;
  durationMinutes: number | null;
  pressureLevel: number | null;
  presenterCount: number | null;
  managersBroughtIn: number | null;
  closingOffer: string | null;
  pricesQuoted: string | null;
  notableQuotes: string | null;
  story: string;
  didTheyBuy: boolean;
  approvedAt: string | Date | null;
}

function parseDiaryRow(r: PitchDiaryRow): PitchDiaryEntry {
  const safeArr = (json: string | null): string[] => {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  };
  return {
    id: r.id,
    brandSlug: r.brandSlug,
    brandName: r.brandName,
    locationCity: r.locationCity,
    resortName: r.resortName,
    attendedAt: r.attendedAt ? new Date(r.attendedAt as string) : null,
    durationMinutes: r.durationMinutes,
    pressureLevel: r.pressureLevel,
    presenterCount: r.presenterCount,
    managersBroughtIn: r.managersBroughtIn,
    closingOffer: r.closingOffer,
    pricesQuoted: safeArr(r.pricesQuoted),
    notableQuotes: safeArr(r.notableQuotes),
    story: r.story,
    didTheyBuy: r.didTheyBuy,
    approvedAt: r.approvedAt ? new Date(r.approvedAt as string) : null,
  };
}
