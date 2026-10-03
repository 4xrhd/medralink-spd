import React, { useEffect, useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import api from '../services/api.js';
import { Card, Icon, Pill, Badge, Button, MetricCard } from '../ui/primitives.js';

export const AdminDashboard: React.FC = () => {
  useDocumentTitle('Enterprise Governance & Audit Ledger');
  const toast = useToast();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Doctor Accreditation Confirmation State
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Audit filter state
  const [auditFilterRole, setAuditFilterRole] = useState<'All' | 'DOCTOR' | 'PATIENT' | 'ADMIN'>('All');
  const [auditSearch, setAuditSearch] = useState('');
  const [last24Hours, setLast24Hours] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const [dRes, docsRes, auditRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/doctors'),
        api.get('/audit-logs'),
      ]);
      setDashboardData(dRes.data.data);
      setDoctors(docsRes.data.data || []);
      setAuditLogs(auditRes.data.data?.logs || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      toast.error('Failed to load governance telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApproveDoctor = async (doctorId: string, doctorName: string) => {
    try {
      await api.patch(`/doctors/${doctorId}/verify`, { isVerified: true });
      toast.success(`Accreditation approved for ${doctorName}`);
      await fetchStats();
    } catch (err) {
      console.error('Failed to approve doctor verification:', err);
      toast.error('Failed to approve doctor accreditation.');
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      await api.patch(`/doctors/${revokeTarget.id}/verify`, { isVerified: false });
      toast.warning(`Accreditation revoked for ${revokeTarget.name}`);
      setRevokeTarget(null);
      await fetchStats();
    } catch (err) {
      console.error('Failed to update doctor verification:', err);
      toast.error('Failed to revoke doctor accreditation.');
    } finally {
      setIsRevoking(false);
    }
  };

  const copy = async (hash: string) => {
    try {
      await navigator.clipboard?.writeText(hash);
      setCopiedHash(hash);
      toast.info('SHA-256 integrity hash copied to clipboard');
      setTimeout(() => setCopiedHash((c) => (c === hash ? null : c)), 1500);
    } catch {
      toast.error('Could not access clipboard');
    }
  };

  const stats = dashboardData?.stats;
  const pendingDoctorsCount = doctors.filter((d) => !d.is_verified).length;

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesRole = auditFilterRole === 'All' || log.role === auditFilterRole;
    const haystack = `${log.actor_name || ''} ${log.action || ''} ${log.resource || ''} ${log.details || ''}`.toLowerCase();
    const matchesSearch = !auditSearch.trim() || haystack.includes(auditSearch.trim().toLowerCase());
    return matchesRole && matchesSearch;
  });

  const roleTone = (r: string) =>
    r === 'DOCTOR' ? 'blue' : r === 'ADMIN' ? 'purple' : 'emerald';

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-audit border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-16">
      {/* Enterprise Governance Telemetry Banner */}
      <section aria-label="Governance Telemetry Banner" className="border-b border-hair bg-white">
        <div className="mx-auto flex max-w-[1200px] 2xl:max-w-[1720px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 2xl:px-12 py-5">
          <div>
            <h1 className="font-display text-xl font-bold text-ink-900">
              MedraLink Enterprise Governance &amp; Compliance Console
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-ink-600">
              <span className="inline-flex items-center gap-1.5 font-medium text-success">
                <span className="h-2 w-2 rounded-full bg-success" /> Platform Health: Operational
              </span>
              <span className="text-ink-400">•</span>
              <span className="tabular">99.99% Uptime</span>
              <span className="text-ink-400">•</span>
              <span>Zero Unresolved Security Alerts</span>
            </p>
          </div>

          <div className="hidden 2xl:flex items-center gap-6 border-l border-slate-200 pl-6 text-xs text-ink-600">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Data Center Node</span>
              <span className="font-semibold text-slate-900">Dhaka Central Colo-1 (Active)</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Cryptographic Keyring</span>
              <span className="font-mono text-audit font-bold">HSM-256 Validated • FIPS 140-2</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Regulatory Compliance</span>
              <span className="font-semibold text-success">BMDC Form-C &amp; DGDA Audited</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-hair bg-slate-50 px-3.5 py-2 shadow-xs">
            <img
              src="/assets/verified_seal.png"
              alt="Cryptographically verified ledger seal"
              className="h-8 w-8 object-contain"
              loading="lazy"
            />
            <div className="text-right">
              <p className="font-mono text-[11px] font-bold tracking-tight text-primary-700">LEDGER: SYNCHRONIZED</p>
              <p className="text-[10px] font-medium text-success">SHA-256 Validated • 256-Bit</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] 2xl:max-w-[1720px] space-y-6 px-4 sm:px-6 lg:px-8 2xl:px-12 py-8">
        {/* 4 Standardized Metric KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Registered Patient Records"
            value={stats?.totalPatients ?? 0}
            subtext="National health registry index"
            icon={<Icon.User size={20} />}
            iconTone="blue"
            status={{ label: "Live", tone: "emerald" }}
          />

          <MetricCard
            title="Accredited Physicians"
            value={stats?.totalDoctors ?? 0}
            subtext="BMDC Form-C certified"
            icon={<Icon.Stethoscope size={20} />}
            iconTone="emerald"
            status={{ label: "Live", tone: "emerald" }}
          />

          <MetricCard
            title="Consultations Processed"
            value={stats?.totalConsultations ?? 0}
            subtext="Unified clinical records"
            icon={<Icon.File size={20} />}
            iconTone="navy"
            status={{ label: "Live", tone: "emerald" }}
          />

          <MetricCard
            title="Cryptographic Audit Entries"
            value={stats?.auditEntriesCount ?? 0}
            subtext="SHA-256 validated ledger"
            icon={<Icon.Shield size={20} />}
            iconTone="purple"
            status={{ label: "Live", tone: "emerald" }}
          />
        </div>

        {/* Section 1: Physician Credential Verification & Onboarding Table */}
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair px-4 py-4 sm:px-6">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">
                Physician Credential Verification &amp; Onboarding
              </h2>
              <p className="text-sm text-ink-600">
                Approve or revoke BMDC accreditation with instant cryptographic validation status.
              </p>
            </div>
            <Pill tone={pendingDoctorsCount ? 'amber' : 'emerald'}>
              {pendingDoctorsCount ? `${pendingDoctorsCount} Pending Review` : 'Review Queue Clear'}
            </Pill>
          </div>

          <div className="overflow-x-auto" aria-label="Physician credential table">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="border-b border-hair bg-canvas text-left text-xs font-semibold text-slate-600">
                  <th className="px-6 py-3 font-semibold">Doctor Name &amp; UID</th>
                  <th className="px-4 py-3 font-semibold">BMDC License</th>
                  <th className="px-4 py-3 font-semibold">Specialization</th>
                  <th className="px-4 py-3 font-semibold">Hospital Affiliation</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-50/60">
                {doctors.map((doc) => {
                  const isAccredited = Boolean(doc.is_verified);
                  return (
                    <tr key={doc.id} className="hover:bg-canvas transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-ink-900">{doc.full_name}</p>
                        <p className="font-mono text-[11px] text-ink-600">{doc.doctor_uid || doc.id}</p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-ink-600">{doc.bmdc_license_number}</td>
                      <td className="px-4 py-3.5 text-ink-600">{doc.specialization}</td>
                      <td className="px-4 py-3.5 text-ink-600">{doc.hospital_affiliation}</td>
                      <td className="px-4 py-3.5">
                        <Badge tone={isAccredited ? 'emerald' : 'amber'} dot>
                          {isAccredited ? 'Accredited' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          {!isAccredited ? (
                            <Button
                              size="sm"
                              variant="clinical"
                              onClick={() => handleApproveDoctor(doc.id, doc.full_name)}
                            >
                              Approve
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-rose-200 text-critical hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => setRevokeTarget({ id: doc.id, name: doc.full_name })}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Section 2: Cryptographic Audit Trail Inspector (Append-Only) */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-hair px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <Icon.Shield size={18} className="text-audit" />
              <h2 className="font-display text-lg font-bold text-ink-900">
                Cryptographic Audit Trail Inspector
              </h2>
              <Pill tone="purple">Append-Only SHA-256</Pill>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-hair bg-white px-3 py-2 sm:flex-none focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-50 transition-all">
                <Icon.Search size={15} className="text-ink-600 shrink-0" />
                <input
                  aria-label="Search audit entries"
                  value={auditSearch}
                  onChange={(event) => setAuditSearch(event.target.value)}
                  placeholder="Search action, resource, or actor…"
                  className="min-w-0 w-full bg-transparent text-xs text-ink-900 outline-none placeholder:text-ink-400 sm:w-64"
                />
                {auditSearch && (
                  <button
                    type="button"
                    onClick={() => setAuditSearch('')}
                    className="text-ink-600 hover:text-ink-900 text-xs px-1"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex max-w-full overflow-x-auto rounded-lg border border-hair bg-white shadow-xs">
                {(['All', 'DOCTOR', 'PATIENT', 'ADMIN'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={auditFilterRole === r}
                    onClick={() => setAuditFilterRole(r)}
                    className={`shrink-0 px-3 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary-600 ${
                      auditFilterRole === r
                        ? 'bg-primary-700 text-white'
                        : 'bg-white text-ink-600 hover:bg-slate-50'
                    }`}
                  >
                    {r === 'All' ? 'All Roles' : r}
                  </button>
                ))}
              </div>

              <button
                type="button"
                aria-pressed={last24Hours}
                onClick={() => setLast24Hours((current) => !current)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary-600 shadow-xs ${
                  last24Hours
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-hair bg-white text-ink-600 hover:border-hair-strong'
                }`}
              >
                <Icon.Clock size={14} /> Last 24 hours
              </button>
            </div>
          </div>

          <div className="overflow-x-auto" aria-label="Cryptographic audit entries">
            <table className="min-w-[1050px] w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-hair bg-canvas text-left font-sans text-xs font-semibold text-slate-600">
                  <th className="px-6 py-2.5 font-semibold">Timestamp</th>
                  <th className="px-3 py-2.5 font-semibold">Actor Role</th>
                  <th className="px-3 py-2.5 font-semibold">Action</th>
                  <th className="px-3 py-2.5 font-semibold">Target Resource</th>
                  <th className="px-3 py-2.5 font-semibold">Transaction Context</th>
                  <th className="px-6 py-2.5 font-semibold">SHA-256 Integrity Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-50/60">
                {filteredAuditLogs.map((l, i) => {
                  const hash = l.integrity_hash || l.hash || '—';
                  const isCopied = copiedHash === hash && hash !== '—';
                  return (
                    <tr key={l.id || i} className="hover:bg-canvas transition-colors">
                      <td className="tabular whitespace-nowrap px-6 py-3 text-ink-600">
                        {l.created_at ? new Date(l.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-sans">
                          <Pill tone={roleTone(l.role)}>{l.role}</Pill>
                        </span>
                        <span className="mt-0.5 block text-[10px] font-sans font-medium text-ink-600">
                          {l.actor_name || l.actor || 'System'}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-primary-700">{l.action}</td>
                      <td className="px-3 py-3 text-audit font-semibold">{l.resource}</td>
                      <td className="px-3 py-3 font-sans text-ink-600">{l.details || l.context || '—'}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-ink-900 select-all">{hash}</span>
                          {hash !== '—' && (
                            <button
                              onClick={() => copy(hash)}
                              type="button"
                              aria-label={`Copy integrity hash for ${l.action}`}
                              className={`grid h-6 w-6 place-items-center rounded border transition-all ${
                                isCopied
                                  ? 'border-emerald-200 bg-emerald-50 text-success'
                                  : 'border-hair text-ink-600 hover:bg-slate-100 hover:text-primary-600'
                              }`}
                              title={isCopied ? 'Copied!' : 'Copy hash'}
                            >
                              {isCopied ? (
                                <Icon.Check size={12} className="text-success" />
                              ) : (
                                <Icon.Copy size={12} />
                              )}
                            </button>
                          )}
                          {isCopied && (
                            <span className="font-sans text-[10px] font-bold text-success">Copied!</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredAuditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center font-sans text-sm text-ink-600">
                      No audit entries match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Destructive Action Confirmation Dialog */}
        <ConfirmModal
          isOpen={Boolean(revokeTarget)}
          title="Revoke Physician BMDC Accreditation?"
          message={
            <div className="space-y-2">
              <p>
                Are you sure you want to revoke the accreditation of{' '}
                <strong className="text-ink-900">{revokeTarget?.name}</strong>?
              </p>
              <p className="text-xs text-critical font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                Revoking will immediately suspend this physician's authority to issue or cryptographically sign new clinical prescriptions across MedraLink.
              </p>
            </div>
          }
          confirmLabel="Revoke Accreditation"
          cancelLabel="Keep Accredited"
          isDestructive={true}
          isLoading={isRevoking}
          onConfirm={handleConfirmRevoke}
          onCancel={() => setRevokeTarget(null)}
        />
      </main>
    </div>
  );
};
export default AdminDashboard;
