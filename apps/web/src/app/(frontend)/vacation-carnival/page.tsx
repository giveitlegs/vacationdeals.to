import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Vacation Carnival — Bizarre Lead-Gen Bazaar | VacationDeals.to",
  description: "Eight weird-by-design attractions that turn corporate vacation guilt into a win. PTO Debt Collections, Severance Generator, and more.",
  alternates: { canonical: "https://vacationdeals.to/vacation-carnival" },
  openGraph: {
    title: "The Vacation Carnival",
    description: "Step right up to the bizarre lead-gen bazaar.",
    type: "website",
    url: "https://vacationdeals.to/vacation-carnival",
  },
};

interface Attraction {
  slug: string;
  title: string;
  barker: string; // one-line "step right up" pitch
  gradient: string;
  emoji: string;
  live: boolean;
}

const ATTRACTIONS: Attraction[] = [
  {
    slug: "pto-debt",
    title: "Overdue PTO Collections Agency",
    barker: "You owe yourself vacation days. We're here to collect.",
    gradient: "from-red-600 via-rose-600 to-red-700",
    emoji: "🧾",
    live: true,
  },
  {
    slug: "severance",
    title: "Severance Package Generator",
    barker: "The goodbye speech you're too polite to write yourself.",
    gradient: "from-gray-700 via-slate-700 to-gray-900",
    emoji: "📋",
    live: true,
  },
  {
    slug: "cursed-trip",
    title: "Cursed Vacation Generator",
    barker: "Wish you weren't here. Personalized for maximum dread.",
    gradient: "from-purple-800 via-violet-900 to-indigo-900",
    emoji: "🎭",
    live: false,
  },
  {
    slug: "blood-oath",
    title: "Resort Roulette: Blood Oath",
    barker: "One spin alone. Take the oath with a friend, get another.",
    gradient: "from-red-900 via-black to-red-950",
    emoji: "🗡️",
    live: false,
  },
  {
    slug: "court",
    title: "Vacation Court",
    barker: "You stand accused of Willful Overwork. The jury decides.",
    gradient: "from-amber-700 via-yellow-800 to-amber-900",
    emoji: "⚖️",
    live: false,
  },
  {
    slug: "lost-resort",
    title: "The Lost Resort Files",
    barker: "A resort that doesn't officially exist. Sign the NDA.",
    gradient: "from-stone-700 via-neutral-800 to-zinc-900",
    emoji: "🗂️",
    live: false,
  },
  {
    slug: "cult",
    title: "Cult of Leisure",
    barker: "Renounce your calendar. Take your sacred vacation.",
    gradient: "from-orange-200 via-amber-300 to-yellow-400",
    emoji: "🕯️",
    live: false,
  },
  {
    slug: "confessional",
    title: "The Vacation Confessional",
    barker: "The booth must know who you are to grant absolution.",
    gradient: "from-indigo-900 via-purple-900 to-indigo-950",
    emoji: "⛪",
    live: false,
  },
];

export default function VacationCarnivalPage() {
  return (
    <div>
      {/* Carnival hero */}
      <div className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-amber-500 to-yellow-400 p-10 text-center text-white shadow-2xl">
        <div aria-hidden="true" className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 400 100" className="h-full w-full">
            <pattern id="carnival-stripes" x="0" y="0" width="40" height="100" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="20" height="100" fill="white" />
              <rect x="20" y="0" width="20" height="100" fill="black" />
            </pattern>
            <rect width="400" height="100" fill="url(#carnival-stripes)" />
          </svg>
        </div>
        <p className="relative text-sm font-bold uppercase tracking-[0.3em] text-white/80">Step Right Up</p>
        <h1 className="relative mt-2 text-4xl font-black leading-none sm:text-6xl">The Vacation Carnival</h1>
        <p className="relative mx-auto mt-4 max-w-2xl text-lg text-white/95">
          Eight attractions. Each one extracts a smile, a share, or a sob — then hands you a real vacation package.
          The weirdest lead-generation bazaar on the internet.
        </p>
      </div>

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-blue-600">Vacation Deals</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="font-medium text-gray-900">Vacation Carnival</li>
        </ol>
      </nav>

      {/* Attraction grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ATTRACTIONS.map((a) => {
          const inner = (
            <div className={`relative h-56 overflow-hidden rounded-2xl bg-gradient-to-br ${a.gradient} p-6 text-white shadow-xl transition-all ${a.live ? "hover:-translate-y-1 hover:shadow-2xl cursor-pointer" : "opacity-60"}`}>
              <div className="text-5xl">{a.emoji}</div>
              <h3 className="mt-3 text-xl font-black leading-tight">{a.title}</h3>
              <p className="mt-2 text-sm italic opacity-95">&ldquo;{a.barker}&rdquo;</p>
              <div className="absolute bottom-4 right-5">
                {a.live ? (
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                    Enter →
                  </span>
                ) : (
                  <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                    Coming soon
                  </span>
                )}
              </div>
            </div>
          );
          return a.live ? (
            <Link key={a.slug} href={`/vacation-carnival/${a.slug}`}>
              {inner}
            </Link>
          ) : (
            <div key={a.slug} aria-disabled="true">
              {inner}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <section className="mt-16 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-8 text-center">
        <p className="text-2xl font-bold text-gray-900">All paths lead to a real vacation deal.</p>
        <p className="mt-2 text-sm text-gray-600">
          Every attraction above ends with a legitimate vacation-package giveaway at the destination of your choice.
          The bizarre framing is a feature, not a bug.
        </p>
        <Link
          href="/deals"
          className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Or just browse real deals →
        </Link>
      </section>
    </div>
  );
}
