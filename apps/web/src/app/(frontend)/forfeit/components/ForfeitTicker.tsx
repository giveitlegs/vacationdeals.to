"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Forfeited USD already accumulated as of `anchorIso` (server time). */
  todayBaseUsd: number;
  /** ISO timestamp the server snapshot was taken — client extrapolates from here. */
  anchorIso: string;
  /** Burn rate in USD per second. */
  perSecondUsd: number;
}

export function ForfeitTicker({ todayBaseUsd, anchorIso, perSecondUsd }: Props) {
  const [value, setValue] = useState(todayBaseUsd);
  const anchorMs = useRef(Date.parse(anchorIso));

  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - anchorMs.current) / 1000;
      setValue(todayBaseUsd + elapsed * perSecondUsd);
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [todayBaseUsd, perSecondUsd]);

  // Format with two-decimal cents that visibly tick.
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return (
    <div className="font-mono text-4xl font-black leading-none tracking-tight text-white tabular-nums sm:text-6xl md:text-7xl">
      {formatted}
    </div>
  );
}
