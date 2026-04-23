"use client";

import { useState } from "react";

type Stage = "quiz" | "postcard" | "redeemed";

interface QuizAnswer {
  q: string;
  value: string;
}

const QUESTIONS = [
  {
    id: "climate",
    q: "Pick your actual vacation climate preference:",
    options: ["Tropical", "Cool mountain", "Urban", "Beach", "Dry desert"],
  },
  {
    id: "food",
    q: "Food priority on vacation:",
    options: ["Gourmet", "Local dive bars", "Anywhere with AC", "Room service", "I skip meals"],
  },
  {
    id: "pace",
    q: "Vacation pace:",
    options: ["Lazy", "Packed itinerary", "Mostly pool", "Hiking every day", "Spa + dinner only"],
  },
  {
    id: "budget",
    q: "What you actually want to spend:",
    options: ["Under $500", "$500-$1000", "$1000-$2500", "$2500+", "Free ideally"],
  },
  {
    id: "roommate",
    q: "Travel companion:",
    options: ["Spouse", "Kids", "Friends", "Solo", "Elderly parents"],
  },
];

// Cursed-generator templates. We pick the most dissonant cursed interpretation
// of the user's input. All terrible outcomes that make the user laugh + appreciate
// the vacpack redemption at the end.
function generateCursedTrip(answers: Record<string, string>): {
  title: string;
  location: string;
  lodging: string;
  food: string;
  activity: string;
  lowlight: string;
} {
  const seed = Object.values(answers).join("|");
  const hash = [...seed].reduce((h, c) => ((h * 31 + c.charCodeAt(0)) >>> 0), 7);

  const locations = [
    "a Days Inn next to a methadone clinic in Barstow",
    "a Motel 6 with a view of a retention pond in Tulsa",
    "a Super 8 directly above a 24-hour Denny's in Amarillo",
    "a Red Roof Inn on a frontage road in Cleveland suburbs",
    "an Extended Stay America with wall-to-wall industrial carpet",
    "a 'boutique hotel' that turned out to be a converted storage unit",
    "a roadside motel whose pool is permanently green",
    "a 'resort' in Branson that is three RVs and a ping-pong table",
  ];

  const lodgings = [
    "Your room has one lamp, which flickers.",
    "The A/C is 'on' but produces only a gentle humidity.",
    "The bedspread has visible 'scenes from previous guests'.",
    "Your window overlooks a dumpster and a man on a phone call.",
    "The shower has two settings: scalding and off.",
    "There is a stain. The stain moves.",
    "The ice machine screams every 18 minutes all night.",
  ];

  const foods = [
    "Continental breakfast is gravy, one banana, and a waffle iron.",
    "Dinner options: a Perkins and the gas station Tornados.",
    "The 'pool bar' is a cooler with warm Miller Lite.",
    "Every restaurant within 10 miles is closed by 7 PM.",
    "Room service is literally a bag of chips and a Diet Coke.",
    "Breakfast includes a hot-dog roller but no hot dogs.",
  ];

  const activities = [
    "Main local attraction: a barbed-wire museum (admission $8).",
    "The 'beach' is a gravel parking lot adjacent to the lake.",
    "Pool closes at 4 PM for chemical rebalancing. Nightly.",
    "Free activity: listening to the interstate from your balcony.",
    "The 'spa' is a chair next to a space heater.",
    "Local tour: 90 minutes of a man showing you his Corvette.",
  ];

  const lowlights = [
    "A raccoon got into your cooler. It has your keys now.",
    "There's a wedding reception in the lobby until 2 AM.",
    "The fire alarm goes off at 3 AM. Twice.",
    "A family of 8 is in the adjacent room with paper-thin walls.",
    "The only charging port in your room has been removed and capped.",
    "Every front-desk call goes to voicemail. Voicemail is full.",
  ];

  return {
    title: "Your Cursed Vacation, Personalized",
    location: locations[hash % locations.length],
    lodging: lodgings[(hash >> 4) % lodgings.length],
    food: foods[(hash >> 8) % foods.length],
    activity: activities[(hash >> 12) % activities.length],
    lowlight: lowlights[(hash >> 16) % lowlights.length],
  };
}

