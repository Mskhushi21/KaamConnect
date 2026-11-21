import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useApp } from './AppContext.tsx';
import { LANGUAGE_LABELS } from './index.ts';
import type { Language } from './constants.ts';

export function Navbar() {
  const { user, language, setLanguage, t, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [registerMenuOpen, setRegisterMenuOpen] = useState(false);
  const navigate = useNavigate();

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'employer'
      ? '/employer/dashboard'
      : '/worker/dashboard';

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
      isActive
        ? 'text-blue-800 border-teal-600'
        : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single-element Brand Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-900 text-white text-sm font-bold">
            K
          </span>
          <span>KaamConnect</span>
        </Link>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6">
          <NavLink to="/" end className={navLinkClass}>
            {t.nav.home}
          </NavLink>
          <NavLink to="/jobs" className={navLinkClass}>
            {t.nav.findJobs}
          </NavLink>
          <NavLink to="/hire-workers" className={navLinkClass}>
            {t.nav.hireWorkers}
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            {t.nav.about}
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            {t.nav.contact}
          </NavLink>
        </nav>

        {/* Zone 3: Language Switcher + Primary Action */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50">
            <Globe className="w-4 h-4 text-slate-500 shrink-0" />
            <label htmlFor="desktop-lang-select" className="sr-only">
              {t.nav.language}
            </label>
            <select
              id="desktop-lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {(['en', 'kn', 'hi'] as Language[]).map((code) => (
                <option key={code} value={code}>
                  {LANGUAGE_LABELS[code].native}
                </option>
              ))}
            </select>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{t.nav.dashboard}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title={t.nav.logout}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.nav.logout}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 relative">
              <Link
                to="/login"
                className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.login}
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRegisterMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{t.nav.register}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {registerMenuOpen && (
                  <div
                    onMouseLeave={() => setRegisterMenuOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50"
                  >
                    <Link
                      to="/register/worker"
                      onClick={() => setRegisterMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    >
                      {t.auth.registerWorkerLink}
                    </Link>
                    <Link
                      to="/register/employer"
                      onClick={() => setRegisterMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    >
                      {t.auth.registerEmployerLink}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          <select
            aria-label={t.nav.language}
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="border border-slate-200 bg-slate-50 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-800"
          >
            {(['en', 'kn', 'hi'] as Language[]).map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_LABELS[code].native}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-slate-800">
            {t.nav.home}
          </Link>
          <Link to="/jobs" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-slate-800">
            {t.nav.findJobs}
          </Link>
          <Link to="/hire-workers" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-slate-800">
            {t.nav.hireWorkers}
          </Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-slate-800">
            {t.nav.about}
          </Link>
          <Link to="/contact" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm font-medium text-slate-800">
            {t.nav.contact}
          </Link>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center py-2.5 px-4 text-sm font-semibold text-white bg-blue-900 rounded-lg"
                >
                  {t.nav.dashboard}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-center py-2.5 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
                >
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center py-2.5 px-4 text-sm font-semibold text-slate-800 border border-slate-200 rounded-lg"
                >
                  {t.nav.login}
                </Link>
                <Link
                  to="/register/worker"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center py-2.5 px-4 text-sm font-semibold text-white bg-blue-900 rounded-lg"
                >
                  {t.auth.registerWorkerLink}
                </Link>
                <Link
                  to="/register/employer"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center py-2.5 px-4 text-sm font-semibold text-white bg-teal-700 rounded-lg"
                >
                  {t.auth.registerEmployerLink}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
