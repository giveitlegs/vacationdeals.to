import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("key");
  if (secret !== process.env.PAYLOAD_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db } = await import("@vacationdeals/db");
  const { seoHealth } = await import("@vacationdeals/db");
  const { desc, eq, sql } = await import("drizzle-orm");

  const searchParams = request.nextUrl.searchParams;
  const severityFilter = searchParams.get("severity"); // "critical", "high", "medium", "low"
  const unresolvedOnly = searchParams.get("unresolved") !== "false"; // default: only unresolved
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "100")));

  const conditions = [];
  if (unresolvedOnly) {
    conditions.push(eq(seoHealth.isResolved, false));
  }
  if (severityFilter) {
    conditions.push(eq(seoHealth.severity, severityFilter));
  }

  const { and } = await import("drizzle-orm");

  const issues = await db
    .select()
    .from(seoHealth)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(seoHealth.checkedAt))
    .limit(limit);

  // Summary counts
  const [summary] = await db
    .select({
      total: sql<number>`count(*)`,
      critical: sql<number>`count(*) filter (where ${seoHealth.severity} = 'critical' and ${seoHealth.isResolved} = false)`,
      high: sql<number>`count(*) filter (where ${seoHealth.severity} = 'high' and ${seoHealth.isResolved} = false)`,
      medium: sql<number>`count(*) filter (where ${seoHealth.severity} = 'medium' and ${seoHealth.isResolved} = false)`,
      low: sql<number>`count(*) filter (where ${seoHealth.severity} = 'low' and ${seoHealth.isResolved} = false)`,
    })
    .from(seoHealth);

  return NextResponse.json({
    summary: {
      total: Number(summary.total),
      unresolved: {
        critical: Number(summary.critical),
        high: Number(summary.high),
        medium: Number(summary.medium),
        low: Number(summary.low),
      },
    },
    issues,
  });
}
