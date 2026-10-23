import { useLanguage } from '../context/LanguageContext.js';
import React, { useEffect, useState } from 'react';
import { Select } from '../ui/forms.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import api from '../services/api.js';
import { SPECIALTIES } from '../constants/specialties.js';
import { Card, Icon, Badge, ButtonLink, buttonClasses, EmptyState, MetricCard, Skeleton, VitalPill } from '../ui/primitives.js';

export const PatientDashboard: React.FC = () => {
  const { t: tr } = useLanguage();
  useDocumentTitle(tr('Patient Health Records & Prescriptions'));
  const toast = useToast();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hospitalSpecialty, setHospitalSpecialty] = useState('');

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
      <div className="mx-auto max-w-[1720px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 2xl:px-12" role="status" aria-label={tr('Loading clinical portal module...')}>
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[6.5rem] rounded-xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const patientId = user?.patientId || data?.patient?.id;
  const fullName = user?.fullName || data?.patient?.full_name || tr('Patient');
  const patientUid = user?.patientUid || data?.patient?.patient_uid || '-';
  const bloodGroup = data?.patient?.blood_group || '-';
  const initials = fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  const allergies = data?.allergies || [];
  const conditions = data?.conditions || [];
  const lastRx = data?.recentPrescriptions?.[0];

  return (
    <div className="min-h-screen bg-canvas pb-16">
      <main className="mx-auto max-w-[1720px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 2xl:px-12">
        {/* Patient identity: flat record header, safety strip underneath */}
        <Card className="overflow-hidden">
          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-700 font-display text-lg font-semibold text-white" aria-hidden="true">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">{fullName}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-600">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(patientUid);
                      toast.success(tr('Copied Medra-UID: {id}', { id: patientUid }));
                    }}
                    title={tr("Click to copy Medra-UID")}
                    className="inline-flex h-7 items-center gap-1.5 rounded-md border border-hair bg-canvas px-2 font-mono text-xs font-semibold text-primary-700 transition-colors hover:border-hair-strong hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                  >
                    {patientUid}
                    <Icon.Copy size={12} className="text-ink-400" />
                  </button>
                  <span>
                    {data?.patient?.gender || '-'} ·{' '}
                    {data?.patient?.date_of_birth
                      ? tr('{n} yrs', { n: new Date().getFullYear() - new Date(data.patient.date_of_birth).getFullYear() })
                      : '-'}
                  </span>
                  <Badge tone="crimson" size="sm">
                    {bloodGroup !== '-' ? tr('Blood group {group}', { group: bloodGroup }) : tr('Blood Group N/A')}
                  </Badge>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-hair pt-4 text-sm sm:grid-cols-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="min-w-0">
                <dt className="text-xs text-ink-600">{tr("National ID (NID)")}</dt>
                <dd className="truncate font-mono font-semibold text-ink-900">{data?.patient?.nid_or_bid || '-'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-ink-600">{tr("Attending Physician")}</dt>
                <dd className="truncate font-semibold text-ink-900">{lastRx?.doctor_name || '-'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-ink-600">{tr("Primary Facility")}</dt>
                <dd className="truncate font-semibold text-ink-900">{lastRx?.hospital_affiliation || '-'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-ink-600">{tr("Emergency Contact")}</dt>
                <dd className="truncate font-semibold text-ink-900">
                  {data?.patient?.emergency_contact_name || tr('Not provided')}
                  {data?.patient?.emergency_contact_relation && (
                    <span className="font-normal text-ink-600"> ({data.patient.emergency_contact_relation})</span>
                  )}
                </dd>
                {data?.patient?.emergency_contact_phone && (
                  <dd className="font-mono text-xs text-ink-600">{data.patient.emergency_contact_phone}</dd>
                )}
              </div>
            </dl>
          </div>

          {/* Safety strip: allergies always visible */}
          <div className="flex flex-col gap-2 border-t border-rose-200 bg-rose-50/70 px-4 py-3 sm:flex-row sm:items-start sm:gap-4 sm:px-5">
            <div className="flex shrink-0 items-center gap-2">
              <Icon.Alert size={16} className="shrink-0 text-critical" />
              <span className="text-xs font-semibold text-rose-900">{tr('Clinical Safety')}:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-rose-950">{tr('Allergies')}:</span>
              {allergies.length > 0 ? (
                allergies.map((a: any, idx: number) => (
                  <Badge key={idx} tone="crimson" size="sm" dot>
                    {a.allergen} ({a.severity})
                  </Badge>
                ))
              ) : (
                <span className="font-medium text-rose-800">{tr("None Recorded")}</span>
              )}
              <span className="hidden text-rose-300 sm:inline" aria-hidden="true">|</span>
              <span className="font-medium text-ink-900">{tr('Chronic Conditions')}:</span>
              {conditions.length > 0 ? (
                conditions.map((c: any, idx: number) => (
                  <Badge key={idx} tone="slate" size="sm" dot>
                    {c.condition_name} ({tr(c.status || 'Active')})
                  </Badge>
                ))
              ) : (
                <span className="font-medium text-ink-600">{tr("None Recorded")}</span>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            title={tr("Total Consultations")}
            value={data?.stats?.totalVisits ?? 0}
            subtext={tr("Recorded clinical visits")}
            icon={<Icon.Stethoscope size={16} />}
            iconTone="blue"
          />
          <MetricCard
            title={tr("Active Prescriptions")}
            value={data?.stats?.activePrescriptionsCount ?? 0}
            subtext={tr("Verified regimens")}
            icon={<Icon.Pill size={16} />}
            iconTone="emerald"
          />
          <MetricCard
            title={tr("Diagnostic Lab Reports")}
            value={data?.stats?.labReportsCount ?? 0}
            subtext={tr("Reports available")}
            icon={<Icon.Flask size={16} />}
            iconTone="navy"
          />
          <MetricCard
            title={tr("Next Scheduled Review")}
            value={lastRx?.follow_up_date ? new Date(lastRx.follow_up_date).toLocaleDateString() : tr('Routine Review')}
            subtext={lastRx?.follow_up_date ? tr('Follow-up Consultation') : tr('As advised by doctor')}
            icon={<Icon.Calendar size={16} />}
            iconTone="amber"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">{tr("Clinical Biometrics & Regimens")}</h2>
            <p className="text-sm text-ink-600">{tr("Summary of latest vital signs and current active prescriptions.")}</p>
          </div>
          {patientId && (
            <ButtonLink to={`/patient/timeline/${patientId}`} icon={<Icon.Arrow size={14} />} iconPosition="right" className="w-full sm:w-auto">
              {tr("Open Longitudinal Timeline")}
            </ButtonLink>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-[1fr_1fr_360px]">
          <Card
            padding="sm"
            header={{
              title: tr("Recent Clinical Biometrics"),
              icon: <Icon.Pulse size={15} />,
              action: data?.latestVitals?.visit_date ? (
                <span className="font-mono text-xs text-ink-600">
                  {tr('Captured: {date}', { date: new Date(data.latestVitals.visit_date).toLocaleDateString() })}
                </span>
              ) : undefined,
            }}
          >
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <VitalPill
                label={tr("Blood Pressure")}
                value={data?.latestVitals?.systolic_bp && data?.latestVitals?.diastolic_bp ? `${data.latestVitals.systolic_bp}/${data.latestVitals.diastolic_bp}` : '-'}
                tone={data?.latestVitals?.systolic_bp ? 'amber' : 'slate'}
              />
              <VitalPill label={tr("Heart Rate")} value={data?.latestVitals?.heart_rate ? `${data.latestVitals.heart_rate} bpm` : '-'} tone="slate" />
              <VitalPill label={tr("Body Temp")} value={data?.latestVitals?.temperature ? `${data.latestVitals.temperature}°C` : '-'} tone="slate" />
              <VitalPill label={tr("Oxygen (SpO₂)")} value={data?.latestVitals?.spo2 ? `${data.latestVitals.spo2}%` : '-'} tone={data?.latestVitals?.spo2 ? 'emerald' : 'slate'} />
              <VitalPill label={tr("Body Weight")} value={data?.latestVitals?.weight_kg ? `${data.latestVitals.weight_kg} kg` : '-'} tone="slate" />
              <VitalPill label={tr("BMI Index")} value={data?.latestVitals?.bmi ? `${data.latestVitals.bmi}` : '-'} tone={data?.latestVitals?.bmi ? 'amber' : 'slate'} />
            </div>
          </Card>

          <Card padding="sm" header={{ title: tr("Active Electronic Prescriptions"), icon: <Icon.Pill size={15} /> }}>
            <div className="space-y-2.5">
              {data?.activePrescriptions && data.activePrescriptions.length > 0 ? (
                data.activePrescriptions.map((rx: any) => (
                  <div
                    key={rx.id}
                    className="flex flex-col gap-3 rounded-lg border border-hair bg-canvas/60 p-3.5 transition-colors hover:border-hair-strong hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary-700">{rx.prescription_uid}</span>
                        <span className="text-sm font-semibold text-ink-900">{rx.doctor_name}</span>
                      </div>
                      <p className="mt-1 text-xs text-ink-600">
                        {tr('Issued: {date}', { date: new Date(rx.issue_date).toLocaleDateString() })}
                        {rx.specialization ? ` · ${rx.specialization}` : ''}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                      <ButtonLink size="sm" variant="secondary" to={`/prescription/${rx.id}`} icon={<Icon.ExternalLink size={13} />}>
                        {tr('View ℞')}
                      </ButtonLink>
                      <a
                        href={`/api/v1/prescriptions/${rx.id}/pdf?token=${localStorage.getItem('medralink_token')}`}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonClasses({ size: 'sm', variant: 'success-soft' })}
                      >
                        <Icon.Download size={13} />
                        <span>{tr("PDF")}</span>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={<Icon.Pill size={20} />}
                  title={tr('No active prescriptions')}
                  description={tr('Prescriptions your doctor issues will appear here.')}
                />
              )}
            </div>
          </Card>

          <div className="lg:col-span-2 2xl:col-span-1">
            <Card padding="sm" header={{ title: tr("Patient Care Navigator"), icon: <Icon.Shield size={15} />, as: 'h2' }}>
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                <div className="rounded-lg border border-hair bg-canvas/60 p-3.5 text-sm">
                  <p className="font-semibold text-ink-900">{tr("Direct Longitudinal Access")}</p>
                  <p className="mt-1 text-xs text-ink-600">{tr("Full access to codified diagnoses, medications, and laboratory values.")}</p>
                  {patientId && (
                    <ButtonLink to={`/patient/timeline/${patientId}`} size="sm" variant="secondary" className="mt-3" icon={<Icon.Arrow size={13} />} iconPosition="right">
                      {tr("Browse complete visit timeline")}
                    </ButtonLink>
                  )}
                </div>

                <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3.5 text-sm">
                  <p className="mb-2.5 flex items-center gap-2 font-semibold text-rose-900">
                    <Icon.Alert size={14} className="shrink-0 text-critical" />
                    {tr("Emergency Services")}
                  </p>
                  <label htmlFor="dashboard-hospital-specialty" className="mb-1 block text-xs font-semibold text-rose-900">
                    {tr("Specialization")}
                  </label>
                  <Select id="dashboard-hospital-specialty" value={hospitalSpecialty} onChange={(e) => setHospitalSpecialty(e.target.value)} selectSize="sm" className="mb-2.5">
                    {SPECIALTIES.map((s) => (
                      <option key={s.value} value={s.value}>{tr(s.label)}</option>
                    ))}
                  </Select>
                  <ButtonLink
                    to={hospitalSpecialty ? `/hospitals?specialty=${hospitalSpecialty}` : '/hospitals'}
                    variant="destructive"
                    size="sm"
                    block
                    icon={<Icon.Hospital size={14} />}
                  >
                    {tr("Find nearby hospitals")}
                  </ButtonLink>
                  <a href="tel:16263" className="mt-2.5 block font-mono text-sm font-semibold text-critical hover:underline">
                    {tr('Call {number}', { number: '16263' })}
                  </a>
                  <p className="text-xs text-ink-600">{tr("Toll-free 24/7 national health line")}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
