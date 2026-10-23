import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Icon } from '../ui/primitives.js';
import { cn } from '../utils/cn.js';
import { HospitalMap } from '../components/HospitalMap.js';
import { SPECIALTIES, type SpecialtyValue } from '../constants/specialties.js';
import { filterBySpecialty, findHospitalsNear, geocodeAddress, type HospitalResult, type LatLng } from '../services/osmHospitals.js';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function fmtDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Plain Google Maps link: opening it needs no API key. */
function googleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export const HospitalSearchPage: React.FC = () => {
  useDocumentTitle('Emergency Hospital Search | MedraLink');

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [nearby, setNearby] = useState<HospitalResult[]>([]);
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

  /* ---- GPS auto-detect on mount ------------------------------------------ */
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
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
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  /* ---- Load hospitals when the location changes -------------------------- */
  useEffect(() => {
    if (!userLocation) return;
    let cancelled = false;
    setSearching(true);
    setSearched(false);
    setSearchError('');
    setSelectedId(null);
    findHospitalsNear(userLocation)
      .then((results) => {
        if (!cancelled) setNearby(results);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setNearby([]);
        setSearchError(err.message);
      })
      .finally(() => {
        if (cancelled) return;
        setSearching(false);
        setSearched(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userLocation]);

  // Specialty filtering runs in the browser: changing it needs no new request
  const hospitals = useMemo(() => filterBySpecialty(nearby, specialty), [nearby, specialty]);

  /* ---- Typed address (OpenStreetMap Nominatim) --------------------------- */
  const handleManualSearch = async () => {
    if (!manualAddress.trim()) return;
    setAddressError('');
    try {
      const loc = await geocodeAddress(manualAddress.trim());
      if (!loc) {
        setAddressError('We could not find that place. Try a city or area name.');
        return;
      }
      setUserLocation(loc);
      setLocationError(false);
    } catch (err) {
      setAddressError((err as Error).message);
    }
  };

  const selectHospital = useCallback((placeId: string) => {
    setSelectedId(placeId);
    document.getElementById(`hospital-card-${placeId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

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

          {/* Location: GPS status plus a typed address that always works */}
          <div className="mt-4 space-y-2">
            <p className="flex items-center gap-2 text-sm text-white" role="status">
              {gpsLoading ? (
                <>
                  <Icon.Loader size={16} className="text-white" />
                  Detecting your location via GPS...
                </>
              ) : userLocation ? (
                <>
                  <Icon.MapPin size={16} className="shrink-0 text-rose-100" />
                  Searching around your chosen location
                </>
              ) : (
                <>
                  <Icon.MapPin size={16} className="shrink-0 text-rose-100" />
                  {locationError ? 'Location access is off. Type your area below.' : 'Type your area below.'}
                </>
              )}
              <button
                type="button"
                onClick={detectLocation}
                className="ml-1 rounded-lg bg-white/15 px-2 py-0.5 text-xs font-semibold hover:bg-white/25 transition-colors cursor-pointer"
              >
                Use my location
              </button>
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleManualSearch();
              }}
            >
              <label htmlFor="hospital-manual-location" className="sr-only">
                City, area or address
              </label>
              <div className="relative flex-1">
                <Icon.MapPin
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-100 pointer-events-none"
                />
                <input
                  id="hospital-manual-location"
                  type="text"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="City, area or address (e.g. Dhanmondi, Dhaka)"
                  aria-describedby={addressError ? 'hospital-address-error' : undefined}
                  className="w-full rounded-xl border border-white/30 bg-white/10 py-2.5 pl-9 pr-4 text-sm text-white placeholder-rose-100 outline-none focus:ring-2 focus:ring-white/60"
                />
              </div>
              <button
                type="submit"
                id="hospital-manual-search-btn"
                disabled={!manualAddress.trim()}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-rose-800 shadow-sm transition-colors hover:bg-rose-50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                Search
              </button>
            </form>
            {addressError && (
              <p id="hospital-address-error" role="alert" className="text-xs font-semibold text-white">
                {addressError}
              </p>
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

        {/* Free OpenStreetMap map (no API key) */}
        <HospitalMap center={userLocation} hospitals={hospitals} selectedId={selectedId} onSelect={selectHospital} />

        {searchError && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {searchError}
          </p>
        )}

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
                  <div className="flex h-[56px] w-[56px] items-center justify-center rounded-xl bg-rose-50 border border-rose-100">
                    <Icon.Hospital size={24} className="text-rose-700" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2">
                    <h2 className="font-display text-sm font-bold text-ink-900 leading-tight">
                      {h.name}
                    </h2>
                    {h.emergency && (
                      <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800 shrink-0">
                        24/7 Emergency
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-600">
                    <span className="flex items-center gap-1">
                      <Icon.MapPin size={12} className="text-rose-500 shrink-0" />
                      <span className="truncate max-w-[200px]">{h.address}</span>
                    </span>
                    {(
                      <span className="flex items-center gap-1 font-semibold text-rose-700">
                        <Icon.Navigation size={12} className="shrink-0" />
                        {fmtDist(h.distanceKm)} away
                      </span>
                    )}
                    {h.specialities.length > 0 && (
                      <span className="capitalize">{h.specialities.slice(0, 3).join(', ').replace(/_/g, ' ')}</span>
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
                      href={googleMapsDirectionsUrl(h.lat, h.lng)}
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
                Allow location access above, or type your area to find nearby hospitals.
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
                Hospital data comes from OpenStreetMap, a free community map, and may be incomplete or out of date. It does not show real-time emergency room capacity. Always call ahead for critical care.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalSearchPage;
