import type { Metadata } from "next";
import Link from "next/link";
import { ScoutApplyForm } from "./ScoutApplyForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Scout Network — Get paid to sit through a timeshare pitch",
  description:
    "We pay readers to attend timeshare presentations and report back. You keep the vacation. We keep the intel. Apply for the first cohort.",
  alternates: { canonical: "https://vacationdeals.to/scout" },
  openGraph: {
    title: "Get paid to sit through a timeshare pitch",
    description:
      "Free vacation. Per-pitch bounty. The catch: don't buy. Apply for the Scout Network.",
    url: "https://vacationdeals.to/scout",
    type: "website",
  },
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

export default async function ScoutPage() {
  const brands = await loadBrands();

  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <section className="mb-10 rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 px-6 py-12 text-white shadow-2xl sm:px-12">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-emerald-100">
          Now recruiting first cohort
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
          Get paid to sit through a timeshare pitch.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
          You attend the presentation. You keep the vacation. You report back what they said,
          what they offered, who they brought in, and how hard they pushed. <strong>The only
          rule: don't buy.</strong>
        </p>
        <p className="mt-3 text-sm text-emerald-100/90">
          Payouts and per-pitch logistics get worked out one-on-one. This page is for interest —
          we'll reach out individually to scouts in the first cohort.
        </p>
      </section>

      {/* How it works */}
      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        <Step n={1} title="You apply">
          Tell us where you live, how far you'd travel, and which brands you've already done.
        </Step>
        <Step n={2} title="We match + brief">
          We pair you with a brand whose pitch we want documented. Brief covers the basics — what to
          watch for, what to record (if legal in that state), what not to say.
        </Step>
        <Step n={3} title="Attend, report, get paid">
          You sit through the pitch, take the vacation, file a structured report. We pay per
          completed report.
        </Step>
      </section>

      {/* The contrarian frame */}
      <section className="mb-10 rounded-2xl bg-gray-900 px-6 py-8 text-white sm:px-10">
        <h2 className="text-xl font-bold">Why we're doing this</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-200">
          Every aggregator on the web is a passive scraper — scrape the marketing page, parse the
          price, move on. The actual interesting data is what happens <em>inside</em> the
          presentation room: the pressure tactics, the manager rotations, the price ladder, the
          "today only" lines, the discounts that materialize the moment you stand up. That data
          isn't on any page anyone scrapes. It's only in the heads of the people who attended.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-200">
          So we're going to compensate the people who attended. Their reports will feed{" "}
          <Link href="/pitch-diaries" className="font-semibold text-white underline">the Pitch Diaries</Link>,
          calibrate{" "}
          <Link href="/reality-index" className="font-semibold text-white underline">the Reality Index</Link>,
          and become the canonical record of what really happens at these things.
        </p>
      </section>

      {/* Eligibility */}
      <section className="mb-10 rounded-xl border-2 border-amber-300 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-lg font-bold">Be honest with yourself before you apply</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed">
          <li>
            <strong>You must be able to say no.</strong> Pitches average 90–180 minutes. They will
            push hard. If you might cave, this isn't for you.
          </li>
          <li>
            <strong>You must qualify.</strong> Most brands require married couples, household income
            over a threshold, and credit-pull consent. Read the fine print on every offer.
          </li>
          <li>
            <strong>You must travel.</strong> Some pitches are local; most require flights or 3–6
            hour drives. Travel logistics are on you (the vacpack covers room, sometimes flight).
          </li>
        </ul>
      </section>

      <h2 className="mb-4 text-2xl font-bold text-gray-900">Apply</h2>
      <ScoutApplyForm brands={brands} />

      <p className="mt-8 text-center text-sm text-gray-500">
        Already got a pitch story?{" "}
        <Link href="/pitch-diaries/submit" className="font-semibold text-indigo-700 hover:text-indigo-900">
          Submit a Pitch Diary →
        </Link>
      </p>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-base font-bold text-white">
        {n}
      </div>
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">{children}</p>
    </div>
  );
}
