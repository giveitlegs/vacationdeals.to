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
    "a Hampton Inn at an exit that is only mentioned on the map by its exit number",
    "a timeshare presentation that forgot to include the timeshare",
    "a Motel 8, which is just a Motel 6 that rounded up",
    "a Best Western in Gary, Indiana, which is technically 'the Chicago area'",
    "a Travelodge whose mascot, a sleepy bear, has been removed from the sign but not from the carpet",
    "a 'lake house' that is a futon in someone's garage, but the garage has a kayak",
    "a 'villa' in Branson with a view of another villa's back wall",
    "a Howard Johnson's that still has Howard Johnson's signage inside but now it's a La Quinta",
    "a Knight's Inn where the knight is a plaster figure missing one arm",
    "a 'beachfront' hotel 2.4 miles from the beach, 'within walking distance if you're motivated'",
    "a converted Shoney's in Paducah that still smells faintly of hot bar",
    "a Microtel where the rooms are, in fact, smaller than the word implies",
    "a 'mountain lodge' whose mountain is a landfill with vegetation",
    "a 'historic downtown hotel' whose history is 'it was a dentist's office until 2011'",
    "a Comfort Inn next to a 24-hour truck scale whose beep is its own ambient track",
    "a Rodeway Inn directly under the airport flight path, guaranteed 3.2 jets per hour",
    "a 'retreat center' that shares a parking lot with a Taco Bell and a payday loan place",
    "a 'bed and breakfast' where the breakfast is a Pop-Tart and the bed is a sofa",
    "an 'eco lodge' that is a yurt with no plumbing adjacent to a chemical plant",
    "a 'desert oasis' whose oasis is a Culligan water cooler in a plastic Adirondack chair",
    "a Choice Hotel — genuinely, we cannot be more specific, it's whichever one is cheapest that day",
    "a Marriott Fairfield Inn where every floor is the second floor somehow",
  ];

  const lodgings = [
    "Your room has one lamp, which flickers at precisely 72 BPM.",
    "The A/C is 'on' but produces only a gentle humidity and the occasional sigh.",
    "The bedspread has visible 'scenes from previous guests' and one of them has a name.",
    "Your window overlooks a dumpster and a man on a phone call who makes direct eye contact.",
    "The shower has two settings: scalding and off. They alternate on a schedule you cannot predict.",
    "There is a stain. The stain moves. You have named it Greg.",
    "The ice machine screams every 18 minutes all night. It is screaming for you.",
    "The TV only plays QVC and one local news channel stuck on weather from 2019.",
    "The bathroom lock locks but not unlocks. You will need to explain this to management.",
    "The mini-fridge contains half a sub sandwich from the previous guest and a typed note reading 'enjoy'.",
    "Room phone only dials the front desk, which has a recorded greeting saying front desk is closed.",
    "The carpet has a pattern specifically designed to hide what's in the carpet.",
    "Your door will not fully close unless you leverage your entire body weight against it.",
    "The smoke detector is chirping on a low battery. You cannot reach it. Neither can the ladder they bring.",
    "The pillow is one (1) pillow for two (2) people. Additional pillows are $12 each.",
    "The coffee maker works, but only brews decaf at full strength, and regular at a gentle suggestion.",
    "There is a hair in the sink. You didn't put it there. You brought your own hairs.",
    "The iron has a handwritten sign that says 'broken, do not use' and is also the only outlet that works.",
    "The curtain does not fully close. A gap precisely the width of the neighboring parking lot light exists.",
    "Wi-Fi works, but only in the hallway, and only for 40 seconds at a time.",
    "The thermostat goes up to 85°F and down to 83°F. These are the only two temperatures.",
    "The bed is 'queen size' by the local convention, which is 'a loveseat and a throw pillow'.",
    "Safe inside the closet is locked. The previous guest's PIN is a small laminated card on the nightstand.",
    "The room is a corner room. Both corners are the same corner. The geometry is unsettling.",
    "There is a Bible, a Book of Mormon, and a Denny's menu in the nightstand. The Denny's menu is the most thumbed.",
    "The blackout curtains are printed with clouds. The clouds are backlit.",
    "Your room is adjacent to the vending machines, the ice machine, the elevator, and something labeled 'mechanical'.",
    "The bathroom tile is new. The bathroom grout is not. The grout has opinions.",
    "Your bathroom sink has a second faucet labeled 'hot' that only delivers cold. The 'cold' faucet has been removed.",
    "The lampshade is attached to the lamp with visible hot glue. Someone did this recently.",
  ];

  const foods = [
    "Continental breakfast is gravy, one banana, and a waffle iron that has never produced a waffle.",
    "Dinner options: a Perkins, the gas station Tornados, and a vending machine with exclusively trail mix.",
    "The 'pool bar' is a cooler with warm Miller Lite and a Post-it note saying 'honor system'.",
    "Every restaurant within 10 miles closes at 7 PM. The one that's open is also closed, but the door works.",
    "Room service is literally a bag of chips and a Diet Coke, delivered by a teen who knocks with their foot.",
    "Breakfast includes a hot-dog roller but no hot dogs. The rollers still roll.",
    "The complimentary coffee is instant Folgers crystals dissolved in yesterday's coffee.",
    "The 'hot bar' is one crockpot. The crockpot contains a stew. The stew has been there since Tuesday. It is Saturday.",
    "The restaurant attached to the hotel is Applebee's-adjacent — it's just called 'Apple's' and the 'bees' have been removed from the sign.",
    "Your continental breakfast voucher is valid only between 6:00 AM and 6:07 AM.",
    "The pool snack bar serves one item: a hot dog, un-heated, with a packet of relish and no bun.",
    "There is a pizza place across the street. It is open. It has no pizza. This is not a typo.",
    "Your in-room menu has 14 items. 12 are unavailable. The remaining 2 are 'ice' and 'more ice'.",
    "The breakfast buffet has a sign that says 'please take only what you will eat'. The breakfast buffet is three bananas and a pitcher of orange drink.",
    "The closest grocery store is a gas station. The freshest produce is Doritos.",
    "The microwave in the lobby works. The microwave has a handwritten sign: 'no chili. seriously. no chili.'",
    "Tipping is cash only. The ATM is a vending machine that dispenses ones for fives.",
    "You asked for hot sauce. They gave you ketchup. You pushed back. They gave you ketchup with pepper in it.",
    "The server wrote your order on a napkin. They used a crayon. You can see the pressure marks through.",
    "The 'fine dining' option on the property is a Cracker Barrel 3 highway exits back.",
    "The food court has four restaurants, three of which share one deep fryer and a shared regret.",
    "Breakfast ends at 9:00 AM. A staff member will begin removing items at 8:47 AM while you are still eating.",
    "The 'kids menu' is the regular menu but cut in half and photocopied crooked.",
    "Your to-go container is a foam clamshell that immediately deflates into a warm rectangle in your bag.",
    "The ice machine and the coffee machine are the same machine. You cannot have both. You must choose.",
    "The bar has happy hour. Happy hour is 3:14 PM to 3:19 PM. The bar is not open at those times.",
    "The 'Italian' restaurant down the road serves lasagna. It is one (1) piece of provolone on elbow macaroni.",
    "The buffet has a sneeze guard. The sneeze guard has a crack. The crack is aligned with the green beans.",
    "The front desk recommended a local favorite. The local favorite is a Cici's Pizza that closed in 2018.",
    "Your kid's chicken nugget meal comes with applesauce, a juice box, and a small plastic cactus. No one can explain the cactus.",
  ];

  const activities = [
    "Main local attraction: a barbed-wire museum (admission $8, exit through gift shop).",
    "The 'beach' is a gravel parking lot adjacent to the lake. The lake has a rope you cannot cross.",
    "Pool closes at 4 PM for chemical rebalancing. Nightly. And daily. And also now.",
    "Free activity: listening to the interstate from your balcony. Bonus: a rooster somewhere.",
    "The 'spa' is a chair next to a space heater and a bowl of cucumber water with a fly.",
    "Local tour: 90 minutes of a man showing you his Corvette. You will not ride in the Corvette.",
    "Main photo op: the 'World's Second-Largest Ball of Twine', twelve minutes from the biggest one.",
    "The hotel advertises a 'fitness center'. It is a single treadmill facing a wall.",
    "Off-site activity recommended by the concierge: driving around until you find a field.",
    "Game room: two (2) broken arcade cabinets and a Skee-Ball with no balls.",
    "The scenic overlook overlooks a parking lot that overlooks a different, smaller parking lot.",
    "Nightlife recommendation: sitting in the lobby listening to the ice machine work through its emotional range.",
    "The 'kids club' is a TV playing Shrek 2 on a loop and one (1) staff member reading a paperback.",
    "Free local event: a farmer's market that is a card table with two tomatoes and a stranger.",
    "Activity package: 'Sunset Cruise' is a man with a rowboat who waits near the dock hoping you'll ask.",
    "Bike rental: one bike, chained to a fence, no one knows who has the key.",
    "Guided hike to a waterfall. The waterfall is a pipe. The pipe is the drain.",
    "Wine tasting at the 'vineyard' involves three boxed wines and a flier for solar panels.",
    "You can see the stadium from the parking lot. The game is on TV in the lobby. You are not allowed in the lobby right now.",
    "The walking tour starts at 8 AM sharp. At 8:03 AM the guide will text you a map and wish you luck.",
    "The 'live music' is a Bose speaker aimed at the pool playing the Hotel California live album.",
    "'Stargazing' advertised at the property. Amenity is a star chart taped to the ceiling of the parking garage.",
    "Bowling alley closes at 9 PM. They will turn off the pins at 8:47 PM. You will bowl at nothing for 13 minutes.",
    "The outlet mall is 'right next door'. Right next door is 22 minutes via a road with one lane closed.",
    "The aquarium has one fish. The fish is a goldfish. The goldfish's name is Sharkey. Entry is $14.",
    "Kayak rental includes a life vest that does not close and a whistle that plays the Crazy Frog song.",
    "The casino is a gas station with four slot machines in a back hallway and a bowl of pretzels.",
    "You signed up for a cooking class. You will watch a man put macaroni in boiling water for 47 minutes.",
    "The petting zoo is a pen with three goats, two of whom are asleep and one of whom is 'resting its eyes permanently'.",
    "Ghost tour of downtown: 2 hours of a man telling you his uncle died in each building.",
  ];

  const lowlights = [
    "A raccoon got into your cooler. It has your keys now. It is inside your car.",
    "There's a wedding reception in the lobby until 2 AM. It is your cousin's wedding. You were not invited.",
    "The fire alarm goes off at 3 AM. Twice. The second time you stayed in bed. So did everyone else.",
    "A family of 8 is in the adjacent room with paper-thin walls. They are reviewing tax documents.",
    "The only charging port in your room has been removed and capped with a business card for a drywall contractor.",
    "Every front-desk call goes to voicemail. Voicemail is full. The full voicemail is screaming.",
    "Someone is playing 'Africa' by Toto in the hallway. Not loud. Just loud enough.",
    "A toddler in the room above yours has discovered gravity and an object and will not stop.",
    "The adjacent room's shower drips onto your bathroom ceiling. The drip has a tempo. You clap to it. You cannot stop.",
    "Your Uber driver is also staying at the hotel. You see him every morning. He nods. He knows.",
    "Housekeeping came in while you were napping. They took the pillow. They did not take the hair.",
    "At 4 AM a man in the hallway will have the longest, most detailed work call of his life. You will learn his quarterly targets.",
    "The elevator dings every time it passes your floor, even when empty. It dings often.",
    "Your rental car has check-engine light on. Turning it off and on makes it briefly flash every other warning light.",
    "A small child in the room across the hall has learned a single whistle and must practice it.",
    "The pool party you were not invited to is directly below your window. It ends at 11:45 PM. They regroup at 12:15 AM.",
    "A sheep is loose somewhere near the parking lot. This has been going on since you arrived. No one is concerned.",
    "Your neighbor is running every morning at 5:50 AM. Their sneakers squeak. Exactly every 1.3 seconds.",
    "Your spouse has started saying 'it builds character' whenever something new breaks. It is not comforting.",
    "The smoke alarm is chirping. Management has added your chirp to a ticket. The ticket is from March.",
    "A fly has chosen your room. The fly has preferences. The fly has a route. You are on the route.",
    "At check-in, someone warned you about 'the guy in 214'. You are in 215.",
    "The ice machine on your floor only gives slush. The slush is warm. Thermodynamics do not apply.",
    "Every morning, a stranger tries your door at exactly 6:04 AM. They apologize. It's a different stranger each day.",
    "Your check-in time was 4 PM. Your room was ready at 6:12 PM. The staff member who gave you a key said 'technically'.",
    "The lobby TV is playing C-SPAN. It is on mute. Captions are on. They are in French.",
    "A group of golfers is staying on your floor. They come back at 2 AM and need ice. They need ice repeatedly.",
    "Hotel manager introduced themselves by saying 'I'm only here through Friday'. It is Thursday.",
    "You overheard a staff member say the words 'that's the third time this week' while pointing at something near your door.",
    "A wedding party took all the hotel luggage carts at 8 AM. They will return them Sunday. You are leaving Saturday.",
  ];

  return {
    title: "Your Cursed Vacation, Personalized",
    location: locations[hash % locations.length],
    lodging: lodgings[(hash >>> 4) % lodgings.length],
    food: foods[(hash >>> 8) % foods.length],
    activity: activities[(hash >>> 12) % activities.length],
    lowlight: lowlights[(hash >>> 16) % lowlights.length],
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
