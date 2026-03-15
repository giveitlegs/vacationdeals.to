"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PricePoint {
  date: string;
  price: number;
  brandName: string;
  brandSlug: string;
  destinationSlug: string;
  durationNights: number;
}

export interface BrandInfo {
  name: string;
  slug: string;
  color: string;
}

interface PriceChartProps {
  data: PricePoint[];
  brands: BrandInfo[];
}

// ---------------------------------------------------------------------------
// Chart dimensions & constants
// ---------------------------------------------------------------------------

const CHART_HEIGHT = 400;
const CHART_WIDTH = 900;
const PADDING = { top: 20, right: 20, bottom: 50, left: 60 };
const INNER_W = CHART_WIDTH - PADDING.left - PADDING.right;
const INNER_H = CHART_HEIGHT - PADDING.top - PADDING.bottom;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateFull(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Build a smooth SVG bezier path through points */
function buildSmoothPath(
  points: { x: number; y: number }[],
): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;

  let d = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to Bezier conversion
    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return d;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PriceChart({ data, brands }: PriceChartProps) {
  const [enabledBrands, setEnabledBrands] = useState<Set<string>>(
    () => new Set(brands.map((b) => b.slug)),
  );

  // Reset enabled brands when the brands list changes (e.g. after filtering)
  useEffect(() => {
    setEnabledBrands(new Set(brands.map((b) => b.slug)));
  }, [brands]);

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    brand: string;
    price: number;
    date: string;
    color: string;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const toggleBrand = useCallback((slug: string) => {
    setEnabledBrands((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  // Filter data to enabled brands
  const filteredData = useMemo(
    () => data.filter((p) => enabledBrands.has(p.brandSlug)),
    [data, enabledBrands],
  );

  // Unique sorted dates
  const dates = useMemo(() => {
    const s = new Set(data.map((p) => p.date));
    return Array.from(s).sort();
  }, [data]);

  // Price range
  const { minPrice, maxPrice } = useMemo(() => {
    if (filteredData.length === 0) return { minPrice: 0, maxPrice: 300 };
    const prices = filteredData.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    // Round to nearest $50
    return {
      minPrice: Math.floor(min / 50) * 50,
      maxPrice: Math.ceil(max / 50) * 50 + 50,
    };
  }, [filteredData]);

  const priceRange = maxPrice - minPrice || 1;

  // X/Y scale
  const xScale = useCallback(
    (date: string) => {
      const idx = dates.indexOf(date);
      return PADDING.left + (idx / Math.max(1, dates.length - 1)) * INNER_W;
    },
    [dates],
  );

  const yScale = useCallback(
    (price: number) => {
      return (
        PADDING.top +
        INNER_H -
        ((price - minPrice) / priceRange) * INNER_H
      );
    },
    [minPrice, priceRange],
  );

  // Group data by brand
  const brandLines = useMemo(() => {
    const map = new Map<string, PricePoint[]>();
    for (const p of filteredData) {
      const arr = map.get(p.brandSlug) ?? [];
      arr.push(p);
      map.set(p.brandSlug, arr);
    }
    return map;
  }, [filteredData]);

  // Y-axis grid lines at $50 increments
  const gridPrices = useMemo(() => {
    const lines: number[] = [];
    for (let p = minPrice; p <= maxPrice; p += 50) {
      lines.push(p);
    }
    return lines;
  }, [minPrice, maxPrice]);

  // X-axis labels — show every Nth date to avoid overlap
  const xLabels = useMemo(() => {
    const step = Math.max(1, Math.floor(dates.length / 7));
    return dates.filter((_, i) => i % step === 0 || i === dates.length - 1);
  }, [dates]);

  // Handle hover on SVG
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = CHART_WIDTH / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * (CHART_HEIGHT / rect.height);

      // Find closest data point
      let closest: {
        dist: number;
        point: PricePoint;
        x: number;
        y: number;
        color: string;
      } | null = null;

      for (const [slug, points] of brandLines) {
        const brand = brands.find((b) => b.slug === slug);
        if (!brand) continue;
        for (const p of points) {
          const px = xScale(p.date);
          const py = yScale(p.price);
          const dist = Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2);
          if (dist < 30 && (!closest || dist < closest.dist)) {
            closest = { dist, point: p, x: px, y: py, color: brand.color };
          }
        }
      }

      if (closest) {
        setTooltip({
          x: closest.x,
          y: closest.y,
          brand: closest.point.brandName,
          price: closest.point.price,
          date: closest.point.date,
          color: closest.color,
        });
      } else {
        setTooltip(null);
      }
    },
    [brandLines, brands, xScale, yScale],
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  return (
    <div>
      {/* Legend / brand toggles */}
      <div className="mb-4 flex flex-wrap gap-3">
        {brands.map((brand) => {
          const active = enabledBrands.has(brand.slug);
          return (
            <label
              key={brand.slug}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-gray-300 bg-white text-gray-900"
                  : "border-gray-200 bg-gray-50 text-gray-400"
              }`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggleBrand(brand.slug)}
                className="sr-only"
              />
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{
                  backgroundColor: active ? brand.color : "#D1D5DB",
                }}
              />
              {brand.name}
            </label>
          );
        })}
      </div>

      {/* SVG Chart */}
      <div className="relative overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full"
          style={{ minWidth: 600 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid lines */}
          {gridPrices.map((p) => (
            <g key={p}>
              <line
                x1={PADDING.left}
                y1={yScale(p)}
                x2={CHART_WIDTH - PADDING.right}
                y2={yScale(p)}
                stroke="#E5E7EB"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 10}
                y={yScale(p) + 4}
                textAnchor="end"
                fill="#6B7280"
                fontSize={12}
              >
                ${p}
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {xLabels.map((date) => (
            <text
              key={date}
              x={xScale(date)}
              y={CHART_HEIGHT - 10}
              textAnchor="middle"
              fill="#6B7280"
              fontSize={11}
            >
              {formatDate(date)}
            </text>
          ))}

          {/* Brand lines */}
          {Array.from(brandLines.entries()).map(([slug, points]) => {
            const brand = brands.find((b) => b.slug === slug);
            if (!brand) return null;

            const sorted = [...points].sort(
              (a, b) => a.date.localeCompare(b.date),
            );
            const coords = sorted.map((p) => ({
              x: xScale(p.date),
              y: yScale(p.price),
            }));
            const pathD = buildSmoothPath(coords);

            return (
              <g key={slug}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={brand.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Data points */}
                {coords.map((c, i) => (
                  <circle
                    key={i}
                    cx={c.x}
                    cy={c.y}
                    r={3}
                    fill={brand.color}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                ))}
              </g>
            );
          })}

          {/* Tooltip */}
          {tooltip && (
            <g>
              {/* Vertical line */}
              <line
                x1={tooltip.x}
                y1={PADDING.top}
                x2={tooltip.x}
                y2={CHART_HEIGHT - PADDING.bottom}
                stroke="#9CA3AF"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              {/* Highlight circle */}
              <circle
                cx={tooltip.x}
                cy={tooltip.y}
                r={6}
                fill={tooltip.color}
                stroke="white"
                strokeWidth={2}
              />
              {/* Tooltip box */}
              <rect
                x={tooltip.x + (tooltip.x > CHART_WIDTH / 2 ? -170 : 12)}
                y={tooltip.y - 40}
                width={158}
                height={56}
                rx={8}
                fill="white"
                stroke="#E5E7EB"
                strokeWidth={1}
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
              />
              <text
                x={tooltip.x + (tooltip.x > CHART_WIDTH / 2 ? -90 : 91)}
                y={tooltip.y - 20}
                textAnchor="middle"
                fill="#111827"
                fontSize={13}
                fontWeight="600"
              >
                {tooltip.brand}
              </text>
              <text
                x={tooltip.x + (tooltip.x > CHART_WIDTH / 2 ? -90 : 91)}
                y={tooltip.y}
                textAnchor="middle"
                fill="#6B7280"
                fontSize={12}
              >
                ${tooltip.price} &middot; {formatDateFull(tooltip.date)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Empty state */}
      {filteredData.length === 0 && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-500">
            No price data to display. Select at least one brand above.
          </p>
        </div>
      )}
    </div>
  );
}
