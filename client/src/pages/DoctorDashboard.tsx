import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import api from '../services/api.js';
import { Card, Icon, Pill, Badge, MetricCard, EmptyState } from '../ui/primitives.js';

export const DoctorDashboard: React.FC = () => {
  useDocumentTitle('Physician Portal - Clinical Workspace');
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load doctor dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

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
          toast.error('Failed to search patients from clinical registry.');
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

  return (
    <div className="min-h-screen bg-canvas pb-16">
      {/* Clinician Header */}
      <div className="border-b border-hair bg-white">
        <div className="mx-auto flex max-w-[1200px] 2xl:max-w-[1720px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 2xl:px-12 py-5">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-700 text-white shadow-sm">
              <Icon.Stethoscope size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary-700">{greeting}</span>
                <span className="text-xs text-ink-400">•</span>
                <span className="text-xs text-ink-600 font-medium">{currentDateStr}</span>
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{doctorName}</h1>
              <p className="mt-0.5 text-sm text-ink-600">
                BMDC License: <span className="font-mono font-semibold text-ink-900">{doctorLicense}</span> • {hospitalName}
              </p>
            </div>
          </div>


        </div>
      </div>

      <main className="mx-auto max-w-[1200px] 2xl:max-w-[1720px] space-y-8 px-4 sm:px-6 lg:px-8 2xl:px-12 py-8">
        {/* Figma Search Bar with Dropdown Card */}
        <div className="relative" ref={searchContainerRef}>
          <div className="flex items-center gap-3 rounded-2xl border border-hair bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-50 focus-within:shadow-md">
            {isSearching ? (
              <Icon.Loader size={20} className="text-primary-700" />
            ) : (
              <Icon.Search size={20} className="text-ink-400" />
            )}
            <input
              aria-label="Search patients"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search Patient by Medra-UID, National ID, Name, or Mobile Number..."
              className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-ink-400 hover:bg-slate-100 hover:text-ink-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Match / Live Search Results Card */}
          {(searchResults.length > 0 || (searchFocused && searchQuery.length > 1)) && (
            <Card className="absolute left-0 right-0 z-20 mt-2 overflow-hidden p-0 shadow-xl border-primary-100">
              <div className="flex items-center justify-between border-b border-hair bg-canvas px-5 py-3">
                <p className="text-xs font-semibold text-ink-900">
                  {isSearching
                    ? 'Searching database...'
                    : searchResults.length > 0
                    ? `${searchResults.length} Matching Patient Records`
                    : 'Search Results'}
                </p>
                <button
                  type="button"
                  onClick={() => setSearchFocused(false)}
                  className="rounded-lg px-2 py-0.5 text-xs font-semibold text-ink-600 hover:bg-slate-200 transition-colors"
                >
                  Close [Esc]
                </button>
              </div>

              {searchResults.length > 0 ? (
                <div className="divide-y divide-hair max-h-80 overflow-y-auto">
                  {searchResults.map((pt) => {
                    const initials = pt.full_name
                      ? pt.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                      : 'PT';
                    return (
                      <div key={pt.id} className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-canvas transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-700 font-bold text-white shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-ink-900">
                              {pt.full_name} <span className="ml-1 font-mono text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">{pt.patient_uid}</span>
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <Pill tone="crimson">{pt.blood_group || 'Blood N/A'}</Pill>
                              <span className="text-xs text-ink-600">
                                {pt.gender} • {pt.date_of_birth ? `${new Date().getFullYear() - new Date(pt.date_of_birth).getFullYear()} Yrs` : 'Adult'}
                              </span>
                              <span className="text-xs font-mono text-ink-600">📱 {pt.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/patient/timeline/${pt.id}`}
                            className="min-h-[36px] inline-flex items-center justify-center rounded-xl border border-hair bg-white px-3.5 py-1.5 text-xs font-semibold text-primary-700 transition-all hover:border-hair-strong hover:bg-slate-50"
                          >
                            Review Timeline
                          </Link>
                          <Link
                            to={`/doctor/new-consultation?patientId=${pt.id}`}
                            className="min-h-[36px] inline-flex items-center justify-center rounded-xl bg-primary-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-800"
                          >
                            Open Consultation
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !isSearching && searchQuery.length > 1 ? (
                <div className="p-4">
                  <EmptyState
                    icon={<Icon.Search size={22} />}
                    title={`No patient records matching "${searchQuery}"`}
                    description="Try searching by full Medra-UID, mobile phone number, or national identification."
                  />
                </div>
              ) : null}
            </Card>
          )}
        </div>

        {/* 4 Standardized Metric KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Today's Appointment Queue"
            value={data?.stats?.todayAppointmentsCount || 0}
            subtext="Patients waiting"
            icon={<Icon.Clock size={22} />}
            iconTone="blue"
            status={{ label: "Live Queue", tone: "blue" }}
          />

          <MetricCard
            title="Total Consultations"
            value={data?.stats?.totalConsultations || 0}
            subtext="Visits logged to date"
            icon={<Icon.CheckCircle size={22} />}
            iconTone="emerald"
            status={{ label: "Active", tone: "emerald" }}
          />

          <MetricCard
            title="E-Prescriptions Issued"
            value={data?.stats?.totalPrescriptionsIssued || 0}
            subtext="Cryptographically signed"
            icon={<Icon.File size={22} />}
            iconTone="purple"
          />

        </div>

        {/* Main Workstation: 3 Columns on 2xl */}
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-[1.1fr_1.1fr_360px]">
          {/* Today's Scheduled Queue */}
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-hair pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-50 text-primary-700">
                  <Icon.Clock size={16} />
                </div>
                <h2 className="font-display text-lg font-bold tracking-tight text-ink-900">Today's Scheduled Consultations</h2>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {data?.todayAppointments && data.todayAppointments.length > 0 ? (
                data.todayAppointments.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-xl border border-hair bg-canvas p-4 transition-colors hover:bg-white"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary-700">{apt.time_slot}</span>
                        <span className="text-sm font-bold text-ink-900">{apt.patient_name}</span>
                        <span className="font-mono text-xs text-ink-400">({apt.patient_uid})</span>
                      </div>
                      <p className="mt-1 text-xs text-ink-600">{apt.reason || 'General Follow-up Consultation'}</p>
                    </div>

                    <Link
                      to={`/doctor/new-consultation?patientId=${apt.patient_id}&appointmentId=${apt.id}`}
                      className="rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-800"
                    >
                      Consult Now
                    </Link>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-hair-strong bg-canvas px-6 py-8 text-center">
                  <img
                    src="/assets/queue_empty.png"
                    alt="All clinical appointments completed"
                    className="mb-3 h-24 w-auto object-contain transition-transform duration-200 hover:scale-105"
                    loading="lazy"
                  />
                  <p className="text-sm font-bold text-ink-900">No appointments pending in queue</p>
                  <p className="mt-1 max-w-xs text-xs text-ink-600">
                    All patient consultations for this clinical shift are completed or ready for check-in.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Clinical Records Logged */}
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-hair pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-success">
                  <Icon.Stethoscope size={16} />
                </div>
                <h2 className="font-display text-lg font-bold tracking-tight text-ink-900">Recent Clinical Records Logged</h2>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {data?.recentConsultations && data.recentConsultations.length > 0 ? (
                data.recentConsultations.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-hair bg-canvas p-4 transition-colors hover:bg-white"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink-900">{c.patient_name}</span>
                        <span className="font-mono text-xs text-ink-400">({c.record_uid})</span>
                      </div>
                      <p className="mt-1 text-xs text-ink-600 line-clamp-1">{c.chief_complaint}</p>
                      <p className="mt-0.5 font-mono text-xs text-ink-400">
                        {new Date(c.visit_date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/patient/timeline/${c.patient_id}`}
                        className="rounded-lg border border-hair px-3 py-1.5 text-xs font-semibold text-primary-700 hover:border-hair-strong"
                      >
                        Timeline
                      </Link>
                      {c.prescription_id && (
                        <Link
                          to={`/prescription/${c.prescription_id}`}
                          className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-success hover:bg-emerald-100"
                        >
                          Rx ℞
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-hair-strong bg-canvas py-10 px-4 text-center">
                  <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-success">
                    <Icon.Stethoscope size={20} />
                  </div>
                  <p className="text-sm font-bold text-ink-900">No consultations logged yet</p>
                  <p className="mt-1 text-xs text-ink-600">
                    New consultations completed in this session will appear here in real-time.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* 3rd Column: Clinical Quick Actions & Chamber Telemetry (Visible on 2xl or tablet/mobile stacked) */}
          <div className="space-y-6 lg:col-span-2 2xl:col-span-1">
            {/* Quick Actions Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between border-b border-hair pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-50 text-primary-700">
                    <Icon.Activity size={16} />
                  </div>
                  <h2 className="font-display text-lg font-bold tracking-tight text-ink-900">Clinical Quick Actions</h2>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <Link
                  to="/doctor/new-consultation"
                  className="flex items-center justify-between rounded-xl bg-primary-700 p-3.5 text-white transition-all hover:bg-primary-800 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 text-white">
                      <Icon.Plus size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">New Walk-In Consultation</p>
                      <p className="text-xs text-primary-100">Ad-hoc patient intake &amp; prescription</p>
                    </div>
                  </div>
                  <Icon.Arrow size={14} className="text-blue-200" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    const input = searchContainerRef.current?.querySelector('input');
                    input?.focus();
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-hair bg-canvas p-3 text-left transition-colors hover:bg-white hover:border-hair-strong"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-primary-700 border border-hair">
                      <Icon.Search size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-900">Lookup Medical Archive</p>
                      <p className="text-[11px] text-ink-600">Search by NID or Medra-UID</p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-ink-400 border border-hair px-1.5 py-0.5 rounded bg-white">⌘K</span>
                </button>
              </div>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
};
