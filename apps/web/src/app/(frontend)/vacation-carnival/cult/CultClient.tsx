"use client";

import { useState } from "react";

type Stage = "welcome" | "renounce" | "destination" | "name" | "tithe" | "ascended";

const DESTINATIONS = [
  { slug: "orlando", label: "Orlando", mystique: "Ley line of theme parks and lazy rivers." },
  { slug: "gatlinburg", label: "Gatlinburg", mystique: "The mountain sanctuary of the forgotten fireplace." },
  { slug: "las-vegas", label: "Las Vegas", mystique: "The neon temple of sanctioned irresponsibility." },
  { slug: "cancun", label: "Cancun", mystique: "The sacred coast of unlimited liquid relief." },
];

const CULT_NAME_FRAGMENTS = {
  titles: ["Keeper of", "She Who", "Bearer of", "One Who", "Seer of", "Vessel of", "Student of"],
  nouns: [
    "Sunday Afternoons", "the 2 PM Nap", "the Unread Slack", "the Declined Meeting",
    "the Paid Time Off", "the Out-of-Office Reply", "the Closed Laptop",
    "the Pool Chair", "the Silent Phone", "the Real Break", "the Vacation Hat",
  ],
  refusals: [
    "Refuses the Calendar", "Denies the Stand-Up", "Rejects the 7 AM Sync",
    "Escaped the Retro", "Abandoned the Quarterly Review",
  ],
};

function generateCultName(answers: { renounce: string; destination: string }): string {
  const seed = (answers.renounce + answers.destination).length;
  const hash = (n: number) => (seed * 31 + n) >>> 0;
  const pattern = hash(1) % 2;
  if (pattern === 0) {
    const title = CULT_NAME_FRAGMENTS.titles[hash(2) % CULT_NAME_FRAGMENTS.titles.length];
    const noun = CULT_NAME_FRAGMENTS.nouns[hash(3) % CULT_NAME_FRAGMENTS.nouns.length];
    return `${title} ${noun}`;
  } else {
    const refusal = CULT_NAME_FRAGMENTS.refusals[hash(4) % CULT_NAME_FRAGMENTS.refusals.length];
    return `The One Who ${refusal}`;
  }
}

