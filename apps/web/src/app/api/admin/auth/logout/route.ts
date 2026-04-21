import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/admin/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("vd_admin")?.value;

    if (token) {
      const { db } = await import("@vacationdeals/db");
      const schema = await import("@vacationdeals/db");
      const { eq } = await import("drizzle-orm");
      await db.delete(schema.adminSessions).where(eq(schema.adminSessions.token, token));
    }
    await clearSessionCookie();
  } catch {}

  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
