"use client";

import { usePathname } from "next/navigation";
import { LeadGenPopup } from "./LeadGenPopup";

// Owner directive 2026-08: popup on EVERY page. Only the back-office admin
// area is excluded (it's not a public page and has its own login flow).
const SKIP_PREFIXES = [
  "/admin",
];

export function SitewideLeadGenPopup() {
  const pathname = usePathname() || "/";

  if (SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  return (
    <LeadGenPopup
      id="sitewide-v2"
      timeDelayMs={6000}
      exitIntent
      source="sitewide_popup"
      headline="Get the cheapest vacation deals first"
      subheadline="One email a week with the lowest-priced publicly-listed packages we find — under $99 stays, all-inclusive flash deals, and broker offers."
      ctaText="Send me the deals"
    />
  );
}
