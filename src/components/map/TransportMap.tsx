"use client";

import React, { useEffect, useRef } from "react";
import type { Map, LayerGroup } from "leaflet";

type LeafletModule = typeof import("leaflet");

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  emoji?: string;
}

interface TransportMapProps {
  markers?: MapMarker[];
  route?: Array<{ lat: number; lng: number }>;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

// Guwahati, Assam as sensible default center
const DEFAULT_CENTER = { lat: 26.1445, lng: 91.7362 };
const DEFAULT_ZOOM = 13;

// Colored dot / emoji marker built with divIcon (no image assets needed).
function makeIcon(L: LeafletModule, emoji?: string, color = "#DC2626") {
  return L.divIcon({
    html: emoji
      ? `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">${emoji}</div>`
      : `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>`,
    className: "transport-leaflet-marker",
    iconSize: emoji ? [24, 24] : [20, 20],
    iconAnchor: emoji ? [12, 12] : [10, 10],
  });
}

export default function TransportMap({
  markers = [],
  route = [],
  center,
  zoom,
  className,
}: TransportMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const layersRef = useRef<LayerGroup | null>(null);

  // Initialize the Leaflet map exactly once (Leaflet is browser-only).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")) as unknown as LeafletModule;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [center?.lat ?? DEFAULT_CENTER.lat, center?.lng ?? DEFAULT_CENTER.lng],
        zoom: zoom ?? DEFAULT_ZOOM,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      leafletRef.current = L;
      layersRef.current = L.layerGroup().addTo(map);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        leafletRef.current = null;
        layersRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers + route whenever props change.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!L || !map || !layers) return;

    layers.clearLayers();

    const points: [number, number][] = [];

    for (const m of markers) {
      L.marker([m.lat, m.lng], { icon: makeIcon(L, m.emoji, m.color) })
        .bindPopup(m.label || "")
        .addTo(layers);
      points.push([m.lat, m.lng]);
    }

    if (route.length > 1) {
      const latLngs = route.map((p) => [p.lat, p.lng]) as [number, number][];
      L.polyline(latLngs, { color: "#DC2626", weight: 4, opacity: 0.7 }).addTo(layers);
      latLngs.forEach((p) => points.push(p));
    }

    if (points.length === 1) {
      map.setView(points[0], zoom ?? DEFAULT_ZOOM + 2);
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, route]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-80 w-full rounded-xl overflow-hidden border border-slate-200"}
    />
  );
}
