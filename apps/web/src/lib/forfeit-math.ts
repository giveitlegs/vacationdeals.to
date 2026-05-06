/**
 * The Forfeit Clock — math.
 *
 * We estimate, conservatively, how many timeshare-presentation deposit
 * dollars are forfeited each second across the brands we track. The
 * numbers below are publicly defensible and the source of each is noted.
 *
 * We display: today's running total (since UTC midnight), this year's
 * cumulative total (since Jan 1 UTC), and a per-second drip animated
 * client-side. The brand-by-brand breakdown weights each brand by its
 * share of our active-deal count.
 */

import "server-only";

export interface ForfeitParams {
  /** Estimated annual vacpacks sold across the major US timeshare brands.
   *  Conservative midpoint of ARDA-affiliated and trade-press estimates
   *  (vacpack volume is reported as "high six-figures to low seven-figures
   *  annually" depending on year). */
  vacpacksPerYear: number;
  /** Share of buyers who pay the deposit but never attend / never travel,
   *  forfeiting the deposit (industry research cites 20-30%; we use the
   *  low end). */
  noShowRate: number;
  /** Average deposit, computed from the live DB (avg active price). */
  avgDepositUsd: number;
}

/** Defaults — kept in code (not in DB) so the methodology is auditable
 *  in git history. */
export const DEFAULTS: Omit<ForfeitParams, "avgDepositUsd"> = {
  vacpacksPerYear: 1_000_000,
  noShowRate: 0.2,
};

export function computeForfeitRates(params: ForfeitParams) {
  const annualUsd = params.vacpacksPerYear * params.noShowRate * params.avgDepositUsd;
  const perDay = annualUsd / 365;
  const perHour = perDay / 24;
  const perMinute = perHour / 60;
  const perSecond = perMinute / 60;
  return { annualUsd, perDay, perHour, perMinute, perSecond };
}

/** Seconds since UTC midnight today (used for "today" running total). */
export function secondsSinceMidnightUtc(now = new Date()): number {
  const u = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Math.max(0, (now.getTime() - u.getTime()) / 1000);
}

/** Seconds since Jan 1 UTC of the current year. */
export function secondsSinceYearStartUtc(now = new Date()): number {
  const u = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  return Math.max(0, (now.getTime() - u.getTime()) / 1000);
}

export function formatUsd(n: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}
