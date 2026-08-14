"use client";

import { useMemo, useState } from "react";
import type { ComputedRoute } from "@/lib/vacation-routes";

// Equirectangular projection over a CONUS + Mexico window. The basemap paths
// below are pre-projected to these exact bounds, so city nodes land on real
// geography.
const VW = 1000;
const VH = 620;
const LON_MIN = -125;
const LON_SPAN = 60; // -125 .. -65
const LAT_MAX = 50;
const LAT_SPAN = 36; // 50 .. 14
const project = (lat: number, lng: number) => ({
  x: ((lng - LON_MIN) / LON_SPAN) * VW,
  y: ((LAT_MAX - lat) / LAT_SPAN) * VH,
});

// Continental US + Mexico outlines, generated from low-res country GeoJSON and
// projected to the bounds above. Drawn as the map's basemap.
const USA_PATH =
  "M503.0 10.5 L506.0 20.0 L511.2 22.9 L522.8 24.0 L539.8 26.7 L556.0 32.0 L569.5 29.8 L590.0 34.3 L595.5 34.1 L610.4 29.2 L626.0 35.5 L642.3 42.1 L655.8 47.9 L668.7 53.4 L670.3 57.9 L674.3 59.6 L673.3 61.3 L677.7 61.8 L681.0 60.1 L681.8 64.1 L685.2 66.9 L689.7 66.9 L692.2 69.0 L690.1 72.0 L707.5 80.1 L711.0 95.8 L714.4 110.7 L709.5 120.9 L701.7 130.4 L698.0 136.4 L697.6 138.2 L699.5 140.7 L705.2 143.4 L709.3 143.4 L728.7 134.2 L745.9 131.5 L767.7 122.9 L768.0 121.2 L766.5 115.9 L763.8 112.5 L771.3 109.8 L787.7 109.7 L803.0 109.7 L808.3 103.0 L810.4 101.7 L828.0 89.3 L835.5 86.1 L860.9 86.0 L891.6 86.0 L893.3 81.7 L898.6 80.9 L905.7 78.2 L911.6 70.4 L916.7 57.0 L929.4 44.0 L934.9 48.5 L946.1 45.6 L953.5 50.5 L953.5 74.0 L964.4 83.7 L967.3 89.4 L949.5 97.7 L932.3 103.7 L914.7 108.8 L905.9 119.0 L903.1 122.9 L902.9 132.0 L908.4 141.1 L915.3 141.6 L913.6 135.3 L918.6 139.1 L917.2 144.0 L906.0 146.8 L898.0 146.5 L885.7 149.5 L878.4 150.3 L868.7 151.2 L854.8 156.2 L879.3 152.9 L884.3 156.2 L860.9 161.4 L850.3 161.4 L850.8 159.3 L845.7 164.1 L850.6 164.9 L847.0 177.2 L834.9 190.5 L833.7 186.1 L830.0 185.2 L824.5 180.9 L828.0 190.1 L832.1 193.2 L832.4 199.7 L827.0 206.4 L817.7 220.2 L816.1 219.5 L821.3 207.8 L812.8 201.2 L810.8 186.9 L807.6 194.3 L811.2 205.2 L800.2 202.5 L811.6 208.1 L812.4 224.5 L817.1 225.7 L818.9 231.6 L821.2 248.8 L810.6 261.6 L793.4 266.7 L782.4 276.8 L774.1 277.9 L765.7 284.3 L763.3 290.0 L745.0 301.2 L735.6 309.4 L727.7 319.6 L725.2 331.9 L728.1 343.8 L733.7 358.6 L741.1 370.8 L741.2 378.2 L749.1 398.2 L748.5 409.8 L747.8 416.5 L743.6 427.0 L738.7 429.2 L730.5 427.1 L727.8 419.5 L721.5 415.6 L712.7 400.8 L704.9 387.6 L702.4 380.8 L705.8 369.4 L701.2 359.9 L688.2 345.5 L681.7 342.9 L664.9 350.7 L661.9 349.9 L653.8 341.8 L643.3 337.6 L624.5 339.7 L609.7 337.8 L597.0 339.0 L590.1 341.7 L593.1 346.3 L592.8 353.3 L596.4 356.7 L593.2 358.9 L587.0 356.4 L580.8 359.6 L568.7 359.1 L556.2 350.0 L541.7 352.2 L529.6 348.2 L519.2 349.4 L505.2 353.4 L490.0 366.2 L473.4 373.6 L464.3 381.8 L460.5 389.6 L460.3 401.4 L461.2 409.7 L464.3 415.6 L457.8 416.1 L446.0 412.3 L433.0 407.0 L428.3 398.9 L424.7 386.8 L414.8 377.0 L409.1 366.9 L400.7 355.1 L389.0 348.2 L375.3 348.6 L364.8 362.2 L351.0 357.0 L342.4 351.8 L338.2 342.3 L332.7 333.4 L322.8 325.8 L314.3 320.3 L308.2 314.2 L279.3 314.2 L279.3 321.3 L266.1 321.3 L232.9 321.5 L194.9 309.3 L169.8 301.0 L171.3 297.6 L150.1 299.5 L131.2 300.8 L128.4 292.0 L117.6 282.1 L109.8 280.0 L108.0 275.1 L98.6 274.2 L92.7 269.6 L77.2 267.9 L73.0 265.1 L70.9 255.6 L54.8 238.3 L40.9 214.4 L41.5 210.4 L34.1 204.7 L21.2 190.3 L18.9 176.2 L10.0 166.8 L13.7 152.6 L13.1 137.8 L7.8 124.6 L14.3 108.4 L16.3 92.7 L18.4 77.1 L15.3 54.0 L10.1 39.3 L5.2 31.3 L7.2 27.9 L31.3 33.8 L40.2 50.0 L44.3 45.5 L41.7 31.3 L36.0 17.2 L83.3 17.2 L132.8 17.2 L149.2 17.2 L200.0 17.2 L249.2 17.2 L299.2 17.2 L349.2 17.2 L405.8 17.2 L462.9 17.2 L497.3 17.2 L497.4 10.6 L503.0 10.5 Z";
