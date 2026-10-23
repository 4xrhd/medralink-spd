import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Icon } from '../ui/primitives.js';
import { cn } from '../utils/cn.js';
import { SPECIALTIES, SpecialtyValue } from '../constants/specialties.js';

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
/* -------------------------------------------------------------------------- */

interface HospitalResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  openNow: boolean | null;
  phone: string | null;
  photoUrl: string | null;
  distanceKm: number | null;
  rating: number | null;
}

interface LatLng {
  lat: number;
  lng: number;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

function fmtDist(km: number | null): string {
  if (km === null) return '-';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function googleMapsDirectionsUrl(lat: number, lng: number, name: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`;
}

/* -------------------------------------------------------------------------- */
/*  Declare google maps on window                                               */
/* -------------------------------------------------------------------------- */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export const HospitalSearchPage: React.FC = () => {
  useDocumentTitle('Emergency Hospital Search | MedraLink');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const googleMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geocoderRef = useRef<any>(null);

  const [mapsReady, setMapsReady] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [hospitals, setHospitals] = useState<HospitalResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSpecialty = searchParams.get('specialty') ?? '';
  const [specialty, setSpecialtyState] = useState<SpecialtyValue>(
    SPECIALTIES.some((s) => s.value === initialSpecialty) ? (initialSpecialty as SpecialtyValue) : ''
  );
  // Keep the filter in the URL so a filtered search can be linked and shared
  const setSpecialty = (value: SpecialtyValue) => {
    setSpecialtyState(value);
    setSearchParams(value ? { specialty: value } : {}, { replace: true });
  };
  const specialtyLabel = SPECIALTIES.find((s) => s.value === specialty)?.label ?? 'All hospitals';

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  /* ---- Load Google Maps script ------------------------------------------- */
  useEffect(() => {
    if (!apiKey) return;

    if (window.google?.maps) {
      setMapsReady(true);
      return;
    }

    const existing = document.querySelector('script[data-gmaps]');
    if (existing) {
      existing.addEventListener('load', () => setMapsReady(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-gmaps', 'true');
    script.addEventListener('load', () => setMapsReady(true));
    document.head.appendChild(script);
  }, [apiKey]);

  /* ---- Init map when script ready ---------------------------------------- */
  useEffect(() => {
    if (!mapsReady || !mapRef.current) return;
    if (googleMapRef.current) return;

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: { lat: 23.8103, lng: 90.4125 }, // Dhaka default
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    });

    geocoderRef.current = new window.google.maps.Geocoder();
  }, [mapsReady]);

  /* ---- GPS auto-detect on mount ------------------------------------------ */
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setGpsLoading(false);
      },
      () => {
        setLocationError(true);
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  /* ---- Place markers on map ---------------------------------------------- */
  const placeMarkers = useCallback((results: HospitalResult[], center: LatLng) => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // User location marker
    new window.google.maps.Marker({
      position: center,
      map: googleMapRef.current,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#2563EB',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2.5,
      },
    });

    googleMapRef.current.setCenter(center);
    googleMapRef.current.setZoom(13);

    results.forEach((h, idx) => {
      const marker = new window.google.maps.Marker({
        position: { lat: h.lat, lng: h.lng },
        map: googleMapRef.current,
        title: h.name,
        label: {
          text: String(idx + 1),
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '11px',
        },
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
          fillColor: '#DC2626',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 1.5,
          scale: 1.6,
          anchor: new window.google.maps.Point(12, 22),
          labelOrigin: new window.google.maps.Point(12, 9),
        },
      });
      markersRef.current.push(marker);
      marker.addListener('click', () => {
        setSelectedId(h.placeId);
        document.getElementById(`hospital-card-${h.placeId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }, []);

  /* ---- Core search logic ------------------------------------------------- */
  const specialtyKeyword = SPECIALTIES.find((s) => s.value === specialty)?.keyword ?? '';
  const doSearch = useCallback(
    (loc: LatLng) => {
      if (!mapsReady || !googleMapRef.current) return;

      setSearching(true);
      setSearched(false);
      setHospitals([]);

      const service = new window.google.maps.places.PlacesService(googleMapRef.current);
      service.nearbySearch(
        {
          location: loc,
          rankBy: window.google.maps.places.RankBy.DISTANCE,
          type: 'hospital',
          ...(specialtyKeyword ? { keyword: specialtyKeyword } : {}),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (results: any[], status: string) => {
          setSearching(false);
          setSearched(true);

          const OK = 'OK';
          const ZERO = 'ZERO_RESULTS';
          if (status !== OK && status !== ZERO) {
            setHospitals([]);
            return;
          }

          const mapped: HospitalResult[] = (results || []).slice(0, 15).map((r: any) => {
            const lat = r.geometry?.location?.lat() ?? 0;
            const lng = r.geometry?.location?.lng() ?? 0;
            const photoRef = r.photos?.[0];
            const photoUrl = photoRef
              ? photoRef.getUrl({ maxWidth: 200, maxHeight: 200 })
              : null;

            return {
              placeId: r.place_id ?? String(Math.random()),
              name: r.name ?? 'Unknown Hospital',
              address: r.vicinity ?? '-',
              lat,
              lng,
              openNow: r.opening_hours?.isOpen() ?? null,
              phone: null,
              photoUrl,
              distanceKm: haversineKm(loc, { lat, lng }),
              rating: r.rating ?? null,
            };
          });

          // Sort by distance
          mapped.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
          setHospitals(mapped);
          placeMarkers(mapped, loc);
        }
      );
    },
    [mapsReady, placeMarkers, specialtyKeyword]
  );

  /* ---- Search whenever location + maps are ready ------------------------- */
  useEffect(() => {
    if (userLocation && mapsReady && googleMapRef.current) {
      doSearch(userLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, mapsReady, specialty]);

  /* ---- Manual address geocode -------------------------------------------- */
  const handleManualSearch = () => {
    if (!manualAddress.trim() || !geocoderRef.current) return;
    geocoderRef.current.geocode({ address: manualAddress }, (results: any[], status: string) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const loc: LatLng = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };
        setUserLocation(loc);
        setLocationError(false);
      }
    });
  };

  /* ---- GPS retry --------------------------------------------------------- */
  const retryGps = () => {
    setGpsLoading(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setLocationError(true);
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  /* ---- No API key guard -------------------------------------------------- */
  if (!apiKey) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-100 text-rose-600">
          <Icon.Alert size={32} />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-ink-900">Google Maps API Key Missing</h1>
          <p className="mt-2 max-w-sm text-sm text-ink-600">
            Add{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-rose-700">
              VITE_GOOGLE_MAPS_API_KEY
            </code>{' '}
            to your{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">client/.env</code>{' '}
            file and restart the dev server.
          </p>
        </div>
        <Link
          to="/patient"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
        >
          <Icon.Arrow size={14} className="rotate-180" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  /* ---- Render ------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-canvas pb-20">

      {/* Emergency Banner Header */}
      <div className="bg-gradient-to-r from-rose-700 to-rose-600 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
                <Icon.Hospital size={24} className="text-white" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
                  Emergency Hospital Finder
                </h1>
                <p className="mt-0.5 text-sm text-rose-100">
                  Locate the nearest hospital to your current position
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left backdrop-blur-sm">
              <p className="text-xs font-medium text-rose-200">National Emergency Hotline</p>
              <a
                href="tel:16263"
                className="mt-0.5 font-mono text-lg font-bold text-white hover:underline"
              >
                16263
              </a>
              <p className="text-[11px] text-rose-200">Toll-free 24/7 medical triage</p>
            </div>
          </div>

          {/* Location Status Bar */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            {gpsLoading ? (
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white">
                <Icon.Loader size={16} className="text-white" />
                <span>Detecting your location via GPS...</span>
              </div>
            ) : userLocation && !locationError ? (
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white">
                <Icon.MapPin size={16} className="text-rose-200 shrink-0" />
                <span>Location detected - searching nearby hospitals</span>
                <button
                  type="button"
                  onClick={retryGps}
                  className="ml-2 rounded-lg bg-white/10 px-2 py-0.5 text-xs font-semibold hover:bg-white/20 transition-colors cursor-pointer"
                >
                  Refresh
                </button>
              </div>
            ) : (
              /* Manual fallback */
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1">
                  <Icon.MapPin
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-300 pointer-events-none"
                  />
                  <input
                    id="hospital-manual-location"
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                    placeholder="Type your city or address..."
                    className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-4 text-sm text-white placeholder-rose-300 outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <button
                  type="button"
                  id="hospital-manual-search-btn"
                  onClick={handleManualSearch}
                  disabled={!manualAddress.trim() || !mapsReady}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-rose-700 shadow-sm transition-colors hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Search
                </button>
                {locationError && (
                  <button
                    type="button"
                    onClick={retryGps}
                    title="Retry GPS"
                    className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <Icon.MapPin size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-6 space-y-5">

        {/* Specialization filter */}
        <div className="flex flex-col gap-2 rounded-2xl border border-hair bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor="hospital-specialty" className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Icon.Stethoscope size={16} className="text-primary-700" />
            Specialization
          </label>
          <select
            id="hospital-specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value as SpecialtyValue)}
            className="h-10 w-full rounded-xl border border-hair-strong bg-white px-3 text-sm text-ink-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 sm:w-72"
          >
            {SPECIALTIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Embedded Google Map */}
        <div
          ref={mapRef}
          id="hospital-map"
          className="w-full rounded-2xl border border-hair shadow-sm overflow-hidden"
          style={{ height: '340px', background: '#f0f0f0' }}
          aria-label="Nearby hospitals map"
        >
          {!mapsReady && (
            <div className="flex h-full items-center justify-center gap-2 text-ink-500">
              <Icon.Loader size={20} />
              <span className="text-sm font-medium">Loading map...</span>
            </div>
          )}
        </div>

        {/* Results Header */}
        {searched && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-600">
              {hospitals.length > 0
                ? `Showing ${hospitals.length} ${specialty ? `${specialtyLabel} ` : ''}hospitals near you, sorted by distance`
                : `No ${specialty ? `${specialtyLabel} ` : ''}hospitals found in this area`}
            </p>
          </div>
        )}

        {/* Searching spinner */}
        {searching && !searched && (
          <div className="flex items-center justify-center gap-3 py-12 text-ink-500">
            <Icon.Loader size={24} />
            <span className="text-sm font-medium">Finding nearby hospitals...</span>
          </div>
        )}

        {/* Hospital Result Cards */}
        {hospitals.length > 0 && (
          <div className="space-y-3" role="list" aria-label="Nearby hospital results">
            {hospitals.map((h, idx) => (
              <div
                key={h.placeId}
                id={`hospital-card-${h.placeId}`}
                role="listitem"
                onClick={() => setSelectedId(h.placeId)}
                className={cn(
                  'flex gap-4 rounded-2xl border bg-white p-4 shadow-sm transition-all cursor-pointer',
                  selectedId === h.placeId
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : 'border-hair hover:border-rose-200 hover:shadow-md'
                )}
              >
                {/* Rank Badge + Photo */}
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-rose-600 text-xs font-bold text-white shadow-sm">
                    {idx + 1}
                  </div>
                  {h.photoUrl ? (
                    <img
                      src={h.photoUrl}
                      alt={`${h.name} photo`}
                      className="h-[72px] w-[72px] rounded-xl object-cover border border-hair"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-xl bg-rose-50 border border-rose-100">
                      <Icon.Hospital size={28} className="text-rose-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2">
                    <h2 className="font-display text-sm font-bold text-ink-900 leading-tight">
                      {h.name}
                    </h2>
                    {h.openNow !== null && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0',
                          h.openNow
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            h.openNow ? 'bg-emerald-500' : 'bg-rose-500'
                          )}
                        />
                        {h.openNow ? 'Open Now' : 'Closed'}
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-600">
                    <span className="flex items-center gap-1">
                      <Icon.MapPin size={12} className="text-rose-500 shrink-0" />
                      <span className="truncate max-w-[200px]">{h.address}</span>
                    </span>
                    {h.distanceKm !== null && (
                      <span className="flex items-center gap-1 font-semibold text-rose-700">
                        <Icon.Navigation size={12} className="shrink-0" />
                        {fmtDist(h.distanceKm)} away
                      </span>
                    )}
                    {h.rating !== null && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <span className="text-amber-400">*</span>
                        {h.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {h.phone ? (
                      <a
                        href={`tel:${h.phone}`}
                        id={`hospital-call-${h.placeId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                      >
                        <Icon.Phone size={13} />
                        Call
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-hair bg-slate-50 px-3 py-1.5 text-xs font-medium text-ink-400 cursor-default">
                        <Icon.Phone size={13} />
                        Call (N/A)
                      </span>
                    )}
                    <a
                      href={googleMapsDirectionsUrl(h.lat, h.lng, h.name)}
                      id={`hospital-directions-${h.placeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-blue-100"
                    >
                      <Icon.Navigation size={13} />
                      Get Directions
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {searched && hospitals.length === 0 && !searching && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-hair bg-white py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-400">
              <Icon.Hospital size={28} />
            </div>
            <div>
              <p className="font-display text-base font-bold text-ink-900">
                No hospitals found nearby
              </p>
              <p className="mt-1 text-sm text-ink-600">
                {specialty
                  ? `No ${specialtyLabel} hospitals were found near this location.`
                  : 'Try a different location using the address input above.'}
              </p>
            </div>
            {specialty && (
              <button
                type="button"
                onClick={() => setSpecialty('')}
                className="rounded-xl border border-hair bg-white px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-slate-50"
              >
                Show all hospitals
              </button>
            )}
          </div>
        )}

        {/* Waiting for location */}
        {!searched && !searching && !userLocation && !gpsLoading && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-hair bg-white py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-primary-700">
              <Icon.MapPin size={28} />
            </div>
            <div>
              <p className="font-display text-base font-bold text-ink-900">
                Enter your location to begin
              </p>
              <p className="mt-1 text-sm text-ink-600">
                Allow location access above, or type your city to find nearby hospitals.
              </p>
            </div>
          </div>
        )}

        {/* Safety footer */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <Icon.Alert size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="text-xs text-amber-900">
              <p className="font-bold">In a life-threatening emergency, call 999 or 16263 immediately.</p>
              <p className="mt-0.5 font-normal">
                Hospital availability and open/closed status is sourced from Google Places and may not reflect real-time emergency room capacity. Always call ahead for critical care.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalSearchPage;
