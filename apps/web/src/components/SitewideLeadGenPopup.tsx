"use client";

import { usePathname } from "next/navigation";
import { LeadGenPopup } from "./LeadGenPopup";

const SKIP_PREFIXES = [
  "/admin",
  "/vacpack-games",
  "/pitch-diaries/submit",
  "/scout",
  "/vacation-carnival",
];

export function SitewideLeadGenPopup() {
  const pathname = usePathname() || "/";

  if (SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  return (
    <LeadGenPopup
      id="sitewide-v1"
      timeDelayMs={45000}
      exitIntent
      source="sitewide_popup"
      headline="Get the cheapest vacation deals first"
      subheadline="One email a week. Drop your address and we'll send the lowest-priced packages — under $99 stays, all-inclusive flash deals, and broker-only offers."
      ctaText="Send me the deals"
    />
  );
}
