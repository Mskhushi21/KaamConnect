import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Briefcase,
  ShieldAlert,
  ArrowRight,
  Check,
  Hammer,
  Home,
  Truck,
  UtensilsCrossed,
  Store,
  Scissors,
  Wrench,
  Sparkles,
  Factory,
  Sprout,
  ShieldCheck,
  FileSpreadsheet,
  CalendarDays,
  Car,
  Users,
} from 'lucide-react';
import { useApp } from './AppContext.tsx';
import { JOB_CATEGORIES, getAllCities } from './constants.ts';
import { translateCategory } from './index.ts';
import { apiFetch } from './api.ts';
import { JobCard, type JobListing } from './JobCard.tsx';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Construction: Hammer,
  'Domestic and Household Work': Home,
  'Delivery and Transportation': Truck,
  'Hotel and Restaurant': UtensilsCrossed,
  'Retail and Shop Assistant': Store,
  'Tailoring and Handicrafts': Scissors,
  'Repair and Maintenance': Wrench,
  'Cleaning and Sanitation': Sparkles,
  'Factory and Warehouse': Factory,
  'Gardening and Agriculture': Sprout,
  'Security and Maintenance': ShieldCheck,
  'Office Assistant and Data Entry': FileSpreadsheet,
  'Event Workers': CalendarDays,
  Drivers: Car,
  'General Helpers': Users,
};

interface PublicStats {
  activeJobs: number;
  totalWorkers: number;
  totalEmployers: number;
  citiesCovered: number;
  categoryCounts: Record<string, number>;
}

