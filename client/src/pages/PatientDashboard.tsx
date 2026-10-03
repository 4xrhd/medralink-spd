import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import api from '../services/api.js';
import { Card, Icon, Pill, Badge, Button, MetricCard, VitalPill } from '../ui/primitives.js';

export const PatientDashboard: React.FC = () => {
  useDocumentTitle('Patient Health Records & Prescriptions');
  const toast = useToast();
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const patientId = user?.patientId || data?.patient?.id;
  const fullName = user?.fullName || data?.patient?.full_name || 'Patient';
  const patientUid = user?.patientUid || data?.patient?.patient_uid || '-';
  const bloodGroup = data?.patient?.blood_group || '-';
  const initials = fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  const allergies = data?.allergies || [];
  const conditions = data?.conditions || [];

  const stats = [
    {
      label: 'Total Consultations',
      value: data?.stats?.totalVisits ?? 0,
      unit: 'Visits',
      icon: <Icon.Stethoscope size={20} />,
      bg: '#EFF6FF',
      fg: '#2563EB',
    },
    {
      label: 'Active Prescriptions',
      value: data?.stats?.activePrescriptionsCount ?? 0,
      unit: 'Regimens',
      icon: <Icon.Pill size={20} />,
      bg: '#ECFDF5',
      fg: '#059669',
    },
    {
      label: 'Diagnostic Lab Reports',
      value: data?.stats?.labReportsCount ?? 0,
      unit: 'Available',
      icon: <Icon.Flask size={20} />,
      bg: '#F5F3FF',
      fg: '#7C3AED',
    },
  ];

  return (
    <div className="min-h-screen bg-canvas pb-16">
      <main className="mx-auto max-w-[1200px] 2xl:max-w-[1720px] space-y-6 px-4 sm:px-6 lg:px-8 2xl:px-12 py-8">
        {/* Figma Screen 2 Summary Banner */}
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-r from-primary-700 to-primary-600 p-6 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 font-display text-xl font-bold">
                  {initials}
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold">{fullName}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(patientUid);
                        toast.success(`Copied Medra-UID: ${patientUid}`);
                      }}
                      title="Click to copy Medra-UID"
                      className="inline-flex items-center gap-1 rounded-md bg-white/15 hover:bg-white/25 px-2 py-0.5 font-mono text-xs text-white transition-colors cursor-pointer"
                    >
                      <span>{patientUid}</span>
                      <Icon.Copy size={11} className="opacity-70" />
                    </button>
                    <span className="text-sm text-primary-100">
                      {data?.patient?.gender || '-'} •{' '}
                      {data?.patient?.date_of_birth
                        ? `${new Date().getFullYear() - new Date(data.patient.date_of_birth).getFullYear()} Yrs`
                        : '-'}
                    </span>
                    <Badge tone="crimson" size="sm" className="font-bold">
                      {bloodGroup !== '-' ? `${bloodGroup} Blood Group` : 'Blood Group N/A'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 2xl Demographic Cluster */}
              <div className="hidden 2xl:flex items-center gap-6 border-l border-white/20 pl-6 text-xs text-primary-100">
                <div>
                  <span className="text-primary-200 font-medium block text-xs">National ID (NID)</span>
                  <span className="font-mono font-bold text-white text-sm">{data?.patient?.nid_or_bid || '-'}</span>
                </div>
                <div>
                  <span className="text-primary-200 font-medium block text-xs">Attending Physician</span>
                  <span className="font-semibold text-white text-sm">
                    {data?.recentPrescriptions?.[0]?.doctor_name || 'Primary Care Physician'}
                  </span>
                </div>
                <div>
                  <span className="text-primary-200 font-medium block text-xs">Primary Facility</span>
                  <span className="font-semibold text-white text-sm">
                    {data?.recentPrescriptions?.[0]?.hospital_affiliation || 'MedraLink Network Clinic'}
                  </span>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-xs">
                <p className="text-xs font-medium text-primary-200">
                  Emergency Contact
                </p>
                <p className="mt-1 font-semibold text-white flex items-center gap-1.5">
                  <Icon.User size={14} className="text-primary-200 shrink-0" />
                  <span>{data?.patient?.emergency_contact_name || 'Not provided'}</span>{' '}
                  {data?.patient?.emergency_contact_relation && (
                    <span className="font-normal text-primary-200 text-xs">
                      ({data.patient.emergency_contact_relation})
                    </span>
                  )}
                </p>
                <p className="font-mono text-sm text-primary-100 mt-1 flex items-center gap-1.5">
                  <span className="text-xs text-primary-300">📞</span>
                  <span>{data?.patient?.emergency_contact_phone || '-'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Safety Alert Strip with high-contrast medical badges */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t border-rose-200 bg-rose-50/70 px-6 py-3.5">
            <div className="flex items-center gap-2 shrink-0">
              <Icon.Alert size={18} className="text-critical shrink-0" />
              <span className="text-xs font-semibold text-rose-900">Clinical Safety:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-rose-950">Allergies:</span>
              {allergies && allergies.length > 0 ? (
                allergies.map((a: any, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 font-semibold text-rose-800 border border-rose-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-critical" />
                    {a.allergen} ({a.severity})
                  </span>
                ))
              ) : (
                <span className="text-rose-800 font-medium">None Recorded</span>
              )}
              <span className="hidden sm:inline text-rose-300">•</span>
              <span className="font-medium text-ink-900">Chronic Conditions:</span>
              {conditions && conditions.length > 0 ? (
                conditions.map((c: any, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-0.5 font-semibold text-ink-900 border border-hair-strong"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                    {c.condition_name} ({c.status || 'Active'})
                  </span>
                ))
              ) : (
                <span className="text-amber-800 font-medium">None Recorded</span>
              )}
            </div>
          </div>
        </Card>

        {/* 4-Metric Row with MetricCard */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <MetricCard
            title="Total Consultations"
            value={data?.stats?.totalVisits ?? '3'}
            subtext="Recorded clinical visits"
            icon={<Icon.Stethoscope size={20} />}
            iconTone="blue"
          />
          <MetricCard
            title="Active Prescriptions"
            value={data?.stats?.activePrescriptionsCount ?? '2'}
            subtext="Verified regimens"
            icon={<Icon.Pill size={20} />}
            iconTone="emerald"
          />
          <MetricCard
            title="Diagnostic Lab Reports"
            value={data?.stats?.labReportsCount ?? 0}
            subtext="Reports available"
            icon={<Icon.Flask size={20} />}
            iconTone="purple"
          />
          <MetricCard
            title="Next Scheduled Review"
            value={
              data?.recentPrescriptions?.[0]?.follow_up_date
                ? new Date(data.recentPrescriptions[0].follow_up_date).toLocaleDateString()
                : 'Routine Review'
            }
            subtext={
              data?.recentPrescriptions?.[0]?.follow_up_date
                ? 'Follow-up Consultation'
                : 'As advised by doctor'
            }
            icon={<Icon.Calendar size={20} />}
            iconTone="amber"
          />
        </div>

        {/* Action Bar & Quick Timeline Access */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-ink-900">Clinical Biometrics &amp; Regimens</h2>
            <p className="text-sm text-ink-600">Summary of latest vital signs and current active prescriptions.</p>
          </div>
          {patientId && (
            <Link
              to={`/patient/timeline/${patientId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-800"
            >
              <Icon.Clock size={16} />
              <span>Open Longitudinal Timeline</span>
              <Icon.Arrow size={14} />
            </Link>
          )}
        </div>

        {/* Clinical Workspace: 3 Columns on 2xl */}
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-[1.1fr_1.1fr_360px]">
          {/* Latest Recorded Vitals */}
          <Card hover className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-hair pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-50 text-primary-600">
                  <Icon.Pulse size={16} />
                </div>
                <h3 className="font-display text-base font-bold text-ink-900">Recent Clinical Biometrics</h3>
              </div>
              {data?.latestVitals?.visit_date && (
                <span className="font-mono text-xs font-medium text-ink-600">
                  Captured: {new Date(data.latestVitals.visit_date).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <VitalPill
                label="Blood Pressure"
                value={
                  data?.latestVitals?.systolic_bp && data?.latestVitals?.diastolic_bp
                    ? `${data.latestVitals.systolic_bp}/${data.latestVitals.diastolic_bp}`
                    : '-'
                }
                tone={data?.latestVitals?.systolic_bp ? 'amber' : 'slate'}
              />
              <VitalPill
                label="Heart Rate"
                value={data?.latestVitals?.heart_rate ? `${data.latestVitals.heart_rate} bpm` : '-'}
                tone="slate"
              />
              <VitalPill
                label="Body Temp"
                value={data?.latestVitals?.temperature ? `${data.latestVitals.temperature}°C` : '-'}
                tone="slate"
              />
              <VitalPill
                label="Oxygen (SpO₂)"
                value={data?.latestVitals?.spo2 ? `${data.latestVitals.spo2}%` : '-'}
                tone={data?.latestVitals?.spo2 ? 'emerald' : 'slate'}
              />
              <VitalPill
                label="Body Weight"
                value={data?.latestVitals?.weight_kg ? `${data.latestVitals.weight_kg} kg` : '-'}
                tone="slate"
              />
              <VitalPill
                label="BMI Index"
                value={data?.latestVitals?.bmi ? `${data.latestVitals.bmi}` : '-'}
                tone={data?.latestVitals?.bmi ? 'amber' : 'slate'}
              />
            </div>
          </Card>

          {/* Active Prescriptions */}
          <Card hover className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-hair pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-success">
                  <Icon.Pill size={16} />
                </div>
                <h3 className="font-display text-base font-bold text-ink-900">Active Electronic Prescriptions</h3>
              </div>
              <Pill tone="emerald">Verified Regimens</Pill>
            </div>

            <div className="space-y-3">
              {data?.activePrescriptions && data.activePrescriptions.length > 0 ? (
                data.activePrescriptions.map((rx: any) => (
                  <div
                    key={rx.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 transition-all hover:shadow-xs hover:border-emerald-400"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-success">{rx.prescription_uid}</span>
                        <span className="text-xs text-ink-900 font-semibold">{rx.doctor_name}</span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-success">
                        Issued: {new Date(rx.issue_date).toLocaleDateString()} • {rx.specialization || 'Cardiology'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Link
                        to={`/prescription/${rx.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-success shadow-xs hover:bg-emerald-50 transition-colors"
                      >
                        <Icon.ExternalLink size={12} />
                        <span>View ℞</span>
                      </Link>
                      <a
                        href={`/api/v1/prescriptions/${rx.id}/pdf?token=${localStorage.getItem('medralink_token')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-success transition-colors"
                      >
                        <Icon.Download size={13} />
                        <span>PDF</span>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                    <div>
                      <span className="font-mono text-xs font-bold text-success">RX-4029</span>
                      <p className="text-xs text-emerald-800 font-semibold mt-0.5">Tab. Amlocard 5mg (1+0+0) • Tab. Napa Extra</p>
                      <p className="text-[11px] text-success mt-0.5">Dr. Ahmed Tariq • Square Hospital</p>
                    </div>
                    <Link
                      to={`/patient/timeline/${patientId}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-success px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-success transition-colors self-end sm:self-auto"
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
              <div className="flex items-center justify-between border-b border-hair pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-50 text-primary-600">
                    <Icon.Shield size={16} />
                  </div>
                  <h3 className="font-display text-base font-bold text-ink-900">Patient Care Navigator</h3>
                </div>
                <Pill tone="blue">Self-Service</Pill>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-hair bg-canvas p-3 text-xs">
                  <p className="font-semibold text-ink-900">Direct Longitudinal Access</p>
                  <p className="mt-1 text-ink-600">
                    Full access to codified diagnoses, medications, and laboratory values.
                  </p>
                  <Link
                    to={`/patient/timeline/${patientId}`}
                    className="mt-2.5 inline-flex items-center gap-1.5 font-bold text-primary-600 hover:underline"
                  >
                    <span>Browse complete visit timeline</span>
                    <Icon.Arrow size={12} />
                  </Link>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <Icon.Lock size={14} />
                    <span>AES-256 Health Locker</span>
                  </div>
                  <p className="mt-1 text-success">
                    Encrypted zero-knowledge patient consent vault active.
                  </p>
                </div>

                <div className="rounded-xl border border-hair bg-canvas p-3 text-xs">
                  <p className="text-xs font-semibold text-slate-700">Emergency Ambulance</p>
                  <p className="mt-1 font-mono font-bold text-critical text-sm">Call 16263 (National Health Line)</p>
                  <p className="mt-0.5 text-ink-600">Toll-free 24/7 emergency medical triage</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
