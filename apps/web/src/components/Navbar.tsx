"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const TOP_CITIES: { slug: string; label: string; state: string }[] = [
  { slug: "orlando", label: "Orlando", state: "FL" },
  { slug: "las-vegas", label: "Las Vegas", state: "NV" },
  { slug: "gatlinburg", label: "Gatlinburg", state: "TN" },
  { slug: "myrtle-beach", label: "Myrtle Beach", state: "SC" },
  { slug: "branson", label: "Branson", state: "MO" },
  { slug: "williamsburg", label: "Williamsburg", state: "VA" },
  { slug: "cocoa-beach", label: "Cocoa Beach", state: "FL" },
  { slug: "daytona-beach", label: "Daytona Beach", state: "FL" },
  { slug: "cancun", label: "Cancun", state: "MX" },
  { slug: "cabo-san-lucas", label: "Cabo San Lucas", state: "MX" },
  { slug: "puerto-vallarta", label: "Puerto Vallarta", state: "MX" },
  { slug: "punta-cana", label: "Punta Cana", state: "DO" },
];

const BEST_OF_CITIES: { slug: string; label: string }[] = [
  { slug: "orlando", label: "Orlando" },
  { slug: "las-vegas", label: "Las Vegas" },
  { slug: "cancun", label: "Cancun" },
  { slug: "gatlinburg", label: "Gatlinburg" },
  { slug: "myrtle-beach", label: "Myrtle Beach" },
  { slug: "branson", label: "Branson" },
  { slug: "williamsburg", label: "Williamsburg" },
  { slug: "cocoa-beach", label: "Cocoa Beach" },
  { slug: "daytona-beach", label: "Daytona Beach" },
  { slug: "cabo-san-lucas", label: "Cabo San Lucas" },
  { slug: "puerto-vallarta", label: "Puerto Vallarta" },
  { slug: "punta-cana", label: "Punta Cana" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [bestOfOpen, setBestOfOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [carnivalOpen, setCarnivalOpen] = useState(false);
  const [destinationsOpen, setDestinationsOpen] = useState(false);
  const [showPlayNow, setShowPlayNow] = useState(false);

  // Flutter "PLAY NOW!" label every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPlayNow(true);
      setTimeout(() => setShowPlayNow(false), 2500);
    }, 8000);
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
          <div className="hidden items-center gap-5 md:flex">
            <Link href="/deals" className="text-sm font-medium text-gray-600 hover:text-blue-600">All Deals</Link>

            {/* Destinations dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setDestinationsOpen(true)}
              onMouseLeave={() => setDestinationsOpen(false)}
            >
              <Link href="/destinations" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                Destinations
              </Link>
              {destinationsOpen && (
                <div className="absolute left-0 top-full z-50 w-[520px] pt-2">
                  <div className="grid grid-cols-2 gap-1 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                    {TOP_CITIES.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/${c.slug}`}
                        className="flex items-baseline gap-1.5 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      >
                        <span className="font-medium">{c.label}</span>
                        <span className="text-xs text-gray-400">{c.state}</span>
                      </Link>
                    ))}
                    <div className="col-span-2 my-1 border-t border-gray-100" />
                    <Link href="/destinations" className="col-span-2 rounded-md bg-gray-50 px-3 py-2 text-center text-sm font-semibold text-blue-600 hover:bg-gray-100">
                      View all destinations →
                    </Link>
                    <Link href="/vacation-deals-map" className="col-span-2 rounded-md px-3 py-2 text-center text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600">
                      🗺️ Interactive deals map
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/brands" className="text-sm font-medium text-gray-600 hover:text-blue-600">Brands</Link>

            {/* Tools dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setToolsOpen(true)}
              onMouseLeave={() => setToolsOpen(false)}
            >
              <button type="button" className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600">
                Tools
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {toolsOpen && (
                <div className="absolute left-0 top-full z-50 w-72 pt-2">
                  <div className="rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    <Link href="/will-it-hold-up" className="block px-4 py-2 hover:bg-orange-50">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base">🔍</span>
                        <span className="text-sm font-semibold text-orange-600">Will It Hold Up?</span>
                      </div>
                      <span className="ml-6 text-xs text-gray-500">Paste any vacpack URL → verdict</span>
                    </Link>
                    <Link href="/reality-index" className="block px-4 py-2 hover:bg-gray-50">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base">📊</span>
                        <span className="text-sm font-semibold text-gray-900">Reality Index</span>
                      </div>
                      <span className="ml-6 text-xs text-gray-500">Score every brand 0–100</span>
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    <Link href="/rate-recap" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Rate Recap</Link>
                    <Link href="/vacpack-rate-showdown" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Rate Showdown</Link>
                    <Link href="/data-report" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Data Report (B2B)</Link>
                    <Link href="/vacpack-ad-spy" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">VacPack Ad Spy (B2B)</Link>
                    <div className="my-1 border-t border-gray-100" />
                    <Link href="/timeshare-laws" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">⚖️ Timeshare Laws by State</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Best Of 2026 dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setBestOfOpen(true)}
              onMouseLeave={() => setBestOfOpen(false)}
            >
              <button type="button" className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600">
                Best Of 2026
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {bestOfOpen && (
                <div className="absolute left-0 top-full z-50 w-72 pt-2">
                  <div className="rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Best Vacation Deals — Live Rankings</p>
                    {BEST_OF_CITIES.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/best-vacation-deals-${c.slug}-2026`}
                        className="block px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-blue-600">Blog</Link>

            {/* Games dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setGamesOpen(true)}
              onMouseLeave={() => setGamesOpen(false)}
            >
              <Link href="/vacpack-games" className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-fuchsia-600">
                <span className="text-base">🎮</span>
                <span className="bg-gradient-to-r from-fuchsia-600 via-amber-500 to-emerald-500 bg-clip-text text-transparent font-semibold">Games</span>
              </Link>
              {gamesOpen && (
                <div className="absolute left-0 top-full z-50 w-60 pt-2">
                  <div className="rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    <Link href="/vacpack-games" className="block px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 hover:text-fuchsia-600">
                      All Games
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    <Link href="/vacpack-games/survival-kit" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">🎯 Survival Kit</Link>
                    <Link href="/vacpack-games/bingo" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-fuchsia-600">🎱 VacPack Bingo</Link>
                    <Link href="/vacpack-games/59-challenge" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">💰 $59 Challenge</Link>
                    <Link href="/vacpack-games/time-machine" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600">🕰️ Time Machine</Link>
                    <Link href="/vacpack-games/scratch-off" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-yellow-600">🎟️ Scratch-Off</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Carnival dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCarnivalOpen(true)}
              onMouseLeave={() => setCarnivalOpen(false)}
            >
              <Link href="/vacation-carnival" className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-purple-600">
                <span className="text-base">🎪</span>
                <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent font-semibold">Carnival</span>
              </Link>
              {carnivalOpen && (
                <div className="absolute left-0 top-full z-50 w-60 pt-2">
                  <div className="rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    <Link href="/vacation-carnival" className="block px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 hover:text-purple-600">
                      All Attractions
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    <Link href="/vacation-carnival/pto-debt" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600">💸 PTO Debt Calculator</Link>
                    <Link href="/vacation-carnival/severance" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600">📄 Severance Packet</Link>
                    <Link href="/vacation-carnival/cursed-trip" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600">🔮 Cursed Trip Quiz</Link>
                    <Link href="/vacation-carnival/blood-oath" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600">🩸 Blood Oath</Link>
                    <Link href="/vacation-carnival/court" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600">⚖️ Vacation Court</Link>
                    <Link href="/vacation-carnival/lost-resort" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600">🗺️ The Lost Resort</Link>
                    <Link href="/vacation-carnival/cult" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600">🕯️ The Cult</Link>
                    <Link href="/vacation-carnival/confessional" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600">🙏 The Confessional</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Resort Roulette CTA */}
            <div className="relative">
              <Link
                href="/resort-roulette"
                className="flex items-center gap-1.5 rounded-full border-2 border-red-400 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-600 transition-all hover:bg-red-100 hover:border-red-500 pulse-glow"
              >
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
          <div className="absolute right-0 top-0 h-full w-72 overflow-y-auto bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100" aria-label="Close menu">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col px-4 py-4 text-sm">
              <MobileLink href="/deals" onClose={() => setMobileOpen(false)}>All Deals</MobileLink>

              <MobileSectionHeader>Destinations</MobileSectionHeader>
              <MobileLink href="/destinations" onClose={() => setMobileOpen(false)}>All Destinations</MobileLink>
              {TOP_CITIES.map((c) => (
                <MobileSubLink key={c.slug} href={`/${c.slug}`} onClose={() => setMobileOpen(false)}>{c.label}, {c.state}</MobileSubLink>
              ))}
              <MobileSubLink href="/vacation-deals-map" onClose={() => setMobileOpen(false)}>🗺️ Interactive Map</MobileSubLink>

              <MobileLink href="/brands" onClose={() => setMobileOpen(false)}>Brands</MobileLink>

              <MobileSectionHeader>🔧 Tools</MobileSectionHeader>
              <MobileSubLink href="/will-it-hold-up" onClose={() => setMobileOpen(false)} highlight>🔍 Will It Hold Up?</MobileSubLink>
              <MobileSubLink href="/reality-index" onClose={() => setMobileOpen(false)}>📊 Reality Index</MobileSubLink>
              <MobileSubLink href="/rate-recap" onClose={() => setMobileOpen(false)}>Rate Recap</MobileSubLink>
              <MobileSubLink href="/vacpack-rate-showdown" onClose={() => setMobileOpen(false)}>Rate Showdown</MobileSubLink>
              <MobileSubLink href="/data-report" onClose={() => setMobileOpen(false)}>Data Report (B2B)</MobileSubLink>
              <MobileSubLink href="/vacpack-ad-spy" onClose={() => setMobileOpen(false)}>VacPack Ad Spy (B2B)</MobileSubLink>
              <MobileSubLink href="/timeshare-laws" onClose={() => setMobileOpen(false)}>⚖️ Timeshare Laws by State</MobileSubLink>

              <MobileSectionHeader>🏆 Best Of 2026</MobileSectionHeader>
              {BEST_OF_CITIES.map((c) => (
                <MobileSubLink key={c.slug} href={`/best-vacation-deals-${c.slug}-2026`} onClose={() => setMobileOpen(false)}>
                  {c.label}
                </MobileSubLink>
              ))}

              <MobileLink href="/blog" onClose={() => setMobileOpen(false)}>Blog</MobileLink>

              <MobileSectionHeader>🎮 VacPack Games</MobileSectionHeader>
              <MobileSubLink href="/vacpack-games" onClose={() => setMobileOpen(false)}>All Games</MobileSubLink>
              <MobileSubLink href="/vacpack-games/survival-kit" onClose={() => setMobileOpen(false)}>🎯 Survival Kit</MobileSubLink>
              <MobileSubLink href="/vacpack-games/bingo" onClose={() => setMobileOpen(false)}>🎱 VacPack Bingo</MobileSubLink>
              <MobileSubLink href="/vacpack-games/59-challenge" onClose={() => setMobileOpen(false)}>💰 $59 Challenge</MobileSubLink>
              <MobileSubLink href="/vacpack-games/time-machine" onClose={() => setMobileOpen(false)}>🕰️ Time Machine</MobileSubLink>
              <MobileSubLink href="/vacpack-games/scratch-off" onClose={() => setMobileOpen(false)}>🎟️ Scratch-Off</MobileSubLink>

              <MobileSectionHeader>🎪 Vacation Carnival</MobileSectionHeader>
              <MobileSubLink href="/vacation-carnival" onClose={() => setMobileOpen(false)}>All Attractions</MobileSubLink>
              <MobileSubLink href="/vacation-carnival/pto-debt" onClose={() => setMobileOpen(false)}>💸 PTO Debt Calculator</MobileSubLink>
              <MobileSubLink href="/vacation-carnival/severance" onClose={() => setMobileOpen(false)}>📄 Severance Packet</MobileSubLink>
              <MobileSubLink href="/vacation-carnival/cursed-trip" onClose={() => setMobileOpen(false)}>🔮 Cursed Trip Quiz</MobileSubLink>
              <MobileSubLink href="/vacation-carnival/blood-oath" onClose={() => setMobileOpen(false)}>🩸 Blood Oath</MobileSubLink>
              <MobileSubLink href="/vacation-carnival/court" onClose={() => setMobileOpen(false)}>⚖️ Vacation Court</MobileSubLink>
              <MobileSubLink href="/vacation-carnival/lost-resort" onClose={() => setMobileOpen(false)}>🗺️ The Lost Resort</MobileSubLink>
              <MobileSubLink href="/vacation-carnival/cult" onClose={() => setMobileOpen(false)}>🕯️ The Cult</MobileSubLink>
              <MobileSubLink href="/vacation-carnival/confessional" onClose={() => setMobileOpen(false)}>🙏 The Confessional</MobileSubLink>

              {/* Roulette CTA */}
              <Link href="/resort-roulette" onClick={() => setMobileOpen(false)}
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-3 text-sm font-bold text-white">
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

function MobileSectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 border-t border-gray-100 px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">
      {children}
    </div>
  );
}

function MobileLink({ href, onClose, children }: { href: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClose} className="rounded-lg px-3 py-2.5 font-medium text-gray-800 hover:bg-gray-50 hover:text-blue-600">
      {children}
    </Link>
  );
}

function MobileSubLink({ href, onClose, children, highlight }: { href: string; onClose: () => void; children: React.ReactNode; highlight?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`rounded-lg px-5 py-2 ${highlight ? "font-semibold text-orange-600 hover:bg-orange-50" : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"}`}
    >
      {children}
    </Link>
  );
}
