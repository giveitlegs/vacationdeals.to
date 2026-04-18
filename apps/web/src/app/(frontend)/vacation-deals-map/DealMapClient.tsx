"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

interface MapPin {
  city: string;
  slug: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  deals: number;
  cheapest: number | null;
}

// Leaflet CSS is inlined to avoid FOUC / tile skew from late CSS load
const LEAFLET_CSS = `
.leaflet-container{height:100%;width:100%;font-family:inherit}
.leaflet-pane,.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow,.leaflet-tile-container,
.leaflet-pane>svg,.leaflet-pane>canvas,.leaflet-zoom-box,.leaflet-image-layer,.leaflet-layer{position:absolute;left:0;top:0}
.leaflet-container{overflow:hidden}
.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow{-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-user-drag:none}
.leaflet-tile::after{content:'';display:block}
.leaflet-safari .leaflet-tile{image-rendering:-webkit-optimize-contrast}
.leaflet-safari .leaflet-tile-container{width:1600px;height:1600px;-webkit-transform-origin:0 0}
.leaflet-marker-icon,.leaflet-marker-shadow{display:block}
.leaflet-container .leaflet-overlay-pane svg{max-width:none!important;max-height:none!important}
.leaflet-container .leaflet-marker-pane img,.leaflet-container .leaflet-shadow-pane img,
.leaflet-container .leaflet-tile-pane img,.leaflet-container img.leaflet-image-layer,
.leaflet-container .leaflet-tile{max-width:none!important;max-height:none!important;width:auto;padding:0}
.leaflet-container img.leaflet-tile{mix-blend-mode:plus-lighter}
.leaflet-container.leaflet-touch-zoom{-ms-touch-action:pan-x pan-y;touch-action:pan-x pan-y}
.leaflet-container.leaflet-touch-drag{-ms-touch-action:pinch-zoom;touch-action:none;touch-action:pinch-zoom}
.leaflet-container.leaflet-touch-drag.leaflet-touch-zoom{-ms-touch-action:none;touch-action:none}
.leaflet-control{position:relative;z-index:800;pointer-events:visiblePainted;pointer-events:auto}
.leaflet-top,.leaflet-bottom{position:absolute;z-index:1000;pointer-events:none}
.leaflet-top{top:0}.leaflet-right{right:0}.leaflet-bottom{bottom:0}.leaflet-left{left:0}
.leaflet-control{float:left;clear:both}
.leaflet-right .leaflet-control{float:right}
.leaflet-top .leaflet-control{margin-top:10px}
.leaflet-bottom .leaflet-control{margin-bottom:10px}
.leaflet-left .leaflet-control{margin-left:10px}
.leaflet-right .leaflet-control{margin-right:10px}
.leaflet-fade-anim .leaflet-popup{opacity:1;transition:opacity .2s linear}
.leaflet-zoom-anim .leaflet-zoom-animated{transition:transform .25s cubic-bezier(0,0,.25,1)}
.leaflet-pan-anim .leaflet-tile,.leaflet-zoom-anim .leaflet-zoom-hide{visibility:hidden}
.leaflet-zoom-anim .leaflet-tile,.leaflet-pan-anim .leaflet-tile{transition:none}
.leaflet-interactive{cursor:pointer}
.leaflet-grab{cursor:-webkit-grab;cursor:-moz-grab;cursor:grab}
.leaflet-crosshair,.leaflet-crosshair .leaflet-interactive{cursor:crosshair}
.leaflet-control,.leaflet-popup-pane{cursor:auto}
.leaflet-dragging .leaflet-grab,.leaflet-dragging .leaflet-grab .leaflet-interactive,
.leaflet-dragging .leaflet-marker-draggable{cursor:move;cursor:-webkit-grabbing;cursor:-moz-grabbing;cursor:grabbing}
.leaflet-tooltip{position:absolute;padding:6px;background-color:#fff;border:1px solid #ccc;border-radius:3px;color:#333;white-space:nowrap;-webkit-user-select:none;-moz-user-select:none;user-select:none;pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,.4);font-size:12px}
.leaflet-tooltip-top:before,.leaflet-tooltip-bottom:before,.leaflet-tooltip-left:before,.leaflet-tooltip-right:before{position:absolute;pointer-events:none;border:6px solid transparent;background:transparent;content:''}
.leaflet-tooltip-top:before{bottom:0;left:50%;margin-left:-6px;border-top-color:#fff;margin-bottom:-12px}
.leaflet-control-zoom a{width:30px;height:30px;line-height:30px;display:block;text-align:center;text-decoration:none;color:#333;font:bold 18px/30px Lucida\ Console,Monaco,monospace;background:#fff;border-bottom:1px solid #ccc}
.leaflet-control-zoom a:hover{background:#f4f4f4}
.leaflet-control-zoom-in{border-top-left-radius:4px;border-top-right-radius:4px}
.leaflet-control-zoom-out{border-bottom-left-radius:4px;border-bottom-right-radius:4px}
.custom-pin{background:transparent!important;border:none!important}
`;

