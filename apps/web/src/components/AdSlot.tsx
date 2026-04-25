"use client";

import { useEffect, useState } from "react";

interface BannerData {
  id: number;
  name: string;
  imageUrl: string | null;
  linkUrl: string | null;
  htmlContent: string | null;
  width: number | null;
  height: number | null;
  utmContentMatch: string | null;
  prospectBrandSlug: string | null;
}

interface Props {
  /** Slot position. Server resolver picks the best banner for this slot. */
  position: "header" | "hero" | "sidebar" | "inline" | "footer";
  /** Default rendered dimensions if banner doesn't set its own. */
  width?: number;
  height?: number;
  /** Optional className wrapper */
  className?: string;
}

/**
 * Renders a single ad banner for a given slot.
 *
 *   - On mount, reads ?utm_content from the URL.
 *   - Calls /api/ads?position=<slot>&utm_content=<value>.
 *   - Server returns either the UTM-matched prospect banner OR the active
 *     default for that slot.
 *
 * UTM-matched banners are the sales-prospecting trick: send a prospect a
 * unique URL like https://vacationdeals.to/?utm_content=hgv-prospect and
 * they see a mock HGV-branded banner at the top. Nobody else sees it —
 * letting us show "your branded ad" without disrupting the live site.
 */
export function AdSlot({ position, width, height, className }: Props) {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmContent = params.get("utm_content") || "";
    const url = `/api/ads?position=${encodeURIComponent(position)}${utmContent ? `&utm_content=${encodeURIComponent(utmContent)}` : ""}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.banner) setBanner(data.banner);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [position]);

  if (!loaded) {
    return (
      <div
        className={className}
        style={{ minHeight: height ?? undefined, width: width ?? "100%" }}
        aria-hidden="true"
      />
    );
  }
  if (!banner) return null;

  const w = banner.width ?? width;
  const h = banner.height ?? height;
  const isProspect = banner.utmContentMatch != null;

  if (!banner.imageUrl) return null;

  const img = (
    <img
      src={banner.imageUrl}
      alt={banner.name}
      width={w ?? undefined}
      height={h ?? undefined}
      loading="lazy"
      className="block max-w-full h-auto"
    />
  );

  return (
    <div className={className} data-ad-slot={position} data-ad-id={banner.id}>
      {isProspect && (
        <div className="mb-1 text-[10px] uppercase tracking-wider text-amber-600">
          Preview for {banner.prospectBrandSlug}
        </div>
      )}
      {banner.linkUrl ? (
        <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer sponsored">
          {img}
        </a>
      ) : img}
    </div>
  );
}
