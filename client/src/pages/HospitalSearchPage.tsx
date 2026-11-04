import { useLanguage } from '../context/LanguageContext.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Select } from '../ui/forms.js';
import { useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Badge, Button, buttonClasses, Card, Icon, Input, PageHeader, Skeleton } from '../ui/primitives.js';
import { cn } from '../utils/cn.js';
import { HospitalMap } from '../components/HospitalMap.js';
import { SuggestInput } from '../components/SuggestInput.js';
import { PLACES } from '../data/places.js';
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

function getHospitalThumbnail(h: HospitalResult): string {
  const text = (h.name + ' ' + h.specialities.join(' ')).toLowerCase();
  if (text.includes('cardiac') || text.includes('heart') || text.includes('cardio')) {
    return '/images/hospitals/cardiac-center.webp';
  }
  if (text.includes('trauma') || text.includes('emergency') || text.includes('ortho') || text.includes('diagnostic')) {
    return '/images/hospitals/trauma-center.webp';
  }
  return '/images/hospitals/general-hospital.webp';
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */

export const HospitalSearchPage: React.FC = () => {
  const { t: tr } = useLanguage();
  useDocumentTitle(tr('Emergency Hospital Search | MedraLink'));

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

  // Each location request takes a number; only the newest one may move the search
  const locationRequest = useRef(0);
  const [geocoding, setGeocoding] = useState(false);

  /* ---- GPS auto-detect on mount ------------------------------------------ */
  const detectLocation = useCallback(() => {
    const requestId = ++locationRequest.current;
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    setGpsLoading(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        // A place typed after the GPS prompt opened wins over a late GPS answer
        if (requestId !== locationRequest.current) return;
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setGpsLoading(false);
        if (requestId === locationRequest.current) setLocationError(true);
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
    if (!manualAddress.trim() || geocoding) return;
    const requestId = ++locationRequest.current;
    setAddressError('');
    setGeocoding(true);
    try {
      const loc = await geocodeAddress(manualAddress.trim());
      if (requestId !== locationRequest.current) return;
      if (!loc) {
        setAddressError(tr('We could not find that place. Try a city or area name.'));
        return;
      }
      setUserLocation(loc);
      setLocationError(false);
    } catch (err) {
      if (requestId === locationRequest.current) setAddressError((err as Error).message);
    } finally {
      setGeocoding(false);
    }
  };

  const selectHospital = useCallback((placeId: string) => {
    setSelectedId(placeId);
    document.getElementById(`hospital-card-${placeId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  /* ---- Render ------------------------------------------------------------ */
  const emptyBox = 'rounded-xl border border-dashed border-hair-strong bg-surface px-6 py-12 text-center';

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <PageHeader
        icon={<Icon.Hospital size={20} />}
        title={tr("Emergency Hospital Finder")}
        meta={<span>{tr("Locate the nearest hospital to your current position")}</span>}
        actions={
          <a href="tel:16263" className={buttonClasses({ variant: 'destructive' })} aria-label={`${tr("National Emergency Hotline")} 16263`}>
            <Icon.Phone size={15} />
            <span>{tr("National Emergency Hotline")}: <span className="font-mono">16263</span></span>
          </a>
        }
      />

      <div className="mx-auto max-w-[1720px] space-y-5 px-4 pt-6 sm:px-6 lg:px-8 2xl:px-12">
        {/* Where to search: typed address always works, GPS is optional */}
        <Card padding="sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_18rem] lg:items-end">
            <form
              className="min-w-0"
              onSubmit={(e) => {
                e.preventDefault();
                handleManualSearch();
              }}
            >
              <label htmlFor="hospital-manual-location" className="mb-1.5 block text-xs font-semibold text-ink-900">
                {tr("City, area or address")}
              </label>
              <div className="flex gap-2">
                <SuggestInput
                  id="hospital-manual-location"
                  value={manualAddress}
                  onChange={setManualAddress}
                  suggestions={PLACES}
                  placeholder={tr("City, area or address (e.g. Dhanmondi, Dhaka)")}
                  aria-describedby={addressError ? 'hospital-address-error' : 'hospital-location-status'}
                  error={Boolean(addressError)}
                  leftIcon={<Icon.MapPin size={15} />}
                />
                <Button type="submit" id="hospital-manual-search-btn" disabled={!manualAddress.trim() || geocoding} isLoading={geocoding} className="h-10 shrink-0">
                  {tr("Search")}
                </Button>
              </div>
            </form>
            <Button variant="secondary" onClick={detectLocation} icon={<Icon.Navigation size={15} />} className="h-10">
              {tr("Use my location")}
            </Button>
            <div>
              <label htmlFor="hospital-specialty" className="mb-1.5 block text-xs font-semibold text-ink-900">
                {tr("Specialization")}
              </label>
              <Select id="hospital-specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value as SpecialtyValue)}>
                {SPECIALTIES.map((s) => (
                  <option key={s.value} value={s.value}>{tr(s.label)}</option>
                ))}
              </Select>
            </div>
          </div>
          <p id="hospital-location-status" className="mt-2.5 flex items-center gap-2 text-xs text-ink-600" role="status">
            {gpsLoading ? (
              <>
                <Icon.Loader size={14} /> {tr("Detecting your location via GPS...")}
              </>
            ) : (
              <>
                <Icon.MapPin size={14} className="shrink-0 text-ink-400" />
                {userLocation
                  ? tr("Searching around your chosen location")
                  : locationError
                    ? tr('Location access is off. Type your area below.')
                    : tr('Type your area below.')}
              </>
            )}
          </p>
          {addressError && (
            <p id="hospital-address-error" role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-critical">
              <Icon.Alert size={13} /> {addressError}
            </p>
          )}
        </Card>

        {searchError && <Alert>{searchError}</Alert>}

        {/* Results list, with the map beside it on wide screens and under it on smaller ones */}
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-label={tr("Nearby hospital results")} className="space-y-3">
            {searched && (
              <p className="text-sm font-medium text-ink-600" aria-live="polite">
                {hospitals.length > 0
                  ? specialty
                    ? tr('Showing {n} {type} hospitals near you, sorted by distance', { n: hospitals.length, type: tr(specialtyLabel) })
                    : tr('Showing {n} hospitals near you, sorted by distance', { n: hospitals.length })
                  : specialty
                    ? tr('No {type} hospitals found in this area', { type: tr(specialtyLabel) })
                    : tr('No hospitals found in this area')}
              </p>
            )}

            {searching && !searched && (
              <div className="space-y-3" role="status" aria-label={tr("Finding nearby hospitals...")}>
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            )}

            {hospitals.length > 0 && (
              <ol className="space-y-3">
                {hospitals.map((h, idx) => (
                  <li
                    key={h.placeId}
                    id={`hospital-card-${h.placeId}`}
                    onClick={() => setSelectedId(h.placeId)}
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-xl border bg-surface p-4 shadow-card transition-colors sm:gap-4',
                      selectedId === h.placeId ? 'border-primary-600 ring-2 ring-primary-100' : 'border-hair hover:border-hair-strong'
                    )}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-900 text-xs font-semibold text-white tabular" aria-hidden="true">
                      {idx + 1}
                    </span>
                    <div className="hidden sm:block h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-hair">
                      <img
                        src={getHospitalThumbnail(h)}
                        alt=""
                        width={96}
                        height={80}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-sm font-semibold leading-snug text-ink-900 sm:text-base">{h.name}</h2>
                        {h.emergency && <Badge tone="crimson" size="sm">{tr('24/7 Emergency')}</Badge>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-600">
                        <span className="flex min-w-0 items-center gap-1">
                          <Icon.MapPin size={12} className="shrink-0 text-ink-400" />
                          <span className="truncate">{h.address}</span>
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-ink-900">
                          <Icon.Navigation size={12} className="shrink-0" />
                          {tr('{distance} away', { distance: fmtDist(h.distanceKm) })}
                        </span>
                        {h.specialities.length > 0 && (
                          <span className="capitalize">{h.specialities.slice(0, 3).join(', ').replace(/_/g, ' ')}</span>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
                        {h.phone ? (
                          <a
                            href={`tel:${h.phone}`}
                            id={`hospital-call-${h.placeId}`}
                            onClick={(e) => e.stopPropagation()}
                            className={buttonClasses({ size: 'sm', variant: 'danger-soft' })}
                          >
                            <Icon.Phone size={13} />
                            <span>{tr("Call")}</span>
                          </a>
                        ) : (
                          <span className={buttonClasses({ size: 'sm', variant: 'secondary', className: 'pointer-events-none opacity-60' })} aria-disabled="true">
                            <Icon.Phone size={13} />
                            <span>{tr("Call (N/A)")}</span>
                          </span>
                        )}
                        <a
                          href={googleMapsDirectionsUrl(h.lat, h.lng)}
                          id={`hospital-directions-${h.placeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={buttonClasses({ size: 'sm', variant: 'secondary' })}
                        >
                          <Icon.Navigation size={13} />
                          <span>{tr("Get Directions")}</span>
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {searched && hospitals.length === 0 && !searching && (
              <div className={emptyBox}>
                <Icon.Hospital size={26} className="mx-auto text-ink-400" />
                <p className="mt-3 font-display text-base font-semibold text-ink-900">{tr("No hospitals found nearby")}</p>
                <p className="mt-1 text-sm text-ink-600">
                  {specialty
                    ? tr('No {type} hospitals were found near this location.', { type: tr(specialtyLabel) })
                    : tr('Try a different location using the address input above.')}
                </p>
                {specialty && (
                  <Button variant="secondary" className="mt-4" onClick={() => setSpecialty('')}>
                    {tr("Show all hospitals")}
                  </Button>
                )}
              </div>
            )}

            {!searched && !searching && !userLocation && !gpsLoading && (
              <div className={emptyBox}>
                <Icon.MapPin size={26} className="mx-auto text-primary-700" />
                <p className="mt-3 font-display text-base font-semibold text-ink-900">{tr("Enter your location to begin")}</p>
                <p className="mt-1 text-sm text-ink-600">{tr("Allow location access above, or type your area to find nearby hospitals.")}</p>
              </div>
            )}
          </section>

          <div className="overflow-hidden rounded-xl border border-hair shadow-card lg:sticky lg:top-24">
            <HospitalMap center={userLocation} hospitals={hospitals} selectedId={selectedId} onSelect={selectHospital} />
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-xs text-amber-900 sm:px-5">
          <Icon.Alert size={16} className="mt-0.5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold">{tr("In a life-threatening emergency, call 999 or 16263 immediately.")}</p>
            <p className="mt-0.5">{tr("Hospital data comes from OpenStreetMap, a free community map, and may be incomplete or out of date. It does not show real-time emergency room capacity. Always call ahead for critical care.")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalSearchPage;
