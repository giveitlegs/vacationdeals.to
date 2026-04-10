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

const RARITY_COLORS = {
  common: { bg: "#3B82F6", border: "#2563EB", glow: "#60A5FA" },
  rare: { bg: "#8B5CF6", border: "#7C3AED", glow: "#A78BFA" },
  legendary: { bg: "#F59E0B", border: "#D97706", glow: "#FBBF24" },
};

const ALT_SLICE_COLOR = "#1E293B";

// ── Sound effects via Web Audio API (no external files) ──
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
      // Play a quick arpeggio
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

// ── Confetti particle system ──
interface Particle {
  x: number; y: number; vx: number; vy: number; color: string;
  size: number; rotation: number; rotSpeed: number; life: number;
}

export function ResortRouletteWheel({ filter, onWin, onSpinStart, spinsRemaining, sessionId }: ResortRouletteWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [slices, setSlices] = useState<WheelSlice[]>([]);
  const [muted, setMuted] = useState(false);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const particleAnimRef = useRef<number | null>(null);
  const lastTickSliceRef = useRef(-1);

  // Load persisted mute setting
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

  // Draw the wheel at current rotation
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
    const innerR = outerR * 0.5;
    const hubR = outerR * 0.15;

    ctx.clearRect(0, 0, w, h);

    const n = wheelSlices.length;
    const sliceAngle = (Math.PI * 2) / n;

    // Draw outer ring slices (destinations)
    for (let i = 0; i < n; i++) {
      const start = rotation + i * sliceAngle - Math.PI / 2;
      const end = start + sliceAngle;
      const slice = wheelSlices[i];
      const colors = RARITY_COLORS[slice.rarity];

      // Slice fill (alternate darker shade for variety)
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, start, end);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? colors.bg : ALT_SLICE_COLOR;
      ctx.fill();
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Legendary glow
      if (slice.rarity === "legendary" && isSpinning) {
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 20;
      }

      // Destination text (outer ring)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillText(slice.city.toUpperCase().slice(0, 14), outerR - 12, 4);
      ctx.restore();

      ctx.shadowBlur = 0;
    }

    // Draw inner ring slices (prices) — rotated by half a slice for visual offset
    for (let i = 0; i < n; i++) {
      const start = rotation + i * sliceAngle - Math.PI / 2;
      const end = start + sliceAngle;
      const slice = wheelSlices[i];

      // Inner fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, innerR, start, end);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? "#F3F4F6" : "#E5E7EB";
      ctx.fill();
      ctx.strokeStyle = "#9CA3AF";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Price text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = slice.rarity === "legendary" ? "#B45309" : "#111827";
      ctx.font = slice.rarity === "legendary" ? "bold 16px system-ui, sans-serif" : "bold 14px system-ui, sans-serif";
      ctx.fillText(`$${slice.price}`, innerR - 10, 5);
      ctx.restore();
    }

    // Draw hub (center)
    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
    const hubGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, hubR);
    hubGradient.addColorStop(0, "#FBBF24");
    hubGradient.addColorStop(1, "#D97706");
    ctx.fillStyle = hubGradient;
    ctx.fill();
    ctx.strokeStyle = "#92400E";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Hub star
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", 0, 1);
    ctx.restore();

    // Draw pointer (top, fixed)
    ctx.save();
    ctx.translate(cx, 20);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-14, -20);
    ctx.lineTo(14, -20);
    ctx.closePath();
    ctx.fillStyle = "#DC2626";
    ctx.fill();
    ctx.strokeStyle = "#7F1D1D";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }, [isSpinning]);

  // Spawn confetti
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
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        life: 1.0,
      });
    }
  }, []);

  // Particle animation loop
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
        p.vy += 0.35; // gravity
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

  // Spin animation (easing-out cubic for natural slow-down)
  const animateSpin = useCallback((targetRotation: number, wheelSlices: WheelSlice[], winner: WheelSlice) => {
    const startRotation = rotationRef.current;
    const startTime = performance.now();
    const DURATION = 4500; // 4.5 seconds
    const n = wheelSlices.length;
    const sliceAngle = (Math.PI * 2) / n;

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const rotation = startRotation + (targetRotation - startRotation) * eased;
      rotationRef.current = rotation;
      drawWheel(rotation, wheelSlices);

      // Tick sound when pointer crosses a slice boundary
      const pointerAngle = ((-rotation - Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const currentSlice = Math.floor(pointerAngle / sliceAngle);
      if (currentSlice !== lastTickSliceRef.current) {
        sound("tick");
        lastTickSliceRef.current = currentSlice;
      }

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(frame);
      } else {
        setIsSpinning(false);
        spawnConfetti(winner.rarity);
        sound("fanfare");
        if (winner.rarity === "legendary") {
          // Extra confetti burst for legendary
          setTimeout(() => spawnConfetti("legendary"), 300);
          setTimeout(() => spawnConfetti("legendary"), 600);
        }
        setTimeout(() => onWin(winner), 400);
      }
    };
    animFrameRef.current = requestAnimationFrame(frame);
  }, [drawWheel, sound, spawnConfetti, onWin]);

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

      setSlices(result.wheelSlices);

      // Calculate target rotation to land on winner
      const n = result.wheelSlices.length;
      const sliceAngle = (Math.PI * 2) / n;
      // Winner should be at top (pointer position)
      // Start rotation + target = multiple full spins + offset to winner
      const spins = 5 + Math.random() * 2; // 5-7 full rotations
      const targetAngle = rotationRef.current + Math.PI * 2 * spins - (result.winnerIndex * sliceAngle + sliceAngle / 2);

      // Draw the initial wheel with new slices, then start animation
      drawWheel(rotationRef.current, result.wheelSlices);
      animateSpin(targetAngle, result.wheelSlices, result.winner);
    } catch (e) {
      console.error("Spin failed:", e);
      setIsSpinning(false);
    }
  }, [isSpinning, spinsRemaining, onSpinStart, sessionId, filter, animateSpin, drawWheel, sound]);

  // Initial wheel render with placeholder
  useEffect(() => {
    if (slices.length === 0) {
      // Draw a placeholder wheel
      const placeholder: WheelSlice[] = Array.from({ length: 12 }, (_, i) => ({
        dealId: i, price: 99 + i * 20, city: "Loading", state: "", brandName: "...", brandSlug: "",
        slug: "", resortName: "", rarity: "common" as const,
      }));
      drawWheel(0, placeholder);
    }
  }, [slices.length, drawWheel]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Wheel container */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="drop-shadow-2xl"
          style={{ maxWidth: "100%", height: "auto" }}
        />
        {/* Particle layer on top */}
        <canvas
          ref={particleCanvasRef}
          width={500}
          height={500}
          className="pointer-events-none absolute inset-0"
          style={{ maxWidth: "100%", height: "auto" }}
        />
        {/* Sparkler ring (CSS) */}
        {isSpinning && (
          <div className="pointer-events-none absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <div
                key={deg}
                className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300 shadow-[0_0_20px_6px_rgba(253,224,71,0.8)]"
                style={{ transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-240px)` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Spin button */}
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

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        className="mt-4 text-xs text-gray-400 hover:text-gray-600"
        title={muted ? "Unmute sounds" : "Mute sounds"}
      >
        {muted ? "🔇 Sounds off" : "🔊 Sounds on"}
      </button>
    </div>
  );
}
