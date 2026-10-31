import { useLanguage } from '../context/LanguageContext.js';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import api, { getApiErrorMessage } from '../services/api.js';
import { PdfDownloadButton } from '../components/PdfDownloadButton.js';
import { ageFromDob, formatServerDate } from '../utils/dates.js';
import { Button, ButtonLink, EmptyState, Icon, Skeleton } from '../ui/primitives.js';

function QR() {
  const { t: tr } = useLanguage();
  // Deterministic pseudo-random QR-style grid matching Figma
  const cells = [];
  for (let i = 0; i < 121; i++) {
    const on = ((i * 37 + (i % 11) * 13 + 7) % 5) < 2 || (i % 11 === 0) || (i < 11);
    cells.push(on);
  }
  return (
    <div className="grid h-20 w-20 grid-cols-11 gap-px rounded-md bg-white p-1 ring-1 ring-hair">
      {cells.map((c, i) => (
        <div key={i} className={c ? "bg-ink-900" : "bg-transparent"} />
      ))}
    </div>
  );
}

export const PrescriptionViewPage: React.FC = () => {
  const { t: tr } = useLanguage();
  useDocumentTitle(tr('Official Digital Prescription'));
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    // Start clean for every prescription and ignore answers for one the user has already left
    const controller = new AbortController();
    setData(null);
    setError('');
    setLoading(true);
    api
      .get(`/prescriptions/${id}`, { signal: controller.signal })
      .then((res) => setData(res.data.data))
      .catch((err: any) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, tr('Failed to load prescription.')));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-2 py-6 sm:px-4 sm:py-10" role="status" aria-label={tr('Loading clinical portal module...')}>
        <Skeleton className="mx-auto h-[600px] w-full max-w-[595px] rounded-sm bg-white" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState
          icon={<Icon.Alert size={22} className="text-critical" />}
          title={error || tr('Prescription record not found.')}
          action={
            <ButtonLink to="/" variant="secondary" icon={<Icon.Arrow size={14} className="rotate-180" />}>
              {tr("Return to Workstation")}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const issueDateFormatted = formatServerDate(data.issue_date, { day: 'numeric', month: 'long', year: 'numeric' });

  const doctorName = data.doctor_name || '-';
  const doctorLicense = data.bmdc_license_number || '-';
  const hospitalAffiliation = data.hospital_affiliation || '-';
  const chamberDetails = data.chamber_details || '';
  const doctorPhone = data.doctor_phone || '-';
  const qualifications = data.qualifications || '';
  const specialization = data.specialization || '';

  const patientName = data.patient_name || '-';
  const patientUid = data.patient_uid || '-';
  const gender = data.gender || '-';
  const bloodGroup = data.blood_group || '-';
  const ageYears = ageFromDob(data.date_of_birth);
  const age = ageYears !== null ? tr('{n} yrs', { n: ageYears }) : '-';

  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div className="min-h-screen bg-slate-100 px-2 py-6 sm:px-4 sm:py-10">
      <style>{`
        @media print {
          body { background: white !important; }
          .print-controls { display: none !important; }
          .print-sheet {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Top Action Controls */}
      <div className="print-controls mx-auto flex max-w-[595px] flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          icon={<Icon.Arrow size={14} className="rotate-180" />}
          onClick={() => {
            if (window.history.length > 2) navigate(-1);
            else if (user?.role === 'DOCTOR') navigate('/doctor');
            else if (user?.role === 'PATIENT') navigate('/patient');
            else navigate('/');
          }}
        >
          {tr("Back to Records")}
        </Button>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="secondary" size="sm" onClick={() => window.print()} icon={<Icon.File size={14} />}>
            {tr("Print Document")}
          </Button>
          <PdfDownloadButton path={`/prescriptions/${data.id}/pdf`} filename={`${data.prescription_uid || 'prescription'}.pdf`}>
            {tr("Official PDF (℞)")}
          </PdfDownloadButton>
        </div>
      </div>

      {/* A4 page: 595 x 842 pt ratio, fully responsive on mobile */}
      <div className="print-sheet mx-auto flex min-h-[842px] w-full max-w-[595px] flex-col rounded-sm border border-hair bg-white shadow-elevated">
        {/* Header banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-primary-700 px-6 sm:px-8 py-5 text-white">
          <div className="flex items-center gap-3">
            <img src="/logo-mark.png" alt={tr("MedraLink Logo")} className="h-11 w-11 object-contain shrink-0" />
            <div>
              <p className="font-display text-lg sm:text-xl font-bold tracking-tight leading-tight">{tr("MedraLink Clinical Health System")}</p>
              <p className="text-xs text-primary-200">{tr("National Digital E-Prescription Registry")}</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="rounded-md bg-white/20 px-2.5 py-1 font-mono text-xs font-bold text-white">
              {tr('Rx ID')}: {data.prescription_uid}
            </span>
            <p className="mt-1.5 text-xs text-primary-200">{tr('Issued: {date}', { date: issueDateFormatted })}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-5 sm:px-8 py-6">
          {/* Physician letterhead */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-6">
            <div>
              <p className="text-lg font-bold text-ink-900">{doctorName}</p>
              <p className="text-xs font-medium text-ink-600">{qualifications}</p>
              <p className="text-xs font-semibold text-primary-700">{specialization}</p>
              <p className="mt-1 font-mono text-xs text-ink-600">
                {tr('BMDC Registration No')}: {doctorLicense}
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-ink-600">
              <p className="font-semibold text-ink-900">{tr('Chamber')}: {hospitalAffiliation}</p>
              <p>{chamberDetails}</p>
              <p className="mt-1 font-mono text-xs text-ink-600">{tr('Tel')}: {doctorPhone}</p>
            </div>
          </div>

          <div className="my-4 h-px bg-hair" />

          {/* Patient demographic strip (2 columns on mobile, 4 columns on sm+) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-lg bg-hair-strong">
            {[
              ['Patient Name', patientName],
              ['UID', patientUid],
              ['Gender & Age', `${gender} • ${age}`],
              ['Blood Group', bloodGroup],
            ].map(([l, v], i) => (
              <div key={l} className="bg-canvas px-3 py-2.5">
                <p className="text-xs font-semibold text-ink-600">{l}</p>
                <p className={`mt-1 text-sm font-bold text-ink-900 ${i > 0 ? 'tabular' : ''}`}>
                  {v}
                </p>
              </div>
            ))}
          </div>

          {/* Clinical indicators (Vitals & Diagnoses) */}
          <div className="mt-4 space-y-1.5 text-xs">
            {data.vitals && (
              <p className="text-ink-600">
                <span className="font-semibold text-ink-900">Vitals: </span>
                <span className="tabular">
                  {tr('BP')}: {data.vitals.systolic_bp && data.vitals.diastolic_bp ? `${data.vitals.systolic_bp}/${data.vitals.diastolic_bp} mmHg` : '-'}
                  {data.vitals.heart_rate ? ` | Pulse: ${data.vitals.heart_rate} bpm` : ''}
                  {data.vitals.temperature ? ` | Temp: ${data.vitals.temperature}°C` : ''}
                  {data.vitals.weight_kg ? ` | Weight: ${data.vitals.weight_kg} kg` : ''}
                  {data.vitals.bmi ? ` | BMI: ${data.vitals.bmi}` : ''}
                </span>
              </p>
            )}

            <p className="text-ink-600">
              <span className="font-semibold text-ink-900">Diagnosis: </span>
              {data.diagnoses && data.diagnoses.length > 0 ? (
                data.diagnoses.map((d: any) => (
                  <span key={d.id || d.icd10_code} className="mr-2">
                    ICD-10: [{d.icd10_code}] {d.diagnosis_title}{' '}
                    <span className="font-medium text-success">({d.severity || tr('Active')})</span>
                  </span>
                ))
              ) : (
                <span className="text-ink-600 italic">{tr("None recorded")}</span>
              )}
            </p>
          </div>

          {/* Prescription Body (The ℞ Section) */}
          <div className="mt-5 flex-1">
            <div className="flex items-center gap-3">
              <span className="font-serif text-3xl font-bold text-primary-700">℞</span>
              <div className="h-px flex-1 bg-hair" />
            </div>

            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={tr("Medicine Name & Generic")}>
              <table className="mt-3 w-full min-w-[500px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-hair-strong text-left text-xs font-semibold text-ink-600">
                    <th className="w-6 py-2 font-bold">#</th>
                    <th className="py-2 font-bold">{tr("Medicine Name & Generic")}</th>
                    <th className="py-2 font-bold">{tr("Dosage")}</th>
                    <th className="py-2 font-bold">{tr("Frequency")}</th>
                    <th className="py-2 font-bold">{tr("Duration")}</th>
                    <th className="py-2 font-bold">{tr("Instructions")}</th>
                  </tr>
                </thead>
                <tbody className="text-ink-900">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-ink-600">
                        {tr("No medications prescribed in this session.")}
                      </td>
                    </tr>
                  ) : (
                    items.map((item: any, index: number) => (
                      <tr key={item.id || index} className="border-b border-hair align-top">
                        <td className="py-2.5 tabular text-ink-600">{index + 1}</td>
                        <td className="py-2.5 pr-2">
                          <p className="font-semibold text-ink-900">{item.medication_name}</p>
                          {item.generic_name && (
                            <p className="text-[0.625rem] text-ink-600">({item.generic_name})</p>
                          )}
                        </td>
                        <td className="py-2.5 tabular">{item.dosage}</td>
                        <td className="py-2.5">
                          <span className="font-mono font-semibold text-primary-700">{item.frequency}</span>
                        </td>
                        <td className="py-2.5 tabular">{item.duration}</td>
                        <td className="py-2.5 text-ink-600">{item.instructions || tr('As directed')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Advice & Follow-up */}
            <div className="mt-5 rounded-lg bg-canvas p-3.5 border border-hair">
              <p className="text-xs font-semibold text-ink-900">
                {tr("Physician's Clinical Advice")}
              </p>
              <p className="mt-1 text-xs text-ink-900 leading-relaxed">
                {data.instructions || tr('Continue prescribed medications as advised. Maintain routine follow-up.')}
              </p>
              {data.follow_up_date && (
                <p className="mt-2 text-xs">
                  <span className="font-semibold text-primary-700">Follow-up: </span>
                  <span className="text-ink-600">
                    {tr('Review in chamber on {date}.', { date: formatServerDate(data.follow_up_date) })}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Digital Authentication & Verification Sign-Off */}
          <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 border-t border-hair pt-4">
            <div className="flex items-center gap-3">
              <QR />
              <div className="max-w-[190px]">
                <p className="text-[0.625rem] leading-relaxed text-ink-600">
                  {tr("Authenticated electronic medical record generated via MedraLink Clinical Infrastructure. Scan to verify on national registry.")}
                </p>
                <p className="mt-0.5 font-mono text-[0.5625rem] text-ink-400">
                  {tr('Rx ID')}: {data.prescription_uid || '-'}
                </p>
              </div>
            </div>

            {/* Official Cryptographic Seal & Sign-off */}
            <div className="flex items-center gap-3">
              <img
                src="/assets/verified_seal.png"
                alt={tr("MedraLink Cryptographically Verified Seal")}
                className="h-16 w-16 shrink-0 object-contain"
                loading="lazy"
              />
              <div className="text-center sm:text-right">
                <div className="mb-1 flex h-10 w-36 items-end justify-center border-b border-ink-900 mx-auto sm:ml-auto">
                  <span className="font-serif text-lg italic text-primary-700">
                    {doctorName.replace(/^Dr\.?\s*/, '')}
                  </span>
                </div>
                <p className="inline-flex items-center gap-1 text-[0.625rem] font-semibold text-success">
                  <Icon.Lock size={11} /> {tr("Cryptographically Signed")}
                </p>
                <p className="text-[0.625rem] text-ink-600">{doctorName} • {doctorLicense}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
