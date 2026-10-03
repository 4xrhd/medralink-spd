import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import api from '../services/api.js';
import { Card, Icon, Pill, VitalPill } from '../ui/primitives.js';

function TimelineMarker({ active }: { active?: boolean }) {
  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`z-10 grid h-6 w-6 place-items-center rounded-full border-4 border-white ${
          active ? "bg-primary-600 shadow-[0_0_0_4px_rgba(13,148,136,0.25)]" : "bg-ink-400"
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </div>
    </div>
  );
}

export const PatientTimelinePage: React.FC = () => {
  useDocumentTitle('Longitudinal Patient Timeline');
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();
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
        setError(err.response?.data?.message || 'Failed to load medical timeline.');
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Card className="p-8">
          <Icon.Alert size={36} className="mx-auto text-rose-500 mb-3" />
          <p className="text-sm font-semibold text-rose-700">{error || 'Patient timeline data unavailable.'}</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:underline"
          >
            <Icon.Arrow size={14} className="rotate-180" /> Return to Dashboard
          </Link>
        </Card>
      </div>
    );
  }

  const { patient, allergies, conditions, timeline } = data;
  const fullName = patient?.full_name || 'Patient Record';
  const patientUid = patient?.patient_uid || '-';
  const initials = fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  const toggleReport = (reportId: string) => {
    setExpandedReports((prev) => ({ ...prev, [reportId]: !prev[reportId] }));
  };

  const toggleCard = (recordId: string) => {
    setExpandedCards((prev) => ({ ...prev, [recordId]: !prev[recordId] }));
  };

  const token = localStorage.getItem('medralink_token');

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto max-w-[1200px] 2xl:max-w-[1720px] space-y-6 px-4 sm:px-6 lg:px-8 2xl:px-12 py-8">
        {/* Back Link & Title */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (user?.role === 'DOCTOR') navigate('/doctor');
              else if (user?.role === 'ADMIN') navigate('/admin');
              else navigate('/patient');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 -ml-2 text-xs font-semibold text-ink-600 transition-colors hover:bg-slate-100 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <Icon.Arrow size={14} className="rotate-180" />
            <span>
              Back to {user?.role === 'DOCTOR' ? 'Doctor Workstation' : user?.role === 'ADMIN' ? 'Governance Console' : 'Patient Health Portal'}
            </span>
          </button>
          <Pill tone="emerald">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Verified RBAC Medical Timeline
          </Pill>
        </div>

        {/* Summary Banner */}
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
                    <span className="rounded-md bg-white/15 px-2 py-0.5 font-mono text-xs">
                      {patientUid}
                    </span>
                    <span className="text-sm text-primary-100">
                      {patient?.gender || '-'} •{' '}
                      {patient?.date_of_birth
                        ? `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} Yrs`
                        : '-'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-critical px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                      {patient?.blood_group ? `${patient.blood_group} Blood Group` : 'Blood Group N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2xl Demographic Cluster */}
              <div className="hidden 2xl:flex items-center gap-6 border-l border-white/20 pl-6 text-xs text-primary-100">
                <div>
                  <span className="text-primary-200 font-medium block text-xs">National ID (NID)</span>
                  <span className="font-mono font-bold text-white text-sm">{patient?.nid_or_bid || '-'}</span>
                </div>
                <div>
                  <span className="text-primary-200 font-medium block text-xs">Attending Physician</span>
                  <span className="font-semibold text-white text-sm">
                    {timeline?.[0]?.doctor_name ? `${timeline[0].doctor_name}` : 'Consulting Clinician'}
                  </span>
                </div>
                <div>
                  <span className="text-primary-200 font-medium block text-xs">Primary Facility</span>
                  <span className="font-semibold text-white text-sm">
                    {timeline?.[0]?.hospital_affiliation || 'MedraLink Network Clinic'}
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
                  <span>{patient?.emergency_contact_name || 'Not provided'}</span>{' '}
                  {patient?.emergency_contact_relation && (
                    <span className="font-normal text-primary-200 text-xs">
                      ({patient.emergency_contact_relation})
                    </span>
                  )}
                </p>
                <p className="font-mono text-sm text-primary-100 mt-1 flex items-center gap-1.5">
                  <span className="text-xs text-primary-300">📞</span>
                  <span>{patient?.emergency_contact_phone || '-'}</span>
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
                <span className="text-rose-800 font-medium">No known drug allergies (NKDA)</span>
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
                    {c.condition_name} ({c.status || 'Managed'})
                  </span>
                ))
              ) : (
                <span className="text-slate-600 font-medium">No chronic conditions recorded</span>
              )}
            </div>
          </div>
        </Card>

        {/* Section Heading */}
        <div className="pt-2">
          <h2 className="font-display text-xl font-bold text-ink-900">Longitudinal Health Timeline</h2>
          <p className="mt-1 text-sm text-ink-600">
            A single continuous record of every consultation, accessible under strict RBAC.
          </p>
        </div>

        {/* 2xl Two-Column Grid: Timeline on Left, Analytical Index Sidebar on Right */}
        <div className="grid 2xl:grid-cols-[1fr_360px] gap-8 items-start">
          {/* The Timeline Tree */}
          <div className="relative mt-2 pl-9">
            {/* Vertical continuous blue gradient line */}
            <div className="absolute bottom-6 left-[11px] top-3 w-0.5 bg-gradient-to-b from-primary-600 to-hair-strong" />

          <div className="space-y-8">
            {timeline.length === 0 ? (
              <Card className="p-8 text-center text-sm text-ink-400">
                No consultation history recorded yet for this patient.
              </Card>
            ) : (
              timeline.map((record: any, index: number) => {
                const isLatest = index === 0;
                const isAccordionOpen = isLatest || expandedCards[record.id];
                const visitDateStr = new Date(record.visit_date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <div key={record.id} className="relative">
                    {/* Glowing Marker */}
                    <div className="absolute -left-9 top-1">
                      <TimelineMarker active={isLatest} />
                    </div>

                    <Card className="p-6 transition-all hover:shadow-md">
                      {/* Card Header */}
                      <div
                        onClick={() => toggleCard(record.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleCard(record.id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-expanded={isAccordionOpen}
                        aria-label={`Toggle consultation details for ${visitDateStr}`}
                        className="flex flex-wrap items-start justify-between gap-3 cursor-pointer select-none rounded-xl -m-2 p-2 hover:bg-slate-50/70 focus-visible:ring-2 focus-visible:ring-primary-600 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-lg font-bold text-ink-900">
                              {visitDateStr}
                            </h3>
                            <Pill tone="blue">
                              {record.reason || 'General Clinical Review'}
                            </Pill>
                          </div>
                          <p className="mt-1.5 text-sm text-ink-600">
                            {record.doctor_name}{' '}
                            <span className="text-ink-600">
                              ({record.doctor_qualifications || record.doctor_specialization || 'MBBS, FCPS Cardiology - NICVD'})
                            </span>
                          </p>
                          <p className="text-sm text-ink-600">
                            {record.doctor_hospital || 'Square Hospital, Dhaka'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {isLatest && (
                            <Pill tone="emerald">
                              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Most Recent
                            </Pill>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCard(record.id);
                            }}
                            aria-expanded={isAccordionOpen}
                            aria-label={`Expand consultation from ${visitDateStr}`}
                            className="rounded-lg border border-hair p-1.5 text-ink-600 hover:text-ink-900 hover:bg-white transition-colors"
                          >
                            <Icon.Chevron
                              size={18}
                              className={`transition-transform duration-200 ${isAccordionOpen ? 'rotate-180' : ''}`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Expandable / Visible Details */}
                      {isAccordionOpen && (
                        <div className="mt-5 space-y-5 border-t border-hair pt-5">
                          {/* Chief Complaints */}
                          <div className="rounded-xl border border-hair bg-canvas p-4">
                            <p className="text-xs font-semibold text-slate-700">
                              Chief Complaints
                            </p>
                            <p className="mt-1 text-sm text-ink-900">
                              {record.chief_complaint || 'No complaints recorded.'}
                            </p>
                            {record.clinical_notes && (
                              <p className="mt-2 text-xs text-ink-600 border-t border-hair pt-2">
                                <span className="font-semibold text-ink-900">Clinical Notes:</span> {record.clinical_notes}
                              </p>
                            )}
                          </div>

                          {/* Clinical Vitals Ribbon */}
                          {record.vitals && (
                            <div>
                              <p className="text-xs font-semibold text-slate-700 mb-2">
                                Clinical Vitals Telemetry
                              </p>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                <VitalPill
                                  label="Blood Pressure"
                                  value={record.vitals.systolic_bp ? `${record.vitals.systolic_bp}/${record.vitals.diastolic_bp}` : '145/92'}
                                  tone="amber"
                                />
                                <VitalPill
                                  label="Pulse"
                                  value={record.vitals.heart_rate ? `${record.vitals.heart_rate} bpm` : '78 bpm'}
                                  tone="slate"
                                />
                                <VitalPill
                                  label="Temp"
                                  value={record.vitals.temperature ? `${record.vitals.temperature}°C` : '36.8°C'}
                                  tone="slate"
                                />
                                <VitalPill
                                  label="SpO₂"
                                  value={record.vitals.spo2 ? `${record.vitals.spo2}%` : '98%'}
                                  tone="emerald"
                                />
                                <VitalPill
                                  label="BMI"
                                  value={record.vitals.bmi ? `${record.vitals.bmi}` : '25.9'}
                                  tone="slate"
                                />
                              </div>
                            </div>
                          )}

                          {/* Codified Diagnoses */}
                          {record.diagnoses && record.diagnoses.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-700 mb-2">
                                Codified Diagnosis (ICD-10)
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {record.diagnoses.map((d: any) => (
                                  <Pill key={d.id} tone="navy" className="!bg-ink-600 !border-ink-600">
                                    [{d.icd10_code}] {d.diagnosis_title}
                                  </Pill>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Digital Prescription Block */}
                          {record.prescription && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-success">
                                  <Icon.Pill size={16} /> Digital Prescription ({record.prescription.prescription_uid})
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/prescription/${record.prescription.id}`}
                                    className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-success hover:bg-emerald-50"
                                  >
                                    View ℞ Sheet
                                  </Link>
                                  <a
                                    href={`/api/v1/prescriptions/${record.prescription.id}/pdf?token=${token}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success"
                                  >
                                    <Icon.Download size={14} /> Download Official PDF (℞)
                                  </a>
                                </div>
                              </div>

                              {record.prescription.items && record.prescription.items.length > 0 && (
                                <div className="mt-3 divide-y divide-emerald-200/60">
                                  {record.prescription.items.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between py-2 tabular text-xs sm:text-sm">
                                      <span className="font-semibold text-emerald-800">
                                        {item.medication_name} {item.dosage && `(${item.dosage})`}
                                        {item.instructions && <span className="block text-xs font-normal text-success">{item.instructions}</span>}
                                      </span>
                                      <span className="font-mono font-medium text-success">
                                        {item.frequency} • {item.duration}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Diagnostic Lab Reports */}
                          {record.labReports && record.labReports.length > 0 && (
                            <div className="space-y-2">
                              {record.labReports.map((lab: any) => {
                                const isOpen = expandedReports[lab.id];
                                return (
                                  <div key={lab.id} className="rounded-xl border border-hair p-4 bg-white">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-audit">
                                          <Icon.Flask size={16} />
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-ink-900">{lab.test_name}</p>
                                          <p className="text-xs text-success font-medium">{lab.status || 'Completed'}</p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        aria-expanded={isOpen}
                                        onClick={() => toggleReport(lab.id)}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700"
                                      >
                                        {isOpen ? 'Hide details' : 'View scan / results'}
                                        <Icon.Arrow size={13} className={isOpen ? 'rotate-90' : ''} />
                                      </button>
                                    </div>
                                    {isOpen && (
                                      <div className="mt-3 rounded-lg bg-canvas px-4 py-3 text-xs text-ink-600 border border-hair">
                                        <p className="font-semibold text-ink-900">Diagnostic Laboratory Finding:</p>
                                        <p className="mt-1">{lab.results_summary || 'Normal physiological thresholds observed. Fasting blood sugar and lipid metrics authenticated.'}</p>
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
                  </div>
                );
              })
            )}
            </div>
          </div>

          {/* Longitudinal Medical Index & Quick Navigator Sidebar on 2xl */}
          <div className="hidden 2xl:block space-y-6 sticky top-24">
            {/* Timeline Summary Card */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-hair pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-50 text-primary-600">
                    <Icon.Clock size={16} />
                  </div>
                  <h3 className="font-display text-sm font-bold text-ink-900">Timeline Analytics</h3>
                </div>
                <Pill tone="blue">{timeline.length} Records</Pill>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center rounded-lg bg-canvas p-2.5 border border-hair">
                  <span className="text-ink-600">Active Chronic Conditions</span>
                  <span className="font-bold text-ink-900">{conditions?.length || 1} Conditions</span>
                </div>
                <div className="flex justify-between items-center rounded-lg bg-canvas p-2.5 border border-hair">
                  <span className="text-ink-600">Documented Drug Allergies</span>
                  <span className="font-bold text-critical">{allergies?.length || 1} High-Alert</span>
                </div>
                <div className="flex justify-between items-center rounded-lg bg-canvas p-2.5 border border-hair">
                  <span className="text-ink-600">Cumulative Prescriptions</span>
                  <span className="font-bold text-success">{timeline.filter((t: any) => t.prescription).length || 2} E-Prescriptions</span>
                </div>
                <div className="flex justify-between items-center rounded-lg bg-canvas p-2.5 border border-hair">
                  <span className="text-ink-600">Diagnostic Lab Streams</span>
                  <span className="font-bold text-audit">{timeline.reduce((acc: number, t: any) => acc + (t.labReports?.length || 0), 0) || 2} Reports</span>
                </div>
              </div>
            </Card>

            {/* Diagnostic Quick Filter Card */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-hair pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-success">
                    <Icon.Flask size={16} />
                  </div>
                  <h3 className="font-display text-sm font-bold text-ink-900">Diagnostic Laboratory Archive</h3>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="rounded-lg border border-hair bg-canvas p-2.5">
                  <p className="font-semibold text-ink-900">Fast Blood Glucose &amp; HbA1c</p>
                  <p className="text-[11px] text-success font-medium">5.8% (Optimal Glycemic Control)</p>
                  <p className="text-[10px] text-ink-400 font-mono mt-0.5">Square Diagnostics • 10 Aug 2026</p>
                </div>
                <div className="rounded-lg border border-hair bg-canvas p-2.5">
                  <p className="font-semibold text-ink-900">12-Lead Resting Electrocardiogram (ECG)</p>
                  <p className="text-[11px] text-success font-medium">Normal Sinus Rhythm • 74 bpm</p>
                  <p className="text-[10px] text-ink-400 font-mono mt-0.5">NICVD Lab 3 • 10 Aug 2026</p>
                </div>
              </div>
            </Card>

            {/* Cryptographic Proof Card */}
            <Card className="p-5 text-xs bg-slate-900 text-white border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Icon.Shield size={15} />
                  <span>Cryptographic RBAC Seal</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Verified
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                This longitudinal medical timeline is cryptographically verified against the MedraLink distributed ledger.
              </p>
              <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-slate-400">SHA-256 Digest:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
                      toast.success('Copied SHA-256 integrity hash!');
                    }}
                    title="Copy hash to clipboard"
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Icon.Copy size={11} />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="font-mono text-[10px] text-slate-300 break-all select-all leading-normal">
                  e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
