import { SPECIALTIES, type SpecialtyValue } from '../constants/specialties.js';

/**
 * Free hospital search built on OpenStreetMap data (no API key, no billing).
 * Inside Bangladesh it searches a bundled snapshot (public/data/hospitals-bd.json, refreshed by
 * scripts/fetch-hospitals.mjs), so it is instant and cannot be rate-limited. Elsewhere it queries
 * the public Overpass API. Typed addresses are resolved with Nominatim.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface HospitalResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  emergency: boolean;
  specialities: string[];
  distanceKm: number;
}

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const OVERPASS_SERVERS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const OVERPASS_TIMEOUT_MS = 15000;
const BD_SNAPSHOT_URL = '/data/hospitals-bd.json';
// Bounding box of Bangladesh; points inside use the bundled snapshot
const BD_BOUNDS = { minLat: 20.5, maxLat: 26.7, minLng: 88.0, maxLng: 92.7 };
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const SEARCH_RADIUS_M = 10000;
const MAX_RESULTS = 15;

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

export function buildOverpassQuery(loc: LatLng, radiusM: number = SEARCH_RADIUS_M): string {
  const around = `(around:${radiusM},${loc.lat},${loc.lng})`;
  return `[out:json][timeout:25];(nwr["amenity"="hospital"]${around};nwr["healthcare"="hospital"]${around};);out center tags;`;
}

function formatAddress(tags: Record<string, string>): string {
  const parts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb'], tags['addr:city']].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : tags['addr:full'] || '-';
}

export function parseOverpassHospitals(data: { elements?: OverpassElement[] }, origin: LatLng): HospitalResult[] {
  const seen = new Set<string>();
  const results: HospitalResult[] = [];

  for (const el of data?.elements ?? []) {
    const tags = el.tags ?? {};
    const name = tags['name:en'] || tags.name;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    const placeId = `${el.type}/${el.id}`;
    if (!name || lat === undefined || lng === undefined || seen.has(placeId)) continue;
    seen.add(placeId);

    results.push({
      placeId,
      name,
      address: formatAddress(tags),
      lat,
      lng,
      phone: tags.phone || tags['contact:phone'] || null,
      website: tags.website || tags['contact:website'] || null,
      emergency: tags.emergency === 'yes',
      specialities: (tags['healthcare:speciality'] ?? '').split(';').map((s) => s.trim()).filter(Boolean),
      distanceKm: haversineKm(origin, { lat, lng }),
    });
  }

  return results.sort((a, b) => a.distanceKm - b.distanceKm);
}

export function matchesSpecialty(h: HospitalResult, specialty: SpecialtyValue): boolean {
  const def = SPECIALTIES.find((s) => s.value === specialty);
  if (!def || !def.names) return true;
  if (specialty === 'emergency' && h.emergency) return true;
  if (h.specialities.some((s) => (def.osm as readonly string[]).includes(s))) return true;
  return def.names.test(h.name);
}

export function isInBangladesh(loc: LatLng): boolean {
  return loc.lat >= BD_BOUNDS.minLat && loc.lat <= BD_BOUNDS.maxLat && loc.lng >= BD_BOUNDS.minLng && loc.lng <= BD_BOUNDS.maxLng;
}

let snapshotPromise: Promise<{ elements?: OverpassElement[] }> | null = null;

/** Loads the bundled Bangladesh snapshot once per page session. */
function loadBangladeshSnapshot(): Promise<{ elements?: OverpassElement[] }> {
  snapshotPromise ??= fetch(BD_SNAPSHOT_URL).then((res) => {
    if (!res.ok) throw new Error('Hospital data could not be loaded. Please refresh the page.');
    return res.json();
  });
  snapshotPromise.catch(() => {
    snapshotPromise = null; // allow a retry after a failed load
  });
  return snapshotPromise;
}

async function queryServer(server: string, query: string): Promise<{ elements?: OverpassElement[] }> {
  const res = await fetch(server, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(OVERPASS_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${server} responded ${res.status}`);
  return res.json();
}

/** Asks every public Overpass server at once and uses the first good answer. */
async function fetchOverpass(query: string): Promise<{ elements?: OverpassElement[] }> {
  try {
    return await Promise.any(OVERPASS_SERVERS.map((server) => queryServer(server, query)));
  } catch (err) {
    console.warn('[hospitals] all Overpass servers failed', err);
    throw new Error('Hospital search is temporarily unavailable. Please try again in a moment.');
  }
}

/**
 * All hospitals near a location, nearest first. Specialty filtering happens on this list in the
 * browser, so changing the filter never needs another network request.
 */
export async function findHospitalsNear(loc: LatLng): Promise<HospitalResult[]> {
  if (isInBangladesh(loc)) {
    return parseOverpassHospitals(await loadBangladeshSnapshot(), loc);
  }
  return parseOverpassHospitals(await fetchOverpass(buildOverpassQuery(loc)), loc);
}

export function filterBySpecialty(all: HospitalResult[], specialty: SpecialtyValue): HospitalResult[] {
  return all.filter((h) => matchesSpecialty(h, specialty)).slice(0, MAX_RESULTS);
}

export async function searchHospitals(loc: LatLng, specialty: SpecialtyValue): Promise<HospitalResult[]> {
  return filterBySpecialty(await findHospitalsNear(loc), specialty);
}

export async function geocodeAddress(query: string): Promise<LatLng | null> {
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Address lookup failed. Please try again.');
  const rows: Array<{ lat: string; lon: string }> = await res.json();
  return rows.length > 0 ? { lat: Number(rows[0].lat), lng: Number(rows[0].lon) } : null;
}
