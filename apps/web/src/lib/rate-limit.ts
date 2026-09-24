/**
 * Tiny in-memory sliding-window rate limiter. Adequate for a single PM2 fork
 * process (our deploy). Not shared across instances and resets on restart —
 * fine for throttling public-form abuse. For anything stronger, back it with
 * Redis/DB later.
 */
type Hit = number[]; // timestamps (ms)
const buckets = new Map<string, Hit>();

let lastSweep = 0;
function sweep(now: number, windowMs: number) {
  // Occasionally drop empty/expired buckets so the Map can't grow unbounded.
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, hits] of buckets) {
    const live = hits.filter((t) => now - t < windowMs);
    if (live.length === 0) buckets.delete(k);
    else buckets.set(k, live);
  }
}

/**
 * Returns true if `key` is allowed (under `max` in the last `windowMs`), false if
 * it should be throttled. Records the hit when allowed.
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now, windowMs);
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}
