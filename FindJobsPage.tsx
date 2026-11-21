import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useApp } from './AppContext.tsx';
import {
  EXPERIENCE_LEVELS,
  INDIA_LOCATIONS,
  JOB_CATEGORIES,
  WORK_TYPES,
  getCitiesForDistrict,
  getDistrictsForState,
} from './constants.ts';
import {
  translateCategory,
  translateExperience,
  translateWorkType,
} from './index.ts';
import { apiFetch } from './api.ts';
import { JobCard, type JobListing } from './JobCard.tsx';

export function FindJobsPage() {
  const { user, t, showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [stateFilter, setStateFilter] = useState(searchParams.get('state') || '');
  const [districtFilter, setDistrictFilter] = useState(searchParams.get('district') || '');
  const [cityFilter, setCityFilter] = useState(searchParams.get('city') || '');
  const [areaFilter, setAreaFilter] = useState(searchParams.get('area') || '');
  const [workType, setWorkType] = useState(searchParams.get('work_type') || '');
  const [payType, setPayType] = useState(searchParams.get('pay_type') || '');
  const [minSalary, setMinSalary] = useState(searchParams.get('min_salary') || '');
  const [maxSalary, setMaxSalary] = useState(searchParams.get('max_salary') || '');
  const [experience, setExperience] = useState(searchParams.get('experience') || '');
  const [recentDays, setRecentDays] = useState(searchParams.get('recent_days') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest');

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const districts = stateFilter ? getDistrictsForState(stateFilter) : [];
  const cities = stateFilter && districtFilter ? getCitiesForDistrict(stateFilter, districtFilter) : [];

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (category) params.set('category', category);
      if (stateFilter) params.set('state', stateFilter);
      if (districtFilter) params.set('district', districtFilter);
      if (cityFilter) params.set('city', cityFilter);
      if (areaFilter.trim()) params.set('area', areaFilter.trim());
      if (workType) params.set('work_type', workType);
      if (payType) params.set('pay_type', payType);
      if (minSalary) params.set('min_salary', minSalary);
      if (maxSalary) params.set('max_salary', maxSalary);
      if (experience) params.set('experience', experience);
      if (recentDays) params.set('recent_days', recentDays);
      if (sort) params.set('sort', sort);

      setSearchParams(params, { replace: true });
      const res = await apiFetch<{ jobs: JobListing[] }>(`/api/jobs?${params.toString()}`);
      setJobs(res.jobs);
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    category,
    stateFilter,
    districtFilter,
    cityFilter,
    workType,
    payType,
    experience,
    recentDays,
    sort,
    user?.id,
  ]);

  const handleResetFilters = () => {
    setQ('');
    setCategory('');
    setStateFilter('');
    setDistrictFilter('');
    setCityFilter('');
    setAreaFilter('');
    setWorkType('');
    setPayType('');
    setMinSalary('');
    setMaxSalary('');
    setExperience('');
    setRecentDays('');
    setSort('latest');
    setSearchParams({}, { replace: true });
    setTimeout(() => {
      apiFetch<{ jobs: JobListing[] }>('/api/jobs?sort=latest')
        .then((res) => setJobs(res.jobs))
        .catch(() => {});
    }, 0);
  };

  const handleToggleSave = async (jobId: number, currentlySaved: boolean) => {
    try {
      if (currentlySaved) {
        await apiFetch(`/api/worker/saved/${jobId}`, { method: 'DELETE' });
      } else {
        await apiFetch(`/api/worker/saved/${jobId}`, { method: 'POST' });
      }
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, is_saved: !currentlySaved } : j))
      );
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
          {t.jobs.pageTitle}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">{t.jobs.pageSubtitle}</p>
      </div>

      {/* Top Search & Sort Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchJobs();
          }}
          className="flex-1 flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.jobs.searchPlaceholder}
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            {t.hero.searchButton}
          </button>
        </form>

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t.jobs.filters}</span>
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="jobs-sort" className="text-xs font-medium text-slate-500 whitespace-nowrap">
              {t.jobs.sortBy}:
            </label>
            <select
              id="jobs-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none"
            >
              <option value="latest">{t.jobs.sortLatest}</option>
              <option value="salary_asc">{t.jobs.sortSalaryAsc}</option>
              <option value="salary_desc">{t.jobs.sortSalaryDesc}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Filter Sidebar */}
        <aside
          className={`lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 space-y-4 ${
            mobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">{t.jobs.filters}</h2>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:text-blue-900"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.jobs.clearFilters}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.jobs.category}
            </label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              <option value="">{t.hero.allCategories}</option>
              {JOB_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {translateCategory(t, c)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.jobs.state}
            </label>
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setDistrictFilter('');
                setCityFilter('');
              }}
              className={inputClass}
            >
              <option value="">All States</option>
              {INDIA_LOCATIONS.map((s) => (
                <option key={s.state} value={s.state}>
                  {s.state}
                </option>
              ))}
            </select>
          </div>

          {stateFilter && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.jobs.district}
              </label>
              <select
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setCityFilter('');
                }}
                className={inputClass}
              >
                <option value="">All Districts</option>
                {districts.map((d) => (
                  <option key={d.district} value={d.district}>
                    {d.district}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.jobs.city}
            </label>
            {cities.length > 0 ? (
              <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className={inputClass}>
                <option value="">{t.hero.allCities}</option>
                {cities.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                onBlur={fetchJobs}
                placeholder="e.g., Bengaluru, Mysuru"
                className={inputClass}
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.jobs.area}
            </label>
            <input
              type="text"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              onBlur={fetchJobs}
              placeholder={t.jobs.areaPlaceholder}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.jobs.workType}
            </label>
            <select value={workType} onChange={(e) => setWorkType(e.target.value)} className={inputClass}>
              <option value="">All Work Types</option>
              {WORK_TYPES.map((w) => (
                <option key={w} value={w}>
                  {translateWorkType(t, w)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.jobs.payType}
            </label>
            <select value={payType} onChange={(e) => setPayType(e.target.value)} className={inputClass}>
              <option value="">{t.jobs.allPayTypes}</option>
              <option value="monthly">{t.jobs.monthly}</option>
              <option value="daily">{t.jobs.daily}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.jobs.minSalary}
              </label>
              <input
                type="number"
                min={0}
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                onBlur={fetchJobs}
                placeholder="500"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.jobs.maxSalary}
              </label>
              <input
                type="number"
                min={0}
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                onBlur={fetchJobs}
                placeholder="30000"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.jobs.experience}
            </label>
            <select value={experience} onChange={(e) => setExperience(e.target.value)} className={inputClass}>
              <option value="">Any</option>
              {EXPERIENCE_LEVELS.map((exp) => (
                <option key={exp} value={exp}>
                  {translateExperience(t, exp)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.jobs.postedWithin}
            </label>
            <select value={recentDays} onChange={(e) => setRecentDays(e.target.value)} className={inputClass}>
              <option value="">{t.jobs.anyTime}</option>
              <option value="1">{t.jobs.last24h}</option>
              <option value="7">{t.jobs.last7d}</option>
              <option value="30">{t.jobs.last30d}</option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchJobs}
            className="w-full py-2 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors"
          >
            {t.hero.searchButton}
          </button>
        </aside>

        {/* Job Results */}
        <div className="lg:col-span-9 space-y-4">
          <div className="text-sm text-slate-600 font-medium tabular-nums">
            {t.jobs.showingResults.replace('{count}', String(jobs.length))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-56 bg-white border border-slate-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <p className="text-base font-semibold text-slate-900">{t.jobs.noJobsFound}</p>
              <p className="text-sm text-slate-600">{t.jobs.noJobsHint}</p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-900 rounded-lg"
              >
                {t.jobs.clearFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} onToggleSave={handleToggleSave} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
