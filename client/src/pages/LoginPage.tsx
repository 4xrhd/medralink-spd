import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Icon, Button, FormField, Input } from '../ui/primitives.js';
import { EcgLine } from '../ui/medical.js';
import { getApiErrorMessage } from '../services/api.js';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const DEMO_ACCOUNTS: Record<string, { email: string; password: string }> = DEMO_MODE
  ? {
      doctor: { email: 'dr.ahmed@medralink.com', password: 'doctor123' },
      patient: { email: 'rahim@gmail.com', password: 'patient123' },
      admin: { email: 'admin@medralink.com', password: 'admin123' },
    }
  : {};

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

  // Demo builds (VITE_DEMO_MODE=true) can prefill the seeded accounts; production builds ship none
  useEffect(() => {
    const demo = DEMO_MODE && roleParam ? DEMO_ACCOUNTS[roleParam] : undefined;
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
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
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Invalid email or password.');
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
              <img src="/logo.svg" alt="MedraLink Logo" className="h-11 w-11 object-contain" />
              <div>
                <span className="font-display text-xl font-bold tracking-tight">
                  Medra<span className="text-primary-300">Link</span>
                </span>
                <p className="text-[11px] font-medium text-primary-200">
                  Clinical Portal
                </p>
              </div>
            </div>

            <div className="mt-10">
              <p className="text-xs font-semibold text-primary-300">
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
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="lg:hidden text-center mb-6">
            <img src="/logo.svg" alt="MedraLink Logo" className="mx-auto h-12 w-12 object-contain mb-2" />
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">
              Sign in to Medra<span className="text-primary-700">Link</span>
            </h1>
            <p className="text-xs text-ink-600 mt-1">
              Connected Electronic Medical Records &amp; Clinical Portals
            </p>
          </div>

          <div className="max-w-md w-full mx-auto">
            <div className="hidden lg:block mb-6">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-900">
                Sign in to MedraLink
              </h1>
              <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">
                Use the email and password for your MedraLink account.
              </p>
            </div>

            {error && (
              <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
                <Icon.Alert size={16} className="shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Demo builds only: one click fills a seeded account */}
            {DEMO_MODE && (
              <fieldset className="mb-6">
                <legend className="mb-2 text-sm font-medium text-ink-600">Try a demo account</legend>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(DEMO_ACCOUNTS).map(([role, account]) => {
                    const selected = email === account.email;
                    return (
                      <button
                        key={role}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setEmail(account.email);
                          setPassword(account.password);
                        }}
                        className={`min-h-[44px] rounded-lg border px-2 text-sm font-medium capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1 ${
                          selected
                            ? 'border-primary-700 bg-primary-700 text-white'
                            : 'border-hair-strong bg-white text-ink-900 hover:border-primary-600'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
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
              <div className="-mt-2 text-right">
                <Link to="/forgot-password" className="text-xs font-semibold text-primary-700 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isSubmitting}
                icon={<Icon.Lock size={16} />}
              >
                Sign in
              </Button>
            </form>

            <div className="mt-6 border-t border-hair pt-5 text-center text-xs text-ink-600">
              Don't have a clinical account?{' '}
              <Link to="/register" className="font-semibold text-primary-700 hover:underline">
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
