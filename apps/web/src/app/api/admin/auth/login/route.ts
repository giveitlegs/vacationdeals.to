import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/admin/auth";

function redirect(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") || "").toLowerCase().trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      return redirect("/admin/login?error=invalid");
    }

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");

    const user = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.email, email),
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return redirect("/admin/login?error=invalid");
    }

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const { token, expiresAt } = await createSession(user.id, ipAddress, userAgent);
    await setSessionCookie(token, expiresAt);

    return redirect("/admin");
  } catch (e) {
    console.error("[admin/login]", e);
    return redirect("/admin/login?error=failed");
  }
}
