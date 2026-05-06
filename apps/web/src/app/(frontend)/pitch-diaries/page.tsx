import type { Metadata } from "next";
import Link from "next/link";
import { getApprovedDiaries, getBrandDiaryCounts } from "@/lib/pitch-diaries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Pitch Diaries — Real timeshare-presentation transcripts, by brand",
  description:
    "Crowdsourced anonymous accounts of what attendees actually heard at timeshare presentations. Searchable by brand. Submit your own.",
  alternates: { canonical: "https://vacationdeals.to/pitch-diaries" },
  openGraph: {
    title: "The Pitch Diaries",
    description:
      "Anonymous, crowdsourced transcripts of what timeshare salespeople actually say behind closed doors.",
    url: "https://vacationdeals.to/pitch-diaries",
    type: "website",
  },
};

export default async function PitchDiariesIndex() {
  const [diaries, brandCounts] = await Promise.all([
    getApprovedDiaries({ limit: 30 }),
    getBrandDiaryCounts(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero */}
      <section className="mb-10 rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 px-6 py-12 text-white shadow-2xl sm:px-12">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-indigo-100">
          Crowdsourced · anonymous · brand-tagged
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
          The Pitch Diaries
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
          What did they actually say at your timeshare presentation? People share, we publish, future
          attendees know what's coming. {diaries.length > 0 ? `${diaries.length} diaries indexed and counting.` : "Be the first to contribute."}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/pitch-diaries/submit"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-indigo-800 shadow-md hover:bg-indigo-50"
          >
            Submit your pitch story →
          </Link>
          <Link
            href="/forfeit"
            className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
          >
            See what's at stake →
          </Link>
        </div>
      </section>

      {/* Brand directory */}
      {brandCounts.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Browse by brand</h2>
          <div className="flex flex-wrap gap-2">
            {brandCounts.map((b) => (
              <Link
                key={b.slug}
                href={`/pitch-diaries/brand/${b.slug}`}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-indigo-500 hover:text-indigo-700"
              >
                {b.name} <span className="text-gray-500">({b.count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Diary list */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          {diaries.length > 0 ? "Latest diaries" : "First entries coming soon"}
        </h2>
        {diaries.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <p className="text-gray-700">
              No approved diaries yet. If you've sat through a timeshare pitch — even one — your
              story is the entire reason this page exists.
            </p>
            <Link
              href="/pitch-diaries/submit"
              className="mt-4 inline-block rounded-full bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700"
            >
              Be entry #1 →
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {diaries.map((d) => (
              <article
                key={d.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      <Link href={`/pitch-diaries/${d.id}`} className="hover:text-indigo-700">
                        {d.brandName ?? "Unknown brand"} — {d.locationCity ?? d.resortName ?? "Pitch room"}
                      </Link>
                    </h3>
                    <p className="text-xs text-gray-500">
                      {d.durationMinutes ? `${d.durationMinutes}-min pitch · ` : ""}
                      {d.pressureLevel ? `pressure ${d.pressureLevel}/10 · ` : ""}
                      {d.didTheyBuy ? "they bought" : "they walked"}
                    </p>
                  </div>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                    #{d.id}
                  </span>
                </div>
                <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-gray-700">
                  {d.story}
                </p>
                {d.notableQuotes.length > 0 && (
                  <blockquote className="border-l-4 border-indigo-300 bg-indigo-50 px-4 py-2 text-sm italic text-indigo-900">
                    "{d.notableQuotes[0]}"
                  </blockquote>
                )}
                <Link
                  href={`/pitch-diaries/${d.id}`}
                  className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  Read full diary →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Sticky CTA at bottom */}
      <section className="mb-10 rounded-2xl bg-gray-900 px-6 py-8 text-white">
        <h2 className="text-xl font-bold">Sat through a pitch? Submit anonymously.</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-200">
          We never publish names, contact info, or anything that identifies you. The goal is the
          tactics — what they said, how hard they pushed, how the math was framed. Future
          attendees walk in armed.
        </p>
        <Link
          href="/pitch-diaries/submit"
          className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-100"
        >
          Submit your story →
        </Link>
      </section>
    </div>
  );
}
