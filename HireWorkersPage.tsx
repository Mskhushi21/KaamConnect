import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, ShieldCheck, Briefcase } from 'lucide-react';
import { useApp } from './AppContext.tsx';
import { JOB_CATEGORIES, WORK_TYPES, getAllCities } from './constants.ts';
import {
  translateCategory,
  translateExperience,
  translateWorkType,
} from './index.ts';
import { apiFetch } from './api.ts';

interface WorkerCardItem {
  id: number;
  full_name: string;
  is_sample: number;
  state: string;
  district: string;
  city: string;
  area: string;
  skills: string;
  experience_label: string;
  preferred_category: string;
  preferred_work_type: string;
  bio: string;
  availability_status: string;
}

export function HireWorkersPage() {
  const { user, t, showToast } = useApp();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [workType, setWorkType] = useState('');
  const [workers, setWorkers] = useState<WorkerCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const cities = getAllCities();

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (category) params.set('category', category);
      if (city) params.set('city', city);
      if (workType) params.set('work_type', workType);
      const res = await apiFetch<{ workers: WorkerCardItem[] }>(
        `/api/employer/workers?${params.toString()}`
      );
      setWorkers(res.workers);
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, city, workType]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
            {t.hireWorkers.pageTitle}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">{t.hireWorkers.pageSubtitle}</p>
        </div>
        <Link
          to={user?.role === 'employer' ? '/employer/dashboard?tab=post' : '/register/employer'}
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
        >
          {t.hireWorkers.postJobToInvite}
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 text-sm text-blue-950">
        <ShieldCheck className="w-5 h-5 text-blue-800 shrink-0" />
        <span>{t.hireWorkers.privacyNote}</span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadWorkers();
        }}
        className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.hireWorkers.searchPlaceholder}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="">{t.hero.allCategories}</option>
          {JOB_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {translateCategory(t, c)}
            </option>
          ))}
        </select>

        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="">{t.hero.allCities}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <select
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">All Types</option>
            {WORK_TYPES.map((w) => (
              <option key={w} value={w}>
                {translateWorkType(t, w)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-900 rounded-lg shrink-0"
          >
            {t.hero.searchButton}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
          No workers matched your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((w) => (
            <div key={w.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-teal-800">
                    {translateCategory(t, w.preferred_category)}
                    {w.is_sample === 1 ? ` · ${t.home.sampleListingLabel}` : ''}
                  </p>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{w.full_name}</h3>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    w.availability_status === 'Available' ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {w.availability_status === 'Available' ? t.hireWorkers.available : t.hireWorkers.busy}
                </span>
              </div>

              <div className="space-y-1.5 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {w.area ? `${w.area}, ` : ''}
                    {w.city}, {w.state}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {translateWorkType(t, w.preferred_work_type)} ·{' '}
                    {translateExperience(t, w.experience_label)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-1">{t.jobs.requiredSkills}</p>
                <p className="text-sm text-slate-800">{w.skills}</p>
                {w.bio && <p className="text-xs text-slate-600 mt-2 line-clamp-2">{w.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
