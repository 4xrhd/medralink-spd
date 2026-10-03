import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Icon, Button, FormField, Input } from '../ui/primitives.js';
import { EcgLine } from '../ui/medical.js';

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
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-canvas">
      <div className="w-full max-w-5xl rounded-3xl border border-hair bg-surface shadow-card overflow-hidden grid lg:grid-cols-12">
        {/* Left Panel - Healthcare Hero and Reassurance */}
        <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 text-white overflow-hidden">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary-600/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white backdrop-blur-sm border border-white/20 shadow-inner">
                <Icon.Cross size={22} className="text-white" />
              </div>
              <div>
                <span className="font-display text-xl font-bold tracking-tight">
                  Medra<span className="text-primary-300">Link</span>
                </span>
                <p className="text-[11px] font-medium uppercase tracking-wider text-primary-200">
                  Clinical Portal
                </p>
              </div>
            </div>

            <div className="mt-10">
              <p className="text-xs font-semibold tracking-wider uppercase text-primary-300">
                Connected Care Network
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white leading-snug">
                One unified record for every clinical visit.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-primary-100/90">
                Secure access to patient timelines, compliant electronic prescriptions, and diagnostic histories across Bangladesh.
              </p>
            </div>

            <div className="my-8">
              <EcgLine strokeClassName="stroke-primary-400/60" className="h-10 w-full" />
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-primary-300">
                  <Icon.Check size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">BMDC Verified Standards</p>
                  <p className="text-xs text-primary-200/80">
                    Compliant with Bangladesh Medical &amp; Dental Council guidelines.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-primary-300">
                  <Icon.Check size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Encrypted Patient Timeline</p>
                  <p className="text-xs text-primary-200/80">
                    Role-governed consent and strict clinical privacy controls.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-primary-300">
                  <Icon.Check size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Drug-Safety &amp; Allergy Guard</p>
                  <p className="text-xs text-primary-200/80">
                    Instant interaction checks during every doctor consultation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10 text-xs text-primary-200/80 flex items-center justify-between">
            <span>Protected Healthcare Session</span>
            <span className="font-mono text-[11px] text-primary-300">TLS 1.3 / AES-256</span>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="lg:hidden text-center mb-6">
            <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-primary-700 text-white shadow-card mb-2">
              <Icon.Cross size={24} />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">
              Sign in to Medra<span className="text-primary-600">Link</span>
            </h1>
            <p className="text-xs text-ink-600 mt-1">
              Connected Electronic Medical Records &amp; Clinical Portals
            </p>
          </div>

          <div className="max-w-md w-full mx-auto">
            <div className="hidden lg:block mb-6">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">
                Welcome to Clinical Portal
              </h1>
              <p className="text-sm text-ink-600 mt-1">
                Enter your credentials or choose a quick evaluation profile below.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
                <Icon.Alert size={16} className="shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Demo Access Selectors */}
            <div className="mb-6 rounded-2xl border border-hair bg-primary-50/40 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-600 mb-2.5 flex items-center gap-1.5">
                <Icon.User size={13} className="text-primary-600" /> Quick Demo One-Click Access:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('dr.test@medralink.com');
                    setPassword('Password123!');
                  }}
                  className={`rounded-xl px-2 py-2 text-xs font-semibold transition-all cursor-pointer border text-center ${
                    email === 'dr.test@medralink.com'
                      ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                      : 'border-hair-strong bg-white text-ink-900 hover:border-primary-300 hover:bg-primary-50/50'
                  }`}
                >
                  <div className="text-base mb-0.5">🩺</div>
                  Doctor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('patient.test@medralink.com');
                    setPassword('Password123!');
                  }}
                  className={`rounded-xl px-2 py-2 text-xs font-semibold transition-all cursor-pointer border text-center ${
                    email === 'patient.test@medralink.com'
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                      : 'border-hair-strong bg-white text-ink-900 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="text-base mb-0.5">👤</div>
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@medralink.com');
                    setPassword('admin123');
                  }}
                  className={`rounded-xl px-2 py-2 text-xs font-semibold transition-all cursor-pointer border text-center ${
                    email === 'admin@medralink.com'
                      ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                      : 'border-hair-strong bg-white text-ink-900 hover:border-violet-300 hover:bg-violet-50/50'
                  }`}
                >
                  <div className="text-base mb-0.5">🛡️</div>
                  Admin
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
                      className="text-xs font-medium text-ink-400 hover:text-ink-900 transition-colors p-1"
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

            <div className="mt-6 border-t border-hair pt-5 text-center text-xs text-ink-600">
              Don't have a clinical account?{' '}
              <Link to="/register" className="font-semibold text-primary-600 hover:underline">
                Register Patient or Doctor Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
