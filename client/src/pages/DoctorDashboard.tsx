import { useLanguage } from '../context/LanguageContext.js';
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import api, { getApiErrorMessage, isCancelled } from '../services/api.js';
import { ageFromDob, formatServerDate } from '../utils/dates.js';
import { Button, ButtonLink, Card, Icon, Pill, MetricCard, EmptyState, PageHeader, Skeleton } from '../ui/primitives.js';

export const DoctorDashboard: React.FC = () => {
  const { t: tr } = useLanguage();
  useDocumentTitle(tr('Physician Portal - Clinical Workspace'));
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Patient Search State with useDebounce
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    api
      .get('/dashboard', { signal: controller.signal })
      .then((res) => setData(res.data.data))
      .catch((err) => {
        if (!isCancelled(err)) setLoadError(getApiErrorMessage(err, tr('Today\'s clinic data could not be loaded.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  // Lists show skeletons while loading and a neutral note after a failure, never a false "nothing today"
  const listPlaceholder = loading ? (
    <div className="space-y-2.5" role="status" aria-label={tr('Loading clinical portal module...')}>
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
    </div>
  ) : loadError ? (
    <p className="px-1 py-6 text-center text-sm text-ink-600">{tr('Not available until the dashboard loads.')}</p>
  ) : null;

  // Debounced search effect: eliminates high-frequency keystroke API requests
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let active = true;
    setIsSearching(true);

    api
      .get(`/patients?q=${encodeURIComponent(debouncedSearchQuery.trim())}`)
      .then((res) => {
        if (active) {
          setSearchResults(res.data.data || []);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Patient search error:', err);
          toast.error(tr('Failed to search patients from clinical registry.'));
        }
      })
      .finally(() => {
        if (active) {
          setIsSearching(false);
        }
      });

    return () => {
      active = false;
    };
  }, [debouncedSearchQuery, toast]);

  const handleSearchInput = (queryText: string) => {
    setSearchQuery(queryText);
    if (!queryText.trim()) {
      setSearchResults([]);
    }
  };

  const doctorName = user?.fullName || 'Physician';
  const doctorLicense = user?.doctorProfile?.bmdcLicenseNumber || '-';
  const hospitalName = user?.doctorProfile?.hospitalAffiliation || 'MedraLink Clinical Network';
  const departmentName = user?.doctorProfile?.specialization || 'Clinical Medicine';

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const currentDateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const listRow = 'flex flex-col gap-3 rounded-lg border border-hair bg-canvas/60 p-3.5 transition-colors hover:border-hair-strong hover:bg-white sm:flex-row sm:items-center sm:justify-between';

  return (
    <div className="min-h-screen bg-canvas pb-16">
      <PageHeader
        icon={<Icon.Stethoscope size={20} />}
        overline={<>{tr(greeting)} · {currentDateStr}</>}
        title={doctorName}
        meta={
          <>
            <span>
              {tr('BMDC License')}: <span className="font-mono font-semibold text-ink-900">{doctorLicense}</span>
            </span>
            <span className="hidden text-ink-400 sm:inline" aria-hidden="true">|</span>
            <span>{hospitalName}</span>
          </>
        }
        actions={
          <ButtonLink to="/doctor/new-consultation" icon={<Icon.Plus size={16} />}>
            {tr('New consultation')}
          </ButtonLink>
        }
      />

      <main className="mx-auto max-w-[1720px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 2xl:px-12">
        {/* Patient search with live results */}
        <div className="relative" ref={searchContainerRef}>
          <div className="flex h-12 items-center gap-3 rounded-lg border border-hair-strong bg-white px-4 shadow-card transition-colors focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-100">
            {isSearching ? (
              <Icon.Loader size={18} className="shrink-0 text-primary-700" />
            ) : (
              <Icon.Search size={18} className="shrink-0 text-ink-400" />
            )}
            <input
              aria-label={tr("Search patients")}
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder={tr("Search patients by name, ID or phone")}
              className="h-full w-full min-w-0 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
            />
            {searchQuery && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                {tr("Clear")}
              </Button>
            )}
          </div>

          {(searchResults.length > 0 || (searchFocused && searchQuery.length > 1)) && (
            <Card variant="elevated" className="absolute left-0 right-0 z-20 mt-2 overflow-hidden">
              <div className="flex items-center justify-between border-b border-hair bg-canvas px-4 py-2.5">
                <p className="text-xs font-semibold text-ink-900">
                  {isSearching
                    ? tr('Searching database...')
                    : searchResults.length > 0
                    ? tr('{n} matching patients', { n: searchResults.length })
                    : tr('Search Results')}
                </p>
                <Button size="sm" variant="ghost" onClick={() => setSearchFocused(false)}>
                  {tr('Close [Esc]')}
                </Button>
              </div>

              {searchResults.length > 0 ? (
                <div className="max-h-80 divide-y divide-hair overflow-y-auto">
                  {searchResults.map((pt) => {
                    const initials = pt.full_name
                      ? pt.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                      : tr('PT');
                    return (
                      <div key={pt.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-canvas sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-700 text-sm font-semibold text-white" aria-hidden="true">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-900">
                              {pt.full_name}
                              <span className="rounded-md bg-primary-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary-700">{pt.patient_uid}</span>
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-600">
                              <Pill tone="crimson">{pt.blood_group || tr('Blood N/A')}</Pill>
                              <span>
                                {pt.gender} · {ageFromDob(pt.date_of_birth) !== null ? tr('{n} yrs', { n: ageFromDob(pt.date_of_birth) as number }) : tr('Adult')}
                              </span>
                              {pt.phone && <span className="font-mono">{pt.phone}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:flex">
                          <ButtonLink size="sm" variant="secondary" to={`/patient/timeline/${pt.id}`}>
                            {tr("Review Timeline")}
                          </ButtonLink>
                          <ButtonLink size="sm" to={`/doctor/new-consultation?patientId=${pt.id}`}>
                            {tr("Open Consultation")}
                          </ButtonLink>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !isSearching && searchQuery.length > 1 ? (
                <div className="p-4">
                  <EmptyState
                    icon={<Icon.Search size={22} />}
                    title={tr('No patient records matching "{query}"', { query: searchQuery })}
                    description={tr("Try searching by full Medra-UID, mobile phone number, or national identification.")}
                  />
                </div>
              ) : null}
            </Card>
          )}
        </div>

        {/* Key figures */}
        {loadError ? (
          <EmptyState
            icon={<Icon.Alert size={22} className="text-critical" />}
            title={loadError}
            description={tr('Check your connection and try again.')}
            action={
              <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
                {tr('Try again')}
              </Button>
            }
          />
        ) : loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className={`h-[6.5rem] rounded-xl ${i === 0 ? 'col-span-2 lg:col-span-1' : ''}`} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 [&>*:first-child]:col-span-2 lg:[&>*:first-child]:col-span-1">
            <MetricCard
              title={tr("Today's Appointment Queue")}
              value={data?.stats?.todayAppointmentsCount || 0}
              subtext={tr("Patients waiting")}
              icon={<Icon.Clock size={16} />}
              iconTone="blue"
            />
            <MetricCard
              title={tr("Total Consultations")}
              value={data?.stats?.totalConsultations || 0}
              subtext={tr("Visits logged to date")}
              icon={<Icon.CheckCircle size={16} />}
              iconTone="emerald"
            />
            <MetricCard
              title={tr("E-Prescriptions Issued")}
              value={data?.stats?.totalPrescriptionsIssued || 0}
              subtext={tr("Cryptographically signed")}
              icon={<Icon.File size={16} />}
              iconTone="navy"
            />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-[1fr_1fr_360px]">
          <Card padding="sm" header={{ title: tr("Today's Scheduled Consultations"), icon: <Icon.Clock size={15} /> }}>
            <div className="space-y-2.5">
              {listPlaceholder ?? (data?.todayAppointments && data.todayAppointments.length > 0 ? (
                data.todayAppointments.map((apt: any) => (
                  <div key={apt.id} className={listRow}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary-700">{apt.time_slot}</span>
                        <span className="text-sm font-semibold text-ink-900">{apt.patient_name}</span>
                        <span className="font-mono text-xs text-ink-400">{apt.patient_uid}</span>
                      </div>
                      <p className="mt-1 text-xs text-ink-600">{apt.reason || tr('General Follow-up Consultation')}</p>
                    </div>
                    <ButtonLink size="sm" className="sm:shrink-0" to={`/doctor/new-consultation?patientId=${apt.patient_id}&appointmentId=${apt.id}`}>
                      {tr("Consult Now")}
                    </ButtonLink>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={<img src="/assets/queue_empty.png" alt="" className="h-8 w-8 object-contain" />}
                  title={tr("No appointments pending in queue")}
                  description={tr("All patient consultations for this clinical shift are completed or ready for check-in.")}
                />
              ))}
            </div>
          </Card>

          <Card padding="sm" header={{ title: tr("Recent Clinical Records Logged"), icon: <Icon.Stethoscope size={15} /> }}>
            <div className="space-y-2.5">
              {listPlaceholder ?? (data?.recentConsultations && data.recentConsultations.length > 0 ? (
                data.recentConsultations.map((c: any) => (
                  <div key={c.id} className={listRow}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink-900">{c.patient_name}</span>
                        <span className="font-mono text-xs text-ink-400">{c.record_uid}</span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-ink-600">{c.chief_complaint}</p>
                      <p className="mt-0.5 font-mono text-xs text-ink-400">{formatServerDate(c.visit_date)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                      <ButtonLink size="sm" variant="secondary" to={`/patient/timeline/${c.patient_id}`}>
                        {tr("Timeline")}
                      </ButtonLink>
                      {c.prescription_id && (
                        <ButtonLink size="sm" variant="success-soft" to={`/prescription/${c.prescription_id}`} icon={<Icon.File size={14} />}>
                          {tr('View ℞')}
                        </ButtonLink>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={<Icon.Stethoscope size={20} />}
                  title={tr("No consultations logged yet")}
                  description={tr("New consultations completed in this session will appear here in real-time.")}
                />
              ))}
            </div>
          </Card>

          <div className="lg:col-span-2 2xl:col-span-1">
            <Card padding="sm" header={{ title: tr("Clinical Quick Actions"), icon: <Icon.Activity size={15} /> }}>
              <div className="space-y-2">
                <Link
                  to="/doctor/new-consultation"
                  className="group/qa flex items-center justify-between gap-3 rounded-lg border border-primary-800/40 bg-primary-700 p-3 text-white transition-colors hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-white/15" aria-hidden="true">
                      <Icon.Plus size={16} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{tr("New Walk-In Consultation")}</span>
                      <span className="block text-xs text-primary-100">{tr("Ad-hoc patient intake & prescription")}</span>
                    </span>
                  </span>
                  <Icon.Arrow size={14} className="shrink-0 transition-transform duration-150 group-hover/qa:translate-x-0.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => searchContainerRef.current?.querySelector('input')?.focus()}
                  className="flex w-full items-center gap-3 rounded-lg border border-hair bg-white p-3 text-left transition-colors hover:border-hair-strong hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-md border border-hair bg-canvas text-primary-700" aria-hidden="true">
                    <Icon.Search size={15} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink-900">{tr("Lookup Medical Archive")}</span>
                    <span className="block text-xs text-ink-600">{tr("Search by NID or Medra-UID")}</span>
                  </span>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
