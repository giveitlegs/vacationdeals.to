import type { Metadata } from "next";
import Link from "next/link";
import { PitchSubmitForm } from "./PitchSubmitForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submit a Pitch Diary — anonymous timeshare-presentation account",
  description:
    "Sat through a timeshare presentation? Tell us what happened. Anonymous, moderated, brand-tagged. Help future attendees walk in armed.",
  alternates: { canonical: "https://vacationdeals.to/pitch-diaries/submit" },
};

async function loadBrands(): Promise<Array<{ slug: string; name: string }>> {
  try {
    const { db } = await import("@vacationdeals/db");
    const { sql } = await import("drizzle-orm");
    const r = (await db.execute(sql`
      SELECT slug, name FROM brands WHERE is_suppressed = false ORDER BY name ASC
    `)) as unknown as
      | { rows?: Array<{ slug: string; name: string }> }
      | Array<{ slug: string; name: string }>;
    return (Array.isArray(r) ? r : r.rows ?? []) as Array<{ slug: string; name: string }>;
  } catch {
    return [];
  }
}

export default async function SubmitPitchDiaryPage() {
  const brands = await loadBrands();

  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <section className="mb-8 rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 px-6 py-10 text-white shadow-xl sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-indigo-100">
          Anonymous · moderated · published
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
          Submit a Pitch Diary
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90">
          Tell us what actually happened — what they said, what they offered, what they pressured.
          We strip personal info and publish the tactics. Future attendees walk in knowing what's coming.
        </p>
      </section>

      <div className="mb-6 rounded-xl bg-amber-50 px-5 py-4 text-sm text-amber-900 ring-1 ring-amber-200">
        <strong>Before you start:</strong> don't include presenter names or anything that could identify a
        specific employee. We're cataloguing tactics, not targeting individuals. We'll redact on review if
        anything slips through.
      </div>

      <PitchSubmitForm brands={brands} />

      <p className="mt-8 text-center text-sm text-gray-500">
        Looking for someone else's story instead? <Link href="/pitch-diaries" className="font-semibold text-indigo-700 hover:text-indigo-900">Browse the diaries →</Link>
      </p>
    </div>
  );
}
