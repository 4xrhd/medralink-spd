import { useLanguage } from '../context/LanguageContext.js';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { NotificationSettingsModal } from './NotificationSettingsModal.js';
import { Icon, Badge } from '../ui/primitives.js';
import { LanguageToggle } from './LanguageToggle.js';

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
  const { t: tr } = useLanguage();
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const ROLE_LABEL: Record<string, string> = { DOCTOR: 'Doctor', PATIENT: 'Patient', ADMIN: 'Admin' };

  // One link list per role; the active page is marked with the green rule under it
  const roleNavItems: Array<{ to: string; label: string; match: (path: string) => boolean }> = !user
    ? []
    : user.role === 'DOCTOR'
      ? [
          { to: '/doctor', label: 'Today', match: (p) => p === '/doctor' },
          { to: '/doctor/new-consultation', label: 'New consultation', match: (p) => p.startsWith('/doctor/new-consultation') },
        ]
      : user.role === 'PATIENT'
        ? [
            { to: '/patient', label: 'My record', match: (p) => p === '/patient' },
            { to: user.patientId ? `/patient/timeline/${user.patientId}` : '/patient', label: 'Timeline', match: (p) => p.startsWith('/patient/timeline') },
            { to: '/hospitals', label: 'Hospitals', match: (p) => p === '/hospitals' },
          ]
        : [
            { to: '/admin', label: 'Overview', match: (p) => p === '/admin' },
            { to: '/admin/audit-logs', label: 'Audit trail', match: (p) => p === '/admin/audit-logs' },
          ];

  const getRoleBadge = () =>
    user ? (
      <span className="hidden sm:inline-block border-l border-hair pl-3 text-sm font-medium text-ink-600">{tr(ROLE_LABEL[user.role])}</span>
    ) : null;

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ML';

  const publicNavItems = [
    ['Product', '#solutions'],
    ['How it works', '#how-it-works'],
    ['Workspaces', '#clinical-architecture'],
    ['Security', '#governance'],
    ['FAQ', '#faq'],
  ];

  return (
    <>
      <header className={`sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md transition-shadow duration-200 supports-[backdrop-filter]:bg-white/80 ${scrolled ? 'border-hair shadow-[0_1px_12px_-4px_rgb(20_33_28/0.12)]' : 'border-hair/70'}`}>
      <div className="mx-auto flex h-16 max-w-[1720px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8 2xl:px-12">
        {/* Brand Logo & Status */}
        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700"
            aria-label={tr("MedraLink home")}
          >
            <img src="/logo-mark.png" alt="" className="h-8 w-8 object-contain" />
            <span className="font-display text-[1.1875rem] font-bold tracking-[-0.02em] text-ink-900">{tr("MedraLink")}</span>
          </Link>
          {getRoleBadge()}
        </div>

        {/* Center Navigation Links (Desktop) */}
        {user ? (
          <nav aria-label={tr("Main")} className="hidden md:flex h-16 flex-1 items-stretch gap-7 pl-4 text-sm font-medium">
            {roleNavItems.map((item) => {
              const active = item.match(location.pathname);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={`-mb-px inline-flex items-center whitespace-nowrap border-b-2 px-0.5 pt-0.5 transition-colors duration-150 ${
                    active ? 'border-primary-700 font-semibold text-ink-900' : 'border-transparent text-ink-600 hover:border-hair-strong hover:text-ink-900'
                  }`}
                >
                  {tr(item.label)}
                </Link>
              );
            })}
          </nav>
        ) : isAuthPage ? (
          <nav className="hidden sm:flex items-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-primary-50 hover:text-ink-900"
            >
              <Icon.Arrow size={14} className="rotate-180" /> {tr("Back to home")}
            </Link>
          </nav>
        ) : (
          <nav aria-label={tr("Main")} className="hidden lg:flex items-center gap-1">
            {publicNavItems.map(([label, hash]) => (
              <a
                key={label}
                href={hash}
                onClick={(e) => handleNavAnchor(e, hash)}
                className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-ink-600 transition-colors duration-150 hover:bg-primary-50 hover:text-ink-900"
              >
                {tr(label)}
              </a>
            ))}
          </nav>
        )}

        {/* Right Section: Actions & Profiles */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageToggle className="hidden sm:inline-flex" />
          {user ? (
            <>
              {/* Notification Center Popover */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  aria-label={unreadCount > 0 ? tr('Notifications, {n} unread', { n: unreadCount }) : tr('Notifications')}
                  aria-expanded={showNotifications}
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                  className={`relative grid h-9 w-9 place-items-center rounded-lg transition-colors duration-150 ${
                    showNotifications
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-ink-600 hover:bg-primary-50 hover:text-ink-900'
                  }`}
                >
                  <Icon.Bell size={18} />
                  {unreadCount > 0 && (
                    <span aria-hidden="true" className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[0.625rem] font-bold leading-none text-white ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm rounded-2xl border border-hair bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-hair pb-2.5 px-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-ink-900">
                          {tr("Notifications")}
                        </span>
                        {unreadCount > 0 && (
                          <Badge tone="crimson" size="sm">
                            {tr('{n} new', { n: unreadCount })}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-xs font-semibold text-primary-700 hover:underline cursor-pointer"
                          >
                            {tr("Mark all read")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setShowSettingsModal(true);
                            setShowNotifications(false);
                          }}
                          aria-label={tr("Notification settings")}
                          title={tr("Notification settings")}
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
                        {tr('All')} ({notifications.length})
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
                        <span>{tr("Unread")}</span>
                        {unreadCount > 0 && (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[0.625rem] ${
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
                          <p className="text-sm font-semibold text-ink-900">{tr("You're all caught up")}</p>
                          <p className="text-xs text-ink-600 max-w-[220px] mx-auto leading-relaxed">
                            {activeFilter === 'unread'
                              ? tr('No unread notifications.')
                              : tr('New prescriptions, lab results and account alerts will appear here.')}
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
                                isUnread ? 'bg-primary-50/60' : ''
                              }`}
                            >
                              <div
                                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${categoryStyle.bg}`}
                              >
                                {categoryStyle.icon}
                              </div>

                              <div className="flex-1 min-w-0 pr-6">
                                <div className="flex items-start justify-between gap-1">
                                  <p className="text-sm font-semibold text-ink-900 truncate">
                                    {item.title}
                                  </p>
                                  <span className="text-xs text-ink-400 shrink-0">
                                    {formatRelativeTime(item.created_at)}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-xs text-ink-600 leading-relaxed line-clamp-2">
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
                                title={tr("Dismiss notification")}
                                aria-label={tr("Dismiss notification")}
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
                    <div className="mt-2.5 border-t border-hair pt-2 px-1 flex items-center text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSettingsModal(true);
                          setShowNotifications(false);
                        }}
                        className="text-ink-600 hover:text-primary-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Icon.Settings size={12} />
                        <span>{tr("Notification preferences")}</span>
                      </button>
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
                  className={`flex items-center gap-2 rounded-lg p-1 sm:pr-2 transition-colors duration-150 ${showProfileMenu ? 'bg-primary-50' : 'hover:bg-primary-50'}`}
                  aria-expanded={showProfileMenu}
                  aria-label={tr("User account menu")}
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary-700 text-xs font-semibold text-white" aria-hidden="true">
                    {initials}
                  </div>
                  <div className="hidden leading-tight sm:block text-left">
                    <p className="max-w-[160px] truncate text-sm font-semibold text-ink-900">{user.fullName}</p>
                    <p className="text-xs text-ink-400">{tr(ROLE_LABEL[user.role])}</p>
                  </div>
                  <Icon.Chevron size={14} className={`hidden sm:block text-ink-400 transition-transform duration-150 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-64 max-w-xs rounded-xl border border-hair bg-white p-1.5 shadow-elevated z-50">
                    <div className="border-b border-hair p-3">
                      <p className="truncate text-sm font-semibold text-ink-900">{user.fullName}</p>
                      <p className="truncate text-xs text-ink-600">{user.email}</p>
                      {(user.role === 'DOCTOR' ? user.doctorProfile?.bmdcLicenseNumber || user.doctorUid : user.patientUid) && (
                        <p className="mt-1.5 text-xs text-ink-400 tabular">
                          {user.role === 'DOCTOR' ? 'BMDC ' : tr('Health ID') + ' '}
                          {user.role === 'DOCTOR' ? user.doctorProfile?.bmdcLicenseNumber || user.doctorUid : user.patientUid}
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      {user.role === 'DOCTOR' && (
                        <>
                          <Link
                            to="/doctor"
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-primary-50 hover:text-ink-900"
                          >
                            <Icon.Stethoscope size={15} /> {tr("Dashboard")}
                          </Link>
                          <Link
                            to="/doctor/new-consultation"
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-primary-50 hover:text-ink-900"
                          >
                            <Icon.Plus size={15} /> {tr("New consultation")}
                          </Link>
                        </>
                      )}

                      {user.role === 'PATIENT' && (
                        <>
                          <Link
                            to="/patient"
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-primary-50 hover:text-ink-900"
                          >
                            <Icon.User size={15} /> {tr("My record")}
                          </Link>
                          <Link
                            to={user.patientId ? `/patient/timeline/${user.patientId}` : '/patient'}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-primary-50 hover:text-ink-900"
                          >
                            <Icon.Clock size={15} /> {tr("Timeline")}
                          </Link>
                        </>
                      )}

                      {user.role === 'ADMIN' && (
                        <>
                          <Link
                            to="/admin"
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-primary-50 hover:text-ink-900"
                          >
                            <Icon.Shield size={15} /> {tr("Overview")}
                          </Link>
                          <Link
                            to="/admin/audit-logs"
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-primary-50 hover:text-ink-900"
                          >
                            <Icon.Lock size={15} /> {tr("Audit trail")}
                          </Link>
                        </>
                      )}

                      <Link
                        to="/"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-primary-50 hover:text-ink-900"
                      >
                        <Icon.Arrow size={15} className="rotate-180" /> {tr("MedraLink home")}
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setShowSettingsModal(true);
                          setShowProfileMenu(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-primary-50 hover:text-ink-900 cursor-pointer"
                      >
                        <Icon.Settings size={15} /> {tr("Notification preferences")}
                      </button>
                      <Link
                        to="/account"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-primary-50 hover:text-ink-900"
                      >
                        <Icon.User size={15} /> {tr("Account settings")}
                      </Link>
                    </div>

                    <div className="border-t border-hair pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-critical transition-colors hover:bg-rose-50"
                      >
                        <Icon.LogOut size={15} /> {tr("Sign out")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </>
          ) : (
            <>
              {location.pathname !== '/login' && (
                <Link to="/login" className="inline-flex h-9 items-center whitespace-nowrap rounded-lg px-3 text-sm font-semibold text-ink-900 transition-colors duration-150 hover:bg-primary-50">
                  {tr("Sign in")}
                </Link>
              )}
              {location.pathname !== '/register' && (
                <Link to="/register" className={`inline-flex h-9 items-center whitespace-nowrap rounded-lg bg-primary-700 px-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_1px_2px_rgb(11_93_70/0.25)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-primary-800 active:translate-y-0 active:scale-[0.97] motion-reduce:transform-none ${location.pathname === '/login' ? '' : 'hidden sm:inline-flex'}`}>
                  {tr("Get started")}
                </Link>
              )}
            </>
          )}

          {/* Mobile/Tablet Hamburger Menu Toggle */}
          {!isAuthPage && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`grid h-9 w-9 place-items-center rounded-lg text-ink-600 transition-colors hover:bg-primary-50 hover:text-ink-900 ${
                user ? 'md:hidden' : 'lg:hidden'
              }`}
              aria-label={mobileMenuOpen ? tr('Close menu') : tr('Open menu')}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <Icon.X size={18} /> : <Icon.Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile/Tablet Drawer */}
      {mobileMenuOpen && (
        <div className={`border-t border-hair bg-white px-4 py-4 shadow-elevated ${user ? 'md:hidden' : 'lg:hidden'}`}>
          <LanguageToggle className="mb-4 sm:hidden" />
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-700 text-sm font-semibold text-white" aria-hidden="true">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{user.fullName}</p>
                  <p className="truncate text-xs text-ink-600">{tr(ROLE_LABEL[user.role])}, {user.email}</p>
                </div>
              </div>

              <nav aria-label={tr("Main")} className="space-y-0.5">
                {[...roleNavItems, { to: '/account', label: 'Account settings', match: (p: string) => p === '/account' }].map((item) => {
                  const active = item.match(location.pathname);
                  return (
                    <Link
                      key={item.to + item.label}
                      to={item.to}
                      aria-current={active ? 'page' : undefined}
                      className={`block rounded-lg border-l-2 px-3.5 py-2.5 text-sm transition-colors ${
                        active
                          ? 'border-primary-700 bg-primary-50 font-semibold text-ink-900'
                          : 'border-transparent text-ink-600 hover:bg-primary-50 hover:text-ink-900'
                      }`}
                    >
                      {tr(item.label)}
                    </Link>
                  );
                })}
              </nav>

              {/* Sign Out Button */}
              <div className="border-t border-hair pt-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium text-critical transition-colors hover:bg-rose-50"
                >
                  <Icon.LogOut size={16} /> {tr("Sign out")}
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
                    className="block rounded-lg px-3.5 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-primary-50 hover:text-ink-900"
                  >
                    {tr(label)}
                  </a>
                ))}
              </div>

              {/* Public Auth Actions */}
              <div className="grid grid-cols-2 gap-2.5 border-t border-hair pt-4">
                <Link
                  to="/login"
                  className="flex items-center justify-center rounded-lg border border-hair-strong bg-white py-2.5 text-sm font-semibold text-ink-900 hover:bg-primary-50"
                >
                  {tr("Sign in")}
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center rounded-lg bg-primary-700 py-2.5 text-sm font-semibold text-white hover:bg-primary-800"
                >
                  {tr("Get started")}
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