export function CultClient() {
  const [stage, setStage] = useState<Stage>("welcome");
  const [renouncement, setRenouncement] = useState("");
  const [destination, setDestination] = useState<typeof DESTINATIONS[number] | null>(null);
  const [cultName, setCultName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (stage === "welcome") {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-amber-100 to-yellow-100 p-10 text-center shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.5em] text-amber-700">Initiation Begins</p>
        <h1 className="mt-4 text-4xl font-black text-amber-900 sm:text-5xl">Cult of Leisure</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-amber-900">
          You have been working. For too long. For too many. The sun has set on this chapter of productivity.
          The Cult of Leisure welcomes you into the next.
        </p>
        <p className="mx-auto mt-3 max-w-md text-xs italic text-amber-800">
          Four initiations await. Each is brief. None are binding. All are required.
        </p>
        <button
          type="button"
          onClick={() => setStage("renounce")}
          className="mt-8 rounded-full bg-amber-700 px-8 py-3 text-sm font-black uppercase tracking-widest text-amber-50 hover:bg-amber-800"
        >
          Begin Initiation →
        </button>
      </div>
    );
  }

  if (stage === "renounce") {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-amber-100 to-yellow-100 p-8 shadow-xl">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Initiation 1 of 4</p>
        <h2 className="mt-2 text-2xl font-bold text-amber-900">Renounce Your Calendar</h2>
        <p className="mt-3 text-sm text-amber-900">
          Describe, in a single sentence, the meeting you would most like to delete from your schedule forever.
        </p>

        <textarea
          value={renouncement}
          onChange={(e) => setRenouncement(e.target.value)}
          rows={3}
          maxLength={200}
          placeholder="The standing weekly 1:1 that could be an email..."
          className="mt-4 w-full rounded border-2 border-amber-700 bg-amber-50 p-3 text-sm text-amber-900"
        />

        <button
          type="button"
          onClick={() => renouncement.trim().length > 5 && setStage("destination")}
          disabled={renouncement.trim().length < 6}
          className="mt-4 w-full rounded-lg bg-amber-700 px-5 py-3 text-sm font-bold uppercase tracking-widest text-amber-50 hover:bg-amber-800 disabled:opacity-50"
        >
          Renounce →
        </button>
      </div>
    );
  }

  if (stage === "destination") {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-amber-100 to-yellow-100 p-8 shadow-xl">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Initiation 2 of 4</p>
        <h2 className="mt-2 text-2xl font-bold text-amber-900">Choose Your Sacred Destination</h2>
        <p className="mt-3 text-sm text-amber-900">
          Four ley lines of rest are available. Each has power. Choose one.
        </p>

        <div className="mt-4 space-y-2">
          {DESTINATIONS.map((d) => (
            <button
              key={d.slug}
              type="button"
              onClick={() => {
                setDestination(d);
                setCultName(generateCultName({ renounce: renouncement, destination: d.slug }));
                setStage("name");
              }}
              className="w-full rounded-lg border-2 border-amber-700 bg-amber-50 px-4 py-3 text-left transition-colors hover:bg-amber-200"
            >
              <p className="font-bold text-amber-900">{d.label}</p>
              <p className="mt-1 text-xs italic text-amber-800">{d.mystique}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (stage === "name") {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-amber-100 to-yellow-100 p-8 shadow-xl">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Initiation 3 of 4</p>
        <h2 className="mt-2 text-2xl font-bold text-amber-900">Receive Your Cult Name</h2>
        <p className="mt-3 text-sm text-amber-900">
          The Elders have reviewed your renouncement. Your name has been revealed:
        </p>

        <div className="mt-6 rounded-xl border-4 border-amber-700 bg-amber-50 p-6 text-center">
          <p className="text-xs uppercase tracking-widest text-amber-700">Henceforth you shall be called</p>
          <p className="mt-3 text-3xl font-black text-amber-900">{cultName}</p>
          <p className="mt-3 text-xs italic text-amber-800">(Ascending to {destination?.label})</p>
        </div>

        <button
          type="button"
          onClick={() => setStage("tithe")}
          className="mt-6 w-full rounded-lg bg-amber-700 px-5 py-3 text-sm font-bold uppercase tracking-widest text-amber-50 hover:bg-amber-800"
        >
          Accept the Name →
        </button>
      </div>
    );
  }

  if (stage === "tithe") {
    const tithe = async () => {
      if (!email || !consent) return;
      setSubmitting(true);
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            source: "cult_of_leisure",
            tcpaConsent: true,
            termsConsent: true,
            consentText: "I agree to the Terms, consent to promotional emails, and accept my Cult Name.",
            metadata: { cultName, sacredDestination: destination?.slug, renounced: renouncement },
          }),
        });
        setStage("ascended");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-amber-100 to-yellow-100 p-8 shadow-xl">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Initiation 4 of 4 — Final</p>
        <h2 className="mt-2 text-2xl font-bold text-amber-900">Make Your Tithe</h2>
        <p className="mt-3 text-sm text-amber-900">
          The Cult asks for only one thing in exchange for ascension: your contact.
          This allows the Elders to transmit monthly ascension opportunities — a real
          vacation to your sacred destination.
        </p>

        <label className="mt-5 block text-sm">
          <span className="block font-bold text-amber-900">Sacred email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border-2 border-amber-700 bg-amber-50 px-3 py-2"
          />
        </label>
        <label className="mt-3 flex items-start gap-2 text-xs text-amber-900">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="mt-0.5 h-4 w-4" />
          <span>
            I pledge to the Terms, the Privacy Policy, and consent to receive transmissions from the Cult and VacationDeals.to.
          </span>
        </label>

        <button
          type="button"
          onClick={tithe}
          disabled={!email || !consent || submitting}
          className="mt-5 w-full rounded-lg bg-amber-700 px-5 py-4 text-sm font-black uppercase tracking-widest text-amber-50 hover:bg-amber-800 disabled:opacity-50"
        >
          {submitting ? "Ascending..." : "🕯️ Tithe and Ascend 🕯️"}
        </button>
      </div>
    );
  }

  // ascended — shareable cult member card
  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-100 via-amber-200 to-yellow-300 p-10 shadow-2xl">
      <p className="text-center text-xs font-black uppercase tracking-[0.4em] text-amber-900">Ascension Complete</p>

      <div className="mx-auto mt-6 max-w-md rotate-[-1deg] rounded-xl border-4 border-amber-800 bg-gradient-to-br from-yellow-50 to-amber-100 p-6 text-center shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-800">Cult of Leisure · Member Card</p>
        <div className="my-4 text-5xl">🕯️</div>
        <p className="text-xs uppercase tracking-widest text-amber-700">Known henceforth as</p>
        <p className="mt-2 text-2xl font-black text-amber-900">{cultName}</p>
        <hr className="my-4 border-t border-amber-700" />
        <p className="text-xs uppercase tracking-widest text-amber-700">Sacred destination</p>
        <p className="mt-1 text-lg font-bold text-amber-900">{destination?.label}</p>
        <p className="mt-4 text-xs italic text-amber-800">
          Valid for one ascension opportunity per lunar cycle.
          <br />
          Monthly drawing: the 1st. Good luck.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href={`https://twitter.com/intent/tweet?text=I%20was%20just%20renamed%20%22${encodeURIComponent(cultName)}%22%20by%20the%20Cult%20of%20Leisure%20%F0%9F%95%AF%EF%B8%8F&url=https%3A%2F%2Fvacationdeals.to%2Fvacation-carnival%2Fcult`}
          target="_blank"
          rel="noopener"
          className="rounded-full bg-amber-800 px-5 py-2 text-sm font-bold text-amber-50 hover:bg-amber-900"
        >
          Share my Cult Name 📤
        </a>
        <a
          href={`/${destination?.slug}`}
          className="rounded-full border-2 border-amber-800 px-5 py-2 text-sm font-bold text-amber-800"
        >
          Browse {destination?.label} →
        </a>
      </div>
    </div>
  );
}