export function DealMapClient() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [selected, setSelected] = useState<MapPin | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  // Fetch pins on mount
  useEffect(() => {
    fetch("/api/destinations/map")
      .then((r) => r.json())
      .then((d) => setPins(d.pins || []))
      .catch(() => {});
  }, []);

  // Build the map once we have pins and the script is loaded
  const buildMap = useCallback((L: any, container: HTMLDivElement, data: MapPin[]) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(container, {
      center: [30, -90],
      zoom: 4,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '\u00a9 <a href="https://www.openstreetmap.org/copyright">OSM</a> \u00a9 <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    for (const pin of data) {
      const size = Math.min(40, Math.max(18, 12 + pin.deals * 0.5));
      const color = pin.cheapest && pin.cheapest < 100 ? "#10B981" : pin.cheapest && pin.cheapest < 200 ? "#3B82F6" : "#8B5CF6";

      const icon = L.divIcon({
        className: "custom-pin",
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:${Math.max(9, size * 0.3)}px;font-weight:800;cursor:pointer;">${pin.cheapest ? "$" + pin.cheapest : pin.deals}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
      marker.on("click", () => {
        setSelected(pin);
        map.flyTo([pin.lat, pin.lng], 8, { duration: 0.8 });
      });
      marker.bindTooltip(`${pin.city}${pin.state ? ", " + pin.state : ""} \u2014 ${pin.deals} deal${pin.deals !== 1 ? "s" : ""}`, {
        direction: "top",
        offset: [0, -size / 2 - 4],
      });
    }

    if (data.length > 1) {
      const bounds = L.latLngBounds(data.map((p: MapPin) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    mapInstanceRef.current = map;

    // Force tile recalculation after a frame to fix skew
    requestAnimationFrame(() => {
      map.invalidateSize();
    });
    // And again after a short delay for good measure
    setTimeout(() => map.invalidateSize(), 300);
    setTimeout(() => map.invalidateSize(), 1000);
  }, []);

  // Load Leaflet script and init map
  useEffect(() => {
    if (typeof window === "undefined" || pins.length === 0 || !mapRef.current) return;

    // If Leaflet already loaded globally, use it
    if ((window as any).L) {
      buildMap((window as any).L, mapRef.current, pins);
      setMapReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (mapRef.current) {
        buildMap((window as any).L, mapRef.current, pins);
        setMapReady(true);
      }
    };
    document.head.appendChild(script);
  }, [pins, buildMap]);

  // Handle resize — invalidateSize on window resize
  useEffect(() => {
    const handle = () => mapInstanceRef.current?.invalidateSize();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  return (
    <div className="relative">
      {/* Inline Leaflet CSS to prevent tile skew from late stylesheet load */}
      <style>{LEAFLET_CSS}</style>

      {/* Map container — explicit pixel height, not % */}
      <div
        ref={mapRef}
        className="w-full rounded-xl border border-gray-200 shadow-lg"
        style={{ height: "550px", background: "#f1f5f9" }}
      />

      {/* Loading state */}
      {(!mapReady || pins.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-100/80">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      )}

      {/* Selected destination card */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] mx-auto max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-2xl sm:left-4 sm:right-auto">
          <button onClick={() => setSelected(null)} className="absolute right-3 top-3 text-lg text-gray-400 hover:text-gray-600">&times;</button>
          <h3 className="text-lg font-bold text-gray-900">
            {selected.city}{selected.state ? `, ${selected.state}` : ""}
          </h3>
          <div className="mt-2 flex items-center gap-4">
            <div>
              <p className="text-2xl font-black text-emerald-600">{selected.cheapest ? `$${selected.cheapest}` : "\u2014"}</p>
              <p className="text-xs text-gray-500">cheapest deal</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{selected.deals}</p>
              <p className="text-xs text-gray-500">deals available</p>
            </div>
          </div>
          <Link href={`/${selected.slug}`} className="mt-4 block rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700">
            View {selected.city} Deals &rarr;
          </Link>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-emerald-500" /> Under $100</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-blue-500" /> $100\u2013$199</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-violet-500" /> $200+</span>
        <span className="text-gray-400">Bigger pin = more deals</span>
      </div>
    </div>
  );
}
