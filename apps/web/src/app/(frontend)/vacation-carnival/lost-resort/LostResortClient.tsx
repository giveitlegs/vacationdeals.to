"use client";

import { useState } from "react";

type Stage = "intro" | "puzzle-1" | "puzzle-2" | "puzzle-3" | "nda" | "unlocked";

const PUZZLE_1_ANSWER = "WEST"; // First 4 letters of the brand that keeps being redacted
const PUZZLE_2_ANSWER = "90"; // Presentation minutes
const PUZZLE_3_ANSWER = "59"; // The lowest published rate

export function LostResortClient() {
  const [stage, setStage] = useState<Stage>("intro");
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [answer3, setAnswer3] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error1, setError1] = useState(false);
  const [error2, setError2] = useState(false);
  const [error3, setError3] = useState(false);

  const redactedText = (len: number) => <span className="bg-black px-1 text-black">{"█".repeat(len)}</span>;

  if (stage === "intro") {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-stone-900 p-8 text-stone-200 shadow-2xl" style={{ fontFamily: "'Courier New', monospace" }}>
        <p className="text-xs font-bold uppercase tracking-[0.5em] text-red-500">Classification: Internal Only</p>
        <h1 className="mt-3 text-3xl font-black text-stone-100 sm:text-4xl">The Lost Resort Files</h1>
        <hr className="my-4 border-t border-red-900" />
        <p className="text-sm leading-relaxed">
          On 2026-02-18, an envelope was forwarded to VacationDeals.to editors by an
          anonymous source. The envelope contained 14 pages of internal memos,
          redacted blueprints, and margin notes from within a major hospitality
          corporation.
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          Among them: references to a resort — coordinates scrubbed, name redacted —
          that does not appear in any public inventory. Properties manifest {redactedText(7)}.
          Unit counts {redactedText(4)}. Booking channels all return &quot;PROPERTY NOT FOUND.&quot;
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          We&apos;ve posted three of the documents below, heavily redacted. You&apos;ll need to
          solve all three to unlock the coordinates. The prize, apparently, is a real
          vacation to the real property. This is not a drill.
        </p>
        <div className="mt-6 rounded border-2 border-red-800 bg-black/50 p-4 text-center">
          <p className="text-xs uppercase tracking-widest text-red-400">Access terms</p>
          <p className="mt-1 text-xs">By proceeding, you agree to an implicit NDA. If at any point you wish to withdraw, close this tab.</p>
        </div>
        <button
          type="button"
          onClick={() => setStage("puzzle-1")}
          className="mt-6 w-full rounded-lg border-2 border-red-700 bg-red-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-stone-100 hover:bg-red-900"
        >
          Acknowledge and proceed →
        </button>
      </div>
    );
  }

  if (stage === "puzzle-1") {
    const check = () => {
      if (answer1.trim().toUpperCase() === PUZZLE_1_ANSWER) {
        setStage("puzzle-2");
        setError1(false);
      } else setError1(true);
    };
    return (
      <div className="rounded-2xl bg-stone-900 p-6 text-stone-200 shadow-2xl" style={{ fontFamily: "'Courier New', monospace" }}>
        <p className="text-xs uppercase tracking-widest text-red-500">Document 1 of 3 · Classified</p>
        <h2 className="mt-2 text-xl font-black text-stone-100">Internal Memo — Redacted</h2>
        <hr className="my-3 border-t border-red-900" />

        <div className="rounded bg-stone-800 p-4 text-sm leading-relaxed">
          <p>From: {redactedText(12)}</p>
          <p>To: {redactedText(14)}, {redactedText(8)} (Executive)</p>
          <p>Re: Property {redactedText(6)} Program Status</p>
          <br />
          <p>
            Reviewing preview inventory across our <strong>{redactedText(4)}</strong>gate portfolio.
            Q4 numbers are holding. Presentations are running {redactedText(2)} minutes on average.
            The $59 tier continues to move weekly allocations without significant margin pressure.
          </p>
          <p className="mt-2">The unaccounted property remains dormant per the 2019 directive.</p>
        </div>

        <div className="mt-5 rounded border border-amber-600 bg-amber-950/30 p-4">
          <p className="text-xs uppercase tracking-widest text-amber-400">Puzzle 1</p>
          <p className="mt-2 text-sm">The redacted brand name begins with a 4-letter prefix. Context clues throughout the document suggest it ends in &quot;-gate&quot;. What is the 4-letter prefix?</p>
          <div className="mt-3 flex gap-2">
            <input
              value={answer1}
              onChange={(e) => setAnswer1(e.target.value.toUpperCase())}
              maxLength={10}
              placeholder="4 letters"
              className="flex-1 rounded border border-amber-600 bg-black px-3 py-2 font-mono uppercase tracking-widest text-stone-100"
            />
            <button type="button" onClick={check} className="rounded bg-amber-600 px-4 py-2 text-sm font-bold text-black hover:bg-amber-500">
              Submit
            </button>
          </div>
          {error1 && <p className="mt-2 text-xs text-red-400">Incorrect. Try again.</p>}
        </div>
      </div>
    );
  }

  if (stage === "puzzle-2") {
    const check = () => {
      if (answer2.trim() === PUZZLE_2_ANSWER) {
        setStage("puzzle-3");
        setError2(false);
      } else setError2(true);
    };
    return (
      <div className="rounded-2xl bg-stone-900 p-6 text-stone-200 shadow-2xl" style={{ fontFamily: "'Courier New', monospace" }}>
        <p className="text-xs uppercase tracking-widest text-red-500">Document 2 of 3 · Restricted</p>
        <h2 className="mt-2 text-xl font-black text-stone-100">Handwritten Margin Notes</h2>
        <hr className="my-3 border-t border-red-900" />

        <div className="rounded bg-stone-800 p-4 text-sm leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>
          <p className="italic">
            &quot;Target session duration {redactedText(2)} min flat. No variance tolerated.
            Reps scoring below close-rate threshold rotate out at 90 days.
            Inventory turnover per presentation: 0.34 units/session.
            Extend cycle via {redactedText(7)}-drop ploy at minute {redactedText(2)}.
            Manager drop-in at {redactedText(2)}+{redactedText(2)} per protocol.&quot;
          </p>
        </div>

        <div className="mt-5 rounded border border-amber-600 bg-amber-950/30 p-4">
          <p className="text-xs uppercase tracking-widest text-amber-400">Puzzle 2</p>
          <p className="mt-2 text-sm">
            What is the standard timeshare preview presentation length in minutes?
            (The redacted document repeatedly references &quot;session duration&quot; — this is
            the industry-standard number.)
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={answer2}
              onChange={(e) => setAnswer2(e.target.value)}
              maxLength={4}
              placeholder="##"
              className="flex-1 rounded border border-amber-600 bg-black px-3 py-2 font-mono text-stone-100"
            />
            <button type="button" onClick={check} className="rounded bg-amber-600 px-4 py-2 text-sm font-bold text-black hover:bg-amber-500">
              Submit
            </button>
          </div>
          {error2 && <p className="mt-2 text-xs text-red-400">Incorrect. Check the pitch script of any major timeshare brand.</p>}
        </div>
      </div>
    );
  }

  if (stage === "puzzle-3") {
    const check = () => {
      const num = answer3.trim().replace("$", "");
      if (num === PUZZLE_3_ANSWER) {
        setStage("nda");
        setError3(false);
      } else setError3(true);
    };
    return (
      <div className="rounded-2xl bg-stone-900 p-6 text-stone-200 shadow-2xl" style={{ fontFamily: "'Courier New', monospace" }}>
        <p className="text-xs uppercase tracking-widest text-red-500">Document 3 of 3 · Top Secret</p>
        <h2 className="mt-2 text-xl font-black text-stone-100">Pricing Matrix — Fragment</h2>
        <hr className="my-3 border-t border-red-900" />

        <div className="rounded bg-stone-800 p-4 text-sm">
          <table className="w-full">
            <thead className="text-xs uppercase tracking-widest text-red-400">
              <tr>
                <th className="py-1 text-left">Tier</th>
                <th className="py-1 text-right">Rate</th>
                <th className="py-1 text-right">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="py-1">Floor</td><td className="py-1 text-right font-bold">${redactedText(2)}</td><td className="py-1 text-right text-xs text-stone-400">Sunday-Wed check-in only</td></tr>
              <tr><td className="py-1">Mid</td><td className="py-1 text-right">$149</td><td className="py-1 text-right text-xs text-stone-400">Standard weekday</td></tr>
              <tr><td className="py-1">Peak</td><td className="py-1 text-right">$249</td><td className="py-1 text-right text-xs text-stone-400">Weekend + holiday</td></tr>
              <tr><td className="py-1">Ghost</td><td className="py-1 text-right">—</td><td className="py-1 text-right text-xs text-stone-400">Dormant inventory — not for public use</td></tr>
            </tbody>
          </table>
        </div>

        <div className="mt-5 rounded border border-amber-600 bg-amber-950/30 p-4">
          <p className="text-xs uppercase tracking-widest text-amber-400">Puzzle 3</p>
          <p className="mt-2 text-sm">
            What is the redacted &quot;Floor&quot; tier price? (This is the published floor rate
            for Sunday-Wednesday Westgate preview packages — you may have seen it on
            our deals page.)
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={answer3}
              onChange={(e) => setAnswer3(e.target.value)}
              maxLength={5}
              placeholder="$##"
              className="flex-1 rounded border border-amber-600 bg-black px-3 py-2 font-mono text-stone-100"
            />
            <button type="button" onClick={check} className="rounded bg-amber-600 px-4 py-2 text-sm font-bold text-black hover:bg-amber-500">
              Submit
            </button>
          </div>
          {error3 && <p className="mt-2 text-xs text-red-400">Incorrect. Check <a href="/deals" target="_blank" className="underline">our deals page</a>.</p>}
        </div>
      </div>
    );
  }

  if (stage === "nda") {
    const sign = async () => {
      if (!name || !email || !consent) return;
      setSubmitting(true);
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            source: "lost_resort_arg",
            tcpaConsent: true,
            termsConsent: true,
            consentText: "I sign the implicit NDA. I consent to promotional emails from VacationDeals.to.",
            metadata: { name, puzzles_solved: 3 },
          }),
        });
        setStage("unlocked");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="rounded-2xl bg-stone-100 p-8 text-stone-900 shadow-2xl" style={{ fontFamily: "'Georgia', serif" }}>
        <div className="mb-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-red-700">All three documents decoded</p>
          <h2 className="mt-2 text-2xl font-black">Sign the NDA to Unlock Coordinates</h2>
        </div>
        <hr className="my-4 border-t-2 border-red-700" />
        <div className="rounded bg-white p-5 text-sm leading-relaxed">
          <p>I, <strong>[Name]</strong>, hereby acknowledge that by signing this document, I am entering a non-disclosure agreement (non-binding, satirical) regarding:</p>
          <ul className="mt-2 ml-5 list-disc">
            <li>The identity of the resort in question</li>
            <li>The content of the documents shown</li>
            <li>The fact that I decoded all three puzzles to get here</li>
          </ul>
          <p className="mt-3">In exchange, VacationDeals.to will reveal the coordinates and enter me in a monthly drawing for a real vacation to that property.</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="block font-bold">Name (for signature)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded border-2 border-red-700 bg-white px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block font-bold">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded border-2 border-red-700 bg-white px-3 py-2"
            />
          </label>
        </div>

        <label className="mt-3 flex items-start gap-2 text-xs">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="mt-0.5 h-4 w-4" />
          <span>
            I sign the NDA. I agree to the <a href="/terms" target="_blank" rel="noopener" className="underline">Terms</a>,
            {" "}<a href="/privacy" target="_blank" rel="noopener" className="underline">Privacy Policy</a>, and
            consent to promotional emails.
          </span>
        </label>

        <button
          type="button"
          onClick={sign}
          disabled={!name || !email || !consent || submitting}
          className="mt-5 w-full rounded-lg bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-red-800 disabled:opacity-50"
        >
          {submitting ? "Sealing..." : "Sign NDA & Reveal Coordinates"}
        </button>
      </div>
    );
  }

  // unlocked
  return (
    <div className="rounded-2xl bg-stone-900 p-10 text-stone-200 shadow-2xl" style={{ fontFamily: "'Courier New', monospace" }}>
      <p className="text-center text-6xl">🗂️</p>
      <p className="mt-4 text-center text-xs uppercase tracking-widest text-amber-400">Access granted</p>
      <h2 className="mt-3 text-center text-2xl font-black text-stone-100">
        The Lost Resort Has Been Revealed.
      </h2>

      <div className="mx-auto mt-6 max-w-md rounded border border-amber-600 bg-black/50 p-4 text-center">
        <p className="text-xs uppercase tracking-widest text-amber-400">Coordinates</p>
        <p className="mt-2 font-mono text-lg">28.5383°N, -81.3792°W</p>
        <p className="mt-2 text-xs italic text-stone-400">(This is Orlando. The conspiracy was: a great $59 vacpack.)</p>
      </div>

      <p className="mx-auto mt-5 max-w-md text-center text-sm leading-relaxed">
        Your entry is logged. The monthly winner receives a real vacation at the decoded
        coordinates. You&apos;ve also earned a 15% discount code (check your email).
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href="/orlando" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-black hover:bg-amber-400">
          Browse the coordinates →
        </a>
        <a href="/vacation-carnival" className="rounded-lg border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-400">
          Back to Carnival
        </a>
      </div>
    </div>
  );
}
