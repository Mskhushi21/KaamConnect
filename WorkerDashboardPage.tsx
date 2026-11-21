import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Bookmark,
  User,
  Bell,
  Settings,
  LogOut,
  Search,
  Trash2,
} from 'lucide-react';
import { useApp } from './AppContext.tsx';
import { apiFetch } from './api.ts';
import { EXPERIENCE_LEVELS, JOB_CATEGORIES, WORK_TYPES } from './constants.ts';
import {
  translateCategory,
  translateExperience,
  translateWorkType,
} from './index.ts';
import { AppStatusLabel } from './StatusText.tsx';
import { JobCard, type JobListing } from './JobCard.tsx';
import { LocationFields } from './LocationFields.tsx';
import { NotificationsPanel, type NotificationItem } from './NotificationsPanel.tsx';
import { AccountSettingsPanel } from './AccountSettingsPanel.tsx';

type WorkerTab = 'overview' | 'applications' | 'saved' | 'profile' | 'notifications' | 'settings';

export function WorkerDashboardPage() {
  const { user, t, logout, refreshAuth, showToast } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState<WorkerTab>('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    profile: any;
    completion: { percent: number; missing: string[] };
    applications: any[];
    savedJobs: JobListing[];
    recommendedJobs: JobListing[];
    recentJobs: JobListing[];
    notifications: NotificationItem[];
  } | null>(null);

  const [appFilter, setAppFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [location, setLocation] = useState({
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    area: '',
  });
  const [skills, setSkills] = useState('');
  const [experienceLabel, setExperienceLabel] = useState('Fresher');
  const [preferredCategory, setPreferredCategory] = useState<string>(JOB_CATEGORIES[0]);
  const [preferredWorkType, setPreferredWorkType] = useState<string>(WORK_TYPES[0]);
  const [availabilityStatus, setAvailabilityStatus] = useState('Available');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/api/worker/dashboard');
      setData(res);
      if (user) {
        setFullName(user.full_name || '');
        setMobile(user.mobile || '');
      }
      if (res.profile) {
        setLocation({
          state: res.profile.state || 'Karnataka',
          district: res.profile.district || '',
          city: res.profile.city || '',
          area: res.profile.area || '',
        });
        setSkills(res.profile.skills || '');
        setExperienceLabel(res.profile.experience_label || 'Fresher');
        setPreferredCategory(res.profile.preferred_category || JOB_CATEGORIES[0]);
        setPreferredWorkType(res.profile.preferred_work_type || WORK_TYPES[0]);
        setAvailabilityStatus(res.profile.availability_status || 'Available');
        setBio(res.profile.bio || '');
      }
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleWithdraw = async (applicationId: number) => {
    try {
      await apiFetch(`/api/worker/applications/${applicationId}/withdraw`, {
        method: 'PATCH',
      });
      showToast('Application withdrawn.', 'info');
      loadDashboard();
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    }
  };

  const handleRemoveSaved = async (jobId: number) => {
    try {
      await apiFetch(`/api/worker/saved/${jobId}`, { method: 'DELETE' });
      loadDashboard();
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiFetch('/api/worker/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName,
          mobile,
          state: location.state,
          district: location.district,
          city: location.city,
          area: location.area,
          skills,
          experience_label: experienceLabel,
          preferred_category: preferredCategory,
          preferred_work_type: preferredWorkType,
          availability_status: availabilityStatus,
          bio,
        }),
      });
      await refreshAuth();
      await loadDashboard();
      showToast(t.workerDash.profileUpdated, 'success');
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const applications = data?.applications || [];
  const pendingCount = applications.filter((a) => ['Pending', 'Under Review'].includes(a.status)).length;
  const acceptedCount = applications.filter((a) => a.status === 'Accepted').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;
  const unreadNotifs = (data?.notifications || []).filter((n) => n.is_read === 0).length;

  const filteredApplications = applications.filter((a) => {
    if (appFilter === 'pending') return ['Pending', 'Under Review'].includes(a.status);
    if (appFilter === 'accepted') return a.status === 'Accepted';
    if (appFilter === 'rejected') return a.status === 'Rejected';
    return true;
  });

  const navItems: { id: WorkerTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'overview', label: t.workerDash.overview, icon: LayoutDashboard },
    { id: 'applications', label: t.workerDash.myApplications, icon: Briefcase, count: applications.length },
    { id: 'saved', label: t.workerDash.savedJobs, icon: Bookmark, count: data?.savedJobs?.length || 0 },
    { id: 'profile', label: t.workerDash.profileTab, icon: User },
    { id: 'notifications', label: t.workerDash.notificationsTab, icon: Bell, count: unreadNotifs },
    { id: 'settings', label: t.workerDash.settingsTab, icon: Settings },
  ];

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="px-3 py-2 border-b border-slate-100 mb-2">
            <p className="text-xs font-medium text-teal-700">{t.workerDash.welcome}</p>
            <p className="text-base font-bold text-slate-900 truncate">{user?.full_name}</p>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`text-xs font-mono-tabular ${
                      active ? 'text-teal-200' : 'text-slate-500'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 space-y-1">
            <Link
              to="/jobs"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-teal-800 hover:bg-teal-50"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>{t.nav.findJobs}</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>{t.nav.logout}</span>
            </button>
          </div>
        </aside>

        {/* Main Viewport */}
        <div className="lg:col-span-9 space-y-6">
          {loading ? (
            <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ) : (
            <>
              {tab === 'overview' && (
                <div className="space-y-6">
                  {/* Profile Completion & Quick Stats */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                          {t.workerDash.welcome}, {user?.full_name}
                        </h1>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {data?.profile?.area ? `${data.profile.area}, ` : ''}
                          {data?.profile?.city} · {translateCategory(t, data?.profile?.preferred_category || '')}
                        </p>
                      </div>
                      <Link
                        to="/jobs"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg whitespace-nowrap"
                      >
                        <Search className="w-4 h-4" />
                        <span>{t.nav.findJobs}</span>
                      </Link>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                        <span>{t.workerDash.profileCompletion}</span>
                        <span className="font-mono-tabular">{data?.completion.percent || 0}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-600 transition-all"
                          style={{ width: `${data?.completion.percent || 0}%` }}
                        />
                      </div>
                      {(data?.completion.percent || 0) < 100 && (
                        <div className="flex items-center justify-between gap-3 mt-2">
                          <p className="text-xs text-slate-500">{t.workerDash.completeProfileHint}</p>
                          <button
                            type="button"
                            onClick={() => setTab('profile')}
                            className="text-xs font-semibold text-blue-800 hover:underline whitespace-nowrap"
                          >
                            {t.workerDash.profileTab}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4 KPI Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.workerDash.statsApplied}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1 font-mono-tabular">
                        {applications.length}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.workerDash.statsPending}</p>
                      <p className="text-2xl font-bold text-amber-700 mt-1 font-mono-tabular">
                        {pendingCount}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.workerDash.statsAccepted}</p>
                      <p className="text-2xl font-bold text-emerald-700 mt-1 font-mono-tabular">
                        {acceptedCount}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.workerDash.statsRejected}</p>
                      <p className="text-2xl font-bold text-red-700 mt-1 font-mono-tabular">
                        {rejectedCount}
                      </p>
                    </div>
                  </div>

                  {/* Recommended Jobs */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-900 font-display">
                        {t.workerDash.recommended}
                      </h2>
                      <Link to="/jobs" className="text-sm font-semibold text-blue-800 hover:underline">
                        {t.home.viewAllJobs}
                      </Link>
                    </div>
                    {data?.recommendedJobs && data.recommendedJobs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.recommendedJobs.map((job) => (
                          <JobCard key={job.id} job={job} />
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
                        {t.workerDash.noRecommended}
                      </div>
                    )}
                  </div>

                  {/* Recently Added Jobs */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 font-display">
                      {t.workerDash.recentJobs}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(data?.recentJobs || []).slice(0, 4).map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'applications' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 font-display">
                      {t.workerDash.myApplications}
                    </h2>
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
                      {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setAppFilter(f)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
                            appFilter === f
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {f === 'all'
                            ? t.workerDash.filterAll
                            : f === 'pending'
                            ? t.workerDash.statsPending
                            : f === 'accepted'
                            ? t.workerDash.statsAccepted
                            : t.workerDash.statsRejected}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredApplications.length === 0 ? (
                    <div className="py-10 text-center space-y-3">
                      <p className="text-sm text-slate-500">{t.workerDash.noApplications}</p>
                      <Link
                        to="/jobs"
                        className="inline-block px-4 py-2 text-sm font-semibold text-white bg-blue-900 rounded-lg"
                      >
                        {t.nav.findJobs}
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredApplications.map((app) => (
                        <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                to={`/jobs/${app.job_id}`}
                                className="text-base font-bold text-slate-900 hover:text-blue-800"
                              >
                                {app.job_title}
                              </Link>
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              <AppStatusLabel status={app.status} />
                            </div>
                            <p className="text-sm text-slate-600">
                              {app.business_name || app.employer_name} · {app.job_area}, {app.job_city}
                            </p>
                            <p className="text-xs text-slate-500 font-mono-tabular">
                              {app.salary_display} · {t.jobs.contactDetails}: {app.contact_name} ({app.contact_phone})
                            </p>
                            {app.employer_note && (
                              <p className="text-xs text-blue-900 bg-blue-50 border border-blue-100 rounded-md px-2.5 py-1.5 mt-1">
                                {app.employer_note}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              to={`/jobs/${app.job_id}`}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                            >
                              {t.jobs.viewDetails}
                            </Link>
                            {['Pending', 'Under Review'].includes(app.status) && (
                              <button
                                type="button"
                                onClick={() => handleWithdraw(app.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-200 rounded-lg hover:bg-red-50"
                              >
                                {t.workerDash.withdrawBtn}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'saved' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <h2 className="text-lg font-bold text-slate-900 font-display">
                    {t.workerDash.savedJobs}
                  </h2>
                  {(data?.savedJobs || []).length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">{t.workerDash.noSaved}</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data!.savedJobs.map((job) => (
                        <div key={job.id} className="space-y-2">
                          <JobCard job={{ ...job, is_saved: true }} />
                          <button
                            type="button"
                            onClick={() => handleRemoveSaved(job.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 hover:underline"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t.workerDash.removeSavedBtn}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'profile' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <h2 className="text-lg font-bold text-slate-900 font-display">
                    {t.workerDash.profileTab}
                  </h2>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.auth.fullName} *
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.auth.mobile} *
                        </label>
                        <input
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <LocationFields
                      stateValue={location.state}
                      districtValue={location.district}
                      cityValue={location.city}
                      areaValue={location.area}
                      onChange={setLocation}
                    />

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t.auth.skillsLabel} *
                      </label>
                      <input
                        type="text"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.auth.experienceLabel}
                        </label>
                        <select
                          value={experienceLabel}
                          onChange={(e) => setExperienceLabel(e.target.value)}
                          className={inputClass}
                        >
                          {EXPERIENCE_LEVELS.map((exp) => (
                            <option key={exp} value={exp}>
                              {translateExperience(t, exp)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.auth.preferredCategory}
                        </label>
                        <select
                          value={preferredCategory}
                          onChange={(e) => setPreferredCategory(e.target.value)}
                          className={inputClass}
                        >
                          {JOB_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {translateCategory(t, cat)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.auth.preferredWorkType}
                        </label>
                        <select
                          value={preferredWorkType}
                          onChange={(e) => setPreferredWorkType(e.target.value)}
                          className={inputClass}
                        >
                          {WORK_TYPES.map((w) => (
                            <option key={w} value={w}>
                              {translateWorkType(t, w)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.workerDash.availability}
                        </label>
                        <select
                          value={availabilityStatus}
                          onChange={(e) => setAvailabilityStatus(e.target.value)}
                          className={inputClass}
                        >
                          <option value="Available">{t.hireWorkers.available}</option>
                          <option value="Busy">{t.hireWorkers.busy}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t.workerDash.bioLabel}
                      </label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg disabled:opacity-60"
                    >
                      {savingProfile ? t.common.loading : t.workerDash.updateProfileBtn}
                    </button>
                  </form>
                </div>
              )}

              {tab === 'notifications' && (
                <NotificationsPanel
                  notifications={data?.notifications || []}
                  onRefresh={loadDashboard}
                />
              )}

              {tab === 'settings' && <AccountSettingsPanel />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
