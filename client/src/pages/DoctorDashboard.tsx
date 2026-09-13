import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import { Search, Stethoscope, User, Calendar, Clock, PlusCircle, CheckCircle, ChevronRight, FileText } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Patient Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load doctor dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.get(`/patients?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data.data);
    } catch (err) {
      console.error('Patient search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Doctor Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/30 text-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-400/30">
              BMDC Verified Workstation
            </span>
            <span className="text-xs text-slate-300">NICVD / Square Hospital Chamber</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">Welcome, {user?.fullName}</h1>
          <p className="text-sm text-blue-200 mt-1 max-w-xl">
            Search patient longitudinal health records, enter clinical diagnoses, and issue verifiable digital prescriptions.
          </p>
        </div>

        <Link
          to="/doctor/new-consultation"
          className="flex items-center gap-2 bg-white text-brand-navy hover:bg-blue-50 font-bold px-5 py-3 rounded-xl shadow-md transition-all shrink-0 hover:scale-[1.02]"
        >
          <PlusCircle className="w-5 h-5 text-blue-600" />
          <span>New Clinical Consultation</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{data?.stats?.todayAppointmentsCount || 0}</div>
            <div className="text-xs font-medium text-slate-500">Today's Appointment Queue</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{data?.stats?.totalConsultations || 0}</div>
            <div className="text-xs font-medium text-slate-500">Total Consultations Completed</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{data?.stats?.totalPrescriptionsIssued || 0}</div>
            <div className="text-xs font-medium text-slate-500">E-Prescriptions Issued</div>
          </div>
        </div>
      </div>

      {/* Patient Search Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Patient Longitudinal Record Search
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search patient records by Medra-UID (e.g. <code>P-1001</code>), Patient Name, Phone Number, or NID.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Patient UID (e.g. P-1001), Name (e.g. Rahim Ahmed), or Phone..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="bg-brand-navy hover:bg-blue-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            {isSearching ? 'Searching...' : 'Search Patient'}
          </button>
        </form>

        {/* Search Results Display */}
        {searchResults.length > 0 && (
          <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 border-b border-slate-200">
              Found {searchResults.length} Patient Matches
            </div>
            <div className="divide-y divide-slate-100">
              {searchResults.map((pt) => (
                <div key={pt.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {pt.patient_uid}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{pt.full_name}</span>
                      <span className="text-xs text-rose-600 font-semibold">({pt.blood_group || 'Blood: N/A'})</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Gender: {pt.gender} | DOB: {pt.date_of_birth} | Contact: {pt.phone} | District: {pt.district || 'Dhaka'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/patient/timeline/${pt.id}`}
                      className="inline-flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      View Timeline
                    </Link>
                    <Link
                      to={`/doctor/new-consultation?patientId=${pt.id}`}
                      className="inline-flex items-center gap-1 text-xs bg-brand-navy hover:bg-blue-900 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      Start Consultation
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Two Column Grid: Today's Appointments & Recent Consultations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            Today's Scheduled Consultations
          </h2>

          <div className="space-y-3">
            {data?.todayAppointments && data.todayAppointments.length > 0 ? (
              data.todayAppointments.map((apt: any) => (
                <div key={apt.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-700">{apt.time_slot}</span>
                      <span className="text-xs font-bold text-slate-900">{apt.patient_name}</span>
                      <span className="text-[10px] text-slate-400">({apt.patient_uid})</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{apt.reason || 'General Consultation'}</div>
                  </div>

                  <Link
                    to={`/doctor/new-consultation?patientId=${apt.patient_id}&appointmentId=${apt.id}`}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Consult
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center">
                No appointments queued for today.
              </div>
            )}
          </div>
        </div>

        {/* Recent Consultations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-emerald-600" />
            Recent Clinical Records Logged
          </h2>

          <div className="space-y-3">
            {data?.recentConsultations && data.recentConsultations.length > 0 ? (
              data.recentConsultations.map((c: any) => (
                <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{c.patient_name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({c.record_uid})</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 line-clamp-1">{c.chief_complaint}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{new Date(c.visit_date).toLocaleDateString()}</div>
                  </div>

                  <Link
                    to={`/patient/timeline/${c.patient_id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    View Record
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center">
                No recent consultations recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
