import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Activity, Stethoscope, User, ShieldCheck, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleDemoClick = async (role: 'DOCTOR' | 'PATIENT' | 'ADMIN') => {
    setError('');
    setIsSubmitting(true);
    try {
      await quickLogin(role);
    } catch (err: any) {
      setError('Demo login failed. Ensure the server database is initialized.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center text-white shadow-lg shadow-blue-900/30">
            <Activity className="w-7 h-7 text-blue-300" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign in to Medra<span className="text-blue-600">Link</span>
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Centralized Patient Health Record & Clinical Workflow Management
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        {/* Fast Evaluation Card */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-xl p-4 text-white shadow-md mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-400 text-slate-950 text-[11px] font-bold px-2 py-0.5 rounded">EVALUATION DEMO</span>
            <span className="text-xs text-blue-200">1-Click instant login presets:</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <button
              onClick={() => handleDemoClick('DOCTOR')}
              disabled={isSubmitting}
              className="bg-blue-800/80 hover:bg-blue-700 p-2.5 rounded-lg border border-blue-600/50 flex flex-col items-center text-center transition-all group"
            >
              <Stethoscope className="w-5 h-5 text-blue-300 group-hover:scale-110 transition-transform mb-1" />
              <span className="font-semibold text-xs text-white">Doctor</span>
              <span className="text-[10px] text-blue-300">Dr. Ahmed</span>
            </button>

            <button
              onClick={() => handleDemoClick('PATIENT')}
              disabled={isSubmitting}
              className="bg-emerald-900/80 hover:bg-emerald-800 p-2.5 rounded-lg border border-emerald-600/50 flex flex-col items-center text-center transition-all group"
            >
              <User className="w-5 h-5 text-emerald-300 group-hover:scale-110 transition-transform mb-1" />
              <span className="font-semibold text-xs text-white">Patient</span>
              <span className="text-[10px] text-emerald-300">Rahim Ahmed</span>
            </button>

            <button
              onClick={() => handleDemoClick('ADMIN')}
              disabled={isSubmitting}
              className="bg-purple-900/80 hover:bg-purple-800 p-2.5 rounded-lg border border-purple-600/50 flex flex-col items-center text-center transition-all group"
            >
              <ShieldCheck className="w-5 h-5 text-purple-300 group-hover:scale-110 transition-transform mb-1" />
              <span className="font-semibold text-xs text-white">Admin</span>
              <span className="text-[10px] text-purple-300">Audit Inspector</span>
            </button>
          </div>
        </div>

        {/* Regular Login Form */}
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. dr.ahmed@medralink.com"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-navy hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Verifying...' : 'Sign in to Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Need an account?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-800">
              Register Patient or Doctor Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
