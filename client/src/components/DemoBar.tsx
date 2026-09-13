import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Stethoscope, User, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoBar: React.FC = () => {
  const { user, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleSwitch = async (role: 'DOCTOR' | 'PATIENT' | 'ADMIN') => {
    await quickLogin(role);
    if (role === 'DOCTOR') navigate('/doctor');
    if (role === 'PATIENT') navigate('/patient');
    if (role === 'ADMIN') navigate('/admin');
  };

  return (
    <div className="bg-slate-900 text-slate-200 text-xs px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 font-medium">
        <span className="flex items-center gap-1 bg-brand-navy px-2 py-0.5 rounded text-blue-200 font-semibold">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          CSE 416 Lab Evaluation
        </span>
        <span className="text-slate-400 hidden sm:inline">1-Click Evaluation Switcher:</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleSwitch('DOCTOR')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            user?.role === 'DOCTOR' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Login as Dr. Ahmed (Cardiology Specialist)"
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Doctor (Dr. Ahmed)</span>
        </button>

        <button
          onClick={() => handleSwitch('PATIENT')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            user?.role === 'PATIENT' ? 'bg-emerald-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Login as Rahim Ahmed (Patient P-1001)"
        >
          <User className="w-3.5 h-3.5" />
          <span>Patient (Rahim)</span>
        </button>

        <button
          onClick={() => handleSwitch('ADMIN')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            user?.role === 'ADMIN' ? 'bg-purple-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Login as Administrator (Audit & Governance)"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin Officer</span>
        </button>
      </div>
    </div>
  );
};
