"use client";

import { useState } from "react";
import { LeadGenPopup } from "@/components/LeadGenPopup";

interface Scenario {
  q: string;
  options: { text: string; score: number }[];
}

const SCENARIOS: Scenario[] = [
  {
    q: "The rep says 'Don't you want the BEST for your family?' You...",
    options: [
      { text: "Say 'Yes' and start negotiating down", score: 1 },
      { text: "Laugh and say 'I already have the best — my family'", score: 4 },
      { text: "Tell them the best thing for my family is not being in debt", score: 5 },
      { text: "Stay silent and stare", score: 3 },
    ],
  },
  {
    q: "They offer $200 free food credit if you stay an extra hour. You...",
    options: [
      { text: "Take it! Food is food", score: 2 },
      { text: "Politely decline and reference your agreed time", score: 5 },
      { text: "Agree but set a hard 60-min timer on your phone", score: 3 },
      { text: "Accept and silently resent them", score: 1 },
    ],
  },
  {
    q: "The 'manager' comes in with 'a one-time-only deal just for you.' You...",
    options: [
      { text: "Get excited — this must be special", score: 0 },
      { text: "Ask for it in writing with 24 hours to think", score: 4 },
      { text: "Say 'one-time-only deals aren't allowed in my budget'", score: 5 },
      { text: "Politely decline and ask for the exit", score: 5 },
    ],
  },
  {
    q: "They show you photos of the resort at 'peak season'. You...",
    options: [
      { text: "Imagine yourself there in 10 years", score: 1 },
      { text: "Ask to see photos of the resort in off-season", score: 4 },
      { text: "Say 'photos aren't in my purchase decision'", score: 5 },
      { text: "Take notes to Google it later", score: 3 },
    ],
  },
  {
    q: "Rep mentions the property's appreciation in value over time. You...",
    options: [
      { text: "Nod thoughtfully", score: 1 },
      { text: "Ask for the 10-year resale data from their own records", score: 5 },
      { text: "Say 'timeshare contracts lose value, not gain it'", score: 5 },
      { text: "Challenge them to show one that appreciated", score: 4 },
    ],
  },
  {
    q: "They ask 'Where would you vacation in 20 years?' You...",
    options: [
      { text: "Describe your dream vacation honestly", score: 1 },
      { text: "Say 'Probably nowhere if I'm in debt from a timeshare'", score: 5 },
      { text: "Pivot: 'Wherever I want, whenever I want, without a contract'", score: 5 },
      { text: "Say 'I don't plan that far ahead'", score: 3 },
    ],
  },
  {
    q: "They offer a $50 Amex gift card to stay longer. You...",
    options: [
      { text: "Stay another 30 min for the $50", score: 2 },
      { text: "Ask if it's cash equivalent and in writing", score: 3 },
      { text: "Politely decline and leave at your agreed time", score: 5 },
      { text: "Take the gift card and leave anyway", score: 4 },
    ],
  },
  {
    q: "Rep shows you 'the exclusive members-only' section. You...",
    options: [
      { text: "Feel special", score: 0 },
      { text: "Note that it's accessible via public rentals too", score: 5 },
      { text: "Ask if membership is transferable/resalable", score: 4 },
      { text: "Fake interest and note the exit", score: 3 },
    ],
  },
  {
    q: "They say 'This price won't be offered again.' You...",
    options: [
      { text: "Panic and consider it", score: 0 },
      { text: "Say 'Then I'll pass' and mean it", score: 5 },
      { text: "Laugh out loud at the sales tactic", score: 5 },
      { text: "Ask them to put 'final offer' in writing signed by their manager", score: 4 },
    ],
  },
  {
    q: "The rep gets emotional / teary about helping your family. You...",
    options: [
      { text: "Soften and listen more", score: 0 },
      { text: "Remain polite but emotionally disengaged", score: 4 },
      { text: "Recognize it as a technique and stay focused", score: 5 },
      { text: "Get emotional back and hug them", score: 1 },
    ],
  },
  {
    q: "You're 90 minutes in and they haven't presented the price yet. You...",
    options: [
      { text: "Keep listening — maybe it's coming", score: 1 },
      { text: "Ask directly: 'What's the price?' every 5 minutes", score: 4 },
      { text: "Stand up and say 'I need the price now or I leave'", score: 5 },
      { text: "Check your phone and wait it out", score: 2 },
    ],
  },
  {
    q: "They say 'I can only hold this price if you decide today.' You...",
    options: [
      { text: "Stress and weigh options", score: 0 },
      { text: "Respond: 'That's a hard no to deciding today'", score: 5 },
      { text: "Say 'If it's a real deal, it'll be available tomorrow'", score: 5 },
      { text: "Sleep on it and never return their calls", score: 4 },
    ],
  },
  {
    q: "They ask to meet with your spouse 'so both can approve together'. You...",
    options: [
      { text: "Set up another appointment", score: 0 },
      { text: "Say 'I'll discuss with them privately and email you'", score: 5 },
      { text: "Explain you can make decisions without them", score: 4 },
      { text: "Decline; make clear no further presentations needed", score: 5 },
    ],
  },
  {
    q: "They mention the property has '50-year appreciation potential'. You...",
    options: [
      { text: "Imagine the retirement windfall", score: 0 },
      { text: "Ask for the 50-year comparable sales data", score: 5 },
      { text: "Note that timeshares are generally non-appreciating assets", score: 5 },
      { text: "Change the subject", score: 2 },
    ],
  },
  {
    q: "You don't meet their 'income requirements'. You...",
    options: [
      { text: "Feel offended", score: 0 },
      { text: "Shrug, thank them, and leave", score: 5 },
      { text: "Ask for alternatives within your range", score: 2 },
      { text: "Take it as a free escape pass", score: 5 },
    ],
  },
  {
    q: "They offer to finance at 'only 17.9% APR'. You...",
    options: [
      { text: "Think that's reasonable", score: 0 },
      { text: "Laugh and say 'credit cards are cheaper'", score: 5 },
      { text: "Reject and ask for 0% or nothing", score: 4 },
      { text: "Ignore the APR and focus on monthly payment", score: 0 },
    ],
  },
  {
    q: "They ask what's preventing you from buying TODAY. You...",
    options: [
      { text: "Give honest objections they can address", score: 1 },
      { text: "Say 'I never buy things same-day'", score: 5 },
      { text: "Say 'my financial planner reviews all major purchases'", score: 5 },
      { text: "Say 'nothing specific, I'm just not buying'", score: 4 },
    ],
  },
  {
    q: "They mention the 'rescission period' as if it's a deal-maker. You...",
    options: [
      { text: "Feel better about signing", score: 0 },
      { text: "Remember: rescission requires active cancellation", score: 4 },
      { text: "Say 'I'd rather not sign if I'll need to rescind'", score: 5 },
      { text: "Plan to sign then cancel next week", score: 2 },
    ],
  },
  {
    q: "They try to hug you at the end. You...",
    options: [
      { text: "Hug back awkwardly", score: 1 },
      { text: "Polite handshake instead", score: 3 },
      { text: "Firm but polite: 'Not a hug guy/gal'", score: 4 },
      { text: "Back up and thank them verbally", score: 4 },
    ],
  },
  {
    q: "Next day, they call saying 'the offer is still available'. You...",
    options: [
      { text: "Answer and engage", score: 0 },
      { text: "Block the number", score: 4 },
      { text: "Send STOP reply if SMS, ignore if call", score: 4 },
      { text: "Politely decline once, then block if they call again", score: 5 },
    ],
  },
];

