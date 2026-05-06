import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDiaryById } from "@/lib/pitch-diaries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const numId = parseInt(id, 10);
  const diary = Number.isFinite(numId) ? await getDiaryById(numId) : null;
  if (!diary) {
    return { title: "Pitch Diary not found" };
  }
  const title = `Pitch Diary #${diary.id} — ${diary.brandName ?? "Timeshare"} ${diary.locationCity ? `in ${diary.locationCity}` : ""}`;
  return {
    title,
    description: diary.story.slice(0, 200),
    alternates: { canonical: `https://vacationdeals.to/pitch-diaries/${diary.id}` },
    openGraph: {
      title,
      description: diary.notableQuotes[0] ?? diary.story.slice(0, 200),
      url: `https://vacationdeals.to/pitch-diaries/${diary.id}`,
      type: "article",
    },
  };
}

export default async function DiaryDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (!Number.isFinite(numId)) notFound();
  const d = await getDiaryById(numId);
  if (!d) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/pitch-diaries"
        className="mb-4 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-900"
      >
        ← All diaries
      </Link>

      <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-700">
          Pitch Diary #{d.id}
        </p>
        <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
          {d.brandName ?? "Unknown brand"}
          {d.locationCity ? ` — ${d.locationCity}` : ""}
        </h1>
        {d.resortName && <p className="mt-1 text-sm text-gray-500">{d.resortName}</p>}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {d.durationMinutes != null && <Stat label="Duration" value={`${d.durationMinutes} min`} />}
          {d.pressureLevel != null && <Stat label="Pressure" value={`${d.pressureLevel}/10`} />}
          {d.presenterCount != null && <Stat label="Presenters" value={`${d.presenterCount}`} />}
          {d.managersBroughtIn != null && <Stat label="'Managers'" value={`${d.managersBroughtIn}`} />}
        </div>

        <p className="mt-5 inline-block rounded-full bg-gray-900 px-3 py-1 text-xs font-bold uppercase text-white">
          {d.didTheyBuy ? "they bought" : "they walked"}
        </p>

        {d.closingOffer && (
          <section className="mt-6 rounded-xl bg-rose-50 p-5 ring-1 ring-rose-200">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Closing offer</p>
            <p className="mt-1 text-base font-semibold text-rose-900">{d.closingOffer}</p>
          </section>
        )}

        {d.pricesQuoted.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-600">Price ladder</h2>
            <ul className="space-y-1 font-mono text-sm text-gray-800">
              {d.pricesQuoted.map((p, i) => (
                <li key={i} className="border-l-2 border-gray-300 pl-3">
                  {p}
                </li>
              ))}
            </ul>
          </section>
        )}

        {d.notableQuotes.length > 0 && (
          <section className="mt-6 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">Notable quotes</h2>
            {d.notableQuotes.map((q, i) => (
              <blockquote
                key={i}
                className="border-l-4 border-indigo-400 bg-indigo-50 px-4 py-3 text-sm italic text-indigo-900"
              >
                "{q}"
              </blockquote>
            ))}
          </section>
        )}

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-600">The story</h2>
          <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
            {d.story}
          </div>
        </section>
      </article>

      <section className="mt-8 rounded-2xl bg-gray-900 px-6 py-8 text-white">
        <h2 className="text-xl font-bold">Got your own pitch story?</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-200">
          Five minutes of your time arms the next attendee.
        </p>
        <Link
          href="/pitch-diaries/submit"
          className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-100"
        >
          Submit your diary →
        </Link>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-bold text-gray-900">{value}</div>
    </div>
  );
}
