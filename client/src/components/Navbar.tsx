import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { NotificationSettingsModal } from './NotificationSettingsModal.js';
import { Icon, Pill, Badge } from '../ui/primitives.js';

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'unread') {
      return !item.is_read;
    }
    return true;
  });

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
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-600" />
            BMDC Verified • Active Session
          </Pill>
        );
      case 'PATIENT':
        return (
          <Pill tone="emerald" className="hidden sm:inline-flex whitespace-nowrap">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Patient Health Record
          </Pill>
        );
      case 'ADMIN':
        return (
          <Pill tone="purple" className="hidden sm:inline-flex whitespace-nowrap">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-audit" />
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
    ['Care Journey', '#how-it-works'],
    ['Workspaces', '#clinical-architecture'],
    ['Governance', '#governance'],
    ['Support', '#support'],
  ];

  return (
    <>
      <header className="sticky top-0 z-50 h-[72px] border-b border-hair bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="mx-auto flex h-full max-w-[1720px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 2xl:px-12">
        {/* Brand Logo & Status */}
        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            aria-label="MedraLink Home"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-600 text-white shadow-sm">
              <Icon.Cross size={18} />
            </div>
            <span className="font-display text-lg font-extrabold tracking-tight text-ink-900">
              Medra<span className="text-primary-600">Link</span>
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
                      ? 'bg-primary-50 text-primary-700 shadow-xs'
                      : 'text-ink-600 hover:bg-slate-100 hover:text-ink-900'
                  }`}
                >
                  Workstation
                </Link>
                <Link
                  to="/doctor/new-consultation"
                  className={`whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    location.pathname === '/doctor/new-consultation'
                      ? 'bg-primary-700 text-white shadow-sm ring-2 ring-primary-600/40'
                      : 'bg-primary-700 text-white shadow-sm hover:bg-primary-800'
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
                      ? 'bg-primary-50 text-primary-700 shadow-xs'
                      : 'text-ink-600 hover:bg-slate-100 hover:text-ink-900'
                  }`}
                >
                  My Health Record
                </Link>
                <Link
                  to={user.patientId ? `/patient/timeline/${user.patientId}` : '/patient'}
                  className={`whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    location.pathname.startsWith('/patient/timeline')
                      ? 'bg-emerald-50 text-success ring-1 ring-emerald-200'
                      : 'bg-primary-50 text-primary-700 hover:bg-blue-100'
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
                      ? 'bg-primary-50 text-primary-700 shadow-xs'
                      : 'text-ink-600 hover:bg-slate-100 hover:text-ink-900'
                  }`}
                >
                  Governance Console
                </Link>
                <Link
                  to="/admin/audit-logs"
                  className={`whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    location.pathname === '/admin/audit-logs'
                      ? 'bg-violet-50 text-audit ring-1 ring-violet-200'
                      : 'bg-violet-50 text-audit hover:bg-purple-100'
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 transition-colors hover:text-primary-700"
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
                className="whitespace-nowrap text-sm font-medium text-ink-600 transition-colors hover:text-primary-700"
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
                      ? 'border-primary-600 bg-primary-50 text-primary-600'
                      : 'border-hair text-ink-600 hover:bg-slate-100 hover:text-ink-900'
                  }`}
                >
                  <Icon.Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-critical text-[9px] font-bold text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-hair bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-hair pb-2.5 px-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-ink-900">
                          Clinical Alerts
                        </span>
                        {unreadCount > 0 && (
                          <Badge tone="crimson" size="sm">
                            {unreadCount} New
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-[11px] font-semibold text-primary-600 hover:underline cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setShowSettingsModal(true);
                            setShowNotifications(false);
                          }}
                          aria-label="Notification settings"
                          title="Notification settings"
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <Icon.Settings size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Filter Tabs: All vs Unread */}
                    <div className="mt-2.5 flex items-center gap-1.5 px-1 border-b border-slate-100 pb-2">
                      <button
                        type="button"
                        onClick={() => setActiveFilter('all')}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                          activeFilter === 'all'
                            ? 'bg-primary-700 text-white shadow-xs'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                      >
                        All ({notifications.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFilter('unread')}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeFilter === 'unread'
                            ? 'bg-primary-700 text-white shadow-xs'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                      >
                        <span>Unread</span>
                        {unreadCount > 0 && (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                              activeFilter === 'unread'
                                ? 'bg-white/20 text-white'
                                : 'bg-rose-100 text-rose-700 font-bold'
                            }`}
                          >
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Notifications List */}
                    <div className="mt-2 divide-y divide-primary-50/60 max-h-72 overflow-y-auto">
                      {filteredNotifications.length === 0 ? (
                        <div className="py-8 px-4 text-center space-y-2">
                          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400">
                            <Icon.Check size={18} />
                          </div>
                          <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                          <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                            {activeFilter === 'unread'
                              ? 'No unread notifications at this time.'
                              : 'No system or clinical notifications to display.'}
                          </p>
                        </div>
                      ) : (
                        filteredNotifications.map((item) => {
                          const isUnread = !item.is_read;
                          const categoryStyle = {
                            CRITICAL_ALERT: {
                              bg: 'bg-rose-50 text-rose-600 border-rose-100',
                              icon: <Icon.Alert size={14} className="shrink-0" />,
                            },
                            PRESCRIPTION: {
                              bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                              icon: <Icon.Pill size={14} className="shrink-0" />,
                            },
                            LAB_RESULT: {
                              bg: 'bg-amber-50 text-amber-600 border-amber-100',
                              icon: <Icon.Flask size={14} className="shrink-0" />,
                            },
                            SECURITY_AUDIT: {
                              bg: 'bg-purple-50 text-purple-600 border-purple-100',
                              icon: <Icon.Shield size={14} className="shrink-0" />,
                            },
                            GENERAL: {
                              bg: 'bg-blue-50 text-blue-600 border-blue-100',
                              icon: <Icon.Clock size={14} className="shrink-0" />,
                            },
                          }[item.category || 'GENERAL'] || {
                            bg: 'bg-blue-50 text-blue-600 border-blue-100',
                            icon: <Icon.Clock size={14} className="shrink-0" />,
                          };

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (isUnread) {
                                  markAsRead(item.id);
                                }
                                if (item.link) {
                                  setShowNotifications(false);
                                  navigate(item.link);
                                }
                              }}
                              className={`group relative p-2.5 rounded-xl transition-all hover:bg-slate-50 cursor-pointer flex items-start gap-2.5 ${
                                isUnread ? 'bg-blue-50/40' : ''
                              }`}
                            >
                              <div
                                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${categoryStyle.bg}`}
                              >
                                {categoryStyle.icon}
                              </div>

                              <div className="flex-1 min-w-0 pr-6">
                                <div className="flex items-start justify-between gap-1">
                                  <p className="text-xs font-semibold text-ink-900 truncate">
                                    {item.title}
                                  </p>
                                  <span className="text-[10px] font-medium text-ink-400 shrink-0">
                                    {formatRelativeTime(item.created_at)}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[11px] text-ink-600 leading-relaxed line-clamp-2">
                                  {item.message}
                                </p>
                              </div>

                              {/* Unread dot indicator */}
                              {isUnread && (
                                <span className="absolute top-3 right-2 h-2 w-2 rounded-full bg-primary-600 group-hover:hidden" />
                              )}

                              {/* Dismiss action button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(item.id);
                                }}
                                title="Dismiss notification"
                                aria-label="Dismiss notification"
                                className="absolute top-2 right-1.5 hidden group-hover:grid h-5 w-5 place-items-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
                              >
                                <Icon.X size={12} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Popover Footer */}
                    <div className="mt-2.5 border-t border-hair pt-2 px-1 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSettingsModal(true);
                          setShowNotifications(false);
                        }}
                        className="text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Icon.Settings size={12} />
                        <span>Preferences</span>
                      </button>
                      <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Ledger Verified
                      </span>
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
                  className="flex items-center gap-2 rounded-full border border-hair bg-white p-1 sm:pr-3 shadow-xs hover:border-hair-strong transition-all"
                  aria-expanded={showProfileMenu}
                  aria-label="User account menu"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary-700 text-xs font-bold text-white shadow-xs">
                    {initials}
                  </div>
                  <div className="hidden leading-tight sm:block text-left">
                    <p className="text-xs font-semibold text-ink-900">{user.fullName}</p>
                    <p className="font-mono text-[10px] text-ink-400">
                      {user.role === 'DOCTOR'
                        ? user.doctorProfile?.bmdcLicenseNumber || user.doctorUid || 'BMDC Verified'
                        : user.role === 'PATIENT'
                        ? user.patientUid || 'Verified Patient'
                        : 'SECURITY OFFICER'}
                    </p>
                  </div>
                  <Icon.Chevron size={14} className="hidden sm:block text-ink-400" />
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-hair bg-white p-2 shadow-xl z-50">
                    <div className="border-b border-hair p-3">
                      <p className="text-xs font-bold text-ink-900">{user.fullName}</p>
                      <p className="text-[11px] text-ink-600">{user.email || user.role}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Pill tone={user.role === 'DOCTOR' ? 'blue' : user.role === 'PATIENT' ? 'emerald' : 'purple'}>
                          {user.role}
                        </Pill>
                        <span className="text-[10px] font-mono text-ink-400">
                          {user.role === 'DOCTOR'
                            ? user.doctorProfile?.bmdcLicenseNumber || user.doctorUid || 'BMDC Verified'
                            : user.role === 'PATIENT'
                            ? user.patientUid || 'Patient Record'
                            : 'ADMIN'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      {user.role === 'DOCTOR' && (
                        <>
                          <Link
                            to="/doctor"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink-600 hover:bg-slate-100 hover:text-ink-900"
                          >
                            <Icon.Stethoscope size={15} /> Clinical Workstation
                          </Link>
                          <Link
                            to="/doctor/new-consultation"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink-600 hover:bg-slate-100 hover:text-ink-900"
                          >
                            <Icon.Plus size={15} /> Open New Consultation
                          </Link>
                        </>
                      )}

                      {user.role === 'PATIENT' && (
                        <>
                          <Link
                            to="/patient"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink-600 hover:bg-slate-100 hover:text-ink-900"
                          >
                            <Icon.User size={15} /> My Health Record
                          </Link>
                          <Link
                            to={user.patientId ? `/patient/timeline/${user.patientId}` : '/patient'}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink-600 hover:bg-slate-100 hover:text-ink-900"
                          >
                            <Icon.Clock size={15} /> Medical Timeline
                          </Link>
                        </>
                      )}

                      {user.role === 'ADMIN' && (
                        <>
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink-600 hover:bg-slate-100 hover:text-ink-900"
                          >
                            <Icon.Shield size={15} /> Governance Console
                          </Link>
                          <Link
                            to="/admin/audit-logs"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink-600 hover:bg-slate-100 hover:text-ink-900"
                          >
                            <Icon.Lock size={15} /> Cryptographic Audit Trail
                          </Link>
                        </>
                      )}

                      <Link
                        to="/"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink-600 hover:bg-slate-100 hover:text-ink-900"
                      >
                        <Icon.Cross size={15} /> System Overview
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setShowSettingsModal(true);
                          setShowProfileMenu(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink-600 hover:bg-slate-100 hover:text-ink-900 cursor-pointer"
                      >
                        <Icon.Settings size={15} /> Notification Preferences
                      </button>
                    </div>

                    <div className="border-t border-hair pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-critical hover:bg-rose-50"
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
                className="hidden sm:grid h-9 w-9 place-items-center rounded-xl border border-hair text-ink-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-critical"
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
                className="whitespace-nowrap rounded-xl bg-primary-700 px-3.5 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 font-semibold text-white shadow-sm transition-colors hover:bg-primary-800"
              >
                Register Clinic
              </Link>
            ) : (
              <Link
                to="/login"
                className="whitespace-nowrap rounded-xl border border-hair bg-white px-3.5 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 font-semibold text-primary-700 transition-colors hover:bg-slate-50"
              >
                Portal Login
              </Link>
            )
          ) : (
            <>
              {/* Logged Out CTAs */}
              <Link
                to="/login"
                className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs sm:text-sm sm:px-3.5 sm:py-2 font-semibold text-primary-700 transition-colors hover:bg-primary-50"
              >
                Portal Login
              </Link>
              <Link
                to="/register"
                className="hidden sm:inline-flex whitespace-nowrap rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
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
              className="grid h-9 w-9 place-items-center rounded-xl border border-hair text-ink-600 hover:bg-slate-100 xl:hidden transition-colors"
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
        <div className="border-b border-hair bg-white px-4 py-5 shadow-xl xl:hidden">
          {user ? (
            <div className="space-y-4">
              {/* User Identity Box */}
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-hair">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-700 font-bold text-white">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-ink-900">{user.fullName}</p>
                  <p className="text-xs text-ink-600">
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
                      className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink-900 hover:bg-slate-100"
                    >
                      Clinical Workstation
                    </Link>
                    <Link
                      to="/doctor/new-consultation"
                      className="flex items-center gap-2 rounded-xl bg-primary-700 px-3.5 py-2.5 text-sm font-semibold text-white"
                    >
                      <Icon.Stethoscope size={16} /> Open New Consultation
                    </Link>
                  </>
                )}

                {user.role === 'PATIENT' && (
                  <>
                    <Link
                      to="/patient"
                      className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink-900 hover:bg-slate-100"
                    >
                      My Health Record
                    </Link>
                    <Link
                      to={user.patientId ? `/patient/timeline/${user.patientId}` : '/patient'}
                      className="flex items-center gap-2 rounded-xl bg-primary-50 px-3.5 py-2.5 text-sm font-semibold text-primary-700"
                    >
                      <Icon.Clock size={16} /> Medical Timeline
                    </Link>
                  </>
                )}

                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin"
                      className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink-900 hover:bg-slate-100"
                    >
                      Governance Console
                    </Link>
                    <Link
                      to="/admin/audit-logs"
                      className="flex items-center gap-2 rounded-xl bg-violet-50 px-3.5 py-2.5 text-sm font-semibold text-audit"
                    >
                      <Icon.Shield size={16} /> Audit Trail
                    </Link>
                  </>
                )}

                <Link
                  to="/"
                  className="block rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-600 hover:bg-slate-100 hover:text-ink-900"
                >
                  Platform Home
                </Link>
              </div>

              {/* Sign Out Button */}
              <div className="border-t border-hair pt-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-critical hover:bg-rose-100"
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
                    className="block rounded-xl px-3.5 py-2 text-sm font-medium text-ink-600 hover:bg-slate-100 hover:text-ink-900"
                  >
                    {label}
                  </a>
                ))}
              </div>

              {/* Public Auth Actions */}
              <div className="grid grid-cols-2 gap-2.5 border-t border-hair pt-4">
                <Link
                  to="/login"
                  className="flex items-center justify-center rounded-xl border border-hair bg-white py-2.5 text-center text-sm font-semibold text-primary-700 hover:bg-slate-50"
                >
                  Portal Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center rounded-xl bg-primary-700 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-800"
                >
                  Register Clinic
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>

    {/* Notification Preferences Modal - outside header to avoid backdrop-filter stacking context */}
    <NotificationSettingsModal
      isOpen={showSettingsModal}
      onClose={() => setShowSettingsModal(false)}
    />
  </>
  );
};

export default Navbar;
