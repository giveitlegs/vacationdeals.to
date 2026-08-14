"use client";

import { useMemo, useState } from "react";
import type { ComputedRoute } from "@/lib/vacation-routes";

// Equirectangular projection over CONUS-ish bounds (Mexico stops fall in the
// lower band, which is fine — the board is an abstract constellation, not a
// survey map).
const VW = 1000;
const VH = 620;
const LON_MIN = -120;
const LON_SPAN = 54; // -120 .. -66
const LAT_MAX = 50;
const LAT_SPAN = 35; // 50 .. 15
const project = (lat: number, lng: number) => ({
  x: ((lng - LON_MIN) / LON_SPAN) * VW,
  y: ((LAT_MAX - lat) / LAT_SPAN) * VH,
});

const money = (n: number) => "$" + Math.round(Math.abs(n)).toLocaleString("en-US");

// Extract a tailwind-ish gradient "from-X to-Y" into two hex stops for SVG.
const TW_HEX: Record<string, string> = {
  "orange-500": "#f97316", "pink-600": "#db2777", "pink-500": "#ec4899",
  "emerald-500": "#10b981", "teal-700": "#0f766e", "teal-500": "#14b8a6",
  "amber-500": "#f59e0b", "red-600": "#dc2626", "sky-500": "#0ea5e9",
  "indigo-600": "#4f46e5", "cyan-500": "#06b6d4", "purple-600": "#9333ea",
};
function gradientStops(gradient: string): [string, string] {
  const from = gradient.match(/from-([a-z]+-\d+)/)?.[1];
  const to = gradient.match(/to-([a-z]+-\d+)/)?.[1];
  return [TW_HEX[from ?? ""] ?? "#10b981", TW_HEX[to ?? ""] ?? "#0f766e"];
}

