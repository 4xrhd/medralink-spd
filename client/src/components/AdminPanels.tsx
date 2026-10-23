import React, { useCallback, useEffect, useState } from 'react';
import api, { getApiErrorMessage } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import { ConfirmModal } from './ConfirmModal.js';
import { Button, Card, Icon, Pill } from '../ui/primitives.js';

interface AdminUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'PATIENT';
  full_name: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  created_at: string;
}

interface SystemSetting {
  key: string;
  value: string;
  description: string;
  numeric: boolean;
}

const statusTone = (s: AdminUser['status']) => (s === 'ACTIVE' ? 'emerald' : s === 'SUSPENDED' ? 'crimson' : 'amber');

/** User account management: list, filter by role, suspend or reactivate. */
export const AdminUsersPanel: React.FC = () => {
  const toast = useToast();
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [role, setRole] = useState('');
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/users', { params: role ? { role } : {} });
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load users.'));
    }
  }, [role, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async () => {
    if (!target) return;
    const status = target.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setSaving(true);
    try {
      await api.patch(`/admin/users/${target.id}`, { status });
      toast.success(`${target.full_name} is now ${status.toLowerCase()}.`);
      setTarget(null);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update user.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden p-0" id="users">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Icon.User size={18} className="text-primary-700" />
          <h2 className="font-display text-xl font-bold tracking-tight text-ink-900">User Accounts</h2>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-600">
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-hair bg-white px-2 py-1.5 text-xs text-ink-900"
          >
            <option value="">All roles</option>
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Doctor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-hair bg-canvas text-left text-xs font-semibold text-ink-600">
              <th scope="col" className="px-6 py-2.5">Name</th>
              <th scope="col" className="px-3 py-2.5">Email</th>
              <th scope="col" className="px-3 py-2.5">Role</th>
              <th scope="col" className="px-3 py-2.5">Status</th>
              <th scope="col" className="px-6 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hair">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-3 font-semibold text-ink-900">{u.full_name}</td>
                <td className="px-3 py-3 text-ink-600">{u.email}</td>
                <td className="px-3 py-3"><Pill tone="slate">{u.role}</Pill></td>
                <td className="px-3 py-3"><Pill tone={statusTone(u.status)}>{u.status}</Pill></td>
                <td className="px-6 py-3 text-right">
                  {u.id !== me?.id && (
                    <Button
                      size="sm"
                      variant={u.status === 'SUSPENDED' ? 'secondary' : 'outline'}
                      onClick={() => setTarget(u)}
                      aria-label={`${u.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'} ${u.full_name}`}
                    >
                      {u.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        isOpen={Boolean(target)}
        title={target?.status === 'SUSPENDED' ? 'Reactivate account?' : 'Suspend account?'}
        message={
          target?.status === 'SUSPENDED'
            ? `${target?.full_name} will be able to sign in again.`
            : `${target?.full_name} will be signed out immediately and cannot sign in until reactivated.`
        }
        confirmLabel={target?.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
        isDestructive={target?.status !== 'SUSPENDED'}
        isLoading={saving}
        onConfirm={toggleStatus}
        onCancel={() => setTarget(null)}
      />
    </Card>
  );
};

/** System parameters editor backed by GET/PUT /admin/settings. */
export const AdminSettingsPanel: React.FC = () => {
  const toast = useToast();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/admin/settings')
      .then((res) => {
        const rows: SystemSetting[] = res.data.data || [];
        setSettings(rows);
        setDraft(Object.fromEntries(rows.map((r) => [r.key, r.value])));
      })
      .catch((err) => toast.error(getApiErrorMessage(err, 'Failed to load settings.')));
  }, [toast]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const changed = Object.fromEntries(
      Object.entries(draft).filter(([key, value]) => settings.find((s) => s.key === key)?.value !== value)
    );
    if (Object.keys(changed).length === 0) {
      toast.info('No changes to save.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/admin/settings', { settings: changed });
      setSettings((prev) => prev.map((s) => (s.key in changed ? { ...s, value: changed[s.key] } : s)));
      toast.success('System settings saved.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save settings.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-0" id="settings">
      <form onSubmit={save}>
        <div className="flex items-center gap-2 border-b border-hair px-4 py-4 sm:px-6">
          <Icon.Sliders size={18} className="text-primary-700" />
          <h2 className="font-display text-xl font-bold tracking-tight text-ink-900">System Parameters</h2>
        </div>
        <div className="grid gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6">
          {settings.map((s) => (
            <div key={s.key} className="space-y-1.5">
              <label htmlFor={`setting-${s.key}`} className="block text-xs font-semibold text-ink-900">
                {s.description}
              </label>
              <input
                id={`setting-${s.key}`}
                inputMode={s.numeric ? 'numeric' : undefined}
                pattern={s.numeric ? '[0-9]{1,4}' : undefined}
                value={draft[s.key] ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, [s.key]: e.target.value }))}
                className="h-10 w-full rounded-xl border border-hair-strong bg-white px-3 text-sm text-ink-900 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none"
              />
            </div>
          ))}
        </div>
        <div className="border-t border-hair px-4 py-3 sm:px-6">
          <Button type="submit" isLoading={saving}>Save settings</Button>
        </div>
      </form>
    </Card>
  );
};
