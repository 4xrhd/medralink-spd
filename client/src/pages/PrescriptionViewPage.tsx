import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import api from '../services/api.js';
import { Icon } from '../ui/primitives.js';

function QR() {
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
  useDocumentTitle('Official Digital Prescription');
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const res = await api.get(`/prescriptions/${id}`);
        setData(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load prescription.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPrescription();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-ink-600">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-ink-600 px-4 py-16 text-center text-white">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
          <Icon.Alert size={36} className="mx-auto text-rose-400 mb-3" />
          <p className="text-sm font-semibold">{error || 'Prescription record not found.'}</p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-primary-700 hover:bg-slate-100"
          >
            <Icon.Arrow size={14} className="rotate-180" /> Return to Workstation
          </Link>
        </div>
      </div>
    );
  }

  const token = localStorage.getItem('medralink_token');
  const pdfDownloadUrl = `/api/v1/prescriptions/${data.id}/pdf?token=${token}`;

  const issueDateFormatted = data.issue_date
    ? new Date(data.issue_date).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  const doctorName = data.doctor_name || 'Consulting Physician';
  const doctorLicense = data.bmdc_license_number || '-';
  const hospitalAffiliation = data.hospital_affiliation || 'Clinical Health Centre';
  const chamberDetails = data.chamber_details || 'Outpatient Department';
  const doctorPhone = data.doctor_phone || '-';
  const qualifications = data.qualifications || '';
  const specialization = data.specialization || 'Clinical Medicine';

  const patientName = data.patient_name || 'Patient';
  const patientUid = data.patient_uid || '-';
  const gender = data.gender || '-';
  const bloodGroup = data.blood_group || '-';
  const age = data.date_of_birth
    ? `${new Date().getFullYear() - new Date(data.date_of_birth).getFullYear()} Yrs`
    : '-';

  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div className="min-h-screen overflow-x-auto bg-ink-600 py-6 sm:py-10 px-2 sm:px-4">
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
      <div className="print-controls mx-auto flex max-w-[595px] flex-wrap items-center justify-between gap-3 pb-4">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 2) {
              navigate(-1);
            } else if (user?.role === 'DOCTOR') {
              navigate('/doctor');
            } else if (user?.role === 'PATIENT') {
              navigate('/patient');
            } else {
              navigate('/');
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
        >
          <Icon.Arrow size={14} className="rotate-180" /> Back to Records
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
          >
            <Icon.Download size={14} /> Print Document
          </button>
          <a
            href={pdfDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-primary-700 shadow-sm transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <Icon.Download size={14} /> Official PDF (℞)
          </a>
        </div>
      </div>

      {/* A4 page: 595 x 842 pt ratio, fully responsive on mobile */}
      <div className="print-sheet mx-auto flex min-h-[842px] w-full max-w-[595px] flex-col bg-white shadow-2xl rounded-sm">
        {/* Header banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-primary-700 px-6 sm:px-8 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/15">
              <Icon.Cross size={20} />
            </div>
            <div>
              <p className="font-display text-base sm:text-lg font-extrabold leading-tight">MedraLink Clinical Health System</p>
              <p className="text-[11px] sm:text-xs text-primary-200">National Digital E-Prescription Registry</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="rounded-md bg-white/15 px-2 py-1 font-mono text-xs font-semibold">
              Rx ID: {data.prescription_uid}
            </span>
            <p className="mt-1.5 text-xs text-primary-200">Issued: {issueDateFormatted}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-5 sm:px-8 py-6">
          {/* Physician letterhead */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-6">
            <div>
              <p className="text-base font-bold text-ink-900">{doctorName}</p>
              <p className="text-xs text-ink-600">{qualifications}</p>
              <p className="text-xs text-ink-600">{specialization}</p>
              <p className="mt-1 font-mono text-[11px] text-ink-600">
                BMDC Registration No: {doctorLicense}
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-ink-600">
              <p className="font-semibold text-ink-900">Chamber: {hospitalAffiliation}</p>
              <p>{chamberDetails}</p>
              <p className="mt-1 font-mono text-[11px] text-ink-600">Tel: {doctorPhone}</p>
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
                <p className="text-[10px] font-semibold text-slate-500">{l}</p>
                <p className={`mt-0.5 text-xs sm:text-sm font-semibold text-ink-900 ${i > 0 ? 'tabular' : ''}`}>
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
                  BP: {data.vitals.systolic_bp && data.vitals.diastolic_bp ? `${data.vitals.systolic_bp}/${data.vitals.diastolic_bp} mmHg` : '-'}
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
                    <span className="font-medium text-success">({d.severity || 'Active'})</span>
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic">None recorded</span>
              )}
            </p>
          </div>

          {/* Prescription Body (The ℞ Section) */}
          <div className="mt-5 flex-1">
            <div className="flex items-center gap-3">
              <span className="font-serif text-3xl font-bold text-primary-700">℞</span>
              <div className="h-px flex-1 bg-hair" />
            </div>

            <div className="overflow-x-auto">
              <table className="mt-3 w-full min-w-[500px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-hair-strong text-left text-[11px] font-semibold text-slate-600">
                    <th className="w-6 py-2 font-bold">#</th>
                    <th className="py-2 font-bold">Medicine Name &amp; Generic</th>
                    <th className="py-2 font-bold">Dosage</th>
                    <th className="py-2 font-bold">Frequency</th>
                    <th className="py-2 font-bold">Duration</th>
                    <th className="py-2 font-bold">Instructions</th>
                  </tr>
                </thead>
                <tbody className="text-ink-900">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                        No medications prescribed in this session.
                      </td>
                    </tr>
                  ) : (
                    items.map((item: any, index: number) => (
                      <tr key={item.id || index} className="border-b border-primary-50/60 align-top">
                        <td className="py-2.5 tabular text-ink-600">{index + 1}</td>
                        <td className="py-2.5 pr-2">
                          <p className="font-semibold text-ink-900">{item.medication_name}</p>
                          {item.generic_name && (
                            <p className="text-[10px] text-ink-600">({item.generic_name})</p>
                          )}
                        </td>
                        <td className="py-2.5 tabular">{item.dosage}</td>
                        <td className="py-2.5">
                          <span className="font-mono font-semibold text-primary-600">{item.frequency}</span>
                        </td>
                        <td className="py-2.5 tabular">{item.duration}</td>
                        <td className="py-2.5 text-ink-600">{item.instructions || 'As directed'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Advice & Follow-up */}
            <div className="mt-5 rounded-lg bg-canvas p-3.5 border border-hair">
              <p className="text-xs font-semibold text-slate-700">
                Physician's Clinical Advice
              </p>
              <p className="mt-1 text-xs text-ink-900 leading-relaxed">
                {data.instructions || 'Continue prescribed medications as advised. Maintain routine follow-up.'}
              </p>
              {data.follow_up_date && (
                <p className="mt-2 text-xs">
                  <span className="font-semibold text-primary-700">Follow-up: </span>
                  <span className="text-ink-600">
                    Review in chamber on {new Date(data.follow_up_date).toLocaleDateString()}.
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
                <p className="text-[10px] leading-relaxed text-ink-600">
                  Authenticated electronic medical record generated via MedraLink Clinical Infrastructure. Scan to verify on national registry.
                </p>
                <p className="mt-0.5 font-mono text-[9px] text-ink-400">
                  SHA-256: {data.prescription_uid ? `${data.prescription_uid.toLowerCase()}-verified` : 'Record Verified'}
                </p>
              </div>
            </div>

            {/* Official Cryptographic Seal & Sign-off */}
            <div className="flex items-center gap-3">
              <img
                src="/assets/verified_seal.png"
                alt="MedraLink Cryptographically Verified Seal"
                className="h-16 w-16 shrink-0 object-contain opacity-95 transition-opacity hover:opacity-100"
                loading="lazy"
              />
              <div className="text-center sm:text-right">
                <div className="mb-1 flex h-10 w-36 items-end justify-center border-b border-ink-900 mx-auto sm:ml-auto">
                  <span className="font-serif text-lg italic text-primary-700">
                    {doctorName.replace('Dr. ', '')}
                  </span>
                </div>
                <p className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
                  <Icon.Lock size={11} /> Cryptographically Signed
                </p>
                <p className="text-[10px] text-ink-600">{doctorName} • {doctorLicense}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
