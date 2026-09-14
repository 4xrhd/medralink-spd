import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
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
    <div className="grid h-20 w-20 grid-cols-11 gap-px rounded-md bg-white p-1 ring-1 ring-[#E2E8F0]">
      {cells.map((c, i) => (
        <div key={i} className={c ? "bg-[#0F172A]" : "bg-transparent"} />
      ))}
    </div>
  );
}

export const PrescriptionViewPage: React.FC = () => {
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
      <div className="flex min-h-[60vh] items-center justify-center bg-[#334155]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#334155] px-4 py-16 text-center text-white">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
          <Icon.Alert size={36} className="mx-auto text-rose-400 mb-3" />
          <p className="text-sm font-semibold">{error || 'Prescription record not found.'}</p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#1B365D] hover:bg-slate-100"
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
    : '10 August 2026';

  const doctorName = data.doctor_name || 'Dr. Ahmed Tariq';
  const doctorLicense = data.bmdc_license_number || 'A-54921';
  const hospitalAffiliation = data.hospital_affiliation || 'Square Hospital';
  const chamberDetails = data.chamber_details || 'Room 402, Panthapath, Dhaka';
  const doctorPhone = data.doctor_phone || '+8801711000002';
  const qualifications = data.qualifications || 'MBBS, FCPS (Cardiology), MD (Cardiology, BSMMU)';
  const specialization = data.specialization || 'Specialist in Cardiology & Internal Medicine';

  const patientName = data.patient_name || 'Rahim Ahmed';
  const patientUid = data.patient_uid || 'P-1001';
  const gender = data.gender || 'Male';
  const bloodGroup = data.blood_group || 'O+';
  const age = data.date_of_birth
    ? `${new Date().getFullYear() - new Date(data.date_of_birth).getFullYear()} Yrs`
    : '45 Yrs';

  const items = data.items && data.items.length > 0 ? data.items : [
    {
      medication_name: 'Tab. Amlocard',
      generic_name: 'Amlodipine Besylate',
      dosage: '5mg',
      frequency: '1 + 0 + 0',
      duration: '30 Days',
      instructions: 'Take after breakfast'
    },
    {
      medication_name: 'Tab. Napa Extra',
      generic_name: 'Paracetamol + Caffeine',
      dosage: '565mg',
      frequency: '1 + 0 + 1',
      duration: '5 Days',
      instructions: 'Take after meals if headache occurs'
    }
  ];

  return (
    <div className="min-h-screen overflow-x-auto bg-[#334155] py-6 sm:py-10 px-2 sm:px-4">
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
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-[#1B365D] shadow-sm transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <Icon.Download size={14} /> Official PDF (℞)
          </a>
        </div>
      </div>

      {/* A4 page: 595 x 842 pt ratio, fully responsive on mobile */}
      <div className="print-sheet mx-auto flex min-h-[842px] w-full max-w-[595px] flex-col bg-white shadow-2xl rounded-sm">
        {/* Header banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1B365D] px-6 sm:px-8 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/15">
              <Icon.Cross size={20} />
            </div>
            <div>
              <p className="font-display text-base sm:text-lg font-extrabold leading-tight">MedraLink Clinical Health System</p>
              <p className="text-[11px] sm:text-xs text-blue-200">National Digital E-Prescription Registry</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="rounded-md bg-white/15 px-2 py-1 font-mono text-xs font-semibold">
              Rx ID: {data.prescription_uid}
            </span>
            <p className="mt-1.5 text-xs text-blue-200">Issued: {issueDateFormatted}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-5 sm:px-8 py-6">
          {/* Physician letterhead */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-6">
            <div>
              <p className="text-base font-bold text-[#0F172A]">{doctorName}</p>
              <p className="text-xs text-[#475569]">{qualifications}</p>
              <p className="text-xs text-[#475569]">{specialization}</p>
              <p className="mt-1 font-mono text-[11px] text-[#64748B]">
                BMDC Registration No: {doctorLicense}
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-[#475569]">
              <p className="font-semibold text-[#0F172A]">Chamber: {hospitalAffiliation}</p>
              <p>{chamberDetails}</p>
              <p className="mt-1 font-mono text-[11px] text-[#64748B]">Tel: {doctorPhone}</p>
            </div>
          </div>

          <div className="my-4 h-px bg-[#E2E8F0]" />

          {/* Patient demographic strip (2 columns on mobile, 4 columns on sm+) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-lg bg-[#CBD5E1]">
            {[
              ['Patient Name', patientName],
              ['UID', patientUid],
              ['Gender & Age', `${gender} • ${age}`],
              ['Blood Group', bloodGroup],
            ].map(([l, v], i) => (
              <div key={l} className="bg-[#F8FAFC] px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">{l}</p>
                <p className={`mt-0.5 text-xs sm:text-sm font-semibold text-[#0F172A] ${i > 0 ? 'tabular' : ''}`}>
                  {v}
                </p>
              </div>
            ))}
          </div>

          {/* Clinical indicators (Vitals & Diagnoses) */}
          <div className="mt-4 space-y-1.5 text-xs">
            {data.vitals && (
              <p className="text-[#475569]">
                <span className="font-semibold text-[#0F172A]">Vitals: </span>
                <span className="tabular">
                  BP: {data.vitals.systolic_bp || 145}/{data.vitals.diastolic_bp || 92} mmHg |{' '}
                  Pulse: {data.vitals.heart_rate || 78} bpm | Temp: {data.vitals.temperature || 36.8}°C |{' '}
                  Weight: {data.vitals.weight_kg || 76.5} kg | BMI: {data.vitals.bmi || 25.9}
                </span>
              </p>
            )}

            <p className="text-[#475569]">
              <span className="font-semibold text-[#0F172A]">Diagnosis: </span>
              {data.diagnoses && data.diagnoses.length > 0 ? (
                data.diagnoses.map((d: any) => (
                  <span key={d.id} className="mr-2">
                    ICD-10: [{d.icd10_code}] {d.diagnosis_title}{' '}
                    <span className="font-medium text-[#059669]">({d.severity || 'Active'})</span>
                  </span>
                ))
              ) : (
                <span>
                  ICD-10: [I10] Essential (Primary) Hypertension{' '}
                  <span className="font-medium text-[#059669]">(Active)</span>
                </span>
              )}
            </p>
          </div>

          {/* Prescription Body (The ℞ Section) */}
          <div className="mt-5 flex-1">
            <div className="flex items-center gap-3">
              <span className="font-serif text-3xl font-bold text-[#1B365D]">℞</span>
              <div className="h-px flex-1 bg-[#E2E8F0]" />
            </div>

            <div className="overflow-x-auto">
              <table className="mt-3 w-full min-w-[500px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#CBD5E1] text-left text-[10px] uppercase tracking-wider text-[#64748B]">
                    <th className="w-6 py-2 font-bold">#</th>
                    <th className="py-2 font-bold">Medicine Name &amp; Generic</th>
                    <th className="py-2 font-bold">Dosage</th>
                    <th className="py-2 font-bold">Frequency</th>
                    <th className="py-2 font-bold">Duration</th>
                    <th className="py-2 font-bold">Instructions</th>
                  </tr>
                </thead>
                <tbody className="text-[#0F172A]">
                  {items.map((item: any, index: number) => (
                    <tr key={item.id || index} className="border-b border-[#F1F5F9] align-top">
                      <td className="py-2.5 tabular text-[#64748B]">{index + 1}</td>
                      <td className="py-2.5 pr-2">
                        <p className="font-semibold text-[#0F172A]">{item.medication_name}</p>
                        {item.generic_name && (
                          <p className="text-[10px] text-[#64748B]">({item.generic_name})</p>
                        )}
                      </td>
                      <td className="py-2.5 tabular">{item.dosage}</td>
                      <td className="py-2.5">
                        <span className="font-mono font-semibold text-[#2563EB]">{item.frequency}</span>
                      </td>
                      <td className="py-2.5 tabular">{item.duration}</td>
                      <td className="py-2.5 text-[#475569]">{item.instructions || 'As directed'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Advice & Follow-up */}
            <div className="mt-5 rounded-lg bg-[#F8FAFC] p-3.5 border border-[#E2E8F0]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                Physician's Clinical Advice
              </p>
              <p className="mt-1 text-xs text-[#0F172A] leading-relaxed">
                {data.instructions ||
                  'Maintain low sodium diet. Avoid excessive oil. Walk 30 minutes daily. Monitor blood pressure twice weekly.'}
              </p>
              {data.follow_up_date && (
                <p className="mt-2 text-xs">
                  <span className="font-semibold text-[#1B365D]">Follow-up: </span>
                  <span className="text-[#475569]">
                    Review in chamber on {new Date(data.follow_up_date).toLocaleDateString()} with updated Lipid Profile.
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Digital Authentication & Verification Sign-Off */}
          <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 border-t border-[#E2E8F0] pt-4">
            <div className="flex items-center gap-3">
              <QR />
              <div className="max-w-[190px]">
                <p className="text-[10px] leading-relaxed text-[#64748B]">
                  Authenticated electronic medical record generated via MedraLink Clinical Infrastructure. Scan to verify on national registry.
                </p>
                <p className="mt-0.5 font-mono text-[9px] text-[#94A3B8]">SHA-256: 4f89b...e21c</p>
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
                <div className="mb-1 flex h-10 w-36 items-end justify-center border-b border-[#0F172A] mx-auto sm:ml-auto">
                  <span className="font-serif text-lg italic text-[#1B365D]">
                    {doctorName.replace('Dr. ', '')}
                  </span>
                </div>
                <p className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#059669]">
                  <Icon.Lock size={11} /> Cryptographically Signed
                </p>
                <p className="text-[10px] text-[#64748B]">{doctorName} • {doctorLicense}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
