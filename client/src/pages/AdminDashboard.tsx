import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { Shield, Users, Stethoscope, FileText, CheckCircle, XCircle, Search, Filter, RefreshCw, Key, ShieldCheck } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Audit filter state
  const [auditFilterRole, setAuditFilterRole] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const dRes = await api.get('/dashboard');
      setDashboardData(dRes.data.data);

      const docsRes = await api.get('/doctors');
      setDoctors(docsRes.data.data);

      const auditRes = await api.get('/audit-logs');
      setAuditLogs(auditRes.data.data.logs);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFilterAudit = async () => {
    setAuditLoading(true);
    try {
      let url = `/audit-logs?`;
      if (auditFilterRole) url += `role=${auditFilterRole}&`;
      if (auditSearch) url += `search=${encodeURIComponent(auditSearch)}&`;
      const res = await api.get(url);
      setAuditLogs(res.data.data.logs);
    } catch (err) {
      console.error('Audit filter error:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleVerifyToggle = async (doctorId: string, currentStatus: number) => {
    try {
      await api.patch(`/doctors/${doctorId}/verify`, { isVerified: !currentStatus });
      fetchStats();
    } catch (err) {
      console.error('Failed to update doctor verification:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  const stats = dashboardData?.stats;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Welcome Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-brand-navy rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/30 text-purple-200 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-purple-400/30">
              System Governance & Security Controller
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">MedraLink Administrative Console</h1>
          <p className="text-sm text-purple-200 mt-1 max-w-xl">
            Audit logging oversight, doctor credentials onboarding, and platform security policy enforcement.
          </p>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats?.totalPatients || 0}</div>
            <div className="text-xs font-medium text-slate-500">Registered Patients</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats?.totalDoctors || 0}</div>
            <div className="text-xs font-medium text-slate-500">Medical Doctors</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats?.totalRecords || 0}</div>
            <div className="text-xs font-medium text-slate-500">Clinical Records Logged</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats?.totalAuditLogs || 0}</div>
            <div className="text-xs font-medium text-slate-500">Immutable Audit Entries</div>
          </div>
        </div>
      </div>

      {/* Doctor Verification & Onboarding Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-blue-600" />
          Doctor Licensing & Credential Verification
        </h2>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold">
              <tr>
                <th className="px-4 py-3 text-left">Doctor Name & UID</th>
                <th className="px-4 py-3 text-left">BMDC Reg No.</th>
                <th className="px-4 py-3 text-left">Specialization & Hospital</th>
                <th className="px-4 py-3 text-left">License Status</th>
                <th className="px-4 py-3 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctors.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{doc.full_name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{doc.doctor_uid}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                    {doc.bmdc_license_number}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{doc.specialization}</div>
                    <div className="text-[11px] text-slate-400">{doc.hospital_affiliation || 'Independent Practice'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      doc.is_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.is_verified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {doc.is_verified ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleVerifyToggle(doc.id, doc.is_verified)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${
                        doc.is_verified
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                      }`}
                    >
                      {doc.is_verified ? 'Revoke Access' : 'Approve Doctor'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Audit Log Inspector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Cryptographic Audit Trail Inspector (Append-Only)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks all medical history accesses, consultation mutations, and login sessions with SHA-256 hash chains.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={auditFilterRole}
              onChange={(e) => setAuditFilterRole(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
            >
              <option value="">All Roles</option>
              <option value="DOCTOR">Doctor</option>
              <option value="PATIENT">Patient</option>
              <option value="ADMIN">Admin</option>
            </select>

            <input
              type="text"
              placeholder="Search action or details..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
            />

            <button
              onClick={handleFilterAudit}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
            >
              Filter
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-bold">
              <tr>
                <th className="px-3 py-2.5 text-left">Timestamp</th>
                <th className="px-3 py-2.5 text-left">Actor Role</th>
                <th className="px-3 py-2.5 text-left">Action</th>
                <th className="px-3 py-2.5 text-left">Target Resource</th>
                <th className="px-3 py-2.5 text-left">Event Details</th>
                <th className="px-3 py-2.5 text-left">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()} {new Date(log.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.actor_role === 'DOCTOR' ? 'bg-blue-100 text-blue-800' :
                      log.actor_role === 'PATIENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {log.actor_role}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-bold text-slate-800 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {log.target_resource}
                  </td>
                  <td className="px-3 py-2 text-slate-700 font-sans max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="px-3 py-2 text-slate-400 text-[10px] max-w-xs truncate" title={log.sha256_hash}>
                    {log.sha256_hash ? log.sha256_hash.substring(0, 16) + '...' : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
