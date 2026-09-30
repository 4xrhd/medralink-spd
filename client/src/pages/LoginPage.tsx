import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Card, Icon, Button, FormField, Input, Badge } from '../ui/primitives.js';

export const LoginPage: React.FC = () => {
  useDocumentTitle('Sign In');
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, quickLogin, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, navigate based on role
  React.useEffect(() => {
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

  const handleRoleQuickSelect = async (role: 'DOCTOR' | 'PATIENT' | 'ADMIN') => {
    setError('');
    setIsSubmitting(true);
    try {
      await quickLogin(role);
      toast.success(`Authenticated as ${role}`);
    } catch (err: any) {
      const msg = 'Failed to authenticate role. Ensure database service is operational.';
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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Enterprise Role Quick Sign-In */}
        <div className="rounded-2xl bg-[#1B365D] p-5 text-white shadow-card mb-6 border border-white/10">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-semibold text-blue-100">
              Fast Clinical Role Sign-In
            </span>
            <Badge tone="blue" size="sm">
              BMDC Authenticated
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleRoleQuickSelect('DOCTOR')}
              disabled={isSubmitting}
              className="rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 p-3 flex flex-col items-center text-center transition-all group focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 cursor-pointer"
            >
              <Icon.Stethoscope size={20} className="text-blue-300 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="font-semibold text-xs text-white">Attending Doctor</span>
              <span className="text-[11px] text-blue-200 mt-0.5">Dr. Ahmed Tariq</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleQuickSelect('PATIENT')}
              disabled={isSubmitting}
              className="rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 p-3 flex flex-col items-center text-center transition-all group focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 cursor-pointer"
            >
              <Icon.User size={20} className="text-emerald-300 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="font-semibold text-xs text-white">Verified Patient</span>
              <span className="text-[11px] text-emerald-200 mt-0.5">Rahim Ahmed</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleQuickSelect('ADMIN')}
              disabled={isSubmitting}
              className="rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 p-3 flex flex-col items-center text-center transition-all group focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 cursor-pointer"
            >
              <Icon.Shield size={20} className="text-purple-300 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="font-semibold text-xs text-white">Security Officer</span>
              <span className="text-[11px] text-purple-200 mt-0.5">Audit Admin</span>
            </button>
          </div>
        </div>

        {/* Regular Login Card */}
        <Card className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
              <Icon.Alert size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
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
