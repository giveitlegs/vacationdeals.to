"use client";

import { useState, useEffect } from "react";

interface StickyDealBarProps {
  title: string;
  price: number;
  url: string;
}

export function StickyDealBar({ title, price, url }: StickyDealBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="sticky-cta-bar fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="mr-4 min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-lg font-bold text-emerald-600">${price}</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="cta-pulse shrink-0 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          View Deal
        </a>
      </div>
    </div>
  );
}
