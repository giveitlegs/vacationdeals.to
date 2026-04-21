"use client";

import { useEffect, useState } from "react";

/**
 * Reusable lead-gen popup with TCPA consent.
 * Triggers based on: time-on-page, scroll depth, or exit intent.
 * Dismissible + remembers dismissal for 7 days via cookie.
 * POSTs to /api/leads on submit.
 */

interface LeadGenPopupProps {
  /** Unique ID so different triggers can have different cookies */
  id: string;
  /** Trigger on page time (ms), default 30s */
  timeDelayMs?: number;
  /** Trigger on scroll percent (0-1) */
  scrollPercent?: number;
  /** Trigger on exit intent */
  exitIntent?: boolean;
  /** Headline shown in popup */
  headline: string;
  /** Subheadline */
  subheadline: string;
  /** CTA button text */
  ctaText: string;
  /** Optional source tag for analytics */
  source: string;
}

const COOKIE_PREFIX = "vd_popup_";
const COOKIE_DAYS = 7;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function LeadGenPopup({
  id,
  timeDelayMs = 30000,
  scrollPercent,
  exitIntent = true,
  headline,
  subheadline,
  ctaText,
  source,
}: LeadGenPopupProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cookieKey = `${COOKIE_PREFIX}${id}`;

  useEffect(() => {
    // Already dismissed or submitted in last 7 days? Don't trigger.
    if (getCookie(cookieKey)) return;

    let timeTimer: ReturnType<typeof setTimeout> | null = null;
    let scrollHandler: (() => void) | null = null;
    let exitHandler: ((e: MouseEvent) => void) | null = null;

    const trigger = () => {
      setOpen(true);
      cleanup();
    };

    const cleanup = () => {
      if (timeTimer) clearTimeout(timeTimer);
      if (scrollHandler) window.removeEventListener("scroll", scrollHandler);
      if (exitHandler) document.removeEventListener("mouseleave", exitHandler as any);
    };

    // Time trigger
    if (timeDelayMs > 0) {
      timeTimer = setTimeout(trigger, timeDelayMs);
    }

    // Scroll trigger
    if (scrollPercent && scrollPercent > 0 && scrollPercent <= 1) {
      scrollHandler = () => {
        const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        if (scrolled >= scrollPercent) trigger();
      };
      window.addEventListener("scroll", scrollHandler, { passive: true });
    }

    // Exit intent trigger (mouse leaves viewport top)
    if (exitIntent) {
      exitHandler = (e: MouseEvent) => {
        if (e.clientY <= 0) trigger();
      };
      document.addEventListener("mouseleave", exitHandler as any);
    }

    return cleanup;
  }, [cookieKey, timeDelayMs, scrollPercent, exitIntent]);

  const dismiss = () => {
    setCookie(cookieKey, "dismissed", COOKIE_DAYS);
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !consent || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source,
          tcpaConsent: true,
          termsConsent: true,
          consentText: "I agree to the Terms & Conditions and Privacy Policy, and consent to receive promotional emails.",
        }),
      });
      setCookie(cookieKey, "submitted", COOKIE_DAYS * 4);
      setSubmitted(true);
      setTimeout(() => setOpen(false), 2500);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/70 p-4"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center">
            <p className="text-4xl mb-3">🎉</p>
            <h2 className="text-xl font-bold text-gray-900">You&apos;re in!</h2>
            <p className="mt-2 text-sm text-gray-600">Check your inbox for a welcome email.</p>
          </div>
        ) : (
          <>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">{headline}</h2>
            <p className="mb-4 text-sm text-gray-600">{subheadline}</p>
            <form onSubmit={submit}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <label className="mb-4 flex items-start gap-2 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <span>
                  I agree to the{" "}
                  <a href="/terms" target="_blank" rel="noopener" className="text-blue-600 underline">Terms</a>{" "}
                  &amp;{" "}
                  <a href="/privacy" target="_blank" rel="noopener" className="text-blue-600 underline">Privacy Policy</a>,
                  and consent to promotional emails. Unsubscribe anytime.
                </span>
              </label>
              <button
                type="submit"
                disabled={!email || !consent || submitting}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : ctaText}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600"
              >
                No thanks
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
