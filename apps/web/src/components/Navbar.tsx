"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rateRecapOpen, setRateRecapOpen] = useState(false);
  const [showPlayNow, setShowPlayNow] = useState(false);

  // Flutter "PLAY NOW!" label every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPlayNow(true);
      setTimeout(() => setShowPlayNow(false), 2500);
    }, 8000);
    // Show once on mount after 2s
    const initial = setTimeout(() => {
      setShowPlayNow(true);
      setTimeout(() => setShowPlayNow(false), 2500);
    }, 2000);
    return () => { clearInterval(interval); clearTimeout(initial); };
  }, []);

  return (
    <>
      <style>{`
        @keyframes spin-wheel { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes flutter-down {
          0% { opacity: 0; transform: translateY(-10px) rotate(-5deg); }
          20% { opacity: 1; }
          50% { transform: translateY(4px) rotate(3deg); }
          80% { opacity: 1; transform: translateY(0px) rotate(-2deg); }
          100% { opacity: 0; transform: translateY(8px) rotate(0deg); }
        }
        .spin-wheel { animation: spin-wheel 3s linear infinite; }
        .spin-wheel:hover { animation-duration: 0.5s; }
        .flutter-label { animation: flutter-down 2.5s ease-in-out forwards; }
        .pulse-glow { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 50% { box-shadow: 0 0 8px 4px rgba(239,68,68,0.2); } }
      `}</style>

      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <svg className="h-8 w-8 shrink-0" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M24 4C15.163 4 8 11.163 8 20c0 11 16 26 16 26s16-15 16-26c0-8.837-7.163-16-16-16z" fill="#2563EB" />
              <circle cx="24" cy="17.5" r="6.5" fill="#FBBF24" />
              <path d="M14 22h20" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 25c2-1.2 4-1.2 6 0s4 1.2 6 0" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            </svg>
            <span className="flex items-baseline gap-0">
              <span className="text-xl font-bold tracking-tight text-blue-600">Vacation</span>
              <span className="text-xl font-bold tracking-tight text-gray-900">Deals</span>
              <span className="ml-0.5 text-sm font-semibold text-gray-400">.to</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/deals" className="text-sm font-medium text-gray-600 hover:text-blue-600">All Deals</Link>
            <Link href="/destinations" className="text-sm font-medium text-gray-600 hover:text-blue-600">Destinations</Link>
            <Link href="/brands" className="text-sm font-medium text-gray-600 hover:text-blue-600">Brands</Link>
            <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-blue-600">Blog</Link>

            {/* Rate Recap with dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setRateRecapOpen(true)}
              onMouseLeave={() => setRateRecapOpen(false)}
            >
              <Link href="/rate-recap" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                Rate Recap
              </Link>
              {rateRecapOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                  <Link href="/rate-recap" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                    Rate Recap Overview
                  </Link>
                  <Link href="/vacpack-rate-showdown" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                    Rate Showdown (Compare)
                  </Link>
                  <div className="my-1 border-t border-gray-100" />
                  <Link href="/data-report" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                    Data Report (B2B)
                  </Link>
                </div>
              )}
            </div>

            {/* Resort Roulette with spinning wheel + PLAY NOW */}
            <div className="relative">
              <Link
                href="/resort-roulette"
                className="flex items-center gap-1.5 rounded-full border-2 border-red-400 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-600 transition-all hover:bg-red-100 hover:border-red-500 pulse-glow"
              >
                {/* Tiny spinning roulette wheel */}
                <svg className="h-4 w-4 spin-wheel" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3" fill="#FBBF24" />
                  <line x1="12" y1="2" x2="12" y2="9" stroke="white" strokeWidth="1" />
                  <line x1="22" y1="12" x2="15" y2="12" stroke="white" strokeWidth="1" />
                  <line x1="12" y1="22" x2="12" y2="15" stroke="white" strokeWidth="1" />
                  <line x1="2" y1="12" x2="9" y2="12" stroke="white" strokeWidth="1" />
                  <line x1="5" y1="5" x2="9.5" y2="9.5" stroke="white" strokeWidth="0.8" />
                  <line x1="19" y1="5" x2="14.5" y2="9.5" stroke="white" strokeWidth="0.8" />
                  <line x1="19" y1="19" x2="14.5" y2="14.5" stroke="white" strokeWidth="0.8" />
                  <line x1="5" y1="19" x2="9.5" y2="14.5" stroke="white" strokeWidth="0.8" />
                </svg>
                Roulette
              </Link>
              {/* Flutter-down PLAY NOW label */}
              {showPlayNow && (
                <span className="flutter-label pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                  Play Now!
                </span>
              )}
            </div>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100" aria-label="Close menu">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col px-4 py-4">
              {[
                { href: "/deals", label: "All Deals" },
                { href: "/destinations", label: "Destinations" },
                { href: "/brands", label: "Brands" },
                { href: "/blog", label: "Blog" },
                { href: "/rate-recap", label: "Rate Recap" },
                { href: "/vacpack-rate-showdown", label: "\u00A0\u00A0\u2192 Rate Showdown" },
                { href: "/data-report", label: "\u00A0\u00A0\u2192 Data Report" },
              ].map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                  {link.label}
                </Link>
              ))}
              {/* Roulette CTA in mobile */}
              <Link href="/resort-roulette" onClick={() => setMobileOpen(false)}
                className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-3 text-sm font-bold text-white">
                <svg className="h-4 w-4 spin-wheel" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#FFF" stroke="#FFF" strokeWidth="1" opacity="0.3" />
                  <circle cx="12" cy="12" r="3" fill="#FBBF24" />
                  <line x1="12" y1="2" x2="12" y2="9" stroke="white" strokeWidth="1" />
                  <line x1="22" y1="12" x2="15" y2="12" stroke="white" strokeWidth="1" />
                  <line x1="12" y1="22" x2="12" y2="15" stroke="white" strokeWidth="1" />
                  <line x1="2" y1="12" x2="9" y2="12" stroke="white" strokeWidth="1" />
                </svg>
                Resort Roulette
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
