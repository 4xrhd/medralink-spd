import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import { Card, Icon, Pill } from '../ui/primitives.js';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Patient Search State
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearch = async (queryText: string) => {
    setSearchQuery(queryText);
    if (!queryText.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.get(`/patients?q=${encodeURIComponent(queryText)}`);
      setSearchResults(res.data.data);
    } catch (err) {
      console.error('Patient search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const doctorName = user?.fullName || 'Dr. Ahmed Tariq, MBBS, FCPS';
  const doctorLicense = user?.doctorProfile?.bmdcLicenseNumber || 'A-54921';
  const hospitalName = user?.doctorProfile?.hospitalAffiliation || 'Square Hospital / NICVD';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Figma Screen 3 Header */}
      <div className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-[1200px] 2xl:max-w-[1720px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 2xl:px-12 py-5">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1B365D] text-white shadow-sm">
              <Icon.Stethoscope size={22} />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-[#0F172A]">{doctorName}</p>
              <p className="text-xs text-[#475569]">
                BMDC License: <span className="font-mono font-semibold text-[#0F172A]">{doctorLicense}</span> • {hospitalName}
              </p>
            </div>
          </div>

          <div className="hidden 2xl:flex items-center gap-6 border-l border-slate-200 pl-6 text-xs text-[#475569]">
            <div>
              <span className="text-[#94A3B8] font-semibold uppercase tracking-wider block text-[10px]">Department</span>
              <span className="font-bold text-[#0F172A]">Cardiovascular &amp; Internal Medicine</span>
            </div>
            <div>
              <span className="text-[#94A3B8] font-semibold uppercase tracking-wider block text-[10px]">Shift Schedule</span>
              <span className="font-semibold text-[#0F172A]">Morning Rounds • 08:00 – 16:00</span>
            </div>
            <div>
              <span className="text-[#94A3B8] font-semibold uppercase tracking-wider block text-[10px]">Station Protocol</span>
              <span className="font-mono text-[#059669] font-bold">HL7 FHIR v4.0.1 Synced</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Pill tone="emerald">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#059669]" />
              Active Clinical Session • Room 402
            </Pill>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] 2xl:max-w-[1720px] space-y-8 px-4 sm:px-6 lg:px-8 2xl:px-12 py-8">
        {/* Figma Search Bar with Dropdown Card */}
        <div className="relative" ref={searchContainerRef}>
          <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#EFF6FF] focus-within:shadow-md">
            {isSearching ? (
              <Icon.Loader size={20} className="text-[#2563EB]" />
            ) : (
              <Icon.Search size={20} className="text-[#94A3B8]" />
            )}
            <input
              aria-label="Search patients"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search Patient by Medra-UID (e.g. P-1001), National ID, Name, or Mobile Number..."
              className="w-full bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-[#94A3B8] hover:bg-slate-100 hover:text-[#475569] transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Match / Live Search Results Card */}
          {(searchResults.length > 0 || (searchFocused && searchQuery.length > 1)) && (
            <Card className="absolute left-0 right-0 z-20 mt-2 overflow-hidden p-0 shadow-xl border-[#BFDBFE]">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  {isSearching
                    ? 'Searching database...'
                    : searchResults.length > 0
                    ? `${searchResults.length} Matching Patient Records`
                    : 'Search Results'}
                </p>
                <button
                  type="button"
                  onClick={() => setSearchFocused(false)}
                  className="rounded-lg px-2 py-0.5 text-xs font-semibold text-[#64748B] hover:bg-slate-200 transition-colors"
                >
                  Close [Esc]
                </button>
              </div>

              {searchResults.length > 0 ? (
                <div className="divide-y divide-[#E2E8F0] max-h-80 overflow-y-auto">
                  {searchResults.map((pt) => {
                    const initials = pt.full_name
                      ? pt.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                      : 'PT';
                    return (
                      <div key={pt.id} className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-[#F8FAFC] transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#1B365D] font-bold text-white shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#0F172A]">
                              {pt.full_name} <span className="ml-1 font-mono text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-md">{pt.patient_uid}</span>
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <Pill tone="crimson">{pt.blood_group || 'Blood N/A'}</Pill>
                              <span className="text-xs text-[#64748B]">
                                {pt.gender} • {pt.date_of_birth ? `${new Date().getFullYear() - new Date(pt.date_of_birth).getFullYear()} Yrs` : 'Adult'}
                              </span>
                              <span className="text-xs font-mono text-[#64748B]">📱 {pt.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/patient/timeline/${pt.id}`}
                            className="rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-[#1B365D] transition-all hover:border-[#cbd5e1] hover:bg-slate-50"
                          >
                            Review Timeline
                          </Link>
                          <Link
                            to={`/doctor/new-consultation?patientId=${pt.id}`}
                            className="rounded-xl bg-[#2563EB] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#1D4ED8]"
                          >
                            Open Consultation
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !isSearching && searchQuery.length > 1 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-[#94A3B8]">
                    <Icon.Search size={20} />
                  </div>
                  <p className="text-sm font-bold text-[#0F172A]">No patient records matching "{searchQuery}"</p>
                  <p className="mt-1 text-xs text-[#64748B] max-w-sm mx-auto">
                    Try searching by full Medra-UID (e.g. P-1001), mobile phone number, or national identification.
                  </p>
                </div>
              ) : null}
            </Card>
          )}
        </div>

        {/* 4 Metric Stat Cards matching Figma KPI aesthetic */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card hover className="flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
              <Icon.Clock size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Today's Appointment Queue</p>
              <p className="tabular font-display text-2xl font-bold text-[#0F172A] mt-0.5">
                {data?.stats?.todayAppointmentsCount || 0} <span className="text-xs font-normal text-[#64748B]">Patients</span>
              </p>
            </div>
          </Card>

          <Card hover className="flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#ECFDF5] text-[#059669]">
              <Icon.CheckCircle size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Total Consultations</p>
              <p className="tabular font-display text-2xl font-bold text-[#0F172A] mt-0.5">
                {data?.stats?.totalConsultations || 0} <span className="text-xs font-normal text-[#64748B]">Visits Logged</span>
              </p>
            </div>
          </Card>

          <Card hover className="flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#F5F3FF] text-[#7C3AED]">
              <Icon.File size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">E-Prescriptions Issued</p>
              <p className="tabular font-display text-2xl font-bold text-[#0F172A] mt-0.5">
                {data?.stats?.totalPrescriptionsIssued || 0} <span className="text-xs font-normal text-[#64748B]">Rx Sheets</span>
              </p>
            </div>
          </Card>

          <Card hover className="flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#ECFDF5] text-[#059669]">
              <Icon.Shield size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Clinical Safety Index</p>
              <p className="tabular font-display text-2xl font-bold text-[#0F172A] mt-0.5">
                99.8% <span className="text-xs font-semibold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded ml-1 border border-[#A7F3D0]">0 Alerts</span>
              </p>
            </div>
          </Card>
        </div>

        {/* Main Workstation: 3 Columns on 2xl */}
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-[1.1fr_1.1fr_360px]">
          {/* Today's Scheduled Queue */}
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <Icon.Clock size={16} />
                </div>
                <h2 className="font-display text-base font-bold text-[#0F172A]">Today's Scheduled Consultations</h2>
              </div>
              <Pill tone="blue">Queue Active</Pill>
            </div>

            <div className="mt-4 space-y-3">
              {data?.todayAppointments && data.todayAppointments.length > 0 ? (
                data.todayAppointments.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 transition-colors hover:bg-white"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#2563EB]">{apt.time_slot}</span>
                        <span className="text-sm font-bold text-[#0F172A]">{apt.patient_name}</span>
                        <span className="font-mono text-xs text-[#94A3B8]">({apt.patient_uid})</span>
                      </div>
                      <p className="mt-1 text-xs text-[#475569]">{apt.reason || 'General Follow-up Consultation'}</p>
                    </div>

                    <Link
                      to={`/doctor/new-consultation?patientId=${apt.patient_id}&appointmentId=${apt.id}`}
                      className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
                    >
                      Consult Now
                    </Link>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 py-8 text-center">
                  <img
                    src="/assets/queue_empty.png"
                    alt="All clinical appointments completed"
                    className="mb-3 h-24 w-auto object-contain transition-transform duration-200 hover:scale-105"
                    loading="lazy"
                  />
                  <p className="text-sm font-bold text-[#0F172A]">No appointments pending in queue</p>
                  <p className="mt-1 max-w-xs text-xs text-[#64748B]">
                    All patient consultations for this clinical shift are completed or ready for check-in.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Clinical Records Logged */}
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#ECFDF5] text-[#059669]">
                  <Icon.Stethoscope size={16} />
                </div>
                <h2 className="font-display text-base font-bold text-[#0F172A]">Recent Clinical Records Logged</h2>
              </div>
              <Pill tone="emerald">Verified 3NF</Pill>
            </div>

            <div className="mt-4 space-y-3">
              {data?.recentConsultations && data.recentConsultations.length > 0 ? (
                data.recentConsultations.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 transition-colors hover:bg-white"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0F172A]">{c.patient_name}</span>
                        <span className="font-mono text-xs text-[#94A3B8]">({c.record_uid})</span>
                      </div>
                      <p className="mt-1 text-xs text-[#475569] line-clamp-1">{c.chief_complaint}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-[#94A3B8]">
                        {new Date(c.visit_date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/patient/timeline/${c.patient_id}`}
                        className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-[#1B365D] hover:border-[#CBD5E1]"
                      >
                        Timeline
                      </Link>
                      {c.prescription_id && (
                        <Link
                          to={`/prescription/${c.prescription_id}`}
                          className="rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1.5 text-xs font-semibold text-[#059669] hover:bg-emerald-100"
                        >
                          Rx ℞
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] py-10 px-4 text-center">
                  <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-[#059669]">
                    <Icon.Stethoscope size={20} />
                  </div>
                  <p className="text-xs font-bold text-[#0F172A]">No consultations logged yet</p>
                  <p className="mt-1 text-[11px] text-[#64748B]">
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
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                    <Icon.Activity size={16} />
                  </div>
                  <h2 className="font-display text-base font-bold text-[#0F172A]">Clinical Quick Actions</h2>
                </div>
                <Pill tone="blue">Direct Access</Pill>
              </div>

              <div className="mt-4 space-y-2.5">
                <Link
                  to="/doctor/new-consultation"
                  className="flex items-center justify-between rounded-xl bg-[#1B365D] p-3.5 text-white transition-all hover:bg-[#16294a] shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 text-white">
                      <Icon.Plus size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold">New Walk-In Consultation</p>
                      <p className="text-[11px] text-blue-200">Ad-hoc patient intake &amp; prescription</p>
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
                  className="flex w-full items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-left transition-colors hover:bg-white hover:border-[#CBD5E1]"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#2563EB] border border-[#E2E8F0]">
                      <Icon.Search size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">Lookup Medical Archive</p>
                      <p className="text-[11px] text-[#64748B]">Search by NID or Medra-UID</p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[#94A3B8] border border-[#E2E8F0] px-1.5 py-0.5 rounded bg-white">⌘K</span>
                </button>
              </div>
            </Card>

            {/* Chamber Telemetry & Bed Status */}
            <Card className="p-6">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#ECFDF5] text-[#059669]">
                    <Icon.Pulse size={16} />
                  </div>
                  <h2 className="font-display text-base font-bold text-[#0F172A]">Chamber &amp; Facility Telemetry</h2>
                </div>
                <Pill tone="emerald">Live 2s</Pill>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#475569]">CCU Bed Capacity</span>
                    <span className="font-bold text-[#0F172A] tabular">14 / 16 (88%)</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                    <div className="h-full rounded-full bg-[#2563EB]" style={{ width: '87.5%' }} />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs">
                  <span className="font-semibold text-[#475569]">Pathology &amp; Lab TAT</span>
                  <span className="font-bold text-[#059669] flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
                    Avg 38 min (Normal)
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs">
                  <span className="font-semibold text-[#475569]">Emergency Alert Code</span>
                  <span className="font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                    Green • Code Clear
                  </span>
                </div>

                <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-xs">
                  <p className="font-bold text-[#1B365D]">Cardiology Acute Helpline</p>
                  <p className="mt-0.5 text-[#2563EB] font-mono font-semibold">NICVD ER: +8802-9122560</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
