"use client";

import { useState } from "react";

type Stage = "pact" | "single-spin" | "oath-form" | "sworn" | "double-spin";

const PRIZES = [
  { label: "Orlando 3N Vacpack", value: "orlando-3n", weight: 30 },
  { label: "Vegas 3N Vacpack", value: "vegas-3n", weight: 25 },
  { label: "Gatlinburg Mountain Getaway", value: "gatlinburg-3n", weight: 20 },
  { label: "Myrtle Beach Oceanfront", value: "myrtle-oceanfront", weight: 15 },
  { label: "Cancun All-Inclusive", value: "cancun-ai", weight: 7 },
  { label: "The Golden Ticket — Your choice of resort", value: "golden", weight: 3 },
];

function spin(): typeof PRIZES[number] {
  const total = PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of PRIZES) {
    if (r < p.weight) return p;
    r -= p.weight;
  }
  return PRIZES[0];
}

export function BloodOathClient() {
  const [stage, setStage] = useState<Stage>("pact");
  const [myName, setMyName] = useState("");
  const [myEmail, setMyEmail] = useState("");
  const [friendName, setFriendName] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [tcpa, setTcpa] = useState(false);
  const [friendTcpa, setFriendTcpa] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myPrize, setMyPrize] = useState<typeof PRIZES[number] | null>(null);
  const [friendPrize, setFriendPrize] = useState<typeof PRIZES[number] | null>(null);

  if (stage === "pact") {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900 via-black to-red-950 p-8 text-center text-white shadow-2xl sm:p-12">
        <p className="text-xs font-black uppercase tracking-[0.5em] text-red-400">The Pact</p>
        <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
          Blood Oath<br />Roulette
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-white/80">
          Take your one allotted spin alone. <em>Or</em> swear a blood oath with a friend
          and receive a second spin — but if your friend wins and you did not warn them,
          you forfeit everything.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setMyPrize(spin());
              setStage("single-spin");
            }}
            className="rounded-lg border-2 border-gray-500 bg-black/50 px-5 py-4 text-sm font-bold text-white hover:border-gray-300"
          >
            🩸<br />Spin alone (one spin)
          </button>
          <button
            type="button"
            onClick={() => setStage("oath-form")}
            className="rounded-lg border-2 border-red-500 bg-red-950/80 px-5 py-4 text-sm font-bold text-white hover:border-red-400"
          >
            🗡️<br />Swear oath (two spins)
          </button>
        </div>

        <p className="mx-auto mt-6 max-w-sm text-xs italic text-white/60">
          The Oath invokes TCPA compliance. Your friend will be contacted and can decline,
          at which point you lose your bonus spin. The Pact is binding.
        </p>
      </div>
    );
  }

  if (stage === "single-spin") {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-red-900 to-black p-10 text-center text-white shadow-2xl">
        <p className="text-6xl">🩸</p>
        <p className="mt-4 text-xs uppercase tracking-widest text-red-400">Your one spin revealed:</p>
        <h2 className="mt-2 text-3xl font-black">{myPrize?.label}</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-white/80">
          Enter the monthly drawing. Top spinners by volume win.
        </p>
        <a
          href="/deals"
          className="mt-5 inline-block rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
        >
          Browse real {myPrize?.value.split("-")[0]} deals →
        </a>
        <p className="mt-5 text-xs text-white/60">
          You had only one spin. It is done.
        </p>
      </div>
    );
  }

  if (stage === "oath-form") {
    const canSwear = myName && myEmail && friendName && friendEmail && tcpa && friendTcpa;

    const swear = async () => {
      if (!canSwear) return;
      setSubmitting(true);
      try {
        // Log the oath — both contacts, with TCPA consent records
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: myEmail,
            source: "blood_oath_oath_taker",
            tcpaConsent: true,
            termsConsent: true,
            consentText: "I have sworn the Blood Oath and consent to receive promotional emails from VacationDeals.to.",
            metadata: { name: myName, friend_name: friendName, friend_email: friendEmail },
          }),
        });
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: friendEmail,
            source: "blood_oath_recipient",
            tcpaConsent: true,
            termsConsent: true,
            consentText: "A friend entered me in Blood Oath Roulette. I can opt out anytime.",
            metadata: { name: friendName, oath_taker: myName, oath_taker_email: myEmail },
          }),
        });

        setMyPrize(spin());
        setFriendPrize(spin());
        setStage("double-spin");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-950 via-black to-red-900 p-8 text-white shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-red-400">Swear the oath</p>
        <h2 className="mt-2 text-3xl font-black">Two spins. Two contacts.</h2>
        <p className="mt-2 text-sm text-white/80">
          Both parties get a spin. Both parties receive one monthly drawing entry.
          Your friend will be texted to confirm — if they decline, your second spin is forfeit.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-red-800 bg-black/50 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-red-400">Your pact</p>
            <label className="text-sm">
              <span className="mb-1 block text-white/90">Name</span>
              <input
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                className="w-full rounded border border-gray-700 bg-black/70 px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 block text-sm">
              <span className="mb-1 block text-white/90">Email</span>
              <input
                type="email"
                value={myEmail}
                onChange={(e) => setMyEmail(e.target.value)}
                className="w-full rounded border border-gray-700 bg-black/70 px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 flex items-start gap-2 text-xs text-white/80">
              <input type="checkbox" checked={tcpa} onChange={(e) => setTcpa(e.target.checked)} className="mt-0.5 h-4 w-4" />
              <span>I consent to Terms + Privacy + promotional emails.</span>
            </label>
          </div>
          <div className="rounded-lg border border-red-800 bg-black/50 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-red-400">Their pact</p>
            <label className="text-sm">
              <span className="mb-1 block text-white/90">Friend name</span>
              <input
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                className="w-full rounded border border-gray-700 bg-black/70 px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 block text-sm">
              <span className="mb-1 block text-white/90">Friend email</span>
              <input
                type="email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                className="w-full rounded border border-gray-700 bg-black/70 px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 flex items-start gap-2 text-xs text-white/80">
              <input type="checkbox" checked={friendTcpa} onChange={(e) => setFriendTcpa(e.target.checked)} className="mt-0.5 h-4 w-4" />
              <span>I confirm my friend agreed I could enter them, and they may opt out anytime.</span>
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={swear}
          disabled={!canSwear || submitting}
          className="mt-6 w-full rounded-lg bg-red-700 px-5 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-red-800 disabled:opacity-50"
        >
          {submitting ? "Sealing..." : "🩸  Seal the Oath  🗡️"}
        </button>
      </div>
    );
  }

  // double-spin
  return (
    <div className="rounded-2xl bg-gradient-to-br from-red-950 via-black to-red-900 p-10 text-white shadow-2xl">
      <p className="text-center text-6xl">🩸🩸</p>
      <p className="mt-4 text-center text-xs uppercase tracking-widest text-red-400">The Oath is sealed.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-red-600 bg-black/50 p-5 text-center">
          <p className="text-xs uppercase tracking-widest text-red-400">You spun:</p>
          <p className="mt-2 text-xl font-black">{myPrize?.label}</p>
          <p className="mt-2 text-xs text-white/60">({myName})</p>
        </div>
        <div className="rounded-lg border border-red-600 bg-black/50 p-5 text-center">
          <p className="text-xs uppercase tracking-widest text-red-400">{friendName} spun:</p>
          <p className="mt-2 text-xl font-black">{friendPrize?.label}</p>
          <p className="mt-2 text-xs text-white/60">(pending their opt-in)</p>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-md text-center text-sm text-white/80">
        Both of you are entered in this month&apos;s drawing. {friendName} will receive an email
        with the opportunity to accept or decline the oath. If they decline, your spin stands but
        the bonus dissolves. The Pact is binding.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href="/deals" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Browse deals →</a>
        <a href="/vacation-carnival" className="rounded-lg border-2 border-red-600 px-4 py-2 text-sm font-semibold text-white">Back to Carnival</a>
      </div>
    </div>
  );
}