export function HomePage() {
  const { user, t, showToast } = useApp();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<JobListing[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const cities = getAllCities();

  const loadHomeData = async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        apiFetch<PublicStats>('/api/stats/public'),
        apiFetch<{ jobs: JobListing[] }>('/api/jobs?limit=6&sort=latest'),
      ]);
      setStats(statsRes);
      setRecentJobs(jobsRes.jobs);
    } catch {
      // non-fatal
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, [user?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('category', category);
    if (city) params.set('city', city);
    navigate(`/jobs${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleToggleSave = async (jobId: number, currentlySaved: boolean) => {
    try {
      if (currentlySaved) {
        await apiFetch(`/api/worker/saved/${jobId}`, { method: 'DELETE' });
      } else {
        await apiFetch(`/api/worker/saved/${jobId}`, { method: 'POST' });
      }
      setRecentJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, is_saved: !currentlySaved } : j))
      );
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <p className="text-sm font-semibold text-teal-300 tracking-wide">
                {t.hero.kicker}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-balance font-display">
                {t.hero.headline}
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                {t.hero.subheadline}
              </p>

              {/* Working Search Form */}
              <form
                onSubmit={handleSearchSubmit}
                className="bg-white rounded-xl p-2.5 shadow-lg grid grid-cols-1 sm:grid-cols-12 gap-2 text-slate-900"
              >
                <div className="sm:col-span-5 flex items-center gap-2 px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-200">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.hero.searchJobPlaceholder}
                    className="w-full text-sm bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="sm:col-span-3 flex items-center gap-2 px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-200">
                  <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    aria-label={t.jobs.category}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm bg-transparent focus:outline-none text-slate-800 cursor-pointer"
                  >
                    <option value="">{t.hero.allCategories}</option>
                    {JOB_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {translateCategory(t, cat)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-center gap-2 px-3 py-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    aria-label={t.jobs.city}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-sm bg-transparent focus:outline-none text-slate-800 cursor-pointer"
                  >
                    <option value="">{t.hero.allCities}</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full h-full min-h-[42px] px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    {t.hero.searchButton}
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {!user && (
                  <>
                    <Link
                      to="/register/worker"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <span>{t.hero.registerWorkerCta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/register/employer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white border border-slate-600 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <span>{t.hero.postJobCta}</span>
                    </Link>
                  </>
                )}
                {user?.role === 'employer' && (
                  <Link
                    to="/employer/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                  >
                    <span>{t.hero.postJobCta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Clean Architectural / Karnataka Trade Summary Visual Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6 space-y-5">
                <div className="aspect-[16/10] rounded-xl bg-gradient-to-br from-blue-900 via-slate-900 to-teal-900 border border-slate-700/80 p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-teal-300 font-medium">
                    <span>Karnataka &amp; Pan-India</span>
                    <span>English · ಕನ್ನಡ · हिन्दी</span>
                  </div>
                  <svg
                    viewBox="0 0 360 110"
                    className="w-full h-24 text-teal-400/90"
                    aria-hidden="true"
                  >
                    <rect x="8" y="34" width="68" height="68" rx="6" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeOpacity="0.4" />
                    <rect x="20" y="48" width="16" height="16" rx="2" fill="currentColor" fillOpacity="0.4" />
                    <rect x="44" y="48" width="16" height="16" rx="2" fill="currentColor" fillOpacity="0.4" />
                    <rect x="92" y="18" width="84" height="84" rx="6" fill="#38bdf8" fillOpacity="0.14" stroke="#38bdf8" strokeOpacity="0.45" />
                    <rect x="106" y="34" width="22" height="18" rx="2" fill="#38bdf8" fillOpacity="0.35" />
                    <rect x="138" y="34" width="22" height="18" rx="2" fill="#38bdf8" fillOpacity="0.35" />
                    <rect x="122" y="64" width="24" height="38" rx="2" fill="#38bdf8" fillOpacity="0.3" />
                    <rect x="192" y="42" width="72" height="60" rx="6" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeOpacity="0.4" />
                    <path d="M278 102 L278 54 L314 34 L350 54 L350 102 Z" fill="#2dd4bf" fillOpacity="0.14" stroke="#2dd4bf" strokeOpacity="0.45" />
                  </svg>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Bengaluru · Mysuru · Mangaluru · Hubballi · Belagavi</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-amber-200 bg-slate-900/70 border border-slate-700 rounded-lg p-3.5 leading-relaxed">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{t.hero.safetyNotice}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Database Metrics Strip */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/60">
              <p className="text-xs font-medium text-slate-500">{t.stats.activeJobs}</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-1 font-mono-tabular">
                {stats ? stats.activeJobs : '—'}
              </p>
            </div>
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/60">
              <p className="text-xs font-medium text-slate-500">{t.stats.registeredWorkers}</p>
              <p className="text-2xl sm:text-3xl font-bold text-teal-700 mt-1 font-mono-tabular">
                {stats ? stats.totalWorkers : '—'}
              </p>
            </div>
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/60">
              <p className="text-xs font-medium text-slate-500">{t.stats.registeredEmployers}</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 font-mono-tabular">
                {stats ? stats.totalEmployers : '—'}
              </p>
            </div>
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/60">
              <p className="text-xs font-medium text-slate-500">{t.stats.citiesCovered}</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 font-mono-tabular">
                {stats ? stats.citiesCovered : '—'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Local Job Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display text-balance">
              {t.home.popularCategoriesTitle}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1.5">
              {t.home.popularCategoriesSubtitle}
            </p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-800 hover:text-blue-900 whitespace-nowrap"
          >
            <span>{t.home.viewAllJobs}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {JOB_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat] || Briefcase;
            const count = stats?.categoryCounts?.[cat] ?? 0;
            return (
              <Link
                key={cat}
                to={`/jobs?category=${encodeURIComponent(cat)}`}
                className="group bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 flex items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {translateCategory(t, cat)}
                    </h3>
                    <p className="text-xs text-slate-500 tabular-nums mt-0.5">
                      {count} {t.home.openingsCount}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-800 shrink-0" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recently Posted Jobs */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display text-balance">
                {t.home.recentJobsTitle}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-1.5">
                {t.home.recentJobsSubtitle}
              </p>
            </div>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>{t.home.viewAllJobs}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingJobs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-56 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
              ))}
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-12 border border-slate-200 rounded-xl bg-slate-50">
              <p className="text-slate-600 text-sm">{t.jobs.noJobsFound}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recentJobs.map((job) => (
                <JobCard key={job.id} job={job} onToggleSave={handleToggleSave} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="max-w-2xl mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display text-balance">
            {t.home.howItWorksTitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1.5">{t.home.howItWorksSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.home.howSteps.map((step) => (
            <div key={step.title} className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
              <h3 className="text-base font-bold text-blue-900 font-display">{step.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Separate Sections for Workers and Employers */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <div className="border border-slate-200 rounded-xl p-7 bg-slate-50/70 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                  {t.home.forWorkersTitle}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {t.home.forWorkersDesc}
                </p>
                <ul className="space-y-2.5 pt-1">
                  {t.home.forWorkersPoints.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  <span>{t.home.forWorkersBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-7 bg-blue-950 text-white flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold font-display">
                  {t.home.forEmployersTitle}
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {t.home.forEmployersDesc}
                </p>
                <ul className="space-y-2.5 pt-1">
                  {t.home.forEmployersPoints.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 text-sm text-slate-200">
                      <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Link
                  to="/hire-workers"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors"
                >
                  <span>{t.home.forEmployersBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose KaamConnect */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="max-w-2xl mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display text-balance">
            {t.home.whyTitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1.5">{t.home.whySubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {t.home.whyCards.map((card, idx) => (
            <div key={card.title} className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
              <p className="text-xs font-semibold text-teal-700 font-mono-tabular">0{idx + 1}</p>
              <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Callout */}
      <section className="bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              {t.home.contactSectionTitle}
            </h2>
            <p className="text-sm text-slate-600">{t.home.contactSectionDesc}</p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>{t.home.contactSectionBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
