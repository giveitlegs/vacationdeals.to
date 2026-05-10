import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { notifyFormSubmission } from "@/lib/email/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SubmitBody {
  brandSlug?: string;
  locationCity?: string;
  resortName?: string;
  attendedAt?: string; // ISO date
  durationMinutes?: number;
  pressureLevel?: number; // 1-10
  presenterCount?: number;
  managersBroughtIn?: number;
  closingOffer?: string;
  pricesQuoted?: string[];
  notableQuotes?: string[];
  story?: string;
  didTheyBuy?: boolean;
  submitterEmail?: string;
}

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 64);
}

function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Hard validation — story is the one required free-text field.
  const story = (body.story ?? "").trim();
  if (story.length < 80) {
    return NextResponse.json(
      { error: "Tell us at least a few sentences about what happened (80+ characters)." },
      { status: 400 },
    );
  }
  if (story.length > 8000) {
    return NextResponse.json({ error: "Story is too long (8000 char max)." }, { status: 400 });
  }

  // Brand slug must match one we know about (or null).
  let brandId: number | null = null;
  let brandSlug: string | null = null;
  if (body.brandSlug) {
    try {
      const { db, brands } = await import("@vacationdeals/db");
      const { eq } = await import("drizzle-orm");
      const brand = await db.query.brands.findFirst({ where: eq(brands.slug, body.brandSlug) });
      if (brand) {
        brandId = brand.id;
        brandSlug = brand.slug;
      }
    } catch {
      // brand lookup failed — submit without brand link
    }
  }

  const ipHash = hashIp(getIp(req));

  try {
    const { db, pitchDiaries } = await import("@vacationdeals/db");
    const inserted = await db
      .insert(pitchDiaries)
      .values({
        brandId,
        brandSlug,
        locationCity: body.locationCity?.slice(0, 100) ?? null,
        resortName: body.resortName?.slice(0, 255) ?? null,
        attendedAt: body.attendedAt ? new Date(body.attendedAt) : null,
        durationMinutes: clampInt(body.durationMinutes, 0, 600),
        pressureLevel: clampInt(body.pressureLevel, 1, 10),
        presenterCount: clampInt(body.presenterCount, 0, 20),
        managersBroughtIn: clampInt(body.managersBroughtIn, 0, 20),
        closingOffer: body.closingOffer?.slice(0, 5000) ?? null,
        pricesQuoted: body.pricesQuoted?.length
          ? JSON.stringify(body.pricesQuoted.slice(0, 50))
          : null,
        notableQuotes: body.notableQuotes?.length
          ? JSON.stringify(body.notableQuotes.slice(0, 50))
          : null,
        story,
        didTheyBuy: !!body.didTheyBuy,
        submitterEmail: body.submitterEmail?.trim().slice(0, 255) || null,
        submitterIpHash: ipHash,
        status: "pending",
      })
      .returning({ id: pitchDiaries.id });

    notifyFormSubmission({
      formName: "Pitch diary",
      data: {
        submitterEmail: body.submitterEmail?.trim() || "(anonymous)",
        brand: brandSlug || "(unknown)",
        location: body.locationCity || "",
        resort: body.resortName || "",
        pressureLevel: body.pressureLevel ?? "",
        durationMinutes: body.durationMinutes ?? "",
        didTheyBuy: body.didTheyBuy ? "yes" : "no",
        story: story.slice(0, 500) + (story.length > 500 ? "…" : ""),
      },
    }).catch((err) => console.warn("[pitch] notify failed:", err));

    return NextResponse.json({ ok: true, id: inserted[0]?.id });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to save submission. Try again in a moment." },
      { status: 500 },
    );
  }
}

function clampInt(n: number | undefined, min: number, max: number): number | null {
  if (n == null || !Number.isFinite(n)) return null;
  const i = Math.round(Number(n));
  if (i < min || i > max) return null;
  return i;
}