const MEX_PATH =
  "M464.3 415.6 L457.9 430.7 L455.0 443.1 L453.7 466.2 L452.1 474.6 L455.0 484.0 L460.2 492.4 L463.5 505.7 L474.6 518.5 L478.5 528.4 L485.0 536.9 L502.7 541.4 L509.6 548.6 L524.2 543.8 L536.9 542.1 L549.4 539.0 L559.9 536.0 L570.5 529.0 L574.4 519.0 L575.8 504.5 L578.7 499.4 L590.0 494.9 L607.6 490.9 L622.4 491.5 L632.5 490.1 L636.5 493.7 L635.9 502.0 L626.9 512.3 L623.0 522.8 L626.1 525.8 L623.6 533.2 L619.4 546.6 L615.2 542.2 L611.7 542.5 L608.5 542.7 L602.5 553.1 L599.5 551.1 L597.5 551.9 L597.6 554.4 L582.2 554.2 L566.6 554.3 L566.6 563.9 L559.1 564.0 L565.3 569.7 L571.5 573.7 L573.3 577.4 L576.0 578.5 L575.6 584.4 L554.2 584.4 L546.2 598.4 L548.5 601.7 L546.6 605.7 L546.2 610.7 L527.3 592.2 L518.7 586.6 L505.1 582.1 L495.8 583.3 L482.4 589.8 L474.0 591.5 L462.3 587.0 L449.8 583.7 L434.2 575.8 L421.7 573.4 L402.8 565.4 L388.9 557.2 L384.7 552.6 L375.4 551.5 L358.3 546.1 L351.4 538.2 L333.5 528.4 L325.1 517.6 L321.1 509.2 L326.7 507.5 L325.0 502.6 L328.8 498.1 L328.9 492.2 L323.3 484.4 L321.8 477.6 L316.2 468.9 L301.5 451.8 L284.7 438.3 L276.6 427.6 L262.3 420.6 L259.3 416.3 L261.8 405.7 L253.3 401.7 L243.5 393.3 L239.3 381.3 L230.4 379.9 L220.7 370.8 L212.9 362.5 L212.1 357.1 L203.2 344.1 L197.3 330.9 L197.5 324.3 L185.5 317.4 L179.9 318.2 L170.4 313.5 L167.7 320.4 L170.5 328.7 L172.1 341.6 L177.8 348.7 L190.2 360.6 L192.9 364.7 L195.5 365.9 L197.7 371.8 L200.6 371.6 L204.0 382.7 L209.0 387.1 L212.6 393.2 L223.1 401.9 L228.6 417.9 L233.5 425.5 L238.2 433.6 L239.1 442.6 L247.1 443.2 L253.8 451.0 L259.8 458.7 L259.4 461.8 L252.4 468.1 L249.5 468.0 L245.1 457.6 L234.2 447.8 L222.2 439.4 L213.6 435.1 L214.2 422.5 L211.7 413.1 L203.7 407.8 L192.3 400.1 L190.1 402.3 L185.9 397.8 L175.6 393.7 L165.7 383.7 L167.0 382.4 L173.8 383.3 L180.0 376.9 L180.6 369.1 L167.8 356.9 L158.0 352.1 L151.9 341.3 L145.7 330.0 L138.0 316.3 L131.2 300.8 L150.1 299.5 L171.3 297.6 L169.8 301.0 L194.9 309.3 L232.9 321.5 L266.1 321.3 L279.3 321.3 L279.3 314.2 L308.2 314.2 L314.3 320.3 L322.8 325.8 L332.7 333.4 L338.2 342.3 L342.4 351.8 L351.0 357.0 L364.8 362.2 L375.3 348.6 L389.0 348.2 L400.7 355.1 L409.1 366.9 L414.8 377.0 L424.7 386.8 L428.3 398.9 L433.0 407.0 L446.0 412.3 L457.8 416.1 L464.3 415.6 Z";

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

          {/* US + Mexico basemap */}
          <path d={USA_PATH} fill="rgba(16,185,129,0.12)" stroke="rgba(110,231,183,0.40)" strokeWidth={1.3} strokeLinejoin="round" />
          <path d={MEX_PATH} fill="rgba(16,185,129,0.09)" stroke="rgba(110,231,183,0.30)" strokeWidth={1.3} strokeLinejoin="round" />

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
