"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface SubnavItem {
  label: string;
  href: string;
  isActive?: boolean;
  /** optional emoji / short glyph shown before label */
  icon?: string;
}

interface Props {
  cityName: string;
  citySlug: string;
  items: SubnavItem[];
  /** true on child sublander pages; shows "All {city}" chip first */
  showParentChip?: boolean;
}

/**
 * Horizontal scrollable chip nav, swipe-enabled, with left/right arrow controls
 * and gradient-fade edges that hide/show based on scroll position.
 *
 * Injected above the deal grid on both parent city pages and child sublanders.
 */
export function CityModifierSubnav({ cityName, citySlug, items, showParentChip = true }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const updateFades = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 8);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    updateFades();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateFades, { passive: true });
    window.addEventListener("resize", updateFades);

    // Scroll the active chip into view on mount
    const active = el.querySelector<HTMLElement>("[data-active=true]");
    if (active) {
      const offset = active.offsetLeft - el.clientWidth / 2 + active.clientWidth / 2;
      el.scrollTo({ left: Math.max(0, offset), behavior: "auto" });
    }

    return () => {
      el.removeEventListener("scroll", updateFades);
      window.removeEventListener("resize", updateFades);
    };
  }, [items.length]);

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className="relative mb-6 -mx-1 sm:mx-0">
      {/* Left fade + arrow */}
      <button
        type="button"
        onClick={() => scrollBy(-280)}
        aria-label="Scroll left"
        aria-hidden={!showLeft}
        tabIndex={showLeft ? 0 : -1}
        className={`pointer-events-${showLeft ? "auto" : "none"} absolute left-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-opacity hover:bg-gray-50 ${showLeft ? "opacity-100" : "opacity-0"}`}
      >
        <svg className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Right fade + arrow */}
      <button
        type="button"
        onClick={() => scrollBy(280)}
        aria-label="Scroll right"
        aria-hidden={!showRight}
        tabIndex={showRight ? 0 : -1}
        className={`pointer-events-${showRight ? "auto" : "none"} absolute right-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-opacity hover:bg-gray-50 ${showRight ? "opacity-100" : "opacity-0"}`}
      >
        <svg className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Edge gradients */}
      <div className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white via-white/80 to-transparent transition-opacity ${showLeft ? "opacity-100" : "opacity-0"}`} />
      <div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white via-white/80 to-transparent transition-opacity ${showRight ? "opacity-100" : "opacity-0"}`} />

      {/* Scrollable chip row */}
      <div
        ref={scrollerRef}
        className="scrollbar-hide flex gap-2 overflow-x-auto overflow-y-hidden scroll-smooth px-10 py-2"
        style={{
          scrollSnapType: "x proximity",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {showParentChip && (
          <Link
            href={`/${citySlug}`}
            data-active={items.every((i) => !i.isActive)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              items.every((i) => !i.isActive)
                ? "border-blue-600 bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600"
            }`}
            style={{ scrollSnapAlign: "start" }}
          >
            <span aria-hidden="true">🏖️</span>
            <span>All {cityName}</span>
          </Link>
        )}

        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-active={item.isActive ? "true" : "false"}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              item.isActive
                ? "border-blue-600 bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600"
            }`}
            style={{ scrollSnapAlign: "start" }}
          >
            {item.icon && <span aria-hidden="true">{item.icon}</span>}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
