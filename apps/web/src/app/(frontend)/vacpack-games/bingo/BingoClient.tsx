"use client";

import { useMemo, useState } from "react";
import { LeadGenPopup } from "@/components/LeadGenPopup";

const TROPES = [
  "Free breakfast mentioned",
  "Manager &quot;sharpens the pencil&quot; on price",
  "Shown exclusive members-only section",
  "Property&apos;s &quot;appreciation in value&quot;",
  "Priority booking bonus",
  "Bahamas cruise mentioned",
  "Emotional grandkids story",
  "Peak-season photos shown",
  "&quot;Once-in-a-lifetime price&quot;",
  "$50 Amex to stay longer",
  "&quot;What about your family?&quot;",
  "Complimentary drinks offered",
  "&quot;Only available today&quot;",
  "Touring the &quot;model unit&quot;",
  "Rep mentions their own ownership",
  "Whiteboard math with big numbers",
  "Points/credits vs dollars pitch",
  "&quot;90% financing available&quot;",
  "Resale value promised",
  "VIP tier upgrade offered",
  "Rep calls their &quot;manager&quot;",
  "Mention of &quot;limited inventory&quot;",
  "Free rental car dangled",
  "Said &quot;investment&quot; more than 3x",
  "&quot;17.9% APR is reasonable&quot;",
  "&quot;Your kids will thank you&quot;",
  "Mentioned rescission period",
  "Free gift at the end",
  "Asked for your tax bracket",
  "Showed competitor brochures",
  "&quot;This price won&apos;t come back&quot;",
  "Offered you a water/coffee 5+ times",
  "Asked &quot;what would it take?&quot;",
  "Mentioned &quot;inflation hedge&quot;",
  "Brought in a &quot;happy owner&quot;",
  "Said &quot;trust me&quot; unironically",
  "Whispered about a &quot;secret tier&quot;",
  "Complained about traffic/weather",
  "Mentioned their kids/family 3+ times",
  "Timer or countdown displayed",
  "&quot;50-year appreciation potential&quot;",
  "You got offered a pen to sign",
  "Upgraded to a &quot;nicer room&quot;",
  "Survey with leading questions",
  "Asked about your credit score",
  "&quot;What&apos;s stopping you today?&quot;",
  "Offered to hold unit for 24h",
  "Birthday/anniversary call-out",
  "&quot;My boss will kill me for this&quot;",
];

function decodeHtml(s: string) {
  return s.replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function pickSquares(seed: number): string[] {
  const pool = [...TROPES];
  const out: string[] = [];
  let s = seed;
  while (out.length < 24 && pool.length) {
    s = (s * 9301 + 49297) % 233280;
    const idx = Math.floor((s / 233280) * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function checkBingo(marked: boolean[]): number[] | null {
  // 5x5 grid, center (index 12) is FREE
  const lines: number[][] = [];
  for (let r = 0; r < 5; r++) lines.push([r * 5, r * 5 + 1, r * 5 + 2, r * 5 + 3, r * 5 + 4]);
  for (let c = 0; c < 5; c++) lines.push([c, c + 5, c + 10, c + 15, c + 20]);
  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);
  for (const line of lines) {
    if (line.every((i) => marked[i])) return line;
  }
  return null;
}

export function BingoClient() {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [marked, setMarked] = useState<boolean[]>(() => {
    const m = Array(25).fill(false);
    m[12] = true;
    return m;
  });

  const picks = useMemo(() => pickSquares(seed), [seed]);
  const squares: string[] = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < 25; i++) {
      if (i === 12) out.push("FREE — rep says &quot;honestly&quot;");
      else out.push(picks[i < 12 ? i : i - 1]);
    }
    return out;
  }, [picks]);

  const bingoLine = checkBingo(marked);
  const bingo = !!bingoLine;

  const toggle = (i: number) => {
    if (i === 12) return;
    const next = [...marked];
    next[i] = !next[i];
    setMarked(next);
  };

  const newCard = () => {
    setSeed(Math.floor(Math.random() * 1e6));
    const m = Array(25).fill(false);
    m[12] = true;
    setMarked(m);
  };

  return (
    <>
      {bingo && (
        <LeadGenPopup
          id="bingo-win"
          timeDelayMs={1500}
          headline="BINGO! Claim Your Discount"
          subheadline="Enter your email for a $25 discount code on your next vacpack + a printable PDF of this bingo card."
          ctaText="Send My Discount Code"
          source="bingo_win"
        />
      )}

      {bingo && (
        <div className="mb-6 animate-pulse rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 p-6 text-center text-white shadow-xl">
          <p className="text-6xl font-black tracking-widest">BINGO!</p>
          <p className="mt-2 text-sm">You survived the playbook. Grab your reward.</p>
        </div>
      )}

      <div className="grid grid-cols-5 gap-1.5 rounded-xl bg-fuchsia-50 p-2 sm:gap-2 sm:p-4">
        {squares.map((text, i) => {
          const isMarked = marked[i];
          const inWinLine = bingoLine?.includes(i);
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              disabled={i === 12}
              className={`relative aspect-square rounded-lg border-2 p-1 text-[9px] font-semibold leading-tight transition-all sm:p-2 sm:text-xs ${
                inWinLine
                  ? "border-fuchsia-600 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-lg"
                  : isMarked
                  ? "border-fuchsia-400 bg-fuchsia-100 text-fuchsia-900"
                  : "border-gray-200 bg-white text-gray-700 hover:border-fuchsia-400"
              } ${i === 12 ? "cursor-default italic" : "cursor-pointer"}`}
            >
              <span className="absolute inset-1 flex items-center justify-center text-center">
                {decodeHtml(text)}
              </span>
              {isMarked && i !== 12 && !inWinLine && (
                <span className="absolute right-1 top-1 text-xs">✓</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={newCard} className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-gray-50">
          New Card
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-gray-50"
        >
          Print Card
        </button>
        <a
          href="https://twitter.com/intent/tweet?text=Playing+VacPack+Bingo+%F0%9F%8E%B1+during+our+timeshare+pitch.+Join+me%3A&url=https%3A%2F%2Fvacationdeals.to%2Fvacpack-games%2Fbingo"
          target="_blank"
          rel="noopener"
          className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
        >
          Share on X
        </a>
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        Squares marked: {marked.filter(Boolean).length - 1} / 24 (plus FREE center)
      </p>
    </>
  );
}
