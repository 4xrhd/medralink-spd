import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { Clock, Calendar, User, Stethoscope, Pill, FileText, Download, Heart, AlertTriangle, Activity, ArrowLeft } from 'lucide-react';

export const PatientTimelinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-200 text-sm mb-4">
          {error || 'Patient timeline data unavailable.'}
        </div>
        <Link to="/" className="text-blue-600 text-sm font-semibold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { patient, allergies, conditions, timeline } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </Link>
        <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
          Longitudinal EMR Timeline
        </span>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-brand-navy text-white px-2.5 py-0.5 rounded">
                {patient.patient_uid}
              </span>
              <span className="text-xs text-slate-400">Gender: {patient.gender} | DOB: {patient.date_of_birth}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{patient.full_name}</h1>
            <div className="text-xs text-slate-500 mt-0.5">
              Blood Group: <strong className="text-rose-600">{patient.blood_group || 'Unknown'}</strong> | Contact: {patient.phone} | City: {patient.city || 'Dhaka'}
            </div>
          </div>

          {/* Emergency Contact */}
          {patient.emergency_contact_name && (
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs">
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Emergency Contact:</span>
              <span className="font-bold text-slate-800">{patient.emergency_contact_name}</span> ({patient.emergency_contact_relation})
              <div className="text-slate-500">{patient.emergency_contact_phone}</div>
            </div>
          )}
        </div>

        {/* Chronic Conditions & Allergies Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 items-center">
          {allergies && allergies.length > 0 && allergies.map((alg: any) => (
            <span key={alg.id} className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 text-xs px-2.5 py-1 rounded-md font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              Allergy: {alg.allergen} ({alg.severity})
            </span>
          ))}

          {conditions && conditions.length > 0 && conditions.map((c: any) => (
            <span key={c.id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs px-2.5 py-1 rounded-md font-semibold">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              Condition: {c.condition_name} ({c.status})
            </span>
          ))}
        </div>
      </div>

      {/* The Timeline Tree */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-blue-200 space-y-8 my-8">
        {timeline.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">
            No clinical consultation history recorded yet for this patient.
          </div>
        ) : (
          timeline.map((record: any) => (
            <div key={record.id} className="relative group">
              {/* Timeline Marker Node */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-white border-4 border-blue-600 shadow-sm flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              </div>

              {/* Consultation Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
                {/* Card Top: Date & Doctor details */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(record.visit_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-brand-navy" />
                      {record.doctor_name}
                      <span className="text-xs font-normal text-slate-400">({record.doctor_specialization})</span>
                    </h3>
                    <div className="text-xs text-slate-500">{record.doctor_hospital}</div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      Record: {record.record_uid}
                    </span>
                  </div>
                </div>

                {/* Chief Complaints & Clinical Notes */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Chief Complaints</div>
                  <p className="text-sm font-medium text-slate-800">{record.chief_complaint}</p>
                  {record.clinical_notes && (
                    <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong>Clinical Assessment:</strong> {record.clinical_notes}
                    </p>
                  )}
                </div>

                {/* Vitals Ribbon */}
                {record.vitals && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      Patient Vitals Recorded:
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-700">
                      {record.vitals.systolic_bp && (
                        <span className="bg-white px-2.5 py-1 rounded border border-slate-200">
                          BP: <strong>{record.vitals.systolic_bp}/{record.vitals.diastolic_bp}</strong> mmHg
                        </span>
                      )}
                      {record.vitals.heart_rate && (
                        <span className="bg-white px-2.5 py-1 rounded border border-slate-200">
                          Pulse: <strong>{record.vitals.heart_rate}</strong> bpm
                        </span>
                      )}
                      {record.vitals.temperature && (
                        <span className="bg-white px-2.5 py-1 rounded border border-slate-200">
                          Temp: <strong>{record.vitals.temperature}</strong> °C
                        </span>
                      )}
                      {record.vitals.spo2 && (
                        <span className="bg-white px-2.5 py-1 rounded border border-slate-200">
                          SpO2: <strong>{record.vitals.spo2}</strong>%
                        </span>
                      )}
                      {record.vitals.bmi && (
                        <span className="bg-white px-2.5 py-1 rounded border border-slate-200">
                          BMI: <strong>{record.vitals.bmi}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Diagnoses (ICD-10) */}
                {record.diagnoses && record.diagnoses.length > 0 && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Diagnoses (ICD-10 Codified)</div>
                    <div className="flex flex-wrap gap-2">
                      {record.diagnoses.map((d: any) => (
                        <span key={d.id} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-200 text-xs px-2.5 py-1 rounded-md font-semibold">
                          <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{d.icd10_code}</span>
                          {d.diagnosis_title} ({d.severity})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prescription Box */}
                {record.prescription && (
                  <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                        <Pill className="w-4 h-4 text-emerald-600" />
                        Electronic Prescription ({record.prescription.prescription_uid})
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/prescription/${record.prescription.id}`}
                          className="text-xs bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 px-2.5 py-1 rounded font-semibold transition-colors"
                        >
                          View Rx
                        </Link>
                        <a
                          href={`/api/v1/prescriptions/${record.prescription.id}/pdf?token=${localStorage.getItem('medralink_token')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded font-semibold shadow-sm transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download PDF
                        </a>
                      </div>
                    </div>

                    {record.prescription.items && record.prescription.items.length > 0 && (
                      <div className="bg-white rounded-lg border border-emerald-100 overflow-hidden text-xs">
                        <table className="min-w-full divide-y divide-emerald-100">
                          <thead className="bg-emerald-50/70 text-emerald-900 font-semibold">
                            <tr>
                              <th className="px-3 py-1.5 text-left">Medication</th>
                              <th className="px-3 py-1.5 text-left">Dosage</th>
                              <th className="px-3 py-1.5 text-left">Frequency</th>
                              <th className="px-3 py-1.5 text-left">Duration</th>
                              <th className="px-3 py-1.5 text-left">Instructions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {record.prescription.items.map((it: any, idx: number) => (
                              <tr key={it.id || idx}>
                                <td className="px-3 py-2 font-bold text-slate-800">
                                  {it.medication_name}
                                  {it.generic_name && <span className="block text-[10px] text-slate-400 font-normal">{it.generic_name}</span>}
                                </td>
                                <td className="px-3 py-2 text-slate-600">{it.dosage}</td>
                                <td className="px-3 py-2 font-semibold text-blue-700">{it.frequency}</td>
                                <td className="px-3 py-2 text-slate-600">{it.duration}</td>
                                <td className="px-3 py-2 text-slate-500">{it.instructions || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Lab Reports Ordered / Attached */}
                {record.labReports && record.labReports.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      Associated Diagnostic Lab Tests:
                    </div>
                    <div className="space-y-2">
                      {record.labReports.map((lab: any) => (
                        <div key={lab.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{lab.test_name}</span>
                            <span className="ml-2 text-slate-400">[{lab.category}]</span>
                            {lab.results_summary && <p className="text-slate-600 mt-0.5">{lab.results_summary}</p>}
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lab.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {lab.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
