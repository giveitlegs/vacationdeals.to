import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ApplyBody {
  name?: string;
  email?: string;
  phone?: string;
  cityState?: string;
  willingToTravelMiles?: number;
  brandsExperienced?: string[];
  whyInterested?: string;
}

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 64);
}

function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  let body: ApplyBody;
  try {
    body = (await req.json()) as ApplyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();

  if (name.length < 2 || name.length > 255) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const ipHash = hashIp(getIp(req));
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  try {
    const { db, scoutApplications } = await import("@vacationdeals/db");
    await db.insert(scoutApplications).values({
      name: name.slice(0, 255),
      email: email.slice(0, 255),
      phone: body.phone?.trim().slice(0, 50) || null,
      cityState: body.cityState?.trim().slice(0, 100) || null,
      willingToTravelMiles: clampInt(body.willingToTravelMiles, 0, 5000),
      brandsExperienced: body.brandsExperienced?.length
        ? JSON.stringify(body.brandsExperienced.slice(0, 60))
        : null,
      whyInterested: body.whyInterested?.trim().slice(0, 4000) || null,
      ipHash,
      userAgent,
      status: "new",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't save your application. Try again in a moment." }, { status: 500 });
  }
}

function clampInt(n: number | undefined, min: number, max: number): number | null {
  if (n == null || !Number.isFinite(n)) return null;
  const i = Math.round(Number(n));
  if (i < min || i > max) return null;
  return i;
}
