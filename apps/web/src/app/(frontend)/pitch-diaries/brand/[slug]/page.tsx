import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getApprovedDiaries } from "@/lib/pitch-diaries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Pitch Diaries: ${slug} — what attendees actually heard`,
    description: `Anonymous transcripts of timeshare presentations attended for ${slug}.`,
    alternates: { canonical: `https://vacationdeals.to/pitch-diaries/brand/${slug}` },
  };
}

export default async function BrandDiaryPage({ params }: Props) {
  const { slug } = await params;
  const diaries = await getApprovedDiaries({ brandSlug: slug, limit: 100 });
  if (diaries.length === 0) notFound();
  const brandName = diaries[0].brandName ?? slug;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/pitch-diaries" className="mb-4 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-900">
        ← All diaries
      </Link>

      <header className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-700 to-fuchsia-700 px-6 py-10 text-white shadow-xl sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-100">{diaries.length} diaries</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">What people heard at {brandName}</h1>
        <p className="mt-3 max-w-2xl text-base text-white/90">
          Anonymous, moderated, brand-tagged accounts of {brandName} timeshare presentations.
        </p>
      </header>

      <div className="space-y-5">
        {diaries.map((d) => (
          <article key={d.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-indigo-300">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold text-gray-900">
                <Link href={`/pitch-diaries/${d.id}`} className="hover:text-indigo-700">
                  {d.locationCity ?? d.resortName ?? "Pitch room"} · #{d.id}
                </Link>
              </h2>
              <span className="text-xs text-gray-500">
                {d.pressureLevel ? `${d.pressureLevel}/10 pressure · ` : ""}
                {d.didTheyBuy ? "bought" : "walked"}
              </span>
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-gray-700">{d.story}</p>
            {d.notableQuotes[0] && (
              <blockquote className="mt-3 border-l-4 border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs italic text-indigo-900">
                "{d.notableQuotes[0]}"
              </blockquote>
            )}
            <Link href={`/pitch-diaries/${d.id}`} className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-900">
              Read full →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
