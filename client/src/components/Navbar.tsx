import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Icon, Pill } from '../ui/primitives.js';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  tone: 'blue' | 'emerald' | 'purple' | 'amber';
}

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Prescription Digitally Signed',
      desc: 'Rx #RX-2026-0042 verified and anchored with cryptographic seal.',
      time: '12m ago',
      read: false,
      tone: 'emerald',
    },
    {
      id: '2',
      title: 'Audit Trail Integrity Check',
      desc: 'Scheduled SHA-256 ledger validation completed. Zero discrepancies.',
      time: '1h ago',
      read: false,
      tone: 'purple',
    },
    {
      id: '3',
      title: 'Biometric Telemetry Recorded',
      desc: 'Patient P-1001 vitals logged and synced to longitudinal record.',
      time: '3h ago',
      read: true,
      tone: 'blue',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Close dropdowns on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowNotifications(false);
    setShowProfileMenu(false);
  }, [location.pathname]);

  // Smooth scroll handler for anchor links
  const handleNavAnchor = (e: React.MouseEvent, hash: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname !== '/' && location.pathname !== '/landing') {
      navigate('/' + hash);
    } else {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Handle hash scrolling when arriving from another route
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        const timer = setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname, location.hash]);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'DOCTOR':
        return (
          <Pill tone="blue" className="hidden sm:inline-flex whitespace-nowrap">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2563EB]" />
            BMDC Verified • Active Session
          </Pill>
        );
      case 'PATIENT':
        return (
          <Pill tone="emerald" className="hidden sm:inline-flex whitespace-nowrap">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#059669]" />
            Patient Health Record
          </Pill>
        );
      case 'ADMIN':
        return (
          <Pill tone="purple" className="hidden sm:inline-flex whitespace-nowrap">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7C3AED]" />
            Enterprise Governance
          </Pill>
        );
    }
  };

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ML';

  const publicNavItems = [
    ['Solutions', '#solutions'],
    ['Clinical Architecture', '#clinical-architecture'],
    ['Data Governance', '#governance'],
    ['Network Clinics', '#network-clinics'],
    ['Enterprise Support', '#support'],
  ];

  return (
    <header className="sticky top-0 z-50 h-[72px] border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="mx-auto flex h-full max-w-[1720px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 2xl:px-12">
        {/* Brand Logo & Status */}
        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            aria-label="MedraLink Home"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#1B365D] text-white shadow-sm">
              <Icon.Cross size={18} />
            </div>
            <span className="font-display text-lg font-extrabold tracking-tight text-[#0F172A]">
              Medra<span className="text-[#2563EB]">Link</span>
            </span>
          </Link>
          {getRoleBadge()}
        </div>

        {/* Center Navigation Links (Desktop) */}
        {user ? (
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 text-sm font-medium">
            {user.role === 'DOCTOR' && (
              <>
                <Link
                  to="/doctor"
                  className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    location.pathname === '/doctor'
                      ? 'bg-[#EFF6FF] text-[#1D4ED8] shadow-xs'
                      : 'text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]'
                  }`}
                >
                  Workstation
                </Link>
                <Link
                  to="/doctor/new-consultation"
                  className={`whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    location.pathname === '/doctor/new-consultation'
                      ? 'bg-[#1B365D] text-white shadow-sm ring-2 ring-[#2563EB]/40'
                      : 'bg-[#1B365D] text-white shadow-sm hover:bg-[#16294a]'
                  }`}
                >
                  <Icon.Stethoscope size={16} />
                  <span>New Consultation</span>
                </Link>
              </>
            )}

            {user.role === 'PATIENT' && (
              <>
                <Link
                  to="/patient"
                  className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    location.pathname === '/patient'
                      ? 'bg-[#EFF6FF] text-[#1D4ED8] shadow-xs'
                      : 'text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]'
                  }`}
                >
                  My Health Record
                </Link>
                <Link
                  to={`/patient/timeline/${user.patientId || 'pat-1'}`}
                  className={`whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    location.pathname.startsWith('/patient/timeline')
                      ? 'bg-[#ECFDF5] text-[#059669] ring-1 ring-[#A7F3D0]'
                      : 'bg-[#EFF6FF] text-[#1D4ED8] hover:bg-blue-100'
                  }`}
                >
                  <Icon.Clock size={15} />
                  <span>Medical Timeline</span>
                </Link>
              </>
            )}

            {user.role === 'ADMIN' && (
              <>
                <Link
                  to="/admin"
                  className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    location.pathname === '/admin'
                      ? 'bg-[#EFF6FF] text-[#1D4ED8] shadow-xs'
                      : 'text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]'
                  }`}
                >
                  Governance Console
                </Link>
                <Link
                  to="/admin/audit-logs"
                  className={`whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    location.pathname === '/admin/audit-logs'
                      ? 'bg-[#F5F3FF] text-[#7C3AED] ring-1 ring-[#DDD6FE]'
                      : 'bg-[#F5F3FF] text-[#7C3AED] hover:bg-purple-100'
                  }`}
                >
                  <Icon.Shield size={15} />
                  <span>Audit Trail</span>
                </Link>
              </>
            )}
          </nav>
        ) : isAuthPage ? (
          <nav className="hidden sm:flex items-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] transition-colors hover:text-[#1B365D]"
            >
              <Icon.Arrow size={14} className="rotate-180" /> Return to Platform Overview
            </Link>
          </nav>
        ) : (
          <nav className="hidden xl:flex items-center gap-6 2xl:gap-8">
            {publicNavItems.map(([label, hash]) => (
              <a
                key={label}
                href={hash}
                onClick={(e) => handleNavAnchor(e, hash)}
                className="whitespace-nowrap text-sm font-medium text-[#475569] transition-colors hover:text-[#1B365D]"
              >
                {label}
              </a>
            ))}
          </nav>
        )}

        {/* Right Section: Actions & Profiles */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Notification Center Popover */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  aria-label="View system notifications"
                  aria-expanded={showNotifications}
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                  className={`relative grid h-9 w-9 place-items-center rounded-xl border transition-colors ${
                    showNotifications
                      ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                      : 'border-[#E2E8F0] text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]'
                  }`}
                >
                  <Icon.Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[9px] font-bold text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-xl z-50">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5 px-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                          Clinical Alerts
                        </span>
                        {unreadCount > 0 && (
                          <Pill tone="crimson" className="text-[10px] py-0 px-1.5">
                            {unreadCount} New
                          </Pill>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-[11px] font-semibold text-[#2563EB] hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="mt-2 divide-y divide-[#F1F5F9] max-h-72 overflow-y-auto">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-xl transition-colors hover:bg-slate-50 ${
                            !item.read ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-[#0F172A]">{item.title}</p>
                            <span className="text-[10px] font-medium text-[#94A3B8] shrink-0">
                              {item.time}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#475569] leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 border-t border-[#E2E8F0] pt-2 px-1 text-center">
                      <p className="text-[10px] font-medium text-[#94A3B8]">
                        System health: All microservices operational
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Chip & Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white p-1 sm:pr-3 shadow-xs hover:border-[#cbd5e1] transition-all"
                  aria-expanded={showProfileMenu}
                  aria-label="User account menu"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-[#1B365D] text-xs font-bold text-white shadow-xs">
                    {initials}
                  </div>
                  <div className="hidden leading-tight sm:block text-left">
                    <p className="text-xs font-semibold text-[#0F172A]">{user.fullName}</p>
                    <p className="font-mono text-[10px] text-[#94A3B8]">
                      {user.role === 'DOCTOR'
                        ? user.doctorUid || 'BMDC: A-54921'
                        : user.role === 'PATIENT'
                        ? user.patientUid || 'UID: P-1001'
                        : 'SECURITY OFFICER'}
                    </p>
                  </div>
                  <Icon.Chevron size={14} className="hidden sm:block text-[#94A3B8]" />
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-xl z-50">
                    <div className="border-b border-[#E2E8F0] p-3">
                      <p className="text-xs font-bold text-[#0F172A]">{user.fullName}</p>
                      <p className="text-[11px] text-[#475569]">{user.email || user.role}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Pill tone={user.role === 'DOCTOR' ? 'blue' : user.role === 'PATIENT' ? 'emerald' : 'purple'}>
                          {user.role}
                        </Pill>
                        <span className="text-[10px] font-mono text-[#94A3B8]">
                          {user.role === 'DOCTOR'
                            ? user.doctorProfile?.bmdcLicenseNumber || 'A-54921'
                            : user.role === 'PATIENT'
                            ? user.patientUid || 'P-1001'
                            : 'ADMIN'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      {user.role === 'DOCTOR' && (
                        <>
                          <Link
                            to="/doctor"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                          >
                            <Icon.Stethoscope size={15} /> Clinical Workstation
                          </Link>
                          <Link
                            to="/doctor/new-consultation"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                          >
                            <Icon.Plus size={15} /> Open New Consultation
                          </Link>
                        </>
                      )}

                      {user.role === 'PATIENT' && (
                        <>
                          <Link
                            to="/patient"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                          >
                            <Icon.User size={15} /> My Health Record
                          </Link>
                          <Link
                            to={`/patient/timeline/${user.patientId || 'pat-1'}`}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                          >
                            <Icon.Clock size={15} /> Medical Timeline
                          </Link>
                        </>
                      )}

                      {user.role === 'ADMIN' && (
                        <>
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                          >
                            <Icon.Shield size={15} /> Governance Console
                          </Link>
                          <Link
                            to="/admin/audit-logs"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                          >
                            <Icon.Lock size={15} /> Cryptographic Audit Trail
                          </Link>
                        </>
                      )}

                      <Link
                        to="/"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                      >
                        <Icon.Cross size={15} /> System Overview
                      </Link>
                    </div>

                    <div className="border-t border-[#E2E8F0] pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#DC2626] hover:bg-rose-50"
                      >
                        <Icon.LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Quick Sign Out Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:grid h-9 w-9 place-items-center rounded-xl border border-[#E2E8F0] text-[#475569] transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-[#DC2626]"
                title="Sign Out of Session"
                aria-label="Sign Out of Session"
              >
                <Icon.LogOut size={16} />
              </button>
            </>
          ) : isAuthPage ? (
            location.pathname === '/login' ? (
              <Link
                to="/register"
                className="whitespace-nowrap rounded-xl bg-[#1B365D] px-3.5 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 font-semibold text-white shadow-sm transition-colors hover:bg-[#16294a]"
              >
                Register Clinic
              </Link>
            ) : (
              <Link
                to="/login"
                className="whitespace-nowrap rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 font-semibold text-[#1B365D] transition-colors hover:bg-slate-50"
              >
                Portal Login
              </Link>
            )
          ) : (
            <>
              {/* Logged Out CTAs */}
              <Link
                to="/login"
                className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs sm:text-sm sm:px-3.5 sm:py-2 font-semibold text-[#1B365D] transition-colors hover:bg-slate-100"
              >
                Portal Login
              </Link>
              <Link
                to="/register"
                className="hidden sm:inline-flex whitespace-nowrap rounded-lg bg-[#1B365D] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#16294a]"
              >
                Register Clinic
              </Link>
            </>
          )}

          {/* Mobile/Tablet Hamburger Menu Toggle */}
          {!isAuthPage && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-[#E2E8F0] text-[#475569] hover:bg-slate-100 xl:hidden transition-colors"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <Icon.X size={18} /> : <Icon.Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile/Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-[#E2E8F0] bg-white px-4 py-5 shadow-xl xl:hidden">
          {user ? (
            <div className="space-y-4">
              {/* User Identity Box */}
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-[#E2E8F0]">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1B365D] font-bold text-white">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">{user.fullName}</p>
                  <p className="text-xs text-[#475569]">
                    {user.role} • {user.doctorUid || user.patientUid || user.email}
                  </p>
                </div>
              </div>

              {/* Role Navigation Links */}
              <div className="space-y-1">
                {user.role === 'DOCTOR' && (
                  <>
                    <Link
                      to="/doctor"
                      className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-slate-100"
                    >
                      Clinical Workstation
                    </Link>
                    <Link
                      to="/doctor/new-consultation"
                      className="flex items-center gap-2 rounded-xl bg-[#1B365D] px-3.5 py-2.5 text-sm font-semibold text-white"
                    >
                      <Icon.Stethoscope size={16} /> Open New Consultation
                    </Link>
                  </>
                )}

                {user.role === 'PATIENT' && (
                  <>
                    <Link
                      to="/patient"
                      className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-slate-100"
                    >
                      My Health Record
                    </Link>
                    <Link
                      to={`/patient/timeline/${user.patientId || 'pat-1'}`}
                      className="flex items-center gap-2 rounded-xl bg-[#EFF6FF] px-3.5 py-2.5 text-sm font-semibold text-[#1D4ED8]"
                    >
                      <Icon.Clock size={16} /> Medical Timeline
                    </Link>
                  </>
                )}

                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin"
                      className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-slate-100"
                    >
                      Governance Console
                    </Link>
                    <Link
                      to="/admin/audit-logs"
                      className="flex items-center gap-2 rounded-xl bg-[#F5F3FF] px-3.5 py-2.5 text-sm font-semibold text-[#7C3AED]"
                    >
                      <Icon.Shield size={16} /> Audit Trail
                    </Link>
                  </>
                )}

                <Link
                  to="/"
                  className="block rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                >
                  Platform Home
                </Link>
              </div>

              {/* Sign Out Button */}
              <div className="border-t border-[#E2E8F0] pt-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-[#DC2626] hover:bg-rose-100"
                >
                  <Icon.LogOut size={16} /> Sign Out of Platform
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Public Links */}
              <div className="space-y-1">
                {publicNavItems.map(([label, hash]) => (
                  <a
                    key={label}
                    href={hash}
                    onClick={(e) => handleNavAnchor(e, hash)}
                    className="block rounded-xl px-3.5 py-2 text-sm font-medium text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                  >
                    {label}
                  </a>
                ))}
              </div>

              {/* Public Auth Actions */}
              <div className="grid grid-cols-2 gap-2.5 border-t border-[#E2E8F0] pt-4">
                <Link
                  to="/login"
                  className="flex items-center justify-center rounded-xl border border-[#E2E8F0] bg-white py-2.5 text-center text-sm font-semibold text-[#1B365D] hover:bg-slate-50"
                >
                  Portal Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center rounded-xl bg-[#1B365D] py-2.5 text-center text-sm font-semibold text-white hover:bg-[#16294a]"
                >
                  Register Clinic
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
