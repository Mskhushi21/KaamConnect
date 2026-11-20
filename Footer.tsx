import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export function Footer() {
  const { t } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 text-lg font-bold text-white font-display">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-teal-600 text-white text-sm font-bold">
                K
              </span>
              <span>KaamConnect</span>
            </Link>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              {t.common.footerTagline}
            </p>
            <div className="flex items-start gap-2.5 text-xs text-amber-200 bg-slate-800/80 border border-slate-700 rounded-lg p-3 max-w-md">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{t.hero.safetyNotice}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">{t.common.quickLinks}</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/jobs" className="hover:text-white transition-colors">
                  {t.nav.findJobs}
                </Link>
              </li>
              <li>
                <Link to="/hire-workers" className="hover:text-white transition-colors">
                  {t.nav.hireWorkers}
                </Link>
              </li>
              <li>
                <Link to="/register/worker" className="hover:text-white transition-colors">
                  {t.auth.registerWorkerLink}
                </Link>
              </li>
              <li>
                <Link to="/register/employer" className="hover:text-white transition-colors">
                  {t.auth.registerEmployerLink}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">{t.common.legalLinks}</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  {t.common.aboutUs}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  {t.common.contactUs}
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-white transition-colors">
                  {t.common.helpSupport}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  {t.common.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  {t.common.termsConditions}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {t.common.copyright}</p>
          <p>English · ಕನ್ನಡ · हिन्दी</p>
        </div>
      </div>
    </footer>
  );
}