export function CursedTripClient() {
  const [stage, setStage] = useState<Stage>("quiz");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (stage === "quiz") {
    const q = QUESTIONS[currentQ];
    const isLast = currentQ === QUESTIONS.length - 1;

    return (
      <>
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-950 p-6 text-center text-white shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-purple-300">The Cursed Generator</p>
          <h1 className="mt-2 text-3xl font-black">Answer 5 Questions. Receive Your Cursed Vacation.</h1>
          <p className="mt-2 text-sm text-white/80">This has never failed to upset someone.</p>
        </div>

        <div className="rounded-2xl border-2 border-gray-300 bg-white p-6 sm:p-8 shadow-md">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Question {currentQ + 1} of {QUESTIONS.length}</p>
          <h2 className="mb-5 text-xl font-bold text-gray-900">{q.q}</h2>

          <div className="space-y-2">
            {q.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const next = { ...answers, [q.id]: opt };
                  setAnswers(next);
                  if (isLast) setStage("postcard");
                  else setCurrentQ(currentQ + 1);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 transition-colors hover:border-purple-500 hover:bg-purple-50"
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-between text-xs text-gray-500">
            <button
              type="button"
              onClick={() => currentQ > 0 && setCurrentQ(currentQ - 1)}
              disabled={currentQ === 0}
              className="hover:text-gray-900 disabled:opacity-30"
            >
              ← Back
            </button>
            <span>{Math.round(((currentQ + 1) / QUESTIONS.length) * 100)}% complete</span>
          </div>
        </div>
      </>
    );
  }

  if (stage === "postcard") {
    const cursed = generateCursedTrip(answers);

    const redeem = async () => {
      if (!email || !consent) return;
      setSubmitting(true);
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            source: "cursed_trip",
            tcpaConsent: true,
            termsConsent: true,
            consentText: "I agree to Terms and consent to promotional emails.",
            metadata: { answers, cursed },
          }),
        });
        setStage("redeemed");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <>
        {/* Cursed postcard */}
        <div
          className="mx-auto max-w-xl rotate-[-1deg] rounded-lg border-4 border-purple-700 bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-2xl"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-800">Wish You Weren&apos;t Here</p>
            <p className="text-xs text-gray-600">Postmarked {new Date().toLocaleDateString()}</p>
          </div>
          <hr className="my-3 border-t-2 border-purple-700" />

          <h2 className="mb-3 text-2xl font-black text-purple-900">Greetings from:</h2>
          <p className="mb-4 text-lg italic text-gray-900">{cursed.location}</p>

          <div className="space-y-3 text-sm text-gray-800">
            <p><strong>Our room:</strong> {cursed.lodging}</p>
            <p><strong>The food:</strong> {cursed.food}</p>
            <p><strong>Local activities:</strong> {cursed.activity}</p>
            <p><strong>Just now:</strong> {cursed.lowlight}</p>
          </div>

          <hr className="my-4 border-t-2 border-purple-700" />
          <p className="text-center text-xs italic text-gray-600">
            This horror was generated specifically for you by The Cursed Generator™
            <br />
            Based on your actual preferences. You&apos;re welcome.
          </p>
        </div>

        {/* Redemption CTA */}
        <div className="mx-auto mt-8 max-w-xl rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-6 shadow-xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-700">The Antidote</p>
          <h3 className="mb-3 text-xl font-bold text-emerald-900">
            Redemption Trip: Enter for a Real Vacation
          </h3>
          <p className="mb-4 text-sm text-emerald-900">
            Enter our monthly drawing. Winner gets a real vacpack to Orlando, Vegas, Gatlinburg, or Cancun — the exact opposite of everything you just read.
          </p>

          <label className="block text-sm">
            <span className="block font-medium text-emerald-900">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded border border-emerald-300 px-3 py-2"
            />
          </label>
          <label className="mt-3 flex items-start gap-2 text-xs text-emerald-900">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4"
            />
            <span>
              I agree to the <a href="/terms" target="_blank" rel="noopener" className="underline">Terms</a>
              {" & "}
              <a href="/privacy" target="_blank" rel="noopener" className="underline">Privacy Policy</a>
              , and consent to promotional emails.
            </span>
          </label>

          <button
            type="button"
            onClick={redeem}
            disabled={!email || !consent || submitting}
            className="mt-4 w-full rounded-lg bg-emerald-700 px-5 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {submitting ? "Redeeming..." : "Claim My Redemption"}
          </button>

          <div className="mt-4 border-t border-emerald-200 pt-3 text-center">
            <a
              href={`https://twitter.com/intent/tweet?text=I%20just%20got%20a%20cursed%20vacation%20postcard%20from%20${encodeURIComponent(cursed.location)}%20%F0%9F%92%80&url=https%3A%2F%2Fvacationdeals.to%2Fvacation-carnival%2Fcursed-trip`}
              target="_blank"
              rel="noopener"
              className="text-xs text-emerald-700 underline"
            >
              Share my cursed postcard 📤
            </a>
          </div>
        </div>
      </>
    );
  }

  // redeemed
  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-10 text-center text-white shadow-2xl">
      <p className="text-6xl">🌴</p>
      <h2 className="mt-3 text-3xl font-black">Redemption filed.</h2>
      <p className="mx-auto mt-4 max-w-md">
        The Cursed Generator™ releases your soul. Check your inbox for a 10% vacpack discount code and the monthly drawing entry.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href="/deals" className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-emerald-700">Browse real deals →</a>
        <a href="/vacation-carnival" className="rounded-lg border-2 border-white px-4 py-2 text-sm font-semibold text-white">Back to Carnival</a>
      </div>
    </div>
  );
}
