import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Card, Icon, Button, FormField, Input } from '../ui/primitives.js';

export const LoginPage: React.FC = () => {
  useDocumentTitle('Sign In');
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (roleParam === 'doctor') {
      setEmail('dr.test@medralink.com');
      setPassword('Password123!');
    } else if (roleParam === 'patient') {
      setEmail('patient.test@medralink.com');
      setPassword('Password123!');
    } else if (roleParam === 'admin') {
      setEmail('admin@medralink.com');
      setPassword('admin123');
    }
  }, [roleParam]);

  // If already logged in, navigate based on role
  useEffect(() => {
    if (user) {
      if (user.role === 'DOCTOR') navigate('/doctor');
      else if (user.role === 'PATIENT') navigate('/patient');
      else if (user.role === 'ADMIN') navigate('/admin');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Successfully authenticated');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-[#1B365D] text-white shadow-card">
          <Icon.Cross size={24} />
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-[#0F172A]">
          Sign in to Medra<span className="text-[#2563EB]">Link</span>
        </h1>
        <p className="mt-2 text-sm text-[#475569]">
          Unified Electronic Medical Records &amp; Clinical Workflow Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">

        {/* Regular Login Card */}
        <Card className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
              <Icon.Alert size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Evaluation Selectors */}
          <div className="mb-5 rounded-xl border border-[#E2E8F0] bg-slate-50/80 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-2 flex items-center gap-1.5">
              <Icon.User size={13} /> Quick Demo Access:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('dr.test@medralink.com');
                  setPassword('Password123!');
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer border ${
                  email === 'dr.test@medralink.com'
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                🩺 Doctor Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('patient.test@medralink.com');
                  setPassword('Password123!');
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer border ${
                  email === 'patient.test@medralink.com'
                    ? 'border-[#059669] bg-[#ECFDF5] text-[#065F46]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                👤 Patient Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@medralink.com');
                  setPassword('admin123');
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer border ${
                  email === 'admin@medralink.com'
                    ? 'border-[#7C3AED] bg-[#F5F3FF] text-[#6D28D9]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                🛡️ Admin Demo
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField label="Email address" htmlFor="login-email" required>
              <Input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. dr.ahmed@medralink.com"
                leftIcon={<Icon.User size={16} />}
              />
            </FormField>

            <FormField label="Account password" htmlFor="login-password" required>
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Icon.Lock size={16} />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                }
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              icon={<Icon.Lock size={16} />}
            >
              Sign In to Medical Account
            </Button>
          </form>

          <div className="mt-6 border-t border-[#E2E8F0] pt-4 text-center text-xs text-[#475569]">
            Don't have a clinical account?{' '}
            <Link to="/register" className="font-semibold text-[#2563EB] hover:underline">
              Register Patient or Doctor Profile
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
