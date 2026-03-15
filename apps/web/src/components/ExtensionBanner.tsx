"use client";
import { useState, useEffect } from "react";

export function ExtensionBanner() {
  const [dismissed, setDismissed] = useState(true); // Start hidden, show after check

  useEffect(() => {
    const wasDismissed = localStorage.getItem("vd-ext-banner-dismissed");
    if (!wasDismissed) setDismissed(false);
  }, []);

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("vd-ext-banner-dismissed", "1");
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-blue-200 bg-blue-600 px-4 py-3 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-blue-900 sm:inline">NEW</span>
          <p className="text-sm font-medium">
            Get our FREE Chrome Extension — See hidden resort rates on Google!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="#"
            target="_blank"
            rel="noopener"
            className="shrink-0 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-blue-900 transition-colors hover:bg-yellow-300"
          >
            Install Free
          </a>
          <button
            onClick={handleDismiss}
            className="shrink-0 text-white/70 hover:text-white"
            aria-label="Dismiss"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
