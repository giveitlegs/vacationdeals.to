"use client";

import { useEffect, useState, useRef } from "react";
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

export function DealMapClient() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [selected, setSelected] = useState<MapPin | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const leafletRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);

  // Fetch pins
  useEffect(() => {
    fetch("/api/destinations/map")
      .then((r) => r.json())
      .then((d) => setPins(d.pins || []))
      .catch(() => {});
  }, []);

  // Load Leaflet dynamically (no npm package needed)
  useEffect(() => {
    if (mapLoaded || typeof window === "undefined") return;

    // Add CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Add JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      setMapLoaded(true);
      leafletRef.current = (window as any).L;
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, [mapLoaded]);

  // Initialize map when Leaflet loaded + pins ready
  useEffect(() => {
    const L = leafletRef.current;
    if (!L || !mapRef.current || pins.length === 0 || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [28, -82],
      zoom: 4,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add pins
    for (const pin of pins) {
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

      marker.bindTooltip(`${pin.city}${pin.state ? ", " + pin.state : ""} — ${pin.deals} deal${pin.deals !== 1 ? "s" : ""}`, {
        direction: "top",
        offset: [0, -size / 2 - 4],
      });
    }

    mapInstanceRef.current = map;

    // Fit bounds to show all pins
    if (pins.length > 1) {
      const bounds = L.latLngBounds(pins.map((p: MapPin) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapLoaded, pins]);

  return (
    <div className="relative">
      {/* Map container */}
      <div
        ref={mapRef}
        className="h-[500px] w-full rounded-xl border border-gray-200 shadow-lg sm:h-[600px]"
        style={{ background: "#E5E7EB" }}
      />

      {/* Loading state */}
      {(!mapLoaded || pins.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-100">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      )}

      {/* Selected destination card */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] mx-auto max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-2xl sm:left-4 sm:right-auto">
          <button
            onClick={() => setSelected(null)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
          <h3 className="text-lg font-bold text-gray-900">
            {selected.city}{selected.state ? `, ${selected.state}` : ""}
          </h3>
          <div className="mt-2 flex items-center gap-4">
            <div>
              <p className="text-2xl font-black text-emerald-600">
                {selected.cheapest ? `$${selected.cheapest}` : "—"}
              </p>
              <p className="text-xs text-gray-500">cheapest deal</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{selected.deals}</p>
              <p className="text-xs text-gray-500">deals available</p>
            </div>
          </div>
          <Link
            href={`/${selected.slug}`}
            className="mt-4 block rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
          >
            View {selected.city} Deals &rarr;
          </Link>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" /> Under $100
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-blue-500" /> $100–$199
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-violet-500" /> $200+
        </span>
        <span className="text-gray-400">Bigger pin = more deals</span>
      </div>
    </div>
  );
}
