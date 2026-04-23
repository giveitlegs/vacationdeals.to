"use client";

import { useState, useEffect } from "react";

type Stage = "booth" | "absolution";

const PRIOR_CONFESSIONS = [
  "I told my team I had a funeral. I went to the beach.",
  "I booked a flight I never took. I just needed the idea of escape.",
  "I cried at Disney. Not the happy kind.",
  "I faked food poisoning to skip a bachelorette trip I'd already paid for.",
  "I booked a vacpack, told my boss it was a funeral, and went to Orlando.",
  "I've hidden from my family in 4 different hotel bathrooms on 4 separate trips.",
  "I left a group chat of 12 people mid-vacation and never explained.",
  "I 'forgot' to invite my sister to the family trip. Again.",
  "I booked a $49 Westgate and convinced my partner it cost $800.",
  "I pretended I didn't have PTO left. I had 14 days unused.",
  "My out-of-office said 'technical issues.' I was literally on a beach.",
  "I left my phone in the hotel safe for 4 days. Best 4 days of 2024.",
];

// Absolutions, picked deterministically by confession length hash
const ABSOLUTIONS = [
  "You are forgiven. Now go book something with your real PTO.",
  "The booth absolves you. Your penance: a real vacation, minimum 3 nights.",
  "Confession received. The universe doesn't care as much as you think.",
  "Absolved. Your boss has worse secrets. Go to the beach.",
  "The ledger is cleared. Book something before you forget why.",
  "Your sin is heard. Your path is clear: Sunday check-in, Wednesday check-out.",
  "Forgiven. Now stop confessing and actually rest.",
  "The booth has heard worse today. You are absolved.",
];

function pickAbsolution(confession: string): string {
  const hash = [...confession].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 13);
  return ABSOLUTIONS[hash % ABSOLUTIONS.length];
}

export function ConfessionalClient() {
  const [stage, setStage] = useState<Stage>("booth");
  const [confession, setConfession] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTickerIndex((i) => (i + 1) % PRIOR_CONFESSIONS.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  if (stage === "booth") {
    const submit = async () => {
      if (!confession.trim() || !email || !consent) return;
      setSubmitting(true);
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            source: "vacation_confessional",
            tcpaConsent: true,
            termsConsent: true,
            consentText: "I agree to the Terms, consent to promotional emails, and acknowledge my anonymized confession may appear in the public feed.",
            metadata: { confession: confession.trim(), length: confession.trim().length },
          }),
        });
        setStage("absolution");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <>
        {/* Prior confessions ticker — feels like a live feed */}
        <div className="mb-6 rounded-xl border border-indigo-900 bg-indigo-950 p-4 text-indigo-200">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-indigo-400">Recent Confessions · Anonymous Feed</p>
          <p className="mt-2 text-sm italic transition-opacity">
            &ldquo;{PRIOR_CONFESSIONS[tickerIndex]}&rdquo;
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 p-8 text-indigo-100 shadow-2xl">
          {/* Stained-glass style top */}
          <div className="mb-6 text-center">
            <p className="text-5xl">⛪</p>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.5em] text-indigo-300">Enter the Booth</p>
            <h1 className="mt-2 text-3xl font-black text-indigo-50">The Vacation Confessional</h1>
            <p className="mt-2 text-sm italic text-indigo-300">
              The booth must know who you are to grant absolution.
            </p>
          </div>

          <div className="rounded-lg border border-indigo-700 bg-black/40 p-5">
            <label className="block text-sm">
              <span className="block font-bold text-indigo-200">Confess your worst vacation sin</span>
              <textarea
                value={confession}
                onChange={(e) => setConfession(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="I..."
                className="mt-2 w-full rounded bg-indigo-900/50 p-3 text-sm text-indigo-100 placeholder:text-indigo-500"
              />
              <span className="mt-1 block text-xs text-indigo-400">{confession.length} / 500</span>
            </label>

            <label className="mt-4 block text-sm">
              <span className="block font-bold text-indigo-200">Sacred contact (for absolution)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded bg-indigo-900/50 px-3 py-2 text-indigo-100"
              />
            </label>

            <label className="mt-4 flex items-start gap-2 text-xs text-indigo-300">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4"
              />
              <span>
                I agree to Terms &amp; Privacy, consent to promotional emails, and acknowledge my confession may be anonymized and published in the public feed above.
              </span>
            </label>

            <button
              type="button"
              onClick={submit}
              disabled={!confession.trim() || !email || !consent || submitting}
              className="mt-5 w-full rounded-lg border-2 border-indigo-400 bg-indigo-800 px-5 py-3 text-sm font-black uppercase tracking-widest text-indigo-50 hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "The booth hears..." : "Confess"}
            </button>
          </div>
        </div>
      </>
    );
  }

  // absolution
  const absolution = pickAbsolution(confession);
  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 p-10 text-center text-indigo-100 shadow-2xl">
      <p className="text-7xl">🕯️</p>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.4em] text-indigo-300">Absolution</p>

      <div className="mx-auto mt-4 max-w-md rounded-xl border border-indigo-600 bg-black/40 p-5">
        <p className="text-base leading-relaxed italic text-indigo-50">
          &ldquo;{absolution}&rdquo;
        </p>
      </div>

      <p className="mx-auto mt-6 max-w-md text-sm text-indigo-200">
        Your confession has been entered into the monthly drawing. One entry, drawn on the 1st.
        Winner receives a real vacation package — pick your destination.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href="/deals"
          className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-900"
        >
          Book real absolution →
        </a>
        <a
          href="/vacation-carnival"
          className="rounded-lg border-2 border-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-50"
        >
          Back to Carnival
        </a>
      </div>
    </div>
  );
}
