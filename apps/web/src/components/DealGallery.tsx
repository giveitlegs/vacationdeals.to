"use client";

import { useState } from "react";

export interface GalleryImage {
  url: string;
  alt: string;
  kind: string; // hero | gallery | flash_gif
}

/**
 * Resort photo carousel for the deal page. Hero + 3–6 images with slick arrow
 * controls + dot indicators. Minimal JS (CSS cross-fade) for Core Web Vitals.
 * `children` are the badge overlays (brand / savings / duration) from the server
 * component, rendered on top of the active image.
 */
export function DealGallery({
  images,
  heightClass,
  children,
}: {
  images: GalleryImage[];
  heightClass?: string;
  children?: React.ReactNode;
}) {
  const [i, setI] = useState(0);
  const n = images.length;
  const go = (d: number) => setI((p) => (p + d + n) % n);
  const h = heightClass ?? "h-64 sm:h-80 lg:h-96";

  return (
    <div className={`group relative mb-6 overflow-hidden rounded-2xl bg-gray-100 ${h}`}>
      {images.map((img, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={img.url}
          src={img.url}
          alt={img.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
          loading={idx === 0 ? "eager" : "lazy"}
          fetchPriority={idx === 0 ? "high" : "auto"}
        />
      ))}

      {/* scrim so overlaid badges stay legible on bright photos */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

      {/* badge overlays (brand / savings / duration) */}
      {children}

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow-md backdrop-blur transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:opacity-0 sm:group-hover:opacity-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow-md backdrop-blur transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:opacity-0 sm:group-hover:opacity-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Photo ${idx + 1} of ${n}`}
                aria-current={idx === i}
                className={`h-2 rounded-full transition-all ${idx === i ? "w-5 bg-white" : "w-2 bg-white/55 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
