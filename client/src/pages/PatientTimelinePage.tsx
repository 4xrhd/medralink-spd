import { useLanguage } from '../context/LanguageContext.js';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import api, { getApiErrorMessage } from '../services/api.js';
import { Badge, Button, ButtonLink, buttonClasses, Card, EmptyState, Icon, Skeleton, VitalPill } from '../ui/primitives.js';

function TimelineMarker({ active }: { active?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`z-10 block h-3.5 w-3.5 rounded-full border-[3px] border-white ring-1 ${
        active ? 'bg-primary-700 ring-primary-700' : 'bg-ink-400 ring-hair-strong'
      }`}
    />
  );
}

export const PatientTimelinePage: React.FC = () => {
  const { t: tr } = useLanguage();
  useDocumentTitle(tr('Longitudinal Patient Timeline'));
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await api.get(`/patients/${id}/timeline`);
        setData(res.data.data);
      } catch (err: any) {
        setError(getApiErrorMessage(err, tr('Failed to load medical timeline.')));
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchTimeline();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1720px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 2xl:px-12" role="status" aria-label={tr('Loading clinical portal module...')}>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-8 w-64" />
        {[0, 1].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState
          icon={<Icon.Alert size={22} className="text-critical" />}
          title={error || tr('Patient timeline data unavailable.')}
          action={
            <ButtonLink to="/" variant="secondary" icon={<Icon.Arrow size={14} className="rotate-180" />}>
              {tr("Return to Dashboard")}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const { patient, allergies, conditions, timeline } = data;
  const fullName = patient?.full_name || tr('Patient Record');
  const patientUid = patient?.patient_uid || '-';
  const initials = fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  const prescriptionCount = timeline.filter((t: any) => t.prescription).length;
  const labReports = timeline.flatMap((t: any) => (t.labReports || []).map((lab: any) => ({ ...lab, visit_date: t.visit_date })));

  const toggleReport = (reportId: string) => {
    setExpandedReports((prev) => ({ ...prev, [reportId]: !prev[reportId] }));
  };

  const toggleCard = (recordId: string) => {
    setExpandedCards((prev) => ({ ...prev, [recordId]: !prev[recordId] }));
  };

  const token = localStorage.getItem('medralink_token');
  const summaryPdf = `/api/v1/patients/${patient?.id || id}/summary/pdf?token=${token}`;
  const sectionLabel = 'mb-2 text-xs font-semibold text-ink-600';

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto max-w-[1720px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 2xl:px-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 self-start"
            icon={<Icon.Arrow size={14} className="rotate-180" />}
            onClick={() => navigate(user?.role === 'DOCTOR' ? '/doctor' : user?.role === 'ADMIN' ? '/admin' : '/patient')}
          >
            {tr(user?.role === 'DOCTOR' ? 'Back to Doctor Workstation' : user?.role === 'ADMIN' ? 'Back to Governance Console' : 'Back to Patient Health Portal')}
          </Button>
          <a
            href={summaryPdf}
            target="_blank"
            rel="noreferrer"
            title={tr("Download official longitudinal patient health dossier as PDF")}
            className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'w-full sm:w-auto' })}
          >
            <Icon.Download size={14} />
            <span>{tr("Export Health Summary (PDF)")}</span>
          </a>
        </div>

        {/* Patient identity and safety strip */}
        <Card className="overflow-hidden">
          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-700 font-display text-lg font-semibold text-white" aria-hidden="true">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">{fullName}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-600">
                  <span className="rounded-md border border-hair bg-canvas px-2 py-0.5 font-mono text-xs font-semibold text-primary-700">{patientUid}</span>
                  <span>
                    {patient?.gender || '-'} ·{' '}
                    {patient?.date_of_birth ? tr('{n} yrs', { n: new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() }) : '-'}
                  </span>
                  <Badge tone="crimson" size="sm">
                    {patient?.blood_group ? tr('Blood group {group}', { group: patient.blood_group }) : tr('Blood Group N/A')}
                  </Badge>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-hair pt-4 text-sm sm:grid-cols-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="min-w-0">
                <dt className="text-xs text-ink-600">{tr("National ID (NID)")}</dt>
                <dd className="truncate font-mono font-semibold text-ink-900">{patient?.nid_or_bid || '-'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-ink-600">{tr("Attending Physician")}</dt>
                <dd className="truncate font-semibold text-ink-900">{timeline?.[0]?.doctor_name || '-'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-ink-600">{tr("Primary Facility")}</dt>
                <dd className="truncate font-semibold text-ink-900">{timeline?.[0]?.doctor_hospital || timeline?.[0]?.hospital_affiliation || '-'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-ink-600">{tr("Emergency Contact")}</dt>
                <dd className="truncate font-semibold text-ink-900">
                  {patient?.emergency_contact_name || tr('Not provided')}
                  {patient?.emergency_contact_relation && <span className="font-normal text-ink-600"> ({patient.emergency_contact_relation})</span>}
                </dd>
                {patient?.emergency_contact_phone && <dd className="font-mono text-xs text-ink-600">{patient.emergency_contact_phone}</dd>}
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-2 border-t border-rose-200 bg-rose-50/70 px-4 py-3 sm:flex-row sm:items-start sm:gap-4 sm:px-5">
            <div className="flex shrink-0 items-center gap-2">
              <Icon.Alert size={16} className="shrink-0 text-critical" />
              <span className="text-xs font-semibold text-rose-900">{tr('Clinical Safety')}:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-rose-950">{tr('Allergies')}:</span>
              {allergies && allergies.length > 0 ? (
                allergies.map((a: any, idx: number) => (
                  <Badge key={idx} tone="crimson" size="sm" dot>{a.allergen} ({a.severity})</Badge>
                ))
              ) : (
                <span className="font-medium text-rose-800">{tr("No known drug allergies (NKDA)")}</span>
              )}
              <span className="hidden text-rose-300 sm:inline" aria-hidden="true">|</span>
              <span className="font-medium text-ink-900">{tr('Chronic Conditions')}:</span>
              {conditions && conditions.length > 0 ? (
                conditions.map((c: any, idx: number) => (
                  <Badge key={idx} tone="slate" size="sm" dot>{c.condition_name} ({tr(c.status || 'Managed')})</Badge>
                ))
              ) : (
                <span className="font-medium text-ink-600">{tr("No chronic conditions recorded")}</span>
              )}
            </div>
          </div>
        </Card>

        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900 sm:text-xl">{tr("Longitudinal Health Timeline")}</h2>
          <p className="mt-0.5 text-sm text-ink-600">{tr("A single continuous record of every consultation, accessible under strict RBAC.")}</p>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
          {/* Visit timeline: dot and rail on the left, one panel per visit */}
          <div className="relative pl-6 sm:pl-8">
            <div className="absolute bottom-6 left-[6px] top-3 w-px bg-hair-strong sm:left-[10px]" aria-hidden="true" />
            <ol className="space-y-5">
              {timeline.length === 0 ? (
                <li>
                  <EmptyState icon={<Icon.Clock size={20} />} title={tr("No consultation history recorded yet for this patient.")} />
                </li>
              ) : (
                timeline.map((record: any, index: number) => {
                  const isLatest = index === 0;
                  const isOpen = isLatest || expandedCards[record.id];
                  const visitDateStr = new Date(record.visit_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                  const v = record.vitals;

                  return (
                    <li key={record.id} className="relative">
                      <span className="absolute -left-6 top-5 sm:-left-8 sm:translate-x-[3px]">
                        <TimelineMarker active={isLatest} />
                      </span>

                      <Card>
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-display text-base font-semibold text-ink-900 sm:text-lg">{visitDateStr}</h3>
                              <Badge tone="blue" size="sm">{record.reason || tr('General Clinical Review')}</Badge>
                              {isLatest && <Badge tone="emerald" size="sm" dot>{tr("Most Recent")}</Badge>}
                            </div>
                            {record.doctor_name && (
                              <p className="mt-1 text-sm text-ink-600">
                                <span className="font-medium text-ink-900">{record.doctor_name}</span>
                                {(record.doctor_qualifications || record.doctor_specialization) && <> ({record.doctor_qualifications || record.doctor_specialization})</>}
                              </p>
                            )}
                            {record.doctor_hospital && <p className="text-sm text-ink-600">{record.doctor_hospital}</p>}
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`/api/v1/consultations/${record.id}/pdf?token=${token}`}
                              target="_blank"
                              rel="noreferrer"
                              title={tr("Download Clinical Encounter Summary PDF")}
                              className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'flex-1 sm:flex-none' })}
                            >
                              <Icon.Download size={14} />
                              <span>{tr("Encounter PDF")}</span>
                            </a>
                            {!isLatest && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCard(record.id)}
                                aria-expanded={isOpen}
                                aria-label={tr('Expand consultation from {date}', { date: visitDateStr })}
                                icon={<Icon.Chevron size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
                              >
                                <span className="sr-only">{tr('Expand consultation from {date}', { date: visitDateStr })}</span>
                              </Button>
                            )}
                          </div>
                        </div>

                        {isOpen && (
                          <div className="space-y-5 border-t border-hair p-4 sm:p-5">
                            <div>
                              <p className={sectionLabel}>{tr("Chief Complaints")}</p>
                              <p className="text-sm text-ink-900">{record.chief_complaint || tr('No complaints recorded.')}</p>
                              {record.clinical_notes && (
                                <p className="mt-2 text-sm text-ink-600">
                                  <span className="font-semibold text-ink-900">{tr('Clinical Notes')}:</span> {record.clinical_notes}
                                </p>
                              )}
                            </div>

                            {v && (
                              <div>
                                <p className={sectionLabel}>{tr("Clinical Vitals Telemetry")}</p>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                                  <VitalPill label={tr("Blood Pressure")} value={v.systolic_bp ? `${v.systolic_bp}/${v.diastolic_bp}` : '-'} tone={v.systolic_bp ? 'amber' : 'slate'} />
                                  <VitalPill label={tr("Pulse")} value={v.heart_rate ? `${v.heart_rate} bpm` : '-'} tone="slate" />
                                  <VitalPill label={tr("Temp")} value={v.temperature ? `${v.temperature}°C` : '-'} tone="slate" />
                                  <VitalPill label={tr("SpO₂")} value={v.spo2 ? `${v.spo2}%` : '-'} tone={v.spo2 ? 'emerald' : 'slate'} />
                                  <VitalPill label={tr("BMI")} value={v.bmi ? `${v.bmi}` : '-'} tone="slate" />
                                </div>
                              </div>
                            )}

                            {record.diagnoses && record.diagnoses.length > 0 && (
                              <div>
                                <p className={sectionLabel}>{tr("Codified Diagnosis (ICD-10)")}</p>
                                <div className="flex flex-wrap gap-2">
                                  {record.diagnoses.map((d: any) => (
                                    <Badge key={d.id} tone="slate" size="sm">
                                      <span className="font-mono">{d.icd10_code}</span> {d.diagnosis_title}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {record.prescription && (
                              <div className="rounded-lg border border-hair">
                                <div className="flex flex-col gap-3 border-b border-hair bg-canvas/60 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                                  <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                                    <Icon.Pill size={15} className="text-primary-700" />
                                    {tr('Prescription')}
                                    <span className="font-mono text-xs font-medium text-ink-600">{record.prescription.prescription_uid}</span>
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 sm:flex">
                                    <ButtonLink size="sm" variant="secondary" to={`/prescription/${record.prescription.id}`}>
                                      {tr("View ℞ Sheet")}
                                    </ButtonLink>
                                    <a
                                      href={`/api/v1/prescriptions/${record.prescription.id}/pdf?token=${token}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={buttonClasses({ size: 'sm', variant: 'success-soft' })}
                                    >
                                      <Icon.Download size={14} />
                                      <span>{tr("Download Official PDF (℞)")}</span>
                                    </a>
                                  </div>
                                </div>
                                {record.prescription.items && record.prescription.items.length > 0 && (
                                  <ul className="divide-y divide-hair">
                                    {record.prescription.items.map((item: any) => (
                                      <li key={item.id} className="flex flex-col gap-1 px-3.5 py-2.5 text-sm tabular sm:flex-row sm:items-center sm:justify-between">
                                        <span className="font-medium text-ink-900">
                                          {item.medication_name} {item.dosage && <span className="text-ink-600">({item.dosage})</span>}
                                          {item.instructions && <span className="block text-xs font-normal text-ink-600">{item.instructions}</span>}
                                        </span>
                                        <span className="font-mono text-xs text-ink-600 sm:text-sm">{item.frequency} · {item.duration}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}

                            {record.labReports && record.labReports.length > 0 && (
                              <div className="space-y-2">
                                {record.labReports.map((lab: any) => {
                                  const labOpen = expandedReports[lab.id];
                                  return (
                                    <div key={lab.id} className="rounded-lg border border-hair p-3.5">
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                          <span className="grid h-8 w-8 place-items-center rounded-md bg-canvas text-primary-700" aria-hidden="true">
                                            <Icon.Flask size={15} />
                                          </span>
                                          <div>
                                            <p className="text-sm font-semibold text-ink-900">{lab.test_name}</p>
                                            <p className="text-xs text-ink-600">{tr(lab.status || 'Completed')}</p>
                                          </div>
                                        </div>
                                        <Button variant="ghost" size="sm" aria-expanded={labOpen} onClick={() => toggleReport(lab.id)} className="self-start sm:self-auto">
                                          {labOpen ? tr('Hide details') : tr('View scan / results')}
                                        </Button>
                                      </div>
                                      {labOpen && (
                                        <div className="mt-3 rounded-md border border-hair bg-canvas px-3.5 py-3 text-sm text-ink-600">
                                          <p className="font-semibold text-ink-900">{tr('Diagnostic Laboratory Finding')}:</p>
                                          <p className="mt-1">{lab.results_summary || tr('No result summary recorded.')}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    </li>
                  );
                })
              )}
            </ol>
          </div>

          {/* Record summary: below the timeline on smaller screens, beside it on wide ones */}
          <aside className="space-y-6 xl:sticky xl:top-24">
            <Card padding="sm" header={{ title: tr("Timeline Analytics"), icon: <Icon.Clock size={15} />, as: 'h3' }}>
              <dl className="grid grid-cols-2 gap-2 text-sm xl:grid-cols-1">
                {[
                  [tr("Active Chronic Conditions"), conditions?.length || 0, 'text-ink-900'],
                  [tr("Documented Drug Allergies"), allergies?.length || 0, allergies?.length ? 'text-critical' : 'text-ink-900'],
                  [tr("Cumulative Prescriptions"), prescriptionCount, 'text-ink-900'],
                  [tr("Diagnostic Lab Streams"), labReports.length, 'text-ink-900'],
                ].map(([label, value, tone]) => (
                  <div key={label as string} className="flex items-center justify-between gap-2 rounded-md border border-hair bg-canvas/60 px-3 py-2">
                    <dt className="text-xs text-ink-600">{label}</dt>
                    <dd className={`tabular font-semibold ${tone}`}>{value}</dd>
                  </div>
                ))}
              </dl>
              <a href={summaryPdf} target="_blank" rel="noreferrer" className={buttonClasses({ block: true, className: 'mt-3' })}>
                <Icon.Download size={14} />
                <span>{tr("Download Full Dossier (PDF)")}</span>
              </a>
            </Card>

            <Card padding="sm" header={{ title: tr("Diagnostic Laboratory Archive"), icon: <Icon.Flask size={15} />, as: 'h3' }}>
              {labReports.length > 0 ? (
                <ul className="space-y-2">
                  {labReports.map((lab: any) => (
                    <li key={lab.id} className="rounded-md border border-hair bg-canvas/60 px-3 py-2.5 text-sm">
                      <p className="font-semibold text-ink-900">{lab.test_name}</p>
                      <p className="text-xs text-ink-600">
                        {tr(lab.status || 'Completed')} · {new Date(lab.visit_date).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-600">{tr('No lab reports on record yet.')}</p>
              )}
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
};
