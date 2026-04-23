"use client";

import { useState } from "react";

type Stage = "charges" | "plea" | "filed";

// Sample public defenses shown in the jury pool preview area.
const SAMPLE_PLEAS = [
  { initials: "M.R.", role: "Senior PM", words: 47, text: "Your honor, I have been working 14-hour days for six consecutive quarters. My houseplants no longer recognize me. My dog has started leaving the room when I enter. I plead not guilty to overwork on the grounds that I am no longer capable of choosing otherwise." },
  { initials: "D.K.", role: "Ops Lead", words: 38, text: "I haven't used a single vacation day since 2021. My manager calls me 'the glue'. The glue is tired. The glue requests seven business days of silence and an oceanfront view." },
  { initials: "S.L.", role: "Engineer", words: 52, text: "I am guilty. I am guilty of checking Slack on Saturday. I am guilty of answering 'yes' to every meeting. I am guilty of saying 'sure, I can take that on.' I plead guilty with an explanation: I don't know how to stop. Help me stop. Give me Orlando." },
];

export function VacationCourtClient() {
  const [stage, setStage] = useState<Stage>("charges");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plea, setPlea] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const wordCount = plea.trim() ? plea.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > 100;

  if (stage === "charges") {
    const caseNum = Math.floor(Math.random() * 900000 + 100000);
    return (
      <>
        <div className="rounded-t-2xl border-x-4 border-t-4 border-amber-900 bg-gradient-to-br from-amber-50 to-yellow-100 p-8" style={{ fontFamily: "'Georgia', serif" }}>
          <div className="mb-3 text-center">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-amber-900">In the Vacation Court of Public Opinion</p>
            <p className="mt-1 text-xs text-amber-800">Case #{caseNum} · Filed {new Date().toLocaleDateString()}</p>
          </div>
          <hr className="my-4 border-t-2 border-amber-900" />

          <h1 className="mb-4 text-center text-3xl font-black text-amber-900">⚖️ You Have Been Charged</h1>
          <div className="mx-auto max-w-md space-y-3 text-gray-800">
            <p className="text-sm">
              <strong>The Plaintiff:</strong> The People of the Calendar-Bound Workforce
            </p>
            <p className="text-sm">
              <strong>The Defendant:</strong> You (currently reading this on a weekday, probably from a desk)
            </p>
            <p className="text-sm">
              <strong>The Charge:</strong> Willful Overwork in the First Degree
            </p>
            <p className="text-sm">
              <strong>The Specifications:</strong>
            </p>
            <ul className="ml-6 list-disc space-y-1 text-sm">
              <li>Checking email before coffee</li>
              <li>Saying &quot;sure&quot; to last-minute meetings</li>
              <li>Letting PTO expire</li>
              <li>Responding to Slack messages from your bed</li>
            </ul>
            <p className="mt-4 text-center text-xs italic">
              How do you plead?
            </p>
          </div>
        </div>
        <div className="rounded-b-2xl border-x-4 border-b-4 border-amber-900 bg-amber-100 p-5 text-center">
          <button
            type="button"
            onClick={() => setStage("plea")}
            className="rounded-lg bg-amber-900 px-6 py-3 text-sm font-black uppercase tracking-widest text-amber-50 hover:bg-amber-950"
          >
            File My Plea →
          </button>
          <p className="mt-3 text-xs italic text-amber-900">
            100 words. Be persuasive. The jury sees all.
          </p>
        </div>
      </>
    );
  }

  if (stage === "plea") {
    const submit = async () => {
      if (!name || !email || !plea || overLimit || !consent) return;
      setSubmitting(true);
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            source: "vacation_court",
            tcpaConsent: true,
            termsConsent: true,
            consentText: "I agree to Terms and consent to promotional emails.",
            metadata: { name, plea, wordCount },
          }),
        });
        setStage("filed");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <>
        <div className="mb-4 rounded-xl border-2 border-amber-900 bg-amber-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-900">Sample pleas from prior defendants</p>
          <div className="mt-3 space-y-3">
            {SAMPLE_PLEAS.map((p, i) => (
              <div key={i} className="rounded border border-amber-700 bg-amber-100/50 p-3">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-bold text-amber-900">{p.initials} · {p.role}</span>
                  <span className="text-amber-700">{p.words} words</span>
                </div>
                <p className="mt-1 text-xs italic text-gray-800">&ldquo;{p.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="rounded-2xl border-4 border-amber-900 bg-amber-50 p-6">
          <h2 className="mb-4 text-xl font-black uppercase text-amber-900">Your Defense</h2>

          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="block font-bold text-amber-900">Your name (as it appears on the docket)</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded border border-amber-700 bg-white px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="block font-bold text-amber-900">Email (for the verdict)</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded border border-amber-700 bg-white px-3 py-2"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="block font-bold text-amber-900">
              Your plea — up to 100 words. Be persuasive.
            </span>
            <textarea
              required
              value={plea}
              onChange={(e) => setPlea(e.target.value)}
              rows={5}
              maxLength={800}
              placeholder="Your honor, I..."
              className="mt-1 w-full rounded border border-amber-700 bg-white px-3 py-2 text-sm"
            />
            <span className={`mt-1 block text-xs ${overLimit ? "text-red-600 font-bold" : "text-amber-700"}`}>
              {wordCount} / 100 words {overLimit && "— too long"}
            </span>
          </label>

          <label className="mt-3 flex items-start gap-2 text-xs text-amber-900">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              I agree to the <a href="/terms" target="_blank" rel="noopener" className="underline">Terms</a>
              {" & "}
              <a href="/privacy" target="_blank" rel="noopener" className="underline">Privacy Policy</a>
              , consent to promotional emails, and acknowledge my plea may be made public anonymously on the jury feed.
            </span>
          </label>

          <button
            type="submit"
            disabled={!name || !email || !plea || overLimit || !consent || submitting}
            className="mt-5 w-full rounded-lg bg-amber-900 px-5 py-3 text-sm font-black uppercase tracking-widest text-amber-50 hover:bg-amber-950 disabled:opacity-50"
          >
            {submitting ? "Filing with clerk..." : "File Defense with the Court"}
          </button>

          <p className="mt-2 text-center text-xs italic text-amber-700">
            The Court returns verdicts monthly. Top-convicted (most &quot;guilty&quot; votes by peers) advance to the prize drawing.
          </p>
        </form>
      </>
    );
  }

  // filed
  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 p-10 text-center text-amber-50 shadow-2xl">
      <p className="text-6xl">⚖️</p>
      <h2 className="mt-3 text-3xl font-black uppercase">Filed. The docket receives you.</h2>
      <p className="mx-auto mt-4 max-w-md">
        Your defense is now part of the public jury pool. Peers will deliberate. The top-convicted case of the month advances to the prize drawing.
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm italic">
        Forward your plea to a friend to get them to vote &quot;guilty&quot; — it counts as sympathy, not condemnation.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href="/deals"
          className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 hover:bg-white"
        >
          Browse real deals →
        </a>
        <a
          href="/vacation-carnival"
          className="rounded-lg border-2 border-amber-50 px-4 py-2 text-sm font-semibold"
        >
          Back to Carnival
        </a>
      </div>
    </div>
  );
}