export function RouteMap({ routes }: { routes: ComputedRoute[] }) {
  const [activeId, setActiveId] = useState(routes[0]?.id ?? "");
  const active = routes.find((r) => r.id === activeId) ?? routes[0];

  // Pre-project every stop of every route once.
  const projected = useMemo(() => {
    const m = new Map<string, { x: number; y: number }[]>();
    for (const r of routes) {
      m.set(r.id, r.stops.map((s) => project(s.lat, s.lng)));
    }
    return m;
  }, [routes]);

  if (!active) return null;

  const [gStart, gEnd] = gradientStops(active.gradient);
  const activePts = projected.get(active.id) ?? [];
  const polyline = activePts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="rm-wrap">
      <style>{rmStyles}</style>

      {/* Route selector */}
      <div className="mb-4 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Choose a route">
        {routes.map((r) => {
          const on = r.id === active.id;
          return (
            <button
              key={r.id}
              role="tab"
              aria-selected={on}
              aria-label={`${r.name} — pay ${money(r.totalCost)}, get ${money(r.totalCashBack)} back`}
              onClick={() => setActiveId(r.id)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors " +
                (on
                  ? "border-transparent bg-gradient-to-r " + r.gradient + " text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700")
              }
            >
              <span aria-hidden>{r.emoji}</span>
              <span className="hidden sm:inline">{r.name}</span>
              <span className="sm:hidden">{r.name.split(" ").slice(0, 2).join(" ")}</span>
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-emerald-900/10 bg-[#04231b]">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Map of the ${active.name} route: ${active.stops.map((s) => s.city).join(", ")}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="rm-bg" cx="50%" cy="35%" r="80%">
              <stop offset="0%" stopColor="#0b3b2e" />
              <stop offset="100%" stopColor="#04231b" />
            </radialGradient>
            <linearGradient id="rm-route" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gStart} />
              <stop offset="100%" stopColor={gEnd} />
            </linearGradient>
            <pattern id="rm-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M50 0 H0 V50" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            <filter id="rm-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* background + faint grid */}
          <rect width={VW} height={VH} fill="url(#rm-bg)" />
          <rect width={VW} height={VH} fill="url(#rm-grid)" />

          {/* faint constellation of ALL other routes' stops */}
          {routes
            .filter((r) => r.id !== active.id)
            .flatMap((r) =>
              (projected.get(r.id) ?? []).map((p, i) => (
                <circle
                  key={`${r.id}-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill="rgba(255,255,255,0.18)"
                />
              )),
            )}

          {/* animated dashed route line */}
          {activePts.length >= 2 && (
            <polyline
              points={polyline}
              fill="none"
              stroke="url(#rm-route)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="14 12"
              className="rm-route-line"
            />
          )}

          {/* active stop nodes */}
          {active.stops.map((s, i) => {
            const p = activePts[i];
            const pays = s.netCash <= 0;
            return (
              <g key={s.slug} className="rm-node" style={{ ["--i" as string]: i }}>
                {/* pulse halo */}
                <circle cx={p.x} cy={p.y} r={16} fill={gEnd} opacity={0.28} className="rm-halo" />
                <circle cx={p.x} cy={p.y} r={9} fill="url(#rm-route)" stroke="#ffffff" strokeWidth={2.5} filter="url(#rm-glow)" />
                {/* floating $ for stops that pay you */}
                {pays && (
                  <text x={p.x} y={p.y - 20} textAnchor="middle" className="rm-dollar" fill="#fcd34d" fontWeight="900" fontSize="20">
                    $
                  </text>
                )}
                {/* city label */}
                <text
                  x={p.x}
                  y={p.y + 30}
                  textAnchor="middle"
                  fill="#ecfdf5"
                  fontSize="17"
                  fontWeight="700"
                  className="rm-label"
                >
                  {s.city}
                </text>
                <text x={p.x} y={p.y + 48} textAnchor="middle" fill={pays ? "#6ee7b7" : "#a7f3d0"} fontSize="13" fontWeight="600">
                  {money(s.price)}
                  {s.cashBack > 0 ? ` · ${money(s.cashBack)} back` : ""}
                </text>
              </g>
            );
          })}
        </svg>

        {/* floating running-tally card */}
        <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-white/15 bg-black/45 px-4 py-3 text-white backdrop-blur-sm sm:left-4 sm:top-4">
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <span aria-hidden>{active.emoji}</span>
            <span className="max-w-[46vw] truncate sm:max-w-none">{active.name}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-emerald-50/90">
            <span>pay <strong className="text-white">{money(active.totalCost)}</strong></span>
            <span className="text-emerald-300">·</span>
            <span>get <strong className="text-emerald-300">{money(active.totalCashBack)}</strong> back</span>
          </div>
          <div className="mt-1 text-lg font-black">
            NET{" "}
            <span className={active.paysYou ? "text-emerald-400" : "text-amber-300"}>
              {active.paysYou ? `+${money(active.netCash)}` : `-${money(active.netCash)}`}
            </span>
            {active.paysYou && <span className="ml-1.5 align-middle text-xs font-bold text-emerald-400">it pays you!</span>}
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-gray-400">
        Nodes are placed by each city&apos;s coordinates. Gold <span className="font-bold text-amber-500">$</span> marks a stop whose gift card beats its price.
      </p>
    </div>
  );
}

const rmStyles = `
.rm-route-line {
  stroke-dashoffset: 260;
  animation: rm-dash 5s linear infinite;
}
@keyframes rm-dash { to { stroke-dashoffset: 0; } }

.rm-halo {
  transform-box: fill-box;
  transform-origin: center;
  animation: rm-pulse 2.6s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * 0.35s);
}
@keyframes rm-pulse {
  0%, 100% { transform: scale(1);   opacity: 0.28; }
  50%      { transform: scale(1.9); opacity: 0.05; }
}

.rm-dollar {
  transform-box: fill-box;
  transform-origin: center;
  animation: rm-float 2.8s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * 0.4s);
}
@keyframes rm-float {
  0%   { transform: translateY(4px);  opacity: 0.15; }
  50%  { transform: translateY(-8px); opacity: 1; }
  100% { transform: translateY(4px);  opacity: 0.15; }
}

@media (prefers-reduced-motion: reduce) {
  .rm-route-line { animation: none; stroke-dashoffset: 0; }
  .rm-halo { animation: none; opacity: 0.2; }
  .rm-dollar { animation: none; opacity: 1; }
}
`;
