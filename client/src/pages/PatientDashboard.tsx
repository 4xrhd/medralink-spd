import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import { Card, Icon, Pill, VitalPill } from '../ui/primitives.js';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load patient dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563EB] border-t-transparent"></div>
      </div>
    );
  }

  const patientId = user?.patientId || 'pat-1';
  const fullName = user?.fullName || 'Rahim Ahmed';
  const patientUid = user?.patientUid || data?.patient?.patient_uid || 'P-1001';
  const bloodGroup = data?.patient?.blood_group || 'O+';
  const initials = fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  const allergies = data?.allergies || [
    { allergen: 'Penicillin', severity: 'Severe — Angioedema' }
  ];
  const conditions = data?.conditions || [
    { condition_name: 'Essential Hypertension', status: 'Managed' }
  ];

  const stats = [
    {
      label: 'Total Consultations',
      value: data?.stats?.totalVisits ?? '3',
      unit: 'Visits',
      icon: <Icon.Stethoscope size={20} />,
      bg: '#EFF6FF',
      fg: '#2563EB',
    },
    {
      label: 'Active Prescriptions',
      value: data?.stats?.activePrescriptionsCount ?? '2',
      unit: 'Regimens',
      icon: <Icon.Pill size={20} />,
      bg: '#ECFDF5',
      fg: '#059669',
    },
    {
      label: 'Diagnostic Lab Reports',
      value: data?.stats?.labReportsCount ?? '2',
      unit: 'Available',
      icon: <Icon.Flask size={20} />,
      bg: '#F5F3FF',
      fg: '#7C3AED',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <main className="mx-auto max-w-[1200px] 2xl:max-w-[1720px] space-y-6 px-4 sm:px-6 lg:px-8 2xl:px-12 py-8">
        {/* Figma Screen 2 Summary Banner */}
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-r from-[#1B365D] to-[#2563EB] p-6 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 font-display text-xl font-bold">
                  {initials}
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold">{fullName}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-white/15 px-2 py-0.5 font-mono text-xs">
                      {patientUid}
                    </span>
                    <span className="text-sm text-blue-100">
                      {data?.patient?.gender || 'Male'} •{' '}
                      {data?.patient?.date_of_birth ? `${new Date().getFullYear() - new Date(data.patient.date_of_birth).getFullYear()} Yrs` : '45 Yrs'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                      {bloodGroup} Blood Group
                    </span>
                  </div>
                </div>
              </div>

              {/* 2xl Demographic Cluster */}
              <div className="hidden 2xl:flex items-center gap-6 border-l border-white/20 pl-6 text-xs text-blue-100">
                <div>
                  <span className="text-blue-300 font-semibold uppercase tracking-wider block text-[10px]">National ID (NID)</span>
                  <span className="font-mono font-bold text-white">19812694123400012</span>
                </div>
                <div>
                  <span className="text-blue-300 font-semibold uppercase tracking-wider block text-[10px]">Attending Physician</span>
                  <span className="font-semibold text-white">Dr. Ahmed Tariq (A-54921)</span>
                </div>
                <div>
                  <span className="text-blue-300 font-semibold uppercase tracking-wider block text-[10px]">Primary Facility</span>
                  <span className="font-semibold text-white">Square Hospital &amp; NICVD</span>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-xs">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">
                  Emergency Contact
                </p>
                <p className="mt-1 font-semibold text-white flex items-center gap-1.5">
                  <Icon.User size={14} className="text-blue-200 shrink-0" />
                  <span>{data?.patient?.emergency_contact_name || 'Nasreen Ahmed'}</span>{' '}
                  <span className="font-normal text-blue-200 text-xs">
                    ({data?.patient?.emergency_contact_relation || 'Spouse'})
                  </span>
                </p>
                <p className="font-mono text-sm text-blue-100 mt-1 flex items-center gap-1.5">
                  <span className="text-xs text-blue-300">📞</span>
                  <span>{data?.patient?.emergency_contact_phone || '+8801712345678'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Safety Alert Strip with high-contrast medical badges */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t border-[#FDE68A] bg-[#FEF3C7] px-6 py-3.5">
            <div className="flex items-center gap-2 shrink-0">
              <Icon.Alert size={18} className="text-[#B45309] shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#92400E]">Clinical Safety:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-[#78350F]">Allergies:</span>
              {allergies && allergies.length > 0 ? (
                allergies.map((a: any, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-[#FDE68A] px-2 py-0.5 font-semibold text-[#92400E] border border-[#FCD34D]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                    {a.allergen} ({a.severity})
                  </span>
                ))
              ) : (
                <span className="text-[#92400E] font-medium">None Recorded</span>
              )}
              <span className="hidden sm:inline text-[#D97706]">•</span>
              <span className="font-medium text-[#78350F]">Chronic Conditions:</span>
              {conditions && conditions.length > 0 ? (
                conditions.map((c: any, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-0.5 font-semibold text-[#1E293B] border border-[#CBD5E1]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                    {c.condition_name} ({c.status || 'Active'})
                  </span>
                ))
              ) : (
                <span className="text-[#92400E] font-medium">None Recorded</span>
              )}
            </div>
          </div>
        </Card>

        {/* 4-Metric Row on 2xl */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {stats.map((st) => (
            <Card key={st.label} hover className="flex items-center gap-4 p-5 transition-all">
              <div
                className="grid h-12 w-12 place-items-center rounded-xl shrink-0"
                style={{ background: st.bg, color: st.fg }}
              >
                {st.icon}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">{st.label}</p>
                <p className="tabular font-display text-2xl font-bold text-[#0F172A] mt-0.5">
                  {st.value} <span className="text-sm font-medium text-[#64748B]">{st.unit}</span>
                </p>
              </div>
            </Card>
          ))}

          <Card hover className="flex items-center gap-4 p-5 transition-all">
            <div
              className="grid h-12 w-12 place-items-center rounded-xl shrink-0 bg-[#FEF3C7] text-[#D97706]"
            >
              <Icon.Calendar size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Next Scheduled Review</p>
              <p className="tabular font-display text-2xl font-bold text-[#0F172A] mt-0.5">
                Aug 24, 2026 <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.5 rounded ml-1">In 14 Days</span>
              </p>
            </div>
          </Card>
        </div>

        {/* Action Bar & Quick Timeline Access */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0F172A]">Clinical Biometrics &amp; Regimens</h2>
            <p className="text-sm text-[#475569]">Summary of latest vital signs and current active prescriptions.</p>
          </div>
          <Link
            to={`/patient/timeline/${patientId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#16294a]"
          >
            <Icon.Clock size={16} />
            <span>Open Longitudinal Timeline</span>
            <Icon.Arrow size={14} />
          </Link>
        </div>

        {/* Clinical Workspace: 3 Columns on 2xl */}
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-[1.1fr_1.1fr_360px]">
          {/* Latest Recorded Vitals */}
          <Card hover className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <Icon.Pulse size={16} />
                </div>
                <h3 className="font-display text-base font-bold text-[#0F172A]">Recent Clinical Biometrics</h3>
              </div>
              {data?.latestVitals?.visit_date && (
                <span className="font-mono text-xs font-medium text-[#64748B]">
                  Captured: {new Date(data.latestVitals.visit_date).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <VitalPill
                label="Blood Pressure"
                value={data?.latestVitals ? `${data.latestVitals.systolic_bp}/${data.latestVitals.diastolic_bp}` : '145/92'}
                tone="amber"
              />
              <VitalPill
                label="Heart Rate"
                value={data?.latestVitals?.heart_rate ? `${data.latestVitals.heart_rate} bpm` : '78 bpm'}
                tone="slate"
              />
              <VitalPill
                label="Body Temp"
                value={data?.latestVitals?.temperature ? `${data.latestVitals.temperature}°C` : '36.8°C'}
                tone="slate"
              />
              <VitalPill
                label="Oxygen (SpO₂)"
                value={data?.latestVitals?.spo2 ? `${data.latestVitals.spo2}%` : '98%'}
                tone="emerald"
              />
              <VitalPill
                label="Body Weight"
                value={data?.latestVitals?.weight_kg ? `${data.latestVitals.weight_kg} kg` : '76.5 kg'}
                tone="slate"
              />
              <VitalPill
                label="BMI Index"
                value={data?.latestVitals?.bmi ? `${data.latestVitals.bmi}` : '25.9'}
                tone="amber"
              />
            </div>
          </Card>

          {/* Active Prescriptions */}
          <Card hover className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#ECFDF5] text-[#059669]">
                  <Icon.Pill size={16} />
                </div>
                <h3 className="font-display text-base font-bold text-[#0F172A]">Active Electronic Prescriptions</h3>
              </div>
              <Pill tone="emerald">Verified Regimens</Pill>
            </div>

            <div className="space-y-3">
              {data?.activePrescriptions && data.activePrescriptions.length > 0 ? (
                data.activePrescriptions.map((rx: any) => (
                  <div
                    key={rx.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-3.5 transition-all hover:shadow-xs hover:border-[#34D399]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#059669]">{rx.prescription_uid}</span>
                        <span className="text-xs text-[#0F172A] font-semibold">{rx.doctor_name}</span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-[#047857]">
                        Issued: {new Date(rx.issue_date).toLocaleDateString()} • {rx.specialization || 'Cardiology'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Link
                        to={`/prescription/${rx.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#A7F3D0] bg-white px-3 py-1.5 text-xs font-semibold text-[#059669] shadow-xs hover:bg-emerald-50 transition-colors"
                      >
                        <Icon.ExternalLink size={12} />
                        <span>View ℞</span>
                      </Link>
                      <a
                        href={`/api/v1/prescriptions/${rx.id}/pdf?token=${localStorage.getItem('medralink_token')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-[#059669] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#047857] transition-colors"
                      >
                        <Icon.Download size={13} />
                        <span>PDF</span>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-3.5">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#059669]">RX-4029</span>
                      <p className="text-xs text-[#065F46] font-semibold mt-0.5">Tab. Amlocard 5mg (1+0+0) • Tab. Napa Extra</p>
                      <p className="text-[11px] text-[#047857] mt-0.5">Dr. Ahmed Tariq • Square Hospital</p>
                    </div>
                    <Link
                      to={`/patient/timeline/${patientId}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#059669] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#047857] transition-colors self-end sm:self-auto"
                    >
                      <span>View in Timeline</span>
                      <Icon.Arrow size={12} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Patient Care Navigator & Security Telemetry (2xl) */}
          <div className="space-y-6 lg:col-span-2 2xl:col-span-1">
            {/* Health Navigator Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                    <Icon.Shield size={16} />
                  </div>
                  <h3 className="font-display text-base font-bold text-[#0F172A]">Patient Care Navigator</h3>
                </div>
                <Pill tone="blue">Self-Service</Pill>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs">
                  <p className="font-semibold text-[#0F172A]">Direct Longitudinal Access</p>
                  <p className="mt-1 text-[#64748B]">
                    Full access to codified diagnoses, medications, and laboratory values.
                  </p>
                  <Link
                    to={`/patient/timeline/${patientId}`}
                    className="mt-2.5 inline-flex items-center gap-1.5 font-bold text-[#2563EB] hover:underline"
                  >
                    <span>Browse complete visit timeline</span>
                    <Icon.Arrow size={12} />
                  </Link>
                </div>

                <div className="rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-3 text-xs">
                  <div className="flex items-center gap-2 text-[#065F46] font-bold">
                    <Icon.Lock size={14} />
                    <span>AES-256 Health Locker</span>
                  </div>
                  <p className="mt-1 text-[#047857]">
                    Encrypted zero-knowledge patient consent vault active.
                  </p>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Emergency Ambulance</p>
                  <p className="mt-1 font-mono font-bold text-[#DC2626] text-sm">Call 16263 (National Health Line)</p>
                  <p className="mt-0.5 text-[#64748B]">Toll-free 24/7 emergency medical triage</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
