import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, logAdminAction, generateMfaSecret, verifyTotp } from "@/lib/admin/auth";
import { isSameOrigin } from "@/lib/admin/csrf";
import QRCode from "qrcode";

/**
 * POST /api/admin/security/mfa — enroll / verify / disable TOTP 2FA for the
 * current admin. MFA is opt-in; nothing here changes login until "verify" flips
 * mfa_enabled on.
 *   { action: "start" }  → generates + stores a secret (disabled), returns QR
 *   { action: "verify", token } → confirms a code, enables MFA
 *   { action: "disable" } → turns MFA off and clears the secret
 */
export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  try {
    const { action, token } = (await request.json()) as { action?: string; token?: string };

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq } = await import("drizzle-orm");

    if (action === "start") {
      const { secret, otpauthUrl } = generateMfaSecret(admin.email);
      await db.update(schema.adminUsers)
        .set({ mfaSecret: secret, mfaEnabled: false })
        .where(eq(schema.adminUsers.id, admin.id));
      const qr = await QRCode.toDataURL(otpauthUrl);
      return NextResponse.json({ secret, otpauthUrl, qr });
    }

    if (action === "verify") {
      const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, admin.id) });
      if (!user?.mfaSecret) return NextResponse.json({ error: "No pending secret. Start enrollment first." }, { status: 400 });
      if (!verifyTotp(user.mfaSecret, String(token || ""))) {
        return NextResponse.json({ error: "Invalid code — try the current 6 digits." }, { status: 400 });
      }
      await db.update(schema.adminUsers).set({ mfaEnabled: true }).where(eq(schema.adminUsers.id, admin.id));
      await logAdminAction(admin.id, "security.mfa.enabled", "admin", admin.id);
      return NextResponse.json({ ok: true });
    }

    if (action === "disable") {
      await db.update(schema.adminUsers)
        .set({ mfaEnabled: false, mfaSecret: null })
        .where(eq(schema.adminUsers.id, admin.id));
      await logAdminAction(admin.id, "security.mfa.disabled", "admin", admin.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[admin/security/mfa]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
