"use client";

import { useRef, useEffect, useState, useCallback } from "react";

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

interface SpinResult {
  wheelSlices: WheelSlice[];
  winner: WheelSlice;
  winnerIndex: number;
}

interface ResortRouletteWheelProps {
  filter: string;
  onWin: (winner: WheelSlice) => void;
  onSpinStart: () => void;
  spinsRemaining: number;
  sessionId: string;
}

const TAU = Math.PI * 2;

const RARITY_COLORS = {
  common: { bg: "#3B82F6", border: "#2563EB", glow: "#60A5FA" },
  rare: { bg: "#8B5CF6", border: "#7C3AED", glow: "#A78BFA" },
  legendary: { bg: "#F59E0B", border: "#D97706", glow: "#FBBF24" },
};

const ALT_SLICE_COLOR = "#1E293B";

// Web Audio API sound effects
function playSound(type: "tick" | "whoosh" | "fanfare" | "sparkle") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "tick") {
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.type = "square";
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "whoosh") {
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.type = "sawtooth";
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === "fanfare") {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = freq;
        o.type = "triangle";
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.1 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);
        o.start(ctx.currentTime + i * 0.1);
        o.stop(ctx.currentTime + i * 0.1 + 0.3);
      });
    } else if (type === "sparkle") {
      osc.frequency.setValueAtTime(2000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.type = "sine";
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {}
}

interface Particle {
  x: number; y: number; vx: number; vy: number; color: string;
  size: number; rotation: number; rotSpeed: number; life: number;
}

// ============================================================================
// WHEEL GEOMETRY MODEL
// ============================================================================
//
// We use a custom angle convention that makes the math clean:
//
//   angle = 0    → TOP of wheel (12 o'clock) — where the pointer is
//   angle > 0   → clockwise (1, 2, 3 o'clock...)
//   angle = π   → bottom (6 o'clock)
//   angle = 2π  → back to top
//
// Slice i (0-indexed) occupies the angular range:
//   [i * sliceAngle, (i + 1) * sliceAngle]
// Slice i's CENTER is at:
//   i * sliceAngle + sliceAngle / 2
//
// The wheel's rotation offsets every slice by the same amount:
//   rendered angle = slice angle - rotation
// (negative because clockwise rotation of the wheel moves slices clockwise)
//
// For slice i to be CENTERED under the pointer (at angle 0):
//   i * sliceAngle + sliceAngle / 2 - rotation = 0
//   rotation = i * sliceAngle + sliceAngle / 2
//
// To convert our clean angle → canvas angle (where 0 = 3 o'clock, clockwise):
//   canvas_angle = wheel_angle - π/2
// ============================================================================

function wheelToCanvas(wheelAngle: number): number {
  return wheelAngle - Math.PI / 2;
}

function normalize(a: number): number {
  return ((a % TAU) + TAU) % TAU;
}

export function ResortRouletteWheel({ filter, onWin, onSpinStart, spinsRemaining, sessionId }: ResortRouletteWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [muted, setMuted] = useState(false);
  const rotationRef = useRef(0);
  const currentSlicesRef = useRef<WheelSlice[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const particleAnimRef = useRef<number | null>(null);
  const lastTickSliceRef = useRef(-1);

  useEffect(() => {
    const stored = localStorage.getItem("roulette-muted");
    if (stored === "true") setMuted(true);
  }, []);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem("roulette-muted", String(next));
      return next;
    });
  };

  const sound = useCallback((type: "tick" | "whoosh" | "fanfare" | "sparkle") => {
    if (!muted) playSound(type);
  }, [muted]);

  // ==========================================================================
  // DRAW WHEEL
  // ==========================================================================
  const drawWheel = useCallback((rotation: number, wheelSlices: WheelSlice[]) => {
    const canvas = canvasRef.current;
    if (!canvas || wheelSlices.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const outerR = Math.min(w, h) / 2 - 20;
    const innerR = outerR * 0.55;
    const hubR = outerR * 0.16;

    ctx.clearRect(0, 0, w, h);

    const n = wheelSlices.length;
    const sliceAngle = TAU / n;

    // Draw each slice: outer ring (destination) + inner ring (price)
    for (let i = 0; i < n; i++) {
      // Clean wheel-space angles for slice i (0 = top, positive = clockwise)
      const wheelStart = i * sliceAngle - rotation;
      const wheelEnd = wheelStart + sliceAngle;
      const wheelCenter = wheelStart + sliceAngle / 2;

      // Convert to canvas angles for drawing
      const canvasStart = wheelToCanvas(wheelStart);
      const canvasEnd = wheelToCanvas(wheelEnd);
      const canvasCenter = wheelToCanvas(wheelCenter);

      const slice = wheelSlices[i];
      const colors = RARITY_COLORS[slice.rarity];

      // ---- Outer ring slice (destination) ----
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, canvasStart, canvasEnd);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? colors.bg : ALT_SLICE_COLOR;
      ctx.fill();
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (slice.rarity === "legendary" && isSpinning) {
        ctx.save();
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, canvasStart, canvasEnd);
        ctx.closePath();
        ctx.fillStyle = colors.bg;
        ctx.fill();
        ctx.restore();
      }

      // ---- Inner ring slice (price) ----
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, innerR, canvasStart, canvasEnd);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? "#F8FAFC" : "#E5E7EB";
      ctx.fill();
      ctx.strokeStyle = "#9CA3AF";
      ctx.lineWidth = 1;
      ctx.stroke();

      // ---- Destination text (outer ring, radially-aligned, always readable) ----
      // Rotate so text reads from center outward along the slice center.
      // Flip text upside-down on the bottom half so it reads normally.
      ctx.save();
      ctx.translate(cx, cy);

      // For radial text, we rotate so the x-axis points along the slice center radially
      // Canvas default: 0 rad = right, π/2 = down (clockwise positive)
      // So rotating by canvasCenter aligns +x with the slice center direction
      const normalizedCenter = normalize(canvasCenter);
      const isBottomHalf = normalizedCenter > 0 && normalizedCenter < Math.PI;

      if (isBottomHalf) {
        // Bottom half: rotate 180° extra so text reads right-side-up
        ctx.rotate(canvasCenter + Math.PI);
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 12px system-ui, sans-serif";
        const text = slice.city.toUpperCase();
        const maxWidth = outerR - innerR - 16;
        ctx.fillText(text, -(outerR - 8), 0, maxWidth);
      } else {
        // Top half: text reads outward from center
        ctx.rotate(canvasCenter);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 12px system-ui, sans-serif";
        const text = slice.city.toUpperCase();
        const maxWidth = outerR - innerR - 16;
        ctx.fillText(text, outerR - 8, 0, maxWidth);
      }
      ctx.restore();

      // ---- Price text (inner ring) ----
      ctx.save();
      ctx.translate(cx, cy);
      if (isBottomHalf) {
        ctx.rotate(canvasCenter + Math.PI);
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = slice.rarity === "legendary" ? "#B45309" : "#111827";
        ctx.font = slice.rarity === "legendary" ? "bold 16px system-ui, sans-serif" : "bold 14px system-ui, sans-serif";
        ctx.fillText(`$${slice.price}`, -(innerR - 6), 0);
      } else {
        ctx.rotate(canvasCenter);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = slice.rarity === "legendary" ? "#B45309" : "#111827";
        ctx.font = slice.rarity === "legendary" ? "bold 16px system-ui, sans-serif" : "bold 14px system-ui, sans-serif";
        ctx.fillText(`$${slice.price}`, innerR - 6, 0);
      }
      ctx.restore();
    }

    // ---- Hub ----
    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, TAU);
    const hubGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, hubR);
    hubGradient.addColorStop(0, "#FBBF24");
    hubGradient.addColorStop(1, "#D97706");
    ctx.fillStyle = hubGradient;
    ctx.fill();
    ctx.strokeStyle = "#92400E";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("\u2605", 0, 1);
    ctx.restore();

    // ---- Pointer (fixed at top, pointing down into the wheel) ----
    ctx.save();
    ctx.beginPath();
    // Base at y=4 (near top of canvas), tip at y=25 (just inside outer wheel edge)
    ctx.moveTo(cx, 25); // tip (pointing at slice center)
    ctx.lineTo(cx - 16, 4); // base left
    ctx.lineTo(cx + 16, 4); // base right
    ctx.closePath();
    ctx.fillStyle = "#DC2626";
    ctx.strokeStyle = "#7F1D1D";
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, [isSpinning]);

  // ==========================================================================
  // CONFETTI
  // ==========================================================================
  const spawnConfetti = useCallback((rarity: "common" | "rare" | "legendary") => {
    const count = rarity === "legendary" ? 120 : rarity === "rare" ? 80 : 50;
    const colors = rarity === "legendary"
      ? ["#FBBF24", "#F59E0B", "#FCD34D", "#FFFFFF", "#FDE68A"]
      : rarity === "rare"
      ? ["#A78BFA", "#8B5CF6", "#C4B5FD", "#FFFFFF"]
      : ["#60A5FA", "#3B82F6", "#93C5FD", "#FFFFFF"];

    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: cx, y: cy,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.5) * 16 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3,
        rotation: Math.random() * TAU,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        life: 1.0,
      });
    }
  }, []);

  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.vx *= 0.99;
        p.rotation += p.rotSpeed;
        p.life -= 0.008;
        if (p.life <= 0 || p.y > canvas.height + 50) return false;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
        return true;
      });
      particleAnimRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      if (particleAnimRef.current) cancelAnimationFrame(particleAnimRef.current);
    };
  }, []);

  // ==========================================================================
  // SPIN ANIMATION
  // ==========================================================================
  const animateSpin = useCallback((targetRotation: number, wheelSlices: WheelSlice[], winner: WheelSlice) => {
    const startRotation = rotationRef.current;
    const startTime = performance.now();
    const DURATION = 4500;
    const n = wheelSlices.length;
    const sliceAngle = TAU / n;

    lastTickSliceRef.current = -1;

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const rotation = startRotation + (targetRotation - startRotation) * eased;
      rotationRef.current = rotation;
      drawWheel(rotation, wheelSlices);

      // Tick sound: slice i is at the top when rotation = (i + 0.5) * sliceAngle mod TAU
      // So: i = round((rotation mod TAU - sliceAngle/2) / sliceAngle) mod n
      const normRot = normalize(rotation);
      const currentSlice = (Math.round((normRot - sliceAngle / 2) / sliceAngle) % n + n) % n;
      if (currentSlice !== lastTickSliceRef.current) {
        sound("tick");
        lastTickSliceRef.current = currentSlice;
      }

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(frame);
      } else {
        // Animation complete — snap exactly to target to avoid float drift
        rotationRef.current = targetRotation;
        drawWheel(targetRotation, wheelSlices);
        setIsSpinning(false);
        spawnConfetti(winner.rarity);
        sound("fanfare");
        if (winner.rarity === "legendary") {
          setTimeout(() => spawnConfetti("legendary"), 300);
          setTimeout(() => spawnConfetti("legendary"), 600);
        }
        setTimeout(() => onWin(winner), 400);
      }
    };
    animFrameRef.current = requestAnimationFrame(frame);
  }, [drawWheel, sound, spawnConfetti, onWin]);

  // ==========================================================================
  // SPIN HANDLER
  // ==========================================================================
  const handleSpin = useCallback(async () => {
    if (isSpinning || spinsRemaining <= 0) return;
    setIsSpinning(true);
    onSpinStart();
    sound("whoosh");

    try {
      const res = await fetch("/api/roulette/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, filter }),
      });
      if (!res.ok) throw new Error("Spin request failed");
      const result: SpinResult = await res.json();

      currentSlicesRef.current = result.wheelSlices;
      const n = result.wheelSlices.length;
      const sliceAngle = TAU / n;

      // ── TARGET ROTATION CALCULATION ──
      // drawWheel formula: wheelStart = i*sliceAngle - rotation
      //                    canvasCenter = (i + 0.5)*sliceAngle - rotation - π/2
      //
      // Pointer is at canvas angle -π/2 (top of wheel). For slice winnerIndex
      // to be centered under the pointer:
      //   (winnerIndex + 0.5)*sliceAngle - rotation - π/2 = -π/2
      //   rotation = (winnerIndex + 0.5) * sliceAngle
      //
      // We want final rotation mod TAU = this value. Compute delta:
      const desiredFinal = normalize((result.winnerIndex + 0.5) * sliceAngle);
      const currentMod = normalize(rotationRef.current);
      const baseSpins = 5 + Math.random() * 2;
      let delta = baseSpins * TAU + (desiredFinal - currentMod);
      while (delta < 5 * TAU) delta += TAU;
      const targetRotation = rotationRef.current + delta;

      // Debug log for verification
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.log("[roulette]", {
          winnerIndex: result.winnerIndex,
          winner: `${result.winner.city} $${result.winner.price}`,
          currentRotation: rotationRef.current,
          currentMod,
          desiredFinal,
          delta,
          targetRotation,
          expectedFinalMod: normalize(targetRotation),
        });
      }

      drawWheel(rotationRef.current, result.wheelSlices);
      animateSpin(targetRotation, result.wheelSlices, result.winner);
    } catch (e) {
      console.error("Spin failed:", e);
      setIsSpinning(false);
    }
  }, [isSpinning, spinsRemaining, onSpinStart, sessionId, filter, animateSpin, drawWheel, sound]);

  // Initial placeholder render
  useEffect(() => {
    if (currentSlicesRef.current.length === 0) {
      const placeholder: WheelSlice[] = Array.from({ length: 12 }, (_, i) => ({
        dealId: i, price: 99 + i * 20, city: "Loading", state: "", brandName: "",
        brandSlug: "", slug: "", resortName: "", rarity: "common" as const,
      }));
      drawWheel(0, placeholder);
    }
  }, [drawWheel]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={560}
          height={560}
          className="drop-shadow-2xl"
          style={{ maxWidth: "100%", height: "auto" }}
        />
        <canvas
          ref={particleCanvasRef}
          width={560}
          height={560}
          className="pointer-events-none absolute inset-0"
          style={{ maxWidth: "100%", height: "auto" }}
        />
        {isSpinning && (
          <div className="pointer-events-none absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <div
                key={deg}
                className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300 shadow-[0_0_20px_6px_rgba(253,224,71,0.8)]"
                style={{ transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-270px)` }}
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleSpin}
        disabled={isSpinning || spinsRemaining <= 0}
        className={`relative mt-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 px-12 py-5 text-xl font-black uppercase tracking-wider text-white shadow-2xl transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${
          !isSpinning && spinsRemaining > 0 ? "animate-pulse" : ""
        }`}
        style={{ animationDuration: "2s" }}
      >
        {isSpinning ? "SPINNING..." : spinsRemaining <= 0 ? "NO SPINS LEFT" : `SPIN THE WHEEL (${spinsRemaining} left)`}
        {!isSpinning && spinsRemaining > 0 && (
          <span className="pointer-events-none absolute -inset-2 animate-ping rounded-full border-4 border-red-400 opacity-50" />
        )}
      </button>

      <button
        onClick={toggleMute}
        className="mt-4 text-xs text-gray-400 hover:text-gray-600"
        title={muted ? "Unmute sounds" : "Mute sounds"}
      >
        {muted ? "\uD83D\uDD07 Sounds off" : "\uD83D\uDD0A Sounds on"}
      </button>
    </div>
  );
}