function getLevel(score: number): { level: string; emoji: string; color: string; desc: string } {
  const pct = score / (SCENARIOS.length * 5);
  if (pct >= 0.85) return { level: "Ice Cold", emoji: "\u{1F9CA}", color: "from-cyan-500 to-blue-500", desc: "You're unmovable. Sales reps should fear you." };
  if (pct >= 0.7) return { level: "Black Belt", emoji: "\u{1F94B}", color: "from-gray-700 to-gray-900", desc: "Highly trained. You see their moves a mile away." };
  if (pct >= 0.55) return { level: "Solid Skeptic", emoji: "\u{1F9D0}", color: "from-emerald-500 to-teal-500", desc: "You'll make it through fine. Stay sharp." };
  if (pct >= 0.4) return { level: "Vulnerable", emoji: "\u{1F61F}", color: "from-amber-500 to-orange-500", desc: "You could still buy something you don't need. Practice more." };
  return { level: "Pushover", emoji: "\u{1F648}", color: "from-red-500 to-rose-500", desc: "Bring a friend who's Ice Cold. You need backup." };
}

export function SurvivalKitClient() {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const done = idx >= SCENARIOS.length;

  const pick = (score: number) => {
    setAnswers([...answers, score]);
    setIdx(idx + 1);
  };

  const reset = () => { setAnswers([]); setIdx(0); };

  const total = answers.reduce((a, b) => a + b, 0);

  if (done) {
    const { level, emoji, color, desc } = getLevel(total);
    return (
      <>
        <LeadGenPopup
          id="survival-kit-complete"
          timeDelayMs={4000}
          headline="Get the Pushback Phrase Book"
          subheadline="Free PDF: exact phrases to say no without feeling awkward. 12 pages. Field-tested."
          ctaText="Send Me the PDF"
          source="survival_kit_complete"
        />
        <div className={`rounded-3xl bg-gradient-to-br ${color} p-10 text-center text-white shadow-2xl`}>
          <p className="text-6xl">{emoji}</p>
          <p className="mt-3 text-sm font-bold uppercase tracking-wider opacity-80">Your Survival Level</p>
          <h2 className="mt-1 text-5xl font-black">{level}</h2>
          <p className="mx-auto mt-4 max-w-md">{desc}</p>
          <p className="mt-4 text-2xl font-bold">{total} / {SCENARIOS.length * 5}</p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-gray-50">Try Again</button>
          <a href={`https://twitter.com/intent/tweet?text=I+scored+${total}/${SCENARIOS.length * 5}+on+the+Timeshare+Survival+Kit+%22${level}%22%20\u{1F525}&url=https%3A%2F%2Fvacationdeals.to%2Fvacpack-games%2Fsurvival-kit`} target="_blank" rel="noopener" className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600">Share on X</a>
        </div>
      </>
    );
  }

  const s = SCENARIOS[idx];
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">Question {idx + 1} of {SCENARIOS.length}</span>
        <div className="h-2 flex-1 rounded-full bg-gray-200 mx-4 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${((idx + 1) / SCENARIOS.length) * 100}%` }} />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border-2 border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900">{s.q}</h2>
      </div>

      <div className="space-y-3">
        {s.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => pick(opt.score)}
            className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md"
          >
            <span className="font-medium text-gray-900">{opt.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
