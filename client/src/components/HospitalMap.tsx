import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { HospitalResult, LatLng } from '../services/osmHospitals.js';

const DHAKA: LatLng = { lat: 23.8103, lng: 90.4125 };

interface HospitalMapProps {
  center: LatLng | null;
  hospitals: HospitalResult[];
  selectedId: string | null;
  onSelect: (placeId: string) => void;
}

/** Numbered pin drawn with HTML, so no marker image assets are needed. */
function numberedIcon(n: number, selected: boolean): L.DivIcon {
  const bg = selected ? '#9f1239' : '#be123c';
  return L.divIcon({
    className: '',
    html: `<div style="display:grid;place-items:center;width:28px;height:28px;border-radius:9999px;background:${bg};color:#fff;font:700 12px/1 Inter,sans-serif;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/**
 * Leaflet map with free OpenStreetMap tiles: a blue dot for the search location and a
 * numbered pin per hospital. Clicking a pin selects the matching result card.
 */
export const HospitalMap: React.FC<HospitalMapProps> = ({ center, hospitals, selectedId, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([DHAKA.lat, DHAKA.lng], 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!center) return;

    L.circleMarker([center.lat, center.lng], {
      radius: 8,
      color: '#fff',
      weight: 2.5,
      fillColor: '#1d4ed8',
      fillOpacity: 1,
    })
      .bindTooltip('Your location')
      .addTo(layer);

    hospitals.forEach((h, idx) => {
      L.marker([h.lat, h.lng], {
        icon: numberedIcon(idx + 1, h.placeId === selectedId),
        title: h.name,
        alt: `${idx + 1}. ${h.name}`,
        keyboard: true,
      })
        .on('click', () => onSelect(h.placeId))
        .addTo(layer);
    });
  }, [center, hospitals, selectedId, onSelect]);

  // Re-frame only when the results change, not when a pin is selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    const points: L.LatLngTuple[] = [[center.lat, center.lng], ...hospitals.map((h) => [h.lat, h.lng] as L.LatLngTuple)];
    if (hospitals.length > 0) map.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: 15 });
    else map.setView([center.lat, center.lng], 13);
  }, [center, hospitals]);

  return (
    <div
      ref={containerRef}
      id="hospital-map"
      role="region"
      aria-label="Map of nearby hospitals"
      className="w-full rounded-2xl border border-hair shadow-sm overflow-hidden z-0"
      style={{ height: '340px', background: '#f0f0f0' }}
    />
  );
};
