import { useLanguage } from '../context/LanguageContext.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import api, { getApiErrorMessage } from '../services/api.js';
import { formatServerDateTime } from '../utils/dates.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { AdminUsersPanel, AdminSettingsPanel } from '../components/AdminPanels.js';
import { Badge, Button, Card, Icon, Input, MetricCard, PageHeader, Skeleton } from '../ui/primitives.js';
import { DataTable, TBody, THead, Td, Th, Tr } from '../ui/table.js';

const AUDIT_PAGE_SIZE = 50;

export const AdminDashboard: React.FC = () => {
  const { t: tr } = useLanguage();
  useDocumentTitle(tr('Enterprise Governance & Audit Ledger'));
  const toast = useToast();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Doctor Accreditation Confirmation State
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Audit filter state
  const [auditFilterRole, setAuditFilterRole] = useState<'All' | 'DOCTOR' | 'PATIENT' | 'ADMIN'>('All');
  const [auditSearch, setAuditSearch] = useState('');
  const [last24Hours, setLast24Hours] = useState(false);
  const [auditFrom, setAuditFrom] = useState('');
  const [auditTo, setAuditTo] = useState('');
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState('');
  const [ledger, setLedger] = useState<{ valid: boolean; checked: number; brokenAt?: { seq: number; reason: string } } | null>(null);
  const [checkingLedger, setCheckingLedger] = useState(false);
  const auditRequest = useRef(0);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const debouncedAuditSearch = useDebounce(auditSearch, 300);

  // Filtering runs on the server (GET /admin/audit-logs) so it covers the whole ledger, not one page
  const fetchAuditLogs = useCallback(async () => {
    const requestId = ++auditRequest.current;
    const params: Record<string, string> = { limit: String(AUDIT_PAGE_SIZE), page: String(auditPage) };
    if (auditFilterRole !== 'All') params.role = auditFilterRole;
    if (debouncedAuditSearch.trim()) params.search = debouncedAuditSearch.trim();
    if (last24Hours) params.from = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    else if (auditFrom) params.from = new Date(auditFrom).toISOString();
    if (auditTo) params.to = new Date(`${auditTo}T23:59:59`).toISOString();
    setAuditLoading(true);
    setAuditError('');
    try {
      const res = await api.get('/admin/audit-logs', { params });
      if (requestId !== auditRequest.current) return; // a newer filter or page already replaced this one
      setAuditLogs(res.data.data?.logs || []);
      setAuditTotal(res.data.data?.total ?? 0);
    } catch (err) {
      if (requestId !== auditRequest.current) return;
      // Never leave the previous results on screen labelled as matches for the new filters
      setAuditLogs([]);
      setAuditTotal(0);
      setAuditError(getApiErrorMessage(err, tr('Failed to load audit logs')));
    } finally {
      if (requestId === auditRequest.current) setAuditLoading(false);
    }
  }, [auditFilterRole, debouncedAuditSearch, last24Hours, auditFrom, auditTo, auditPage]);

  // A filter change starts again from the first page
  useEffect(() => {
    setAuditPage(1);
  }, [auditFilterRole, debouncedAuditSearch, last24Hours, auditFrom, auditTo]);

  const auditPageCount = Math.max(1, Math.ceil(auditTotal / AUDIT_PAGE_SIZE));

  const checkLedger = async () => {
    setCheckingLedger(true);
    try {
      const res = await api.get('/admin/audit-logs/verify');
      setLedger(res.data.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, tr('The audit ledger could not be checked.')));
    } finally {
      setCheckingLedger(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const fetchStats = async () => {
    try {
      const [dRes, docsRes] = await Promise.all([api.get('/dashboard'), api.get('/doctors')]);
      setDashboardData(dRes.data.data);
      setDoctors(docsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      toast.error(tr('Failed to load governance telemetry'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApproveDoctor = async (doctorId: string, doctorName: string) => {
    if (approvingId) return; // one request at a time; a double click must not approve twice
    setApprovingId(doctorId);
    try {
      await api.patch(`/doctors/${doctorId}/verify`, { isVerified: true });
      toast.success(tr('Accreditation approved for {name}', { name: doctorName }));
    } catch (err) {
      toast.error(getApiErrorMessage(err, tr('Failed to approve doctor accreditation.')));
    } finally {
      setApprovingId(null);
      // Refresh either way: a 409 means the list on screen was out of date
      await Promise.all([fetchStats(), fetchAuditLogs()]);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      await api.patch(`/doctors/${revokeTarget.id}/verify`, { isVerified: false });
      toast.warning(tr('Accreditation revoked for {name}', { name: revokeTarget.name }));
    } catch (err) {
      toast.error(getApiErrorMessage(err, tr('Failed to revoke doctor accreditation.')));
    } finally {
      setRevokeTarget(null);
      setIsRevoking(false);
      await Promise.all([fetchStats(), fetchAuditLogs()]);
    }
  };

  const copy = async (hash: string) => {
    try {
      await navigator.clipboard?.writeText(hash);
      setCopiedHash(hash);
      toast.info(tr('SHA-256 integrity hash copied to clipboard'));
      setTimeout(() => setCopiedHash((c) => (c === hash ? null : c)), 1500);
    } catch {
      toast.error(tr('Could not access clipboard'));
    }
  };

  const stats = dashboardData?.stats;
  const pendingDoctorsCount = doctors.filter((d) => !d.is_verified).length;

  const filteredAuditLogs = auditLogs;

  const roleTone = (r: string) =>
    r === 'DOCTOR' ? 'blue' : r === 'ADMIN' ? 'purple' : 'emerald';

  if (loading) {
    return (
      <div className="mx-auto max-w-[1720px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 2xl:px-12" role="status" aria-label={tr('Loading clinical portal module...')}>
        <Skeleton className="h-16 w-72" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[6.5rem] rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-16">
      <PageHeader
        icon={<Icon.Shield size={20} />}
        title={tr("Administration")}
        meta={
          <>
            <span className="tabular">{tr('{n} audit events recorded', { n: stats?.totalAuditLogs ?? 0 })}</span>
            <span className="hidden text-ink-400 sm:inline" aria-hidden="true">|</span>
            <span>{tr('Each entry chained by SHA-256')}</span>
          </>
        }
      />

      <main className="mx-auto max-w-[1720px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 2xl:px-12">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard title={tr("Registered Patient Records")} value={stats?.totalPatients ?? 0} subtext={tr("National health registry index")} icon={<Icon.User size={16} />} iconTone="blue" />
          <MetricCard title={tr("Accredited Physicians")} value={stats?.totalDoctors ?? 0} subtext={tr("BMDC Form-C certified")} icon={<Icon.Stethoscope size={16} />} iconTone="emerald" />
          <MetricCard title={tr("Consultations Processed")} value={stats?.totalRecords ?? 0} subtext={tr("Unified clinical records")} icon={<Icon.File size={16} />} iconTone="navy" />
          <MetricCard title={tr("Cryptographic Audit Entries")} value={stats?.totalAuditLogs ?? 0} subtext={tr("SHA-256 validated ledger")} icon={<Icon.Lock size={16} />} iconTone="navy" />
        </div>

        <Card
          className="overflow-hidden"
          header={{
            title: tr("Physician Credential Verification & Onboarding"),
            description: tr("Approve or revoke BMDC accreditation with instant cryptographic validation status."),
            icon: <Icon.Stethoscope size={15} />,
            action: (
              <Badge tone={pendingDoctorsCount ? 'amber' : 'emerald'} dot>
                {pendingDoctorsCount ? tr('{n} Pending Review', { n: pendingDoctorsCount }) : tr('Review Queue Clear')}
              </Badge>
            ),
          }}
        >
          <DataTable minWidth="min-w-[900px]" caption={tr("Physician credentials")}>
              <THead>
                <tr>
                  <Th>{tr("Doctor Name & UID")}</Th>
                  <Th>{tr("BMDC License")}</Th>
                  <Th>{tr("Specialization")}</Th>
                  <Th>{tr("Hospital Affiliation")}</Th>
                  <Th>{tr("Status")}</Th>
                  <Th className="text-right">{tr("Action")}</Th>
                </tr>
              </THead>
              <TBody>
                {doctors.map((doc) => {
                  const isAccredited = Boolean(doc.is_verified);
                  return (
                    <Tr key={doc.id}>
                      <Td>
                        <p className="font-semibold text-ink-900">{doc.full_name}</p>
                        <p className="font-mono text-xs text-ink-500">{doc.doctor_uid || doc.id}</p>
                      </Td>
                      <Td className="whitespace-nowrap font-mono text-xs font-medium text-ink-600">{doc.bmdc_license_number}</Td>
                      <Td className="text-ink-600">{doc.specialization}</Td>
                      <Td className="text-ink-600">{doc.hospital_affiliation}</Td>
                      <Td>
                        <Badge tone={isAccredited ? 'emerald' : 'amber'} dot>
                          {isAccredited ? tr('Accredited') : tr('Pending')}
                        </Badge>
                      </Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          {!isAccredited ? (
                            <Button
                              size="sm"
                              variant="clinical"
                              disabled={approvingId !== null}
                              isLoading={approvingId === doc.id}
                              onClick={() => handleApproveDoctor(doc.id, doc.full_name)}
                            >
                              {tr("Approve")}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="danger-soft"
                              onClick={() => setRevokeTarget({ id: doc.id, name: doc.full_name })}
                            >
                              {tr("Revoke")}
                            </Button>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </DataTable>
        </Card>

        <AdminUsersPanel />
        <AdminSettingsPanel />

        <Card
          className="overflow-hidden"
          header={{
            title: tr("Cryptographic Audit Trail Inspector"),
            icon: <Icon.Lock size={15} />,
            badge: <Badge tone="slate" size="sm">{tr('Append-Only SHA-256')}</Badge>,
          }}
        >
          {/* Filters: stacked on phones, one row on wide screens */}
          <div className="grid gap-2 border-b border-hair px-4 py-3 sm:px-5 md:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
            <div className="xl:w-72">
              <Input
                inputSize="sm"
                aria-label={tr("Search audit entries")}
                value={auditSearch}
                onChange={(event) => setAuditSearch(event.target.value)}
                placeholder={tr("Search action, resource, or actor…")}
                leftIcon={<Icon.Search size={14} />}
                rightElement={
                  auditSearch ? (
                    <button type="button" onClick={() => setAuditSearch('')} aria-label={tr("Clear search")} className="grid h-6 w-6 place-items-center rounded text-ink-600 hover:bg-slate-100 hover:text-ink-900">
                      <Icon.X size={12} />
                    </button>
                  ) : undefined
                }
              />
            </div>

            <div role="group" aria-label={tr('Role')} className="flex h-8 overflow-hidden rounded-md border border-hair-strong bg-white [@media(pointer:coarse)]:h-10">
              {(['All', 'DOCTOR', 'PATIENT', 'ADMIN'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={auditFilterRole === r}
                  onClick={() => setAuditFilterRole(r)}
                  className={`flex-1 border-r border-hair px-3 text-xs font-semibold transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600 ${
                    auditFilterRole === r ? 'bg-primary-700 text-white' : 'text-ink-600 hover:bg-canvas hover:text-ink-900'
                  }`}
                >
                  {r === 'All' ? tr('All Roles') : tr(r === 'DOCTOR' ? 'Doctor' : r === 'PATIENT' ? 'Patient' : 'Admin')}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant={last24Hours ? 'soft' : 'secondary'}
              aria-pressed={last24Hours}
              onClick={() => setLast24Hours((current) => !current)}
              icon={<Icon.Clock size={14} />}
            >
              {tr("Last 24 hours")}
            </Button>

            <div className="grid grid-cols-2 gap-2 xl:flex">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                <span className="shrink-0">{tr("From")}</span>
                <Input type="date" value={auditFrom} disabled={last24Hours} onChange={(e) => setAuditFrom(e.target.value)} inputSize="sm" />
              </label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                <span className="shrink-0">{tr("To")}</span>
                <Input type="date" value={auditTo} onChange={(e) => setAuditTo(e.target.value)} inputSize="sm" />
              </label>
            </div>

            <span className="text-xs text-ink-600 xl:ml-auto" aria-live="polite">
              {auditLoading ? tr('Loading entries...') : tr(auditTotal === 1 ? '{n} matching entry' : '{n} matching entries', { n: auditTotal })}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-b border-hair px-4 py-2.5 text-xs sm:px-5" aria-live="polite">
            <Button size="sm" variant="secondary" onClick={checkLedger} isLoading={checkingLedger} icon={<Icon.Lock size={14} />}>
              {tr('Verify ledger integrity')}
            </Button>
            {ledger && (ledger.valid ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-success">
                <Icon.Check size={14} />
                {tr('All {n} chained entries verified. No tampering found.', { n: ledger.checked })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-critical">
                <Icon.Alert size={14} />
                {tr('Chain broken at entry {seq}: {reason}', { seq: ledger.brokenAt?.seq ?? '-', reason: ledger.brokenAt?.reason ?? '' })}
              </span>
            ))}
          </div>

          <DataTable minWidth="min-w-[960px]" caption={tr("Audit entries")}>
            <THead>
              <tr>
                <Th>{tr("Time")}</Th>
                <Th>{tr("Actor")}</Th>
                <Th>{tr("Action")}</Th>
                <Th>{tr("Resource")}</Th>
                <Th>{tr("Details")}</Th>
                <Th>{tr("SHA-256 hash")}</Th>
              </tr>
            </THead>
            <TBody>
              {filteredAuditLogs.map((l, i) => {
                const hash = l.sha256_hash || '-';
                const isCopied = copiedHash === hash && hash !== '-';
                return (
                  <Tr key={l.id || i}>
                    <Td className="tabular whitespace-nowrap text-xs text-ink-600">
                      {formatServerDateTime(l.timestamp)}
                    </Td>
                    <Td>
                      <Badge tone={roleTone(l.actor_role)} size="sm">{tr(l.actor_role === 'DOCTOR' ? 'Doctor' : l.actor_role === 'PATIENT' ? 'Patient' : l.actor_role === 'ADMIN' ? 'Admin' : l.actor_role)}</Badge>
                      <span className="mt-1 block text-xs text-ink-600">{l.actor_name || tr('System')}</span>
                    </Td>
                    <Td className="whitespace-nowrap font-mono text-xs font-semibold text-primary-700">{l.action}</Td>
                    <Td className="font-mono text-xs text-ink-600">{l.target_resource}</Td>
                    <Td className="max-w-xs text-xs text-ink-600">{l.details || '-'}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        {/* Short form keeps the table readable; the full hash is in the tooltip and the copy */}
                        <span className="font-mono text-xs text-ink-900" title={hash}>
                          {hash.length > 12 ? `${hash.slice(0, 12)}...` : hash}
                        </span>
                        {hash !== '-' && (
                          <button
                            onClick={() => copy(hash)}
                            type="button"
                            aria-label={tr('Copy integrity hash for {action}', { action: l.action })}
                            title={isCopied ? tr('Copied') : tr('Copy full hash')}
                            className={`grid h-7 w-7 place-items-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
                              isCopied ? 'border-emerald-200 bg-emerald-50 text-success' : 'border-hair text-ink-600 hover:bg-slate-100 hover:text-primary-700'
                            }`}
                          >
                            {isCopied ? <Icon.Check size={12} /> : <Icon.Copy size={12} />}
                          </button>
                        )}
                        <span className="sr-only" aria-live="polite">{isCopied ? tr('Hash copied') : ''}</span>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
              {filteredAuditLogs.length === 0 && (
                <tr>
                  <Td colSpan={6} className={`py-12 text-center text-sm ${auditError ? 'text-critical' : 'text-ink-600'}`}>
                    {auditLoading ? tr('Loading entries...') : auditError || tr("No audit entries match these filters.")}
                  </Td>
                </tr>
              )}
            </TBody>
          </DataTable>

          {auditPageCount > 1 && (
            <nav aria-label={tr('Audit pages')} className="flex items-center justify-between gap-3 border-t border-hair px-4 py-3 text-xs text-ink-600 sm:px-5">
              <span>{tr('Page {page} of {count}', { page: auditPage, count: auditPageCount })}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={auditPage <= 1 || auditLoading} onClick={() => setAuditPage((p) => p - 1)}>
                  {tr('Previous')}
                </Button>
                <Button size="sm" variant="secondary" disabled={auditPage >= auditPageCount || auditLoading} onClick={() => setAuditPage((p) => p + 1)}>
                  {tr('Next')}
                </Button>
              </div>
            </nav>
          )}
        </Card>

        {/* Destructive Action Confirmation Dialog */}
        <ConfirmModal
          isOpen={Boolean(revokeTarget)}
          title={tr("Revoke Physician BMDC Accreditation?")}
          message={
            <div className="space-y-2">
              <p>
                {tr('Revoke the accreditation of {name}?', { name: revokeTarget?.name ?? '' })}
              </p>
              <p className="rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-critical">
                {tr("Revoking will immediately suspend this physician's authority to issue or cryptographically sign new clinical prescriptions across MedraLink.")}
              </p>
            </div>
          }
          confirmLabel={tr("Revoke Accreditation")}
          cancelLabel={tr("Keep Accredited")}
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
