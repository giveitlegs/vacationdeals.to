"use client";

import { useRef, useEffect, useState, useCallback } from "react";

export interface WheelSlice {
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

interface ResortRouletteWheelProps {
  filter: string;
  onWin: (winner: WheelSlice) => void;
  onSpinStart: () => void;
  spinsRemaining: number;
  sessionId: string;
}

const TAU = Math.PI * 2;
const WHEEL_SIZE = 12;

const RARITY_COLORS: Record<string, { bg: string; alt: string; border: string }> = {
  common:    { bg: "#3B82F6", alt: "#1E293B", border: "#2563EB" },
  rare:      { bg: "#8B5CF6", alt: "#1E293B", border: "#7C3AED" },
  legendary: { bg: "#F59E0B", alt: "#1E293B", border: "#D97706" },
};

// ── Sound via Web Audio (no files) ──
function playSound(type: "tick" | "whoosh" | "fanfare") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "tick") {
      osc.frequency.value = 800; osc.type = "square";
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.start(); osc.stop(ctx.currentTime + 0.04);
    } else if (type === "whoosh") {
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.type = "sawtooth"; osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === "fanfare") {
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = f; o.type = "triangle";
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
        g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.08 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.25);
        o.start(ctx.currentTime + i * 0.08); o.stop(ctx.currentTime + i * 0.08 + 0.25);
      });
    }
  } catch {}
}

// ── Confetti ──
interface Particle { x: number; y: number; vx: number; vy: number; color: string; size: number; rot: number; rs: number; life: number; }

// ── Which slice is at the pointer given current angle? ──
// Slice i is drawn from angle (i * sliceAngle) to ((i+1) * sliceAngle), measured CW from top.
// The wheel is offset by `angle` radians CW. So the pointer (fixed at top) sits at
// wheel-position = angle (mod TAU). The slice at the pointer is floor(angle / sliceAngle) % n.
function sliceAtPointer(angle: number, n: number): number {
  const sliceAngle = TAU / n;
  const norm = ((angle % TAU) + TAU) % TAU;
  return Math.floor(norm / sliceAngle) % n;
}

