import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword, createSession, setSessionCookie, verifyTotp,
  MAX_FAILED_ATTEMPTS, LOCKOUT_MINUTES,
} from "@/lib/admin/auth";
import { isSameOrigin } from "@/lib/admin/csrf";

function redirect(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

export async function POST(request: NextRequest) {
  try {
    // CSRF: block cross-site forged logins.
    if (!isSameOrigin(request)) return redirect("/admin/login?error=failed");

    const formData = await request.formData();
    const email = String(formData.get("email") || "").toLowerCase().trim();
    const password = String(formData.get("password") || "");
    const token = String(formData.get("token") || "").trim();

    if (!email || !password) return redirect("/admin/login?error=invalid");

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");

    const user = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.email, email),
    });

    // Generic "invalid" for a missing user (no account enumeration).
    if (!user) return redirect("/admin/login?error=invalid");

    // Account lockout check.
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return redirect("/admin/login?error=locked");
    }

    const registerFailure = async (redirectError: string) => {
      const failed = (user.failedAttempts || 0) + 1;
      const nowLocked = failed >= MAX_FAILED_ATTEMPTS;
      await db.update(schema.adminUsers).set({
        failedAttempts: failed,
        lockedUntil: nowLocked
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          : (user.lockedUntil ?? null),
      }).where(eq(schema.adminUsers.id, user.id));
      return redirect(nowLocked ? "/admin/login?error=locked" : redirectError);
    };

    if (!verifyPassword(password, user.passwordHash)) {
      return registerFailure("/admin/login?error=invalid");
    }

    // MFA gate — only enforced for users who have enrolled.
    if (user.mfaEnabled && user.mfaSecret) {
      if (!token) return redirect("/admin/login?error=mfa");
      if (!verifyTotp(user.mfaSecret, token)) {
        return registerFailure("/admin/login?error=mfa");
      }
    }

    // Success — clear failure counters.
    await db.update(schema.adminUsers)
      .set({ failedAttempts: 0, lockedUntil: null })
      .where(eq(schema.adminUsers.id, user.id));

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const { token: sessionToken, expiresAt } = await createSession(user.id, ipAddress, userAgent);
    await setSessionCookie(sessionToken, expiresAt);

    return redirect("/admin");
  } catch (e) {
    console.error("[admin/login]", e);
    return redirect("/admin/login?error=failed");
  }
}
