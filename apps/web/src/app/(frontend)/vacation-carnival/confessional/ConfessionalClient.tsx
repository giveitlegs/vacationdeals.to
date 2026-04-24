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
  "I went to a timeshare presentation drunk on purpose so I wouldn't accidentally buy anything.",
  "I told the presenter my name was 'Mike Litoris' and he wrote it on a name tag.",
  "I took a second shower every day just to run out the hotel's water heater before my in-laws arrived.",
  "I 'accidentally' checked us into two rooms so I could nap alone one afternoon.",
  "I told my kids the waterpark was closed. It was not closed.",
  "I hid the good sunscreen from my husband the entire trip. He got burned. I had backup.",
  "I ate all three of my kids' desserts while they were in the pool and blamed it on seagulls.",
  "I ordered room service to the wrong room to see what would happen. They ate it.",
  "I signed the timeshare couple's guest book 'Dr. and Mrs. Nunyadamn Bidness'.",
  "I took a hotel bathrobe. I also took the one from the next room over.",
  "I lied about my wedding anniversary to get the free bottle of champagne. Two trips in a row.",
  "I told my mother-in-law the Wi-Fi didn't work the entire trip. It was perfect.",
  "I 'accidentally' booked a king bed when my sister was coming. She slept on a cot.",
  "I told the cab driver I was a podiatrist for forty minutes. I have no idea what a podiatrist does.",
  "I used the hotel hair dryer on my feet. I will not elaborate.",
  "I poured the minibar vodka into a water bottle and refilled the vodka with tap water.",
  "I claimed I had a shellfish allergy at every restaurant so I could watch my wife order 'safer'.",
  "I gave my kids melatonin on the plane. I gave it to them on the beach, too.",
  "I told a stranger I was a travel influencer with 800k followers. They asked for photos. I obliged.",
  "I came back from my 'solo yoga retreat' with a tan that did not match my story.",
  "I snuck into the breakfast buffet on my last day when I was no longer a guest. Three times.",
  "I took the pen from the hotel desk. I have now done this 34 times.",
  "I told the Uber driver I was flying to Paris. I was flying to a work conference in Columbus.",
  "I called in sick to work from the beach. I answered a Slack message with a seagull in the background.",
  "I charged all my vacation expenses to a credit card I haven't told my spouse about.",
  "I took the 'do not disturb' sign to put in my house. I have a collection now.",
  "I ordered the most expensive thing on the room service menu just because it was included in my package.",
  "I pretended not to know my kid in the pool area for 40 minutes. He was fine.",
  "I skipped the 90-minute timeshare presentation by hiding in the spa. I got a massage instead.",
  "I booked a solo trip and told my family it was for work. I did zero work.",
  "I stole three bars of soap, two shower caps, and a small sewing kit I will never use.",
  "I drank a smoothie from the lobby that I'm now positive was for someone else. I finished it.",
  "I told my therapist the trip was 'for us'. It was 100% for me.",
  "I lied about food poisoning to avoid another jet ski day with my friend group.",
  "I used 'my kid needs a bathroom' to skip every line at Magic Kingdom. My kid is 19.",
  "I 'accidentally' took the rental car back with an extra 400 miles on it and didn't mention it.",
  "I told the resort concierge I was on my honeymoon. I got upgraded. I'm single.",
  "I hid my phone in a sock and told my husband it must have fallen out on the beach. For 3 days.",
  "I bought an all-inclusive package specifically to drink $11 worth of soda I didn't need.",
  "I waved at a stranger across the lobby like I knew them. They waved back. We've been pen pals 4 years.",
  "I used the hotel gym at 2 AM because I didn't want anyone to see me walk on the treadmill for 8 minutes.",
  "I ate a continental breakfast standing up in my hotel hallway because it ran out of chairs.",
  "I told the flight attendant it was my birthday. It wasn't. They announced it anyway.",
  "I stole the pen from the front desk AND the little notepad. The notepad had another guest's Wi-Fi password.",
  "I told my boss I had food poisoning from bad oysters. I don't eat oysters. I never have.",
  "I paid $42 for a pool-side piña colada and drank it in 8 seconds to pretend I was thirsty.",
  "I took a nap in the resort library. I snored. I was mentioned in a TripAdvisor review.",
  "I asked for 'the bride and groom discount' at a bar. I was with my mom.",
  "I told my 7-year-old that if she behaved, we'd go to 'the magical cone place'. It was a DQ.",
  "I wore the same swim trunks for 9 days straight. I rinsed them in the sink like a caveman.",
  "I said 'namaste' to the concierge. They said 'thank you, ma'am'. I don't know if I passed or failed.",
  "I pretended I couldn't speak English at a busy taxi stand. I got there faster.",
  "I ate a $28 club sandwich and described it as 'fine' to the waiter. It was incredible.",
  "I took a photo of my drink, posted it, and tagged the WRONG resort. They replied. It was awkward.",
  "I told my boss I was 'unreachable' during vacation. He reached me. I said I was in a cave.",
  "I bought a souvenir magnet that said 'Live, Laugh, Love' and regretted it the moment the plane landed.",
  "I counted the ceiling tiles in my hotel room for an hour. There were 48. This was the highlight of my trip.",
  "I got a hotel upgrade and didn't tell my wife for an entire day. I just enjoyed the better view alone.",
  "I told my kids the ocean was 'closed' after 7 PM. They believed me for 3 days.",
  "I ate breakfast twice at two different hotels I was not staying at. No one noticed.",
  "I bought a Hawaiian shirt at the resort gift shop and wore it home. I live in Buffalo.",
  "I claimed 'jet lag' for 11 days after a 2-hour flight.",
  "I pretended not to understand the resort's tipping policy. I understood it perfectly.",
  "I left my book at the pool. Returned 4 hours later. Someone had added annotations.",
  "I told the hotel bartender he reminded me of Ryan Reynolds. He looked like Danny DeVito.",
  "I took my mother-in-law on a hike I knew was too long for her. I did not apologize.",
  "I confessed this exact confession to a stranger at the resort bar. They bought me a drink.",
  "I used my neighbor's pool float for 4 hours while they napped. I returned it chlorine-rinsed.",
  "I told the cruise ship comedy show I was a comedy writer. I was not. I got a free drink.",
  "I said I was 'calling room service' but I was actually calling my dog sitter to check on the dog.",
  "I let my kid play mini golf unsupervised for 45 minutes so I could sit in the shade and text my ex.",
  "I lied on a vacation survey and said the pool was 'magical'. It was green.",
  "I brought a book to the beach every day for a week. I read one page.",
  "I ate at the same Denny's three times on a trip to a city famous for its food scene.",
  "I drank the entire welcome bottle of wine before my partner woke up from their nap.",
  "I swam in a hotel pool that had a sign saying 'closed for maintenance'. I was the maintenance.",
  "I told my colleague my flight was delayed. My flight landed 2 hours ago. I was at Panera.",
  "I took photos of my kids 'enjoying themselves' for social media. They were fighting. I cropped it.",
  "I hid in the bathroom during a tour to avoid the guide's eye contact. I stayed 28 minutes.",
  "I told my therapist this trip would 'reset me'. I came home needing another trip to reset from this trip.",
  "I went on a yoga retreat and ate gas station nachos every single night in the car alone.",
  "I claimed I knew how to surf. I got 'surfed' by a wave for 40 minutes on camera.",
  "I asked for a 'light breakfast' in Paris. They brought me cheese and a cigarette.",
  "I told a stranger I was a pilot. I was asked aviation questions for the entire flight. I made up answers.",
  "I booked a 'wellness retreat'. I spent 4 days in a robe eating cashews and crying at sunsets.",
  "I used the hotel's valet even though I could have parked free. I wanted the feeling.",
  "I gave the bartender a $100 tip on the first day. I was treated like royalty. I was broke the rest of the trip.",
  "I told my friend I got a sunburn from 'sitting out too long'. I fell asleep at the pool and woke up at 4 PM.",
  "I went to a Michelin-star restaurant and asked for ketchup. The waiter brought it. He was audibly disappointed.",
  "I faked a tooth emergency to get out of a snorkeling trip. I don't like fish looking at me.",
  "I 'lost' my passport at the front desk so I wouldn't have to leave the resort for a day trip.",
  "I left a room service tip in pesos when I was in the Bahamas.",
  "I brought 3 books and a Kindle on a 4-day trip. I read my emails the whole time.",
  "I went to Las Vegas for a 'bachelor party'. I played bingo. I was 34.",
  "I told my boss I was 'completely off the grid'. I checked email every 12 minutes.",
  "I told my grandmother I was working from the beach. I was not working. I was at the beach.",
  "I ate a donut on the plane and called it 'international travel'.",
  "I told the Airbnb host the AC was broken. It wasn't. I just wanted them to come fix it so I could meet them.",
  "I sobbed openly at a Disney parade at 34 years old. My kids were embarrassed. I was not.",
  "I went to a cooking class in Tuscany and Googled 'how to boil water' on the toilet beforehand.",
  "I walked into the wrong hotel room THREE TIMES on the same trip. Each time with a towel.",
  "I told my husband I 'barely spent anything'. I spent $1,400. On gelato.",
  "I confessed to a priest on vacation. He said 'that's normal'. I didn't feel better.",
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
