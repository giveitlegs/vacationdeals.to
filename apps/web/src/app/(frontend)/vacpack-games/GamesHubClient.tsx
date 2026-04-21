"use client";

import Link from "next/link";
import { useState } from "react";
import { LeadGenPopup } from "@/components/LeadGenPopup";

const GAMES = [
  {
    slug: "resort-roulette",
    href: "/resort-roulette",
    title: "Resort Roulette",
    tag: "Original",
    desc: "Spin a wheel. Win a random real deal. Free daily spins.",
    gradient: "from-red-500 to-orange-500",
    icon: (
      <svg viewBox="0 0 80 80" className="h-16 w-16 animate-spin" style={{ animationDuration: "4s" }}>
        <circle cx="40" cy="40" r="36" fill="#EF4444" stroke="white" strokeWidth="3" />
        <circle cx="40" cy="40" r="10" fill="#FBBF24" />
        <line x1="40" y1="4" x2="40" y2="30" stroke="white" strokeWidth="2" />
        <line x1="76" y1="40" x2="50" y2="40" stroke="white" strokeWidth="2" />
        <line x1="40" y1="76" x2="40" y2="50" stroke="white" strokeWidth="2" />
        <line x1="4" y1="40" x2="30" y2="40" stroke="white" strokeWidth="2" />
      </svg>
    ),
  },
  {
    slug: "survival-kit",
    href: "/vacpack-games/survival-kit",
    title: "Survival Kit",
    tag: "Quiz",
    desc: "20 real scenarios from a timeshare pitch. What would YOU do?",
    gradient: "from-emerald-500 to-teal-500",
    icon: (
      <svg viewBox="0 0 80 80" className="h-16 w-16">
        <rect x="15" y="20" width="50" height="50" rx="6" fill="#10B981" stroke="white" strokeWidth="3" />
        <path d="M30 35 L38 45 L52 28" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="stroke-dashoffset" from="30" to="0" dur="2s" repeatCount="indefinite" />
        </path>
      </svg>
    ),
  },
  {
    slug: "bingo",
    href: "/vacpack-games/bingo",
    title: "VacPack Bingo",
    tag: "Printable",
    desc: "Bingo card of timeshare presentation tropes. Check as they happen.",
    gradient: "from-fuchsia-500 to-pink-500",
    icon: (
      <svg viewBox="0 0 80 80" className="h-16 w-16">
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => {
            const filled = (r + c) % 2 === 0;
            return (
              <rect
                key={`${r}-${c}`}
                x={12 + c * 19}
                y={12 + r * 19}
                width="17"
                height="17"
                rx="2"
                fill={filled ? "#EC4899" : "white"}
                stroke="#EC4899"
                strokeWidth="2"
              >
                <animate attributeName="fill" values={`${filled ? "#EC4899" : "white"};#FBBF24;${filled ? "#EC4899" : "white"}`} dur={`${3 + (r + c) * 0.3}s`} repeatCount="indefinite" />
              </rect>
            );
          })
        )}
      </svg>
    ),
  },
  {
    slug: "59-challenge",
    href: "/vacpack-games/59-challenge",
    title: "$59 Challenge",
    tag: "Community",
    desc: "Plan a full 3-night trip under $200 total. Submit. Win.",
    gradient: "from-amber-500 to-orange-500",
    icon: (
      <svg viewBox="0 0 80 80" className="h-16 w-16">
        <text x="40" y="50" textAnchor="middle" fontSize="32" fontWeight="900" fill="#F59E0B">
          $59
          <animate attributeName="font-size" values="32;38;32" dur="2s" repeatCount="indefinite" />
        </text>
        <circle cx="40" cy="40" r="36" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 4">
          <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="8s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
  },
  {
    slug: "time-machine",
    href: "/vacpack-games/time-machine",
    title: "Time Machine",
    tag: "Interactive",
    desc: "Watch deal prices change over time. Predict next year.",
    gradient: "from-violet-500 to-purple-500",
    icon: (
      <svg viewBox="0 0 80 80" className="h-16 w-16">
        <circle cx="40" cy="40" r="32" fill="none" stroke="#8B5CF6" strokeWidth="3" />
        <line x1="40" y1="40" x2="40" y2="18" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="6s" repeatCount="indefinite" />
        </line>
        <line x1="40" y1="40" x2="56" y2="40" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="30s" repeatCount="indefinite" />
        </line>
        <circle cx="40" cy="40" r="3" fill="#8B5CF6" />
      </svg>
    ),
  },
  {
    slug: "scratch-off",
    href: "/vacpack-games/scratch-off",
    title: "Scratch-Off",
    tag: "Daily",
    desc: "Digital scratch card. Reveal a surprise deal. Daily free scratch.",
    gradient: "from-sky-500 to-blue-500",
    icon: (
      <svg viewBox="0 0 80 80" className="h-16 w-16">
        <rect x="15" y="20" width="50" height="40" rx="6" fill="#3B82F6" />
        <text x="40" y="45" textAnchor="middle" fontSize="14" fontWeight="900" fill="white">SCRATCH</text>
        <g opacity="0.7">
          <circle cx="22" cy="24" r="1.5" fill="white">
            <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0s" repeatCount="indefinite" />
          </circle>
          <circle cx="58" cy="30" r="1.5" fill="white">
            <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="30" cy="52" r="1.5" fill="white">
            <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="55" cy="55" r="1.5" fill="white">
            <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.25s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    ),
  },
];

export function GamesHubClient() {
  const [active, setActive] = useState(0);

  return (
    <>
      <LeadGenPopup
        id="games-hub"
        timeDelayMs={45000}
        exitIntent
        headline="\u{1F389} Score All 6 Games"
        subheadline="Join 10,000+ travelers getting weekly deal alerts + early access to new games."
        ctaText="Get the Weekly Digest"
        source="games_hub_popup"
      />

      {/* Tabs (mobile-friendly horizontal scroll) */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {GAMES.map((g, i) => (
          <button
            key={g.slug}
            onClick={() => setActive(i)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
              active === i ? `bg-gradient-to-r ${g.gradient} text-white shadow-md` : "bg-white text-gray-600 border border-gray-300 hover:border-gray-400"
            }`}
          >
            {g.title}
          </button>
        ))}
      </div>

      {/* Active game preview card */}
      <div className={`relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br ${GAMES[active].gradient} p-8 text-white shadow-2xl`}>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            {GAMES[active].icon}
          </div>
          <div className="flex-1">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              {GAMES[active].tag}
            </span>
            <h2 className="mt-2 text-3xl font-black">{GAMES[active].title}</h2>
            <p className="mt-1 text-white/90">{GAMES[active].desc}</p>
            <Link
              href={GAMES[active].href}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-gray-900 shadow-lg hover:scale-105 transition-transform"
            >
              Play {GAMES[active].title} &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* All games grid */}
      <div className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">All Games</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g) => (
            <Link
              key={g.slug}
              href={g.href}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`mb-3 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br ${g.gradient}`}>
                {g.icon}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{g.tag}</span>
              <h3 className="mt-1 text-lg font-bold text-gray-900 group-hover:text-blue-600">{g.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{g.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
        <h3 className="text-lg font-bold text-gray-900">Why We Made These</h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">
          Vacation deals are fun. Timeshare presentations are... less fun. These games exist to make the whole ecosystem a little lighter — and to help you actually score cheap trips without getting fleeced.
        </p>
      </section>
    </>
  );
}
