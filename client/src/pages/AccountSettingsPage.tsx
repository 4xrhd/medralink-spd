import { useLanguage } from '../context/LanguageContext.js';
import React, { useEffect, useState } from 'react';
import api, { getApiErrorMessage } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Icon, Button, Card, FormField, Input } from '../ui/primitives.js';

export const AccountSettingsPage: React.FC = () => {
  const { t: tr } = useLanguage();
  useDocumentTitle(tr('Account Settings'));
  const { updateUser, replaceToken } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get('/auth/me', { signal: controller.signal })
      .then((res) => {
        setEmail(res.data.data.email);
        // Keep anything the user typed while the profile was still loading
        setFullName((typed) => typed || res.data.data.full_name || '');
        setPhone((typed) => typed || res.data.data.phone || '');
      })
      .catch((err) => {
        if (!controller.signal.aborted) toast.error(getApiErrorMessage(err, tr('Failed to load your profile.')));
      });
    return () => controller.abort();
  }, [toast]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/auth/me', { fullName, phone });
      updateUser({ fullName: fullName.trim() });
      toast.success(tr('Profile updated.'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, tr('Failed to update profile.')));
    } finally {
      setSavingProfile(false);
    }
  };

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail.trim().toLowerCase() === email.toLowerCase()) {
      setEmailError(tr('That is already your email address.'));
      return;
    }
    setEmailError('');
    setSavingEmail(true);
    try {
      const res = await api.put('/auth/email', { newEmail: newEmail.trim(), currentPassword: emailPassword });
      replaceToken(res.data.data.token);
      updateUser({ email: res.data.data.email });
      setEmail(res.data.data.email);
      setNewEmail('');
      setEmailPassword('');
      toast.success(tr('Email changed. Sign in with the new address from now on.'));
    } catch (err) {
      setEmailError(getApiErrorMessage(err, tr('Failed to change email.')));
    } finally {
      setSavingEmail(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError(tr('New passwords do not match.'));
      return;
    }
    setPasswordError('');
    setSavingPassword(true);
    try {
      const res = await api.put('/auth/password', { currentPassword, newPassword });
      // The server signs out other devices and hands this one a new token
      if (res.data?.data?.token) replaceToken(res.data.data.token);
      toast.success(tr('Password changed. Other devices were signed out.'));
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
        <p className="mt-1 text-sm text-ink-600">{tr("Manage your profile details, sign-in email and password.")}</p>
      </div>

      <Card padding="lg">
        <form onSubmit={saveProfile} className="space-y-4" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="text-base font-semibold text-ink-900">{tr("Profile")}</h2>
          <FormField label={tr("Email address")} htmlFor="acct-email" hint={tr("Used to sign in. Change it below.")}>
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
        <form onSubmit={changeEmail} className="space-y-4" aria-labelledby="email-heading">
          <div>
            <h2 id="email-heading" className="text-base font-semibold text-ink-900">{tr("Change email")}</h2>
            <p className="mt-1 text-sm text-ink-600">{tr("You will sign in with the new address. Other devices are signed out.")}</p>
          </div>
          <FormField label={tr("New email address")} htmlFor="acct-new-email" required>
            <Input id="acct-new-email" type="email" autoComplete="email" required maxLength={254} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} leftIcon={<Icon.Mail size={16} />} />
          </FormField>
          <FormField label={tr("Current password")} htmlFor="acct-email-password" required error={emailError || undefined}>
            <Input id="acct-email-password" type="password" autoComplete="current-password" required value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} error={Boolean(emailError)} aria-invalid={Boolean(emailError)} leftIcon={<Icon.Lock size={16} />} />
          </FormField>
          <Button type="submit" isLoading={savingEmail} disabled={savingEmail}>{tr("Change email")}</Button>
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
