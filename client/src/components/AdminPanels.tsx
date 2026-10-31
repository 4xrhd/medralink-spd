import { useLanguage } from '../context/LanguageContext.js';
import React, { useCallback, useEffect, useState } from 'react';
import { Select, Switch } from '../ui/forms.js';
import { DataTable, TBody, THead, Td, Th, Tr } from '../ui/table.js';
import api, { getApiErrorMessage } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import { ConfirmModal } from './ConfirmModal.js';
import { Button, Card, Icon, Pill, Input, FormField } from '../ui/primitives.js';

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
  const { t: tr } = useLanguage();
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
      toast.error(getApiErrorMessage(err, tr('Failed to load users.')));
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
      toast.success(tr('{name} is now {status}.', { name: target.full_name, status: tr(status === 'ACTIVE' ? 'active' : status === 'SUSPENDED' ? 'suspended' : 'pending') }));
      setTarget(null);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, tr('Failed to update user.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      className="overflow-hidden"
      id="users"
      header={{
        title: tr("User Accounts"),
        icon: <Icon.User size={15} />,
        action: (
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-600">
          {tr("Role")}
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            selectSize="sm"
            className="w-auto"
          >
            <option value="">{tr("All roles")}</option>
            <option value="PATIENT">{tr("Patient")}</option>
            <option value="DOCTOR">{tr("Doctor")}</option>
            <option value="ADMIN">{tr("Admin")}</option>
          </Select>
        </label>
        ),
      }}
    >
      <DataTable stack caption={tr("User accounts")}>
        <THead>
          <tr>
            <Th>{tr("Name")}</Th>
            <Th>{tr("Email")}</Th>
            <Th>{tr("Role")}</Th>
            <Th>{tr("Status")}</Th>
            <Th className="text-right">{tr("Action")}</Th>
          </tr>
        </THead>
        <TBody>
          {users.map((u) => (
            <Tr key={u.id}>
              <Td wide className="font-semibold">{u.full_name}</Td>
              <Td label={tr("Email")} wide className="text-ink-600">{u.email}</Td>
              <Td label={tr("Role")}><Pill tone="slate">{tr(u.role === 'DOCTOR' ? 'Doctor' : u.role === 'PATIENT' ? 'Patient' : 'Admin')}</Pill></Td>
              <Td label={tr("Status")}><Pill tone={statusTone(u.status)}>{tr(u.status === 'ACTIVE' ? 'Active' : u.status === 'SUSPENDED' ? 'Suspended' : 'Pending')}</Pill></Td>
              <Td className="text-right">
                {u.id !== me?.id && (
                  <Button
                    size="sm"
                    variant={u.status === 'SUSPENDED' ? 'secondary' : 'danger-soft'}
                    onClick={() => setTarget(u)}
                    aria-label={`${tr(u.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend')} ${u.full_name}`}
                  >
                    {tr(u.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend')}
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
        </TBody>
      </DataTable>
      <ConfirmModal
        isOpen={Boolean(target)}
        title={tr(target?.status === 'SUSPENDED' ? 'Reactivate account?' : 'Suspend account?')}
        message={
          target?.status === 'SUSPENDED'
            ? tr('{name} will be able to sign in again.', { name: target?.full_name ?? '' })
            : tr('{name} will be signed out immediately and cannot sign in until reactivated.', { name: target?.full_name ?? '' })
        }
        confirmLabel={tr(target?.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend')}
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
  const { t: tr } = useLanguage();
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
      .catch((err) => toast.error(getApiErrorMessage(err, tr('Failed to load settings.'))));
  }, [toast]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const changed = Object.fromEntries(
      Object.entries(draft).filter(([key, value]) => settings.find((s) => s.key === key)?.value !== value)
    );
    if (Object.keys(changed).length === 0) {
      toast.info(tr('No changes to save.'));
      return;
    }
    setSaving(true);
    try {
      await api.put('/admin/settings', { settings: changed });
      setSettings((prev) => prev.map((s) => (s.key in changed ? { ...s, value: changed[s.key] } : s)));
      toast.success(tr('System settings saved.'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, tr('Failed to save settings.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card id="settings" header={{ title: tr("System Parameters"), icon: <Icon.Sliders size={15} /> }}>
      <form onSubmit={save}>
        <div className="grid gap-4 px-4 py-5 sm:grid-cols-2 sm:px-5">
          {settings.map((s) =>
            // On/off settings are switches, so nobody has to type "true"
            s.value === 'true' || s.value === 'false' ? (
              <div key={s.key} className="sm:col-span-2">
                <Switch
                  id={`setting-${s.key}`}
                  label={tr(s.description)}
                  checked={draft[s.key] === 'true'}
                  onChange={(next) => setDraft((d) => ({ ...d, [s.key]: String(next) }))}
                />
              </div>
            ) : (
              <FormField key={s.key} label={tr(s.description)} htmlFor={`setting-${s.key}`}>
                <Input
                  id={`setting-${s.key}`}
                  inputMode={s.numeric ? 'numeric' : undefined}
                  pattern={s.numeric ? '[0-9]{1,4}' : undefined}
                  value={draft[s.key] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [s.key]: e.target.value }))}
                />
              </FormField>
            )
          )}
        </div>
        <div className="flex justify-end border-t border-hair px-4 py-3 sm:px-5">
          <Button type="submit" isLoading={saving}>{tr("Save settings")}</Button>
        </div>
      </form>
    </Card>
  );
};
