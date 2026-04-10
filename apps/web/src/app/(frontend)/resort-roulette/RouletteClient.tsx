"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ResortRouletteWheel } from "@/components/ResortRouletteWheel";

interface WheelSlice {
  dealId: number;
  price: number;
  city: string;
  state: string;
  brandName: string;
  brandSlug: string;
  slug: string;
  resortName: string;
  rarity: "common" | "rare" | "legendary";
}

const FAKE_RECENT_WINNERS = [
  { name: "Jessica from Ohio", deal: "$89 Orlando 3-night", time: "2 min ago" },
  { name: "Mike from Texas", deal: "$149 Las Vegas 2-night", time: "4 min ago" },
  { name: "Sarah from Florida", deal: "$199 Cancun 5-night", time: "7 min ago" },
  { name: "Derek from California", deal: "$59 Gatlinburg 3-night", time: "9 min ago" },
  { name: "Amy from New York", deal: "$129 Myrtle Beach 4-night", time: "12 min ago" },
  { name: "Tom from Illinois", deal: "$99 Branson 3-night", time: "15 min ago" },
  { name: "Lisa from Georgia", deal: "$179 Cabo 4-night", time: "18 min ago" },
];

export function RouletteClient() {
  const [filter, setFilter] = useState("all");
  const [spinsRemaining, setSpinsRemaining] = useState(3);
  const [winner, setWinner] = useState<WheelSlice | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [holdTimer, setHoldTimer] = useState(0);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [email, setEmail] = useState("");
  const [streak, setStreak] = useState(0);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    // Generate session ID
    let sid = localStorage.getItem("roulette-session");
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("roulette-session", sid);
    }
    sessionIdRef.current = sid;

    // Restore spin count
    const dateKey = new Date().toISOString().split("T")[0];
    const stored = JSON.parse(localStorage.getItem("roulette-spins-" + dateKey) || "{\"remaining\": 3}");
    setSpinsRemaining(stored.remaining);
  }, []);

  // Rotating ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIdx((i) => (i + 1) % FAKE_RECENT_WINNERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Hold timer countdown
  useEffect(() => {
    if (holdTimer <= 0) return;
    const t = setTimeout(() => setHoldTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [holdTimer]);

  const handleWin = (w: WheelSlice) => {
    setWinner(w);
    setIsSpinning(false);
    setStreak((s) => s + 1);
    setHoldTimer(600); // 10 minutes

    const newRemaining = spinsRemaining - 1;
    setSpinsRemaining(newRemaining);
    const dateKey = new Date().toISOString().split("T")[0];
    localStorage.setItem("roulette-spins-" + dateKey, JSON.stringify({ remaining: newRemaining }));

    if (newRemaining <= 0) setShowEmailGate(true);
  };

  const handleSpinStart = () => {
    setIsSpinning(true);
    setWinner(null);
  };

  const handleClickWinner = async () => {
    if (!winner) return;
    // Track the click
    fetch("/api/roulette/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealId: winner.dealId, sessionId: sessionIdRef.current }),
    }).catch(() => {});
    // Navigate to the deal
    window.location.href = `/deals/${winner.slug}`;
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // Give 5 bonus spins
    setSpinsRemaining(5);
    const dateKey = new Date().toISOString().split("T")[0];
    localStorage.setItem("roulette-spins-" + dateKey, JSON.stringify({ remaining: 5 }));
    setShowEmailGate(false);
    // In production, POST email to a lead capture endpoint
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Animated fireworks background */}
      {isSpinning && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-3 w-3 rounded-full"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 20}%`,
                background: ["#FBBF24", "#EF4444", "#8B5CF6", "#10B981", "#3B82F6", "#EC4899"][i],
                boxShadow: `0 0 30px 10px ${["#FBBF24", "#EF4444", "#8B5CF6", "#10B981", "#3B82F6", "#EC4899"][i]}`,
                animation: `firework 1.5s ease-out ${i * 0.25}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes firework {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(5); opacity: 0.8; }
          100% { transform: scale(8); opacity: 0; }
        }
        @keyframes dropBanner {
          0% { transform: translateY(-100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .banner-drop { animation: dropBanner 0.6s ease-out forwards; }
      `}</style>

      {/* Dim overlay when spinning */}
      {isSpinning && <div className="pointer-events-none fixed inset-0 z-10 bg-black/40 backdrop-blur-[1px]" />}

      {/* Header */}
      <div className="relative z-20 mb-8 text-center">
        <h1 className="mb-3 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
          <span className="bg-gradient-to-r from-red-600 via-amber-500 to-red-600 bg-clip-text text-transparent">
            Resort Roulette
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Spin the wheel. Win a random real vacation deal. Every slot is a real scraped vacpack from our database.
        </p>
        {streak > 1 && (
          <p className="mt-2 inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-700">
            🔥 {streak} spin streak!
          </p>
        )}
      </div>

      {/* Filter controls */}
      <div className="relative z-20 mb-6 flex flex-wrap items-center justify-center gap-2">
        {[
          { value: "all", label: "All Deals" },
          { value: "beach", label: "🏖️ Beach Only" },
          { value: "under-150", label: "💰 Under $150" },
          { value: "luxury", label: "✨ Luxury" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            disabled={isSpinning}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.value
                ? "border-blue-500 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:border-blue-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Wheel */}
      <div className="relative z-20 flex justify-center">
        <ResortRouletteWheel
          filter={filter}
          onWin={handleWin}
          onSpinStart={handleSpinStart}
          spinsRemaining={spinsRemaining}
          sessionId={sessionIdRef.current}
        />
      </div>

      {/* Winner banner — drops down from wheel */}
      {winner && !isSpinning && (
        <div className="relative z-30 mx-auto mt-8 max-w-2xl banner-drop">
          <div
            className={`overflow-hidden rounded-2xl border-4 shadow-2xl ${
              winner.rarity === "legendary"
                ? "border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-100"
                : winner.rarity === "rare"
                ? "border-purple-400 bg-gradient-to-br from-purple-50 to-violet-100"
                : "border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-100"
            }`}
          >
            <div className="px-6 py-5 text-center">
              <div className="mb-2">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    winner.rarity === "legendary"
                      ? "bg-amber-500 text-white"
                      : winner.rarity === "rare"
                      ? "bg-purple-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {winner.rarity === "legendary" ? "⭐ LEGENDARY" : winner.rarity === "rare" ? "💜 RARE" : "🎯 COMMON"} WIN!
                </span>
              </div>
              <h2 className="mb-1 text-3xl font-black text-gray-900">
                ${winner.price} in {winner.city}
              </h2>
              <p className="mb-3 text-sm text-gray-600">
                {winner.resortName} · {winner.brandName}
              </p>
              {holdTimer > 0 && (
                <p className="mb-3 inline-block rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                  ⏱️ Reserved for {formatTime(holdTimer)}
                </p>
              )}
              <button
                onClick={handleClickWinner}
                className="block w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105"
              >
                Claim This Deal →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recently won ticker */}
      <div className="relative z-20 mx-auto mt-10 max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Recently Spun</p>
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <p className="text-sm text-gray-700">
              <strong>{FAKE_RECENT_WINNERS[tickerIdx].name}</strong> just spun{" "}
              <span className="font-semibold text-emerald-600">{FAKE_RECENT_WINNERS[tickerIdx].deal}</span>
              <span className="ml-2 text-xs text-gray-400">{FAKE_RECENT_WINNERS[tickerIdx].time}</span>
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="relative z-20 mx-auto mt-12 max-w-3xl rounded-xl border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-4 text-xl font-bold text-gray-900">How Resort Roulette Works</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
          <div>
            <p className="mb-1 text-2xl">🎰</p>
            <p className="font-semibold text-gray-900">1. Pick a Filter</p>
            <p className="text-gray-600">Choose all deals, beach only, under $150, or luxury.</p>
          </div>
          <div>
            <p className="mb-1 text-2xl">🎯</p>
            <p className="font-semibold text-gray-900">2. Spin the Wheel</p>
            <p className="text-gray-600">Each slice is a real vacpack from our scraped database.</p>
          </div>
          <div>
            <p className="mb-1 text-2xl">✨</p>
            <p className="font-semibold text-gray-900">3. Claim Your Deal</p>
            <p className="text-gray-600">Click the winner banner to go straight to the booking page.</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          <strong>Legendary</strong> (under $100) = gold glow + bonus confetti · <strong>Rare</strong> ($100-$199) = purple · <strong>Common</strong> ($200+) = blue
        </p>
      </section>

      {/* Email gate modal */}
      {showEmailGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Out of Free Spins!</h2>
            <p className="mb-6 text-sm text-gray-600">
              Drop your email to get <strong>5 bonus spins</strong> and our weekly best deals alerts.
            </p>
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Get 5 Bonus Spins
              </button>
              <button
                type="button"
                onClick={() => setShowEmailGate(false)}
                className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600"
              >
                Maybe later
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
