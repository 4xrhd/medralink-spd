import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Card, Icon, Pill } from '../ui/primitives.js';

export const LoginPage: React.FC = () => {
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleQuickSelect = async (role: 'DOCTOR' | 'PATIENT' | 'ADMIN') => {
    setError('');
    setIsSubmitting(true);
    try {
      await quickLogin(role);
    } catch (err: any) {
      setError('Failed to authenticate role. Ensure database service is operational.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-[#1B365D] text-white shadow-md">
          <Icon.Cross size={24} />
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-[#0F172A]">
          Sign in to Medra<span className="text-[#2563EB]">Link</span>
        </h1>
        <p className="mt-2 text-sm text-[#475569]">
          Enterprise Electronic Medical Record (EMR) &amp; Clinical Workflow Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Enterprise Role Quick Sign-In */}
        <div className="rounded-2xl bg-[#1B365D] p-5 text-white shadow-lg mb-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
              Fast Clinical Role Sign-In
            </span>
            <span className="font-mono text-[10px] text-blue-300">BMDC &amp; RBAC Authenticated</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleRoleQuickSelect('DOCTOR')}
              disabled={isSubmitting}
              className="rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 p-3 flex flex-col items-center text-center transition-all group focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
            >
              <Icon.Stethoscope size={18} className="text-blue-300 group-hover:scale-110 transition-transform mb-1" />
              <span className="font-semibold text-xs text-white">Attending Doctor</span>
              <span className="text-[10px] text-blue-200">Dr. Ahmed Tariq</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleQuickSelect('PATIENT')}
              disabled={isSubmitting}
              className="rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 p-3 flex flex-col items-center text-center transition-all group focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
            >
              <Icon.User size={18} className="text-emerald-300 group-hover:scale-110 transition-transform mb-1" />
              <span className="font-semibold text-xs text-white">Verified Patient</span>
              <span className="text-[10px] text-emerald-200">Rahim Ahmed</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleQuickSelect('ADMIN')}
              disabled={isSubmitting}
              className="rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 p-3 flex flex-col items-center text-center transition-all group focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
            >
              <Icon.Shield size={18} className="text-purple-300 group-hover:scale-110 transition-transform mb-1" />
              <span className="font-semibold text-xs text-white">Security Officer</span>
              <span className="text-[10px] text-purple-200">Audit Admin</span>
            </button>
          </div>
        </div>

        {/* Regular Login Card */}
        <Card className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              <Icon.Alert size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-[#475569]">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. dr.ahmed@medralink.com"
                className="mt-1.5 block w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#EFF6FF]"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-[#475569]">
                Account Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 pr-10 text-sm text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#EFF6FF]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-[#64748B] hover:text-[#0F172A]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B365D] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#16294a] focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Icon.Loader size={16} className="animate-spin text-white" />
                  <span>Authenticating Credential...</span>
                </>
              ) : (
                <>
                  <Icon.Lock size={16} />
                  <span>Sign in to Account</span>
                </>
              )}
            </button>
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
