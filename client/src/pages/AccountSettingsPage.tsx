import { useLanguage } from '../context/LanguageContext.js';
import React, { useEffect, useState } from 'react';
import api, { getApiErrorMessage } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Icon, Button, Card, FormField, Input } from '../ui/primitives.js';

export const AccountSettingsPage: React.FC = () => {
  const { t: tr } = useLanguage();
  useDocumentTitle(tr('Account Settings'));
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => {
        setEmail(res.data.data.email);
        setFullName(res.data.data.full_name || '');
        setPhone(res.data.data.phone || '');
      })
      .catch((err) => toast.error(getApiErrorMessage(err, tr('Failed to load your profile.'))));
  }, [toast]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/auth/me', { fullName, phone });
      toast.success(tr('Profile updated.'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, tr('Failed to update profile.')));
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError(tr('New passwords do not match.'));
      return;
    }
    setPasswordError(tr(''));
    setSavingPassword(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      toast.success(tr('Password changed.'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(getApiErrorMessage(err, tr('Failed to change password.')));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">{tr("Account settings")}</h1>
        <p className="mt-1 text-sm text-ink-600">{tr("Manage your profile details and sign-in password.")}</p>
      </div>

      <Card padding="lg">
        <form onSubmit={saveProfile} className="space-y-4" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="text-base font-semibold text-ink-900">{tr("Profile")}</h2>
          <FormField label={tr("Email address")} htmlFor="acct-email" hint={tr("Contact an administrator to change your email.")}>
            <Input id="acct-email" type="email" value={email} disabled leftIcon={<Icon.Mail size={16} />} />
          </FormField>
          <FormField label={tr("Full name")} htmlFor="acct-name" required>
            <Input id="acct-name" required minLength={2} maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} leftIcon={<Icon.User size={16} />} />
          </FormField>
          <FormField label={tr("Phone number")} htmlFor="acct-phone" required>
            <Input id="acct-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} leftIcon={<Icon.Phone size={16} />} />
          </FormField>
          <Button type="submit" isLoading={savingProfile}>{tr("Save profile")}</Button>
        </form>
      </Card>

      <Card padding="lg">
        <form onSubmit={changePassword} className="space-y-4" aria-labelledby="password-heading">
          <h2 id="password-heading" className="text-base font-semibold text-ink-900">{tr("Change password")}</h2>
          <FormField label={tr("Current password")} htmlFor="acct-current" required>
            <Input id="acct-current" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} leftIcon={<Icon.Lock size={16} />} />
          </FormField>
          <FormField label={tr("New password")} htmlFor="acct-new" required hint={tr("At least 8 characters.")}>
            <Input id="acct-new" type="password" autoComplete="new-password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} leftIcon={<Icon.Lock size={16} />} />
          </FormField>
          <FormField label={tr("Confirm new password")} htmlFor="acct-confirm" required error={passwordError || undefined}>
            <Input id="acct-confirm" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={Boolean(passwordError)} aria-invalid={Boolean(passwordError)} leftIcon={<Icon.Lock size={16} />} />
          </FormField>
          <Button type="submit" isLoading={savingPassword}>{tr("Change password")}</Button>
        </form>
      </Card>
    </div>
  );
};
