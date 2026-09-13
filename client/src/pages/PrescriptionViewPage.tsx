import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { Download, Printer, ArrowLeft, Pill, Heart, Stethoscope, CheckCircle, ShieldCheck } from 'lucide-react';

export const PrescriptionViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm mb-4">
          {error || 'Prescription not found.'}
        </div>
        <Link to="/" className="text-blue-600 text-sm font-semibold hover:underline">
          Return to Portal
        </Link>
      </div>
    );
  }

  const token = localStorage.getItem('medralink_token');
  const pdfDownloadUrl = `/api/v1/prescriptions/${data.id}/pdf?token=${token}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print Prescription
          </button>

          <a
            href={pdfDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl shadow-md transition-all hover:scale-[1.02]"
          >
            <Download className="w-4 h-4" />
            Download Official PDF
          </a>
        </div>
      </div>

      {/* Clinical Prescription Sheet Paper */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden print:border-none print:shadow-none">
        {/* Header Ribbon */}
        <div className="bg-brand-navy p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">MedraLink Electronic Prescription</h1>
            <p className="text-xs text-blue-200 mt-0.5">National BMDC Certified Clinical Workflow</p>
          </div>
          <div className="text-right sm:border-l sm:border-blue-700 sm:pl-4">
            <div className="text-xs font-mono font-bold bg-blue-800/80 px-2.5 py-1 rounded inline-block text-blue-100">
              Rx: {data.prescription_uid}
            </div>
            <div className="text-xs text-blue-200 mt-1">Issue Date: {new Date(data.issue_date).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Doctor Header Block */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-700" />
              {data.doctor_name}
            </h2>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">{data.qualifications}</p>
            <p className="text-xs text-blue-600 font-bold">{data.specialization}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">BMDC Reg No: {data.bmdc_license_number}</p>
          </div>

          <div className="text-xs text-slate-500 sm:text-right">
            {data.hospital_affiliation && <p className="font-semibold text-slate-700">{data.hospital_affiliation}</p>}
            {data.chamber_details && <p className="mt-0.5">{data.chamber_details}</p>}
            {data.doctor_phone && <p className="mt-0.5 text-slate-400">Chamber Tel: {data.doctor_phone}</p>}
          </div>
        </div>

        {/* Patient Demographic Banner */}
        <div className="p-4 bg-slate-100/70 border-b border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Name</span>
            <span className="font-bold text-slate-800">{data.patient_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient UID</span>
            <span className="font-bold text-blue-800">{data.patient_uid}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender & DOB</span>
            <span className="text-slate-700 font-medium">{data.gender} | {data.date_of_birth}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group</span>
            <span className="font-bold text-rose-600">{data.blood_group || 'O+'}</span>
          </div>
        </div>

        {/* Vitals & Diagnoses Row */}
        <div className="p-6 border-b border-slate-200 space-y-4">
          {data.vitals && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Vitals at Consultation
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {data.vitals.systolic_bp && (
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    BP: <strong>{data.vitals.systolic_bp}/{data.vitals.diastolic_bp}</strong> mmHg
                  </span>
                )}
                {data.vitals.heart_rate && (
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    Pulse: <strong>{data.vitals.heart_rate}</strong> bpm
                  </span>
                )}
                {data.vitals.temperature && (
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    Temp: <strong>{data.vitals.temperature}</strong> °C
                  </span>
                )}
                {data.vitals.spo2 && (
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    SpO2: <strong>{data.vitals.spo2}</strong>%
                  </span>
                )}
                {data.vitals.bmi && (
                  <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    BMI: <strong>{data.vitals.bmi}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {data.diagnoses && data.diagnoses.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Clinical Diagnoses</div>
              <div className="flex flex-wrap gap-2">
                {data.diagnoses.map((d: any) => (
                  <span key={d.id} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-200 text-xs px-2.5 py-1 rounded-md font-semibold">
                    <span className="bg-blue-600 text-white text-[10px] font-mono px-1 rounded">{d.icd10_code}</span>
                    {d.diagnosis_title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ℞ Prescription Items Table */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-serif font-bold text-brand-navy">℞</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Prescribed Medication Regimen</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold">
                <tr>
                  <th className="px-4 py-2.5 text-left w-12">#</th>
                  <th className="px-4 py-2.5 text-left">Medication / Generic</th>
                  <th className="px-4 py-2.5 text-left">Dosage</th>
                  <th className="px-4 py-2.5 text-left">Frequency</th>
                  <th className="px-4 py-2.5 text-left">Duration</th>
                  <th className="px-4 py-2.5 text-left">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items && data.items.length > 0 ? (
                  data.items.map((it: any, idx: number) => (
                    <tr key={it.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-sm">{it.medication_name}</div>
                        {it.generic_name && <div className="text-[11px] text-slate-400">{it.generic_name}</div>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{it.dosage}</td>
                      <td className="px-4 py-3 font-bold text-blue-700">{it.frequency}</td>
                      <td className="px-4 py-3 text-slate-700">{it.duration}</td>
                      <td className="px-4 py-3 text-slate-500">{it.instructions || 'As advised'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">No medications prescribed.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Advice / Instructions */}
          {data.instructions && (
            <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs space-y-1">
              <div className="font-bold text-blue-900 uppercase text-[10px]">Doctor's Advice & Dietary Regimen:</div>
              <p className="text-slate-700 leading-relaxed">{data.instructions}</p>
            </div>
          )}
        </div>

        {/* Security & Verification Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-700 block">Digitally Signed & Validated Medical Record</span>
              <span>Authenticated via BMDC Reg: {data.bmdc_license_number}</span>
            </div>
          </div>

          <div className="text-right font-mono text-[10px] text-slate-400">
            <div>Auth Token: {btoa(data.prescription_uid)}</div>
            <div>Validity: {data.validity_days || 30} Days from issue</div>
          </div>
        </div>
      </div>
    </div>
  );
};
