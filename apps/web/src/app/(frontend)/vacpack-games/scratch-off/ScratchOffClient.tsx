"use client";

import { useEffect, useRef, useState } from "react";
import type { Deal } from "@/components/DealCard";
import { LeadGenPopup } from "@/components/LeadGenPopup";

const COOKIE_NAME = "vd_scratch_daily";
const FREE_DAILY = 1;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const exp = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${value}; expires=${exp}; path=/; SameSite=Lax`;
}

interface ScratchState {
  date: string;
  used: number;
  grantedBonus: number;
}

function readState(): ScratchState {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return { date: todayKey(), used: 0, grantedBonus: 0 };
  try {
    const s = JSON.parse(raw) as ScratchState;
    if (s.date !== todayKey()) return { date: todayKey(), used: 0, grantedBonus: s.grantedBonus ?? 0 };
    return s;
  } catch {
    return { date: todayKey(), used: 0, grantedBonus: 0 };
  }
}

function writeState(s: ScratchState) {
  setCookie(COOKIE_NAME, JSON.stringify(s), 1);
}

export function ScratchOffClient({ deals }: { deals: Deal[] }) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [golden, setGolden] = useState(false);
  const [state, setState] = useState<ScratchState>({ date: todayKey(), used: 0, grantedBonus: 0 });
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isScratching = useRef(false);

  useEffect(() => {
    setMounted(true);
    setState(readState());
  }, []);

  const total = FREE_DAILY + state.grantedBonus;
  const remaining = Math.max(0, total - state.used);

  const newCard = () => {
    if (deals.length === 0) return;
    if (remaining <= 0) return;
    const isGolden = Math.random() < 0.01;
    const pool = isGolden ? deals.slice(0, Math.min(3, deals.length)) : deals;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setDeal(pick);
    setGolden(isGolden);
    setRevealed(false);
    const next = { ...state, used: state.used + 1 };
    setState(next);
    writeState(next);
  };

  // Initialize the scratch canvas
  useEffect(() => {
    if (!deal || revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Paint scratch-off cover
    const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    if (golden) {
      grad.addColorStop(0, "#FCD34D");
      grad.addColorStop(0.5, "#F59E0B");
      grad.addColorStop(1, "#B45309");
    } else {
      grad.addColorStop(0, "#9CA3AF");
      grad.addColorStop(1, "#4B5563");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Sparkle overlay
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    for (let i = 0; i < 40; i++) {
      ctx.fillRect(Math.random() * rect.width, Math.random() * rect.height, 3, 3);
    }

    // Cover text
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(golden ? "GOLDEN TICKET!" : "SCRATCH HERE", rect.width / 2, rect.height / 2 - 4);
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText(golden ? "Drag to reveal premium deal" : "Drag to reveal your deal", rect.width / 2, rect.height / 2 + 18);

    ctx.globalCompositeOperation = "destination-out";
  }, [deal, revealed, golden]);

  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    // Every ~5 strokes, check if we've scratched enough
    if (Math.random() < 0.18) {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let cleared = 0;
      // Sample every 20th pixel's alpha
      for (let i = 3; i < img.data.length; i += 80) {
        if (img.data[i] === 0) cleared++;
      }
      const ratio = cleared / (img.data.length / 80);
      if (ratio > 0.45) setRevealed(true);
    }
  };

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    isScratching.current = true;
    const p = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    scratch(p.clientX, p.clientY);
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching.current) return;
    const p = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    scratch(p.clientX, p.clientY);
  };
  const onUp = () => {
    isScratching.current = false;
  };

  if (deals.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-4xl">🎟️</p>
        <p className="mt-3 text-lg font-bold text-gray-900">No scratch cards available right now</p>
        <p className="mt-1 text-sm text-gray-500">Check back in a bit — we&apos;re loading fresh deals.</p>
      </div>
    );
  }

  return (
    <>
      {remaining <= 0 && !deal && (
        <LeadGenPopup
          id="scratch-out"
          timeDelayMs={500}
          headline="Out of Scratches!"
          subheadline="Enter your email for 5 more scratches today + a 10% off vacpack code."
          ctaText="Get 5 More Scratches"
          source="scratch_off_exhausted"
        />
      )}

      {/* Scratches remaining */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 px-5 py-3 text-white">
        <span className="text-sm font-bold uppercase tracking-wider">Scratches today</span>
        <span className="text-xl font-black">{mounted ? remaining : "—"} / {mounted ? total : FREE_DAILY}</span>
      </div>

      {!deal && (
        <button
          onClick={newCard}
          disabled={!mounted || remaining <= 0}
          className="w-full rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 px-8 py-12 text-center text-white shadow-xl transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-6xl">🎟️</span>
          <p className="mt-3 text-2xl font-black">{remaining > 0 ? "Reveal a Card" : "No Scratches Left"}</p>
          <p className="mt-1 text-sm opacity-90">{remaining > 0 ? "1 in 100 is a Golden Ticket" : "Check back tomorrow"}</p>
        </button>
      )}

      {deal && (
        <div className="relative">
          {/* Underneath: the revealed deal */}
          <div className={`rounded-2xl p-8 text-center shadow-xl ${
            golden
              ? "bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 text-gray-900"
              : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
          }`}>
            {golden && <p className="mb-2 text-sm font-bold uppercase tracking-widest">⭐ GOLDEN TICKET ⭐</p>}
            <p className="text-sm font-medium opacity-80">{deal.city}, {deal.state} • {deal.brandName}</p>
            <h3 className="mt-1 text-2xl font-black">{deal.resortName}</h3>
            <p className="mt-3 text-6xl font-black">${deal.price}</p>
            <p className="mt-1 text-sm opacity-90">{deal.durationDays} days / {deal.durationNights} nights</p>
            {deal.inclusions && deal.inclusions.length > 0 && (
              <ul className="mx-auto mt-4 max-w-xs space-y-0.5 text-sm opacity-95">
                {deal.inclusions.slice(0, 3).map((inc, i) => <li key={i}>✓ {inc}</li>)}
              </ul>
            )}
            <a
              href={`/deals/${deal.slug}`}
              className="mt-5 inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-100"
            >
              Claim This Deal →
            </a>
          </div>

          {/* Scratch canvas overlay */}
          {!revealed && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full cursor-grab rounded-2xl touch-none"
              onMouseDown={onDown}
              onMouseMove={onMove}
              onMouseUp={onUp}
              onMouseLeave={onUp}
              onTouchStart={onDown}
              onTouchMove={onMove}
              onTouchEnd={onUp}
            />
          )}
        </div>
      )}

      {deal && (
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={() => {
              setDeal(null);
              setRevealed(false);
            }}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-gray-50"
          >
            Close
          </button>
          {remaining > 0 && (
            <button
              onClick={() => {
                setDeal(null);
                setRevealed(false);
                setTimeout(newCard, 50);
              }}
              className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
            >
              Scratch Another ({remaining - 0})
            </button>
          )}
          <button
            onClick={() => setRevealed(true)}
            disabled={revealed}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            Reveal All
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-gray-500">
        New free scratch resets at midnight. Golden ticket odds: 1 in 100.
      </p>
    </>
  );
}
