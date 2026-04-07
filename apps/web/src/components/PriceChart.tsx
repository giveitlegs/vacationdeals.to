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
  destinationName: string;
  durationNights: number;
  dealSlug: string;
  sourceUrl: string;
  lastScrapedAt: string;
  priceChange?: number;
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
    dealSlug: string;
    sourceUrl: string;
    lastScrapedAt: string;
    priceChange?: number;
    destinationName: string;
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
      // Clear any pending hide timeout when mouse moves back to chart
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      tooltipHovered.current = false;
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
          dealSlug: closest.point.dealSlug,
          sourceUrl: closest.point.sourceUrl,
          lastScrapedAt: closest.point.lastScrapedAt,
          priceChange: closest.point.priceChange,
          destinationName: closest.point.destinationName,
        });
      } else {
        setTooltip(null);
      }
    },
    [brandLines, brands, xScale, yScale],
  );

  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipHovered = useRef(false);

  const handleMouseLeave = useCallback(() => {
    // Delay hiding to give user time to move cursor to the tooltip
    hideTimeout.current = setTimeout(() => {
      if (!tooltipHovered.current) {
        setTooltip(null);
      }
    }, 300);
  }, []);

  const handleTooltipEnter = useCallback(() => {
    tooltipHovered.current = true;
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
  }, []);

  const handleTooltipLeave = useCallback(() => {
    tooltipHovered.current = false;
    setTooltip(null);
  }, []);

  const handleClick = useCallback(() => {
    // Click on a data point in the chart navigates to the deal
    if (tooltip?.dealSlug) {
      window.open(`/deals/${tooltip.dealSlug}`, "_self");
    }
  }, [tooltip]);

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
          style={{ minWidth: 600, cursor: tooltip ? "pointer" : "default" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
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
                {/* Data points + price change badges */}
                {coords.map((c, i) => {
                  const point = sorted[i];
                  const hasChange = point?.priceChange != null && Math.abs(point.priceChange) >= 10;
                  return (
                    <g key={i}>
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={3}
                        fill={brand.color}
                        stroke="white"
                        strokeWidth={1.5}
                      />
                      {hasChange && (
                        <g>
                          {/* Badge background */}
                          <rect
                            x={c.x - 14}
                            y={c.y - 22}
                            width={28}
                            height={16}
                            rx={4}
                            fill={point.priceChange! > 0 ? "#EF4444" : "#10B981"}
                            opacity={0.9}
                          />
                          {/* Arrow + percentage */}
                          <text
                            x={c.x}
                            y={c.y - 11}
                            textAnchor="middle"
                            fill="white"
                            fontSize={9}
                            fontWeight="bold"
                          >
                            {point.priceChange! > 0 ? "\u2191" : "\u2193"}{Math.abs(point.priceChange!)}%
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* SVG crosshair + highlight dot (tooltip box is HTML overlay below) */}
          {tooltip && (
            <g>
              <line
                x1={tooltip.x}
                y1={PADDING.top}
                x2={tooltip.x}
                y2={CHART_HEIGHT - PADDING.bottom}
                stroke="#9CA3AF"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <circle
                cx={tooltip.x}
                cy={tooltip.y}
                r={10}
                fill={tooltip.color}
                opacity={0.2}
              />
              <circle
                cx={tooltip.x}
                cy={tooltip.y}
                r={6}
                fill={tooltip.color}
                stroke="white"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {/* HTML tooltip overlay — hoverable and clickable */}
        {tooltip && svgRef.current && (() => {
          const rect = svgRef.current.getBoundingClientRect();
          const scaleX = rect.width / CHART_WIDTH;
          const scaleY = rect.height / CHART_HEIGHT;
          const pixelX = tooltip.x * scaleX;
          const pixelY = tooltip.y * scaleY;
          const flipX = pixelX > rect.width / 2;

          return (
            <div
              onMouseEnter={handleTooltipEnter}
              onMouseLeave={handleTooltipLeave}
              className="absolute z-10 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg transition-opacity"
              style={{
                left: flipX ? pixelX - 240 : pixelX + 16,
                top: Math.max(8, pixelY - 50),
                minWidth: 220,
                pointerEvents: "auto",
              }}
            >
              <p className="text-sm font-semibold text-gray-900">
                {tooltip.brand}
                {tooltip.priceChange != null && Math.abs(tooltip.priceChange) >= 10 && (
                  <span className={`ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold ${
                    tooltip.priceChange > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {tooltip.priceChange > 0 ? "\u2191" : "\u2193"}{Math.abs(tooltip.priceChange)}%
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-800">${tooltip.price}</span>
                {tooltip.destinationName && tooltip.destinationName !== "Unknown" && (
                  <> &middot; {tooltip.destinationName}</>
                )}
                {" "}&middot; {formatDateFull(tooltip.date)}
              </p>
              {/* Last verified timestamp */}
              {tooltip.lastScrapedAt && (() => {
                const scraped = new Date(tooltip.lastScrapedAt);
                const hoursAgo = Math.max(0, Math.round((Date.now() - scraped.getTime()) / 3600000));
                const verifiedLabel = hoursAgo < 1
                  ? "just now"
                  : hoursAgo < 24
                    ? `${hoursAgo}h ago`
                    : `${Math.round(hoursAgo / 24)}d ago`;
                return (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${hoursAgo < 7 ? "bg-emerald-500" : hoursAgo < 24 ? "bg-amber-500" : "bg-red-500"}`} />
                    Verified {verifiedLabel}
                  </p>
                );
              })()}
              {/* Action links */}
              <div className="mt-2 flex flex-col gap-1">
                {tooltip.dealSlug && (
                  <a
                    href={`/deals/${tooltip.dealSlug}`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    View this deal &rarr;
                  </a>
                )}
                {tooltip.sourceUrl && (
                  <a
                    href={tooltip.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-gray-500 hover:text-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Verify price on {tooltip.brand} site &nearr;
                  </a>
                )}
              </div>
            </div>
          );
        })()}
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
