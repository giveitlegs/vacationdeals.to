"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const DISMISS_KEY = "vd-getpaid-widget-dismissed";

export function GetPaidWidget() {
  const pathname = usePathname() || "";
  const [visible, setVisible] = useState(false);

  // Never on the destination page itself, or on admin.
  const hidden =
    pathname.startsWith("/get-paid-to-go-on-vacation") || pathname.startsWith("/admin");

  useEffect(() => {
    if (hidden) return;
    if (typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY)) return;
    const t = window.setTimeout(() => setVisible(true), 5000);
    return () => window.clearTimeout(t);
  }, [hidden, pathname]);

  if (hidden || !visible) return null;

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="gpw-root" aria-live="polite">
      <style>{gpwStyles}</style>

      <div className="gpw-shell">
        {/* floating $ glyphs bouncing off the badge */}
        <span aria-hidden className="gpw-coin gpw-coin-1">$</span>
        <span aria-hidden className="gpw-coin gpw-coin-2">$</span>
        <span aria-hidden className="gpw-coin gpw-coin-3">$</span>

        <Link href="/get-paid-to-go-on-vacation" className="gpw-badge">
          <span className="gpw-emoji" aria-hidden>💸</span>
          <span className="gpw-text">
            Get <span className="gpw-strong">PAID</span> to travel
          </span>
          <span className="gpw-arrow" aria-hidden>→</span>
        </Link>

        <button className="gpw-close" onClick={dismiss} aria-label="Dismiss">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const gpwStyles = `
.gpw-root {
  position: fixed;
  right: 1rem;
  bottom: 5.5rem; /* clear of the extension banner / footer CTAs */
  z-index: 40;
  animation: gpw-in 0.4s ease-out both;
}
@media (min-width: 640px) { .gpw-root { right: 1.5rem; bottom: 1.5rem; } }

.gpw-shell { position: relative; }

.gpw-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 9999px;
  padding: 0.7rem 1.05rem;
  font-weight: 800;
  font-size: 0.9rem;
  color: #052e1b;
  text-decoration: none;
  background: linear-gradient(100deg, #fde68a 0%, #fbbf24 45%, #34d399 100%);
  box-shadow: 0 12px 30px -8px rgba(16,185,129,0.65), 0 0 0 1px rgba(255,255,255,0.4) inset;
  animation: gpw-pulse 2.2s ease-in-out infinite, gpw-shake 3.4s ease-in-out infinite;
  transform-origin: bottom right;
  transition: transform 0.15s ease;
}
.gpw-badge:hover { transform: scale(1.05); }
.gpw-emoji { font-size: 1.15rem; }
.gpw-strong {
  background: #065f46;
  color: #fff;
  padding: 0 0.3rem;
  border-radius: 0.3rem;
  font-weight: 900;
}
.gpw-arrow { transition: transform 0.15s ease; }
.gpw-badge:hover .gpw-arrow { transform: translateX(3px); }

.gpw-close {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 9999px;
  background: #111827;
  color: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  cursor: pointer;
}
.gpw-close:hover { background: #000; }

.gpw-coin {
  position: absolute;
  bottom: 60%;
  font-weight: 900;
  color: #f59e0b;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  opacity: 0;
  pointer-events: none;
}
.gpw-coin-1 { left: 8%;  font-size: 0.95rem; animation: gpw-jump 2.6s ease-in-out infinite; }
.gpw-coin-2 { left: 42%; font-size: 1.25rem; animation: gpw-jump 2.6s ease-in-out 0.6s infinite; }
.gpw-coin-3 { left: 74%; font-size: 0.85rem; animation: gpw-jump 2.6s ease-in-out 1.2s infinite; }

@keyframes gpw-in {
  from { transform: translateY(16px) scale(0.9); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes gpw-pulse {
  0%, 100% { box-shadow: 0 12px 30px -8px rgba(16,185,129,0.65), 0 0 0 1px rgba(255,255,255,0.4) inset; }
  50%      { box-shadow: 0 12px 40px -6px rgba(16,185,129,0.9), 0 0 0 1px rgba(255,255,255,0.6) inset; }
}
@keyframes gpw-shake {
  0%, 88%, 100% { transform: rotate(0deg); }
  90% { transform: rotate(-2.5deg); }
  93% { transform: rotate(2.5deg); }
  96% { transform: rotate(-1.5deg); }
}
@keyframes gpw-jump {
  0%   { transform: translateY(6px) scale(0.8); opacity: 0; }
  25%  { opacity: 1; }
  60%  { transform: translateY(-22px) scale(1.05) rotate(12deg); opacity: 1; }
  100% { transform: translateY(-40px) scale(0.7) rotate(20deg); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .gpw-root { animation: none; }
  .gpw-badge { animation: none; }
  .gpw-badge:hover { transform: none; }
  .gpw-coin { display: none; }
}
`;
