"use client";

import { useEffect } from "react";

/**
 * First-touch attribution capture (single integration point).
 *
 * Mounted once in the root layout. On the visitor's FIRST pageview it stashes the
 * external referrer + any UTM tags in a non-httpOnly `vd_attr` cookie (90 days).
 * It never overwrites an existing cookie, so the FIRST touch wins. Every same-origin
 * POST /api/leads then carries this cookie, so the server derives the channel without
 * any opt-in form (there are 12) needing to change. The lander URL itself comes from
 * the request's Referer header server-side.
 *
 * Not httpOnly on purpose: the client writes it, the server only reads it. It holds no
 * PII — just referrer + campaign tags.
 */

const COOKIE = "vd_attr";
const DAYS = 90;

function hasCookie(name: string): boolean {
  return typeof document !== "undefined" && new RegExp(`(?:^|; )${name}=`).test(document.cookie);
}

export function AttributionBeacon() {
  useEffect(() => {
    try {
      if (hasCookie(COOKIE)) return; // first touch already recorded — don't clobber it
      const params = new URLSearchParams(window.location.search);
      const pick = (k: string) => (params.get(k) || "").slice(0, 300) || undefined;
      const data: Record<string, string> = {};
      const ref = document.referrer || "";
      if (ref) data.r = ref.slice(0, 500);
      const us = pick("utm_source"); if (us) data.us = us;
      const um = pick("utm_medium"); if (um) data.um = um;
      const uc = pick("utm_campaign"); if (uc) data.uc = uc;
      const ut = pick("utm_term"); if (ut) data.ut = ut;
      const uo = pick("utm_content"); if (uo) data.uo = uo;
      // Always set the cookie (even if empty) so a direct visit is recorded as first-touch
      // and a later internal referrer can't masquerade as the acquisition source.
      const expires = new Date(Date.now() + DAYS * 86400000).toUTCString();
      const value = encodeURIComponent(JSON.stringify(data));
      document.cookie = `${COOKIE}=${value}; expires=${expires}; path=/; SameSite=Lax`;
    } catch {
      /* attribution is best-effort — never break the page */
    }
  }, []);

  return null;
}
