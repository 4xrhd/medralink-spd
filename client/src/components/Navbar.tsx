import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { DemoBar } from './DemoBar.js';
import { Activity, LogOut, FileText, Clock, UserCheck, Shield, Stethoscope } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'DOCTOR':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">Doctor Workstation</span>;
      case 'PATIENT':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">Patient Portal</span>;
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">Admin Console</span>;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <DemoBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-brand-navy flex items-center justify-center text-white shadow-md shadow-blue-900/20 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-brand-navy">Medra<span className="text-blue-600">Link</span></span>
                <span className="hidden sm:block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Clinical EMR System</span>
              </div>
            </Link>
            <div className="ml-2 hidden md:block">
              {getRoleBadge()}
            </div>
          </div>

          {/* Navigation Links according to user role */}
          {user && (
            <nav className="flex items-center gap-1 sm:gap-4 text-sm font-medium text-slate-600">
              {user.role === 'PATIENT' && (
                <>
                  <Link to="/patient" className="hover:text-blue-600 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors">
                    Dashboard
                  </Link>
                  <Link to={`/patient/timeline/${user.patientId || 'pat-1'}`} className="flex items-center gap-1 text-brand-navy font-semibold hover:text-blue-600 px-3 py-2 rounded-md hover:bg-blue-50 transition-colors">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Medical Timeline
                  </Link>
                </>
              )}

              {user.role === 'DOCTOR' && (
                <>
                  <Link to="/doctor" className="hover:text-blue-600 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors">
                    Consultations
                  </Link>
                  <Link to="/doctor/new-consultation" className="flex items-center gap-1.5 bg-brand-navy text-white px-3.5 py-1.5 rounded-lg shadow-sm hover:bg-blue-900 transition-colors font-semibold">
                    <Stethoscope className="w-4 h-4" />
                    New Consultation
                  </Link>
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <Link to="/admin" className="hover:text-blue-600 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors">
                    System Overview
                  </Link>
                  <Link to="/admin/audit-logs" className="flex items-center gap-1.5 text-slate-700 hover:text-purple-700 px-3 py-2 rounded-md hover:bg-purple-50 transition-colors">
                    <Shield className="w-4 h-4 text-purple-600" />
                    Audit Trail Inspector
                  </Link>
                </>
              )}

              {/* User Profile & Logout */}
              <div className="flex items-center pl-3 border-l border-slate-200 gap-3">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-semibold text-slate-800">{user.fullName}</div>
                  <div className="text-[11px] text-slate-400">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-md hover:bg-rose-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Logout</span>
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};
