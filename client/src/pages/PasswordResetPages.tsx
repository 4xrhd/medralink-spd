import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getApiErrorMessage } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Icon, Button, Card, FormField, Input } from '../ui/primitives.js';

const Shell: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-10 bg-canvas">
    <Card padding="lg" className="w-full max-w-md">
      <h1 className="font-display text-xl font-bold tracking-tight text-ink-900">{title}</h1>
      <p className="mt-1 mb-6 text-sm text-ink-600">{subtitle}</p>
      {children}
      <p className="mt-6 text-center text-xs text-ink-600">
        <Link to="/login" className="font-semibold text-primary-700 hover:underline">Back to sign in</Link>
      </p>
    </Card>
  </div>
);

export const ForgotPasswordPage: React.FC = () => {
  useDocumentTitle('Forgot Password');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setDemoToken(res.data.data?.resetToken ?? null);
      setSent(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not process the request.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell title="Forgot your password?" subtitle="Enter your account email and we will send reset instructions.">
      {sent ? (
        <div role="status" className="space-y-3 text-sm text-ink-700">
          <p>If an account exists for <strong>{email}</strong>, reset instructions have been sent. The link is valid for 30 minutes.</p>
          {demoToken && (
            <p className="rounded-xl border border-hair bg-primary-50/40 p-3 text-xs">
              Demo mode (email simulated):{' '}
              <Link to={`/reset-password?token=${demoToken}`} className="font-semibold text-primary-700 underline">
                open the reset link
              </Link>
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Email address" htmlFor="forgot-email" required error={error || undefined}>
            <Input id="forgot-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={Boolean(error)} leftIcon={<Icon.Mail size={16} />} />
          </FormField>
          <Button type="submit" className="w-full" isLoading={submitting}>Send reset instructions</Button>
        </form>
      )}
    </Shell>
  );
};

export const ResetPasswordPage: React.FC = () => {
  useDocumentTitle('Reset Password');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      toast.success('Password reset. Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Reset link is invalid or has expired.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Shell title="Reset link missing" subtitle="Open the link from your reset email, or request a new one.">
        <Link to="/forgot-password" className="text-sm font-semibold text-primary-700 hover:underline">Request a new reset link</Link>
      </Shell>
    );
  }

  return (
    <Shell title="Choose a new password" subtitle="Use at least 8 characters.">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="New password" htmlFor="reset-new" required>
          <Input id="reset-new" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} leftIcon={<Icon.Lock size={16} />} />
        </FormField>
        <FormField label="Confirm new password" htmlFor="reset-confirm" required error={error || undefined}>
          <Input id="reset-confirm" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} error={Boolean(error)} aria-invalid={Boolean(error)} leftIcon={<Icon.Lock size={16} />} />
        </FormField>
        <Button type="submit" className="w-full" isLoading={submitting}>Reset password</Button>
      </form>
    </Shell>
  );
};
