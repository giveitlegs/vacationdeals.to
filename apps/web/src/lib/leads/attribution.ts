import type { NextRequest } from "next/server";

/**
 * Server-side reader for a lead's attribution, assembled from:
 *  - the `vd_attr` first-touch cookie (external referrer + UTM tags), set by AttributionBeacon
 *  - the POST's Referer header (the exact lander the opt-in form was on)
 *  - the request IP / User-Agent
 *
 * All values are length-capped. Nothing here is ever placed into a URL.
 */

export interface LeadAttribution {
  landingPath: string | null;
  landingUrl: string | null;
  firstReferrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  ipAddress: string;
  userAgent: string;
}

function trunc(v: unknown, n: number): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null;
}

export function readAttribution(request: NextRequest): LeadAttribution {
  // Lander = the page the form was on (same-origin fetch sends the full Referer).
  const referer = request.headers.get("referer") || "";
  let landingUrl: string | null = null;
  let landingPath: string | null = null;
  if (referer) {
    landingUrl = referer.slice(0, 1000);
    try {
      landingPath = new URL(referer).pathname.slice(0, 500);
    } catch {
      /* non-URL referer — leave path null */
    }
  }

  // First-touch referrer + UTM from the attribution cookie.
  let a: Record<string, unknown> = {};
  const raw = request.cookies.get("vd_attr")?.value;
  if (raw) {
    try {
      a = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    } catch {
      /* malformed cookie — ignore */
    }
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const userAgent = (request.headers.get("user-agent") || "unknown").slice(0, 500);

  return {
    landingPath,
    landingUrl,
    firstReferrer: trunc(a.r, 1000),
    utmSource: trunc(a.us, 255),
    utmMedium: trunc(a.um, 255),
    utmCampaign: trunc(a.uc, 255),
    utmTerm: trunc(a.ut, 255),
    utmContent: trunc(a.uo, 255),
    ipAddress,
    userAgent,
  };
}