export function ResortRouletteWheel({ filter, onWin, onSpinStart, spinsRemaining, sessionId }: ResortRouletteWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleRef = useRef<HTMLCanvasElement>(null);
  const [slices, setSlices] = useState<WheelSlice[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [muted, setMuted] = useState(false);
  const angleRef = useRef(0);            // cumulative CW angle in radians
  const animRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pAnimRef = useRef<number | null>(null);
  const lastTickRef = useRef(-1);

  useEffect(() => { if (localStorage.getItem("roulette-muted") === "true") setMuted(true); }, []);
  const toggleMute = () => setMuted(m => { const v = !m; localStorage.setItem("roulette-muted", String(v)); return v; });
  const snd = useCallback((t: "tick"|"whoosh"|"fanfare") => { if (!muted) playSound(t); }, [muted]);

  // ── Fetch real deals for the wheel on mount + filter change ──
  useEffect(() => {
    fetch(`/api/roulette/deals?filter=${filter}`)
      .then(r => r.json())
      .then(d => { if (d.slices?.length) setSlices(d.slices); })
      .catch(() => {});
  }, [filter]);

  // ── Draw wheel ──
  // Convention: angle = 0 → slice 0 top-left edge at 12 o'clock.
  // Slice i spans CW from i*sliceAngle to (i+1)*sliceAngle, offset by -angle.
  // We draw in canvas coords (0 = 3 o'clock) so subtract π/2.
  const drawWheel = useCallback((angle: number, data: WheelSlice[]) => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const W = c.width, H = c.height, cx = W/2, cy = H/2;
    const R = Math.min(W,H)/2 - 16;
    const rInner = R * 0.52;
    const rHub = R * 0.14;
    const n = data.length || 1;
    const sa = TAU / n;

    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < n; i++) {
      const a0 = i * sa - angle - Math.PI/2;   // canvas start angle
      const a1 = a0 + sa;
      const amid = a0 + sa/2;
      const s = data[i];
      const cols = RARITY_COLORS[s?.rarity ?? "common"];

      // Outer slice
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? cols.bg : cols.alt; ctx.fill();
      ctx.strokeStyle = cols.border; ctx.lineWidth = 1.5; ctx.stroke();

      // Inner slice
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, rInner, a0, a1); ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? "#F8FAFC" : "#E2E8F0"; ctx.fill();
      ctx.strokeStyle = "#CBD5E1"; ctx.lineWidth = 1; ctx.stroke();

      if (!s) continue;

      // ── Radial text (always readable) ──
      const norm = ((amid % TAU) + TAU) % TAU;
      const flip = norm > 0 && norm < Math.PI; // bottom half → flip so text reads L→R

      // Destination label (outer ring)
      ctx.save(); ctx.translate(cx, cy);
      if (flip) {
        ctx.rotate(amid + Math.PI);
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillStyle = "#FFF"; ctx.font = "bold 11px system-ui";
        ctx.fillText(s.city.toUpperCase(), -(R - 6), 0, R - rInner - 14);
      } else {
        ctx.rotate(amid);
        ctx.textAlign = "right"; ctx.textBaseline = "middle";
        ctx.fillStyle = "#FFF"; ctx.font = "bold 11px system-ui";
        ctx.fillText(s.city.toUpperCase(), R - 6, 0, R - rInner - 14);
      }
      ctx.restore();

      // Price label (inner ring)
      ctx.save(); ctx.translate(cx, cy);
      const priceColor = s.rarity === "legendary" ? "#B45309" : "#111";
      const priceFont = s.rarity === "legendary" ? "bold 15px system-ui" : "bold 13px system-ui";
      if (flip) {
        ctx.rotate(amid + Math.PI);
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillStyle = priceColor; ctx.font = priceFont;
        ctx.fillText(`$${s.price}`, -(rInner - 6), 0);
      } else {
        ctx.rotate(amid);
        ctx.textAlign = "right"; ctx.textBaseline = "middle";
        ctx.fillStyle = priceColor; ctx.font = priceFont;
        ctx.fillText(`$${s.price}`, rInner - 6, 0);
      }
      ctx.restore();
    }

    // Hub
    ctx.beginPath(); ctx.arc(cx, cy, rHub, 0, TAU);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rHub);
    g.addColorStop(0, "#FBBF24"); g.addColorStop(1, "#D97706");
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "#92400E"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#FFF"; ctx.font = "bold 20px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("\u2605", cx, cy + 1);

    // Pointer (fixed at top)
    ctx.beginPath();
    ctx.moveTo(cx, 22); ctx.lineTo(cx - 14, 2); ctx.lineTo(cx + 14, 2); ctx.closePath();
    ctx.fillStyle = "#DC2626"; ctx.fill();
    ctx.strokeStyle = "#7F1D1D"; ctx.lineWidth = 2; ctx.stroke();
  }, []);

  // Redraw when slices change (and not spinning)
  useEffect(() => {
    if (slices.length > 0 && !isSpinning) drawWheel(angleRef.current, slices);
  }, [slices, isSpinning, drawWheel]);

  // ── Confetti system ──
  const spawnConfetti = useCallback((rarity: string) => {
    const pc = particleRef.current; if (!pc) return;
    const cx = pc.width/2, cy = pc.height/2;
    const count = rarity === "legendary" ? 120 : rarity === "rare" ? 80 : 50;
    const colors = rarity === "legendary" ? ["#FBBF24","#F59E0B","#FCD34D","#FFF"]
      : rarity === "rare" ? ["#A78BFA","#8B5CF6","#C4B5FD","#FFF"]
      : ["#60A5FA","#3B82F6","#93C5FD","#FFF"];
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: cx, y: cy, vx: (Math.random()-.5)*16, vy: (Math.random()-.5)*16 - 4,
        color: colors[Math.floor(Math.random()*colors.length)],
        size: Math.random()*6+3, rot: Math.random()*TAU, rs: (Math.random()-.5)*.3, life: 1,
      });
    }
  }, []);

  useEffect(() => {
    const pc = particleRef.current; if (!pc) return;
    const ctx = pc.getContext("2d"); if (!ctx) return;
    const loop = () => {
      ctx.clearRect(0, 0, pc.width, pc.height);
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.vx *= 0.99; p.rot += p.rs; p.life -= 0.008;
        if (p.life <= 0 || p.y > pc.height + 50) return false;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size); ctx.restore();
        return true;
      });
      pAnimRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { if (pAnimRef.current) cancelAnimationFrame(pAnimRef.current); };
  }, []);

  // ── SPIN ──
  // New approach: spin the wheel a random amount, then READ which slice
  // the pointer landed on. No pre-selected winner = no mismatch possible.
  const handleSpin = useCallback(() => {
    if (isSpinning || spinsRemaining <= 0 || slices.length === 0) return;
    setIsSpinning(true);
    onSpinStart();
    snd("whoosh");

    // Random target: 5–8 full rotations + random offset
    const extraAngle = Math.random() * TAU;
    const totalSpin = (5 + Math.random() * 3) * TAU + extraAngle;
    const startAngle = angleRef.current;
    const targetAngle = startAngle + totalSpin;
    const startTime = performance.now();
    const DURATION = 5000;
    lastTickRef.current = -1;

    const frame = (now: number) => {
      const t = Math.min((now - startTime) / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3.5); // slightly steeper ease-out
      const angle = startAngle + totalSpin * eased;
      angleRef.current = angle;
      drawWheel(angle, slices);

      // Tick
      const cur = sliceAtPointer(angle, slices.length);
      if (cur !== lastTickRef.current) { snd("tick"); lastTickRef.current = cur; }

      if (t < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        // Snap
        angleRef.current = targetAngle;
        drawWheel(targetAngle, slices);

        // Read the winner from where the pointer actually is
        const winnerIdx = sliceAtPointer(targetAngle, slices.length);
        const winner = slices[winnerIdx];

        setIsSpinning(false);
        spawnConfetti(winner.rarity);
        snd("fanfare");
        if (winner.rarity === "legendary") {
          setTimeout(() => spawnConfetti("legendary"), 300);
          setTimeout(() => spawnConfetti("legendary"), 600);
        }

        // Log the spin
        fetch("/api/roulette/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId: winner.dealId, sessionId }),
        }).catch(() => {});

        setTimeout(() => onWin(winner), 350);
      }
    };
    animRef.current = requestAnimationFrame(frame);
  }, [isSpinning, spinsRemaining, slices, onSpinStart, snd, drawWheel, spawnConfetti, onWin, sessionId]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative">
        <canvas ref={canvasRef} width={560} height={560} className="drop-shadow-2xl" style={{ maxWidth: "100%", height: "auto" }} />
        <canvas ref={particleRef} width={560} height={560} className="pointer-events-none absolute inset-0" style={{ maxWidth: "100%", height: "auto" }} />
        {isSpinning && (
          <div className="pointer-events-none absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
            {[0,60,120,180,240,300].map(d => (
              <div key={d} className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300 shadow-[0_0_20px_6px_rgba(253,224,71,0.8)]"
                style={{ transform: `translate(-50%,-50%) rotate(${d}deg) translateY(-270px)` }} />
            ))}
          </div>
        )}
      </div>

      <button onClick={handleSpin} disabled={isSpinning || spinsRemaining <= 0 || slices.length === 0}
        className={`relative mt-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 px-12 py-5 text-xl font-black uppercase tracking-wider text-white shadow-2xl transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${!isSpinning && spinsRemaining > 0 ? "animate-pulse" : ""}`}
        style={{ animationDuration: "2s" }}>
        {isSpinning ? "SPINNING..." : spinsRemaining <= 0 ? "NO SPINS LEFT" : `SPIN THE WHEEL (${spinsRemaining} left)`}
        {!isSpinning && spinsRemaining > 0 && <span className="pointer-events-none absolute -inset-2 animate-ping rounded-full border-4 border-red-400 opacity-50" />}
      </button>

      <button onClick={toggleMute} className="mt-4 text-xs text-gray-400 hover:text-gray-600">
        {muted ? "\uD83D\uDD07 Sounds off" : "\uD83D\uDD0A Sounds on"}
      </button>
    </div>
  );
}
