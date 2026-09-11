import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import * as OTPAuth from "otpauth";

const SESSION_COOKIE = "vd_admin";
const SESSION_DAYS = 30;
const MFA_ISSUER = "VacationDeals.to";

// ── Login lockout policy (Phase 2 hardening) ──
export const MAX_FAILED_ATTEMPTS = 8;
export const LOCKOUT_MINUTES = 15;

// ── TOTP MFA (opt-in; enforced only once a user enrolls) ──
export function generateMfaSecret(email: string): { secret: string; otpauthUrl: string } {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: MFA_ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
  return { secret: secret.base32, otpauthUrl: totp.toString() };
}

export function verifyTotp(secretBase32: string, token: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: MFA_ISSUER,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretBase32),
    });
    // window ±1 period tolerates minor clock drift
    return totp.validate({ token: token.replace(/\s/g, ""), window: 1 }) !== null;
  } catch {
    return false;
  }
}

// ── Password hashing (scrypt, stdlib only — no bcrypt dep) ──
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(adminUserId: number, ipAddress: string, userAgent: string) {
  const { db } = await import("@vacationdeals/db");
  const schema = await import("@vacationdeals/db");

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(schema.adminSessions).values({
    token,
    adminUserId,
    ipAddress,
    userAgent,
    expiresAt,
  });

  // Update last login
  const { eq } = await import("drizzle-orm");
  await db.update(schema.adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.adminUsers.id, adminUserId));

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq, and, gt } = await import("drizzle-orm");

    const rows = await db
      .select({
        id: schema.adminUsers.id,
        email: schema.adminUsers.email,
        name: schema.adminUsers.name,
        role: schema.adminUsers.role,
      })
      .from(schema.adminSessions)
      .innerJoin(schema.adminUsers, eq(schema.adminSessions.adminUserId, schema.adminUsers.id))
      .where(and(
        eq(schema.adminSessions.token, token),
        gt(schema.adminSessions.expiresAt, new Date()),
      ))
      .limit(1);

    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function logAdminAction(
  adminUserId: number,
  action: string,
  entityType?: string,
  entityId?: number,
  details?: Record<string, unknown>,
) {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    await db.insert(schema.adminActions).values({
      adminUserId,
      action,
      entityType,
      entityId,
      details: details ? JSON.stringify(details) : null,
    });
  } catch {
    // Silent fail — don't break admin flow
  }
}
