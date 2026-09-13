import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import { Clock, FileText, AlertTriangle, Activity, Calendar, Download, ChevronRight, Heart, Pill } from 'lucide-react';

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const patientId = user?.patientId || 'pat-1';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Patient Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/30 text-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-400/30">
              UID: {user?.patientUid || 'P-1001'}
            </span>
            <span className="text-xs text-slate-300">MedraLink Patient Record</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">Welcome, {user?.fullName}</h1>
          <p className="text-sm text-blue-200 mt-1 max-w-xl">
            Access your unified digital clinical history, electronic prescriptions, vitals telemetry, and diagnostic laboratory results.
          </p>
        </div>

        <Link
          to={`/patient/timeline/${patientId}`}
          className="flex items-center gap-2 bg-white text-brand-navy hover:bg-blue-50 font-bold px-5 py-3 rounded-xl shadow-md transition-all shrink-0 hover:scale-[1.02]"
        >
          <Clock className="w-5 h-5 text-blue-600" />
          <span>Interactive Medical Timeline</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* Allergies & Warning Strip */}
      {data?.allergies && data.allergies.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-900 uppercase tracking-wide">Known Medical Contraindications / Allergies: </span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {data.allergies.map((alg: any) => (
                <span key={alg.id} className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300 font-semibold">
                  ⚠️ {alg.allergen} ({alg.severity})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{data?.stats?.totalVisits || 0}</div>
            <div className="text-xs font-medium text-slate-500">Total Consultations Logged</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{data?.stats?.activePrescriptionsCount || 0}</div>
            <div className="text-xs font-medium text-slate-500">Active Prescriptions</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{data?.stats?.labReportsCount || 0}</div>
            <div className="text-xs font-medium text-slate-500">Diagnostic Lab Reports</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Latest Vitals & Active Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latest Vitals */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Recent Clinical Biometrics
            </h2>
            {data?.latestVitals?.visit_date && (
              <span className="text-xs text-slate-400">Captured: {new Date(data.latestVitals.visit_date).toLocaleDateString()}</span>
            )}
          </div>

          {data?.latestVitals ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Blood Pressure</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">
                  {data.latestVitals.systolic_bp}/{data.latestVitals.diastolic_bp} <span className="text-xs font-normal text-slate-400">mmHg</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Heart Rate</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">
                  {data.latestVitals.heart_rate || '--'} <span className="text-xs font-normal text-slate-400">bpm</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Body Temp</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">
                  {data.latestVitals.temperature || '--'} <span className="text-xs font-normal text-slate-400">°C</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Oxygen (SpO2)</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">
                  {data.latestVitals.spo2 || '--'} <span className="text-xs font-normal text-slate-400">%</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Weight & Height</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">
                  {data.latestVitals.weight_kg || '--'} <span className="text-xs font-normal text-slate-400">kg</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">BMI Index</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">
                  {data.latestVitals.bmi || '--'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-6 text-center">No biometric vitals logged yet.</div>
          )}
        </div>

        {/* Active Prescriptions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-600" />
                Recent Electronic Prescriptions
              </h2>
            </div>

            <div className="space-y-3">
              {data?.activePrescriptions && data.activePrescriptions.length > 0 ? (
                data.activePrescriptions.map((rx: any) => (
                  <div key={rx.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-brand-navy">{rx.prescription_uid}</div>
                      <div className="text-xs text-slate-600 mt-0.5 font-medium">Issued by: {rx.doctor_name} ({rx.specialization})</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Date: {new Date(rx.issue_date).toLocaleDateString()}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/prescription/${rx.id}`}
                        className="text-xs bg-white border border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-md font-semibold transition-colors"
                      >
                        View
                      </Link>
                      <a
                        href={`/api/v1/prescriptions/${rx.id}/pdf?token=${localStorage.getItem('medralink_token')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-semibold shadow-sm transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-6 text-center">No electronic prescriptions recorded yet.</div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-right">
            <Link
              to={`/patient/timeline/${patientId}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              View complete chronological history
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
