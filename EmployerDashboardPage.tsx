import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  Users,
  Building2,
  Bell,
  Settings,
  LogOut,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { apiFetch } from '../lib/api.ts';
import {
  EMPLOYER_TYPES,
  EXPERIENCE_LEVELS,
  JOB_CATEGORIES,
  WORK_TYPES,
} from '../data/constants.ts';
import {
  translateCategory,
  translateEmployerType,
  translateExperience,
  translateWorkType,
} from '../i18n/index.ts';
import { AppStatusLabel, JobStatusLabel } from '../components/StatusText.tsx';
import { LocationFields } from '../components/LocationFields.tsx';
import { NotificationsPanel, type NotificationItem } from '../components/NotificationsPanel.tsx';
import { AccountSettingsPanel } from '../components/AccountSettingsPanel.tsx';

type EmployerTab = 'overview' | 'post' | 'jobs' | 'applicants' | 'profile' | 'notifications' | 'settings';

export function EmployerDashboardPage() {
  const { user, t, logout, refreshAuth, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') === 'post' ? 'post' : 'overview';
  const [tab, setTab] = useState<EmployerTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    profile: any;
    jobs: any[];
    applications: any[];
    notifications: NotificationItem[];
    stats: {
      activeJobs: number;
      closedJobs: number;
      totalApplicants: number;
      newApplications: number;
      acceptedApplications: number;
      rejectedApplications: number;
    };
  } | null>(null);

  // Job Post / Edit state
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobCategory, setJobCategory] = useState<string>(JOB_CATEGORIES[0]);
  const [jobDescription, setJobDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [workersRequired, setWorkersRequired] = useState(1);
  const [jobLocation, setJobLocation] = useState({
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    area: '',
  });
  const [payType, setPayType] = useState<'monthly' | 'daily'>('monthly');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [workType, setWorkType] = useState<string>(WORK_TYPES[0]);
  const [workingHours, setWorkingHours] = useState('9:00 AM - 6:00 PM');
  const [experienceRequired, setExperienceRequired] = useState<string>(EXPERIENCE_LEVELS[0]);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [hidePhoneUntilAccepted, setHidePhoneUntilAccepted] = useState(false);
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [savingJob, setSavingJob] = useState(false);
  const [jobError, setJobError] = useState('');

  // Applicant review modal
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [employerNote, setEmployerNote] = useState('');
  const [updatingApp, setUpdatingApp] = useState(false);
  const [applicantJobFilter, setApplicantJobFilter] = useState<string>('all');

  // Employer profile form state
  const [empFullName, setEmpFullName] = useState('');
  const [empMobile, setEmpMobile] = useState('');
  const [empBusinessName, setEmpBusinessName] = useState('');
  const [empType, setEmpType] = useState<string>(EMPLOYER_TYPES[0]);
  const [empLocation, setEmpLocation] = useState({
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    area: '',
  });
  const [empDescription, setEmpDescription] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/api/employer/dashboard');
      setData(res);
      if (user) {
        setEmpFullName(user.full_name || '');
        setEmpMobile(user.mobile || '');
        setContactName((prev) => prev || user.full_name || '');
        setContactPhone((prev) => prev || user.mobile || '');
      }
      if (res.profile) {
        setEmpBusinessName(res.profile.business_name || '');
        setEmpType(res.profile.employer_type || EMPLOYER_TYPES[0]);
        setEmpLocation({
          state: res.profile.state || 'Karnataka',
          district: res.profile.district || '',
          city: res.profile.city || '',
          area: res.profile.area || '',
        });
        setEmpDescription(res.profile.description || '');
        if (!editingJobId) {
          setJobLocation((prev) =>
            prev.area
              ? prev
              : {
                  state: res.profile.state || 'Karnataka',
                  district: res.profile.district || 'Bengaluru Urban',
                  city: res.profile.city || 'Bengaluru',
                  area: res.profile.area || '',
                }
          );
        }
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

  const resetJobForm = () => {
    setEditingJobId(null);
    setJobTitle('');
    setJobCategory(JOB_CATEGORIES[0]);
    setJobDescription('');
    setRequiredSkills('');
    setWorkersRequired(1);
    setPayType('monthly');
    setSalaryMin('');
    setSalaryMax('');
    setWorkType(WORK_TYPES[0]);
    setWorkingHours('9:00 AM - 6:00 PM');
    setExperienceRequired(EXPERIENCE_LEVELS[0]);
    setContactName(user?.full_name || '');
    setContactPhone(user?.mobile || '');
    setHidePhoneUntilAccepted(false);
    setJobError('');
  };

  const startEditJob = (job: any) => {
    setEditingJobId(job.id);
    setJobTitle(job.title);
    setJobCategory(job.category);
    setJobDescription(job.description);
    setRequiredSkills(job.required_skills);
    setWorkersRequired(job.workers_required);
    setJobLocation({
      state: job.state,
      district: job.district,
      city: job.city,
      area: job.area,
    });
    setPayType(job.pay_type);
    setSalaryMin(String(job.salary_min));
    setSalaryMax(String(job.salary_max));
    setWorkType(job.work_type);
    setWorkingHours(job.working_hours);
    setExperienceRequired(job.experience_required);
    setContactName(job.contact_name);
    setContactPhone(job.contact_phone);
    setHidePhoneUntilAccepted(Boolean(job.hide_phone_until_accepted));
    setDeadline(job.application_deadline);
    setJobError('');
    setTab('post');
  };

  const handlePublishOrUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobError('');
    setSavingJob(true);
    try {
      const payload = {
        title: jobTitle,
        category: jobCategory,
        description: jobDescription,
        required_skills: requiredSkills,
        workers_required: Number(workersRequired),
        state: jobLocation.state,
        district: jobLocation.district,
        city: jobLocation.city,
        area: jobLocation.area,
        pay_type: payType,
        salary_min: Number(salaryMin),
        salary_max: Number(salaryMax || salaryMin),
        work_type: workType,
        working_hours: workingHours,
        experience_required: experienceRequired,
        contact_name: contactName,
        contact_phone: contactPhone,
        hide_phone_until_accepted: hidePhoneUntilAccepted,
        application_deadline: deadline,
      };

      if (editingJobId) {
        const res = await apiFetch<{ flaggedForReview?: boolean }>(`/api/jobs/${editingJobId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast(
          res.flaggedForReview ? t.employerDash.flaggedWarning : 'Job listing updated.',
          res.flaggedForReview ? 'info' : 'success'
        );
      } else {
        const res = await apiFetch<{ flaggedForReview?: boolean }>('/api/jobs', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast(
          res.flaggedForReview ? t.employerDash.flaggedWarning : 'Job published successfully.',
          res.flaggedForReview ? 'info' : 'success'
        );
      }

      resetJobForm();
      await loadDashboard();
      setTab('jobs');
    } catch (err: any) {
      setJobError(err.message || t.common.errorGeneric);
    } finally {
      setSavingJob(false);
    }
  };

  const handleJobStatusChange = async (jobId: number, status: 'Active' | 'Closed' | 'Filled') => {
    try {
      await apiFetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast(`Job marked as ${status}.`, 'success');
      loadDashboard();
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    try {
      await apiFetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      showToast('Job listing deleted.', 'info');
      loadDashboard();
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    }
  };

  const handleApplicationDecision = async (status: 'Under Review' | 'Accepted' | 'Rejected') => {
    if (!selectedApp) return;
    setUpdatingApp(true);
    try {
      await apiFetch(`/api/employer/applications/${selectedApp.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, employer_note: employerNote }),
      });
      showToast(`Application updated to ${status}.`, 'success');
      setSelectedApp(null);
      setEmployerNote('');
      loadDashboard();
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    } finally {
      setUpdatingApp(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiFetch('/api/employer/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: empFullName,
          mobile: empMobile,
          business_name: empBusinessName,
          employer_type: empType,
          state: empLocation.state,
          district: empLocation.district,
          city: empLocation.city,
          area: empLocation.area,
          description: empDescription,
        }),
      });
      await refreshAuth();
      await loadDashboard();
      showToast('Employer profile updated.', 'success');
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

  const jobs = data?.jobs || [];
  const applications = data?.applications || [];
  const unreadNotifs = (data?.notifications || []).filter((n) => n.is_read === 0).length;

  const filteredApplications = applications.filter((a) =>
    applicantJobFilter === 'all' ? true : String(a.job_id) === applicantJobFilter
  );

  const navItems: { id: EmployerTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'overview', label: t.employerDash.overview, icon: LayoutDashboard },
    { id: 'post', label: t.employerDash.postJobTab, icon: PlusCircle },
    { id: 'jobs', label: t.employerDash.manageJobsTab, icon: Briefcase, count: jobs.length },
    { id: 'applicants', label: t.employerDash.applicantsTab, icon: Users, count: applications.length },
    { id: 'profile', label: t.employerDash.profileTab, icon: Building2 },
    { id: 'notifications', label: t.employerDash.notificationsTab, icon: Bell, count: unreadNotifs },
    { id: 'settings', label: t.employerDash.settingsTab, icon: Settings },
  ];

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="px-3 py-2 border-b border-slate-100 mb-2">
            <p className="text-xs font-medium text-teal-700">{t.employerDash.welcome}</p>
            <p className="text-base font-bold text-slate-900 truncate">
              {data?.profile?.business_name || user?.full_name}
            </p>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'post' && tab !== 'post') resetJobForm();
                  setTab(item.id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-blue-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className={`text-xs font-mono-tabular ${active ? 'text-teal-200' : 'text-slate-500'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100">
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
                  <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                        {data?.profile?.business_name || user?.full_name}
                      </h1>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {translateEmployerType(t, data?.profile?.employer_type || '')} ·{' '}
                        {data?.profile?.area ? `${data.profile.area}, ` : ''}
                        {data?.profile?.city}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetJobForm();
                        setTab('post');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg whitespace-nowrap"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{t.employerDash.postJobTab}</span>
                    </button>
                  </div>

                  {/* 6 Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.employerDash.statsActiveJobs}</p>
                      <p className="text-2xl font-bold text-emerald-700 mt-1 font-mono-tabular">
                        {data?.stats.activeJobs || 0}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.employerDash.statsClosedJobs}</p>
                      <p className="text-2xl font-bold text-slate-700 mt-1 font-mono-tabular">
                        {data?.stats.closedJobs || 0}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.employerDash.statsTotalApplicants}</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1 font-mono-tabular">
                        {data?.stats.totalApplicants || 0}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.employerDash.statsNewApps}</p>
                      <p className="text-2xl font-bold text-amber-700 mt-1 font-mono-tabular">
                        {data?.stats.newApplications || 0}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.employerDash.statsAccepted}</p>
                      <p className="text-2xl font-bold text-emerald-700 mt-1 font-mono-tabular">
                        {data?.stats.acceptedApplications || 0}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.employerDash.statsRejected}</p>
                      <p className="text-2xl font-bold text-red-700 mt-1 font-mono-tabular">
                        {data?.stats.rejectedApplications || 0}
                      </p>
                    </div>
                  </div>

                  {/* Recent Applications Quick Table */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-900">{t.employerDash.applicantsTab}</h2>
                      <button
                        type="button"
                        onClick={() => setTab('applicants')}
                        className="text-xs font-semibold text-blue-800 hover:underline"
                      >
                        View all
                      </button>
                    </div>
                    {applications.length === 0 ? (
                      <p className="text-sm text-slate-500 py-4">{t.employerDash.noApplicantsYet}</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {applications.slice(0, 5).map((app) => (
                          <div key={app.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{app.worker_name}</p>
                              <p className="text-xs text-slate-600">
                                {app.job_title} · {app.worker_city} · {app.worker_skills}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <AppStatusLabel status={app.status} />
                              {app.status !== 'Withdrawn' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedApp(app);
                                    setEmployerNote(app.employer_note || '');
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg"
                                >
                                  {t.employerDash.reviewApplicant}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'post' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 font-display">
                      {editingJobId ? t.employerDash.editJob : t.employerDash.postJobTab}
                    </h2>
                    {editingJobId && (
                      <button
                        type="button"
                        onClick={() => {
                          resetJobForm();
                          setTab('jobs');
                        }}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        {t.employerDash.cancelEditBtn}
                      </button>
                    )}
                  </div>

                  <form onSubmit={handlePublishOrUpdateJob} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.employerDash.jobTitle} *
                        </label>
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder={t.employerDash.jobTitlePlaceholder}
                          required
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.jobs.category} *
                        </label>
                        <select
                          value={jobCategory}
                          onChange={(e) => setJobCategory(e.target.value)}
                          className={inputClass}
                        >
                          {JOB_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {translateCategory(t, c)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t.jobs.jobDescription} *
                      </label>
                      <textarea
                        rows={4}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        required
                        minLength={20}
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.jobs.requiredSkills} *
                        </label>
                        <input
                          type="text"
                          value={requiredSkills}
                          onChange={(e) => setRequiredSkills(e.target.value)}
                          placeholder="e.g., Cooking, Billing, Driving Licence"
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.employerDash.workersRequired} *
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={workersRequired}
                          onChange={(e) => setWorkersRequired(Number(e.target.value))}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <LocationFields
                      stateValue={jobLocation.state}
                      districtValue={jobLocation.district}
                      cityValue={jobLocation.city}
                      areaValue={jobLocation.area}
                      onChange={setJobLocation}
                      requiredArea
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.employerDash.payStructure} *
                        </label>
                        <select
                          value={payType}
                          onChange={(e) => setPayType(e.target.value as 'monthly' | 'daily')}
                          className={inputClass}
                        >
                          <option value="monthly">{t.jobs.monthly}</option>
                          <option value="daily">{t.jobs.daily}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.employerDash.salaryMin} *
                        </label>
                        <input
                          type="number"
                          min={100}
                          value={salaryMin}
                          onChange={(e) => setSalaryMin(e.target.value)}
                          placeholder={payType === 'daily' ? '700' : '15000'}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.employerDash.salaryMax} *
                        </label>
                        <input
                          type="number"
                          min={100}
                          value={salaryMax}
                          onChange={(e) => setSalaryMax(e.target.value)}
                          placeholder={payType === 'daily' ? '900' : '18000'}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.jobs.workType} *
                        </label>
                        <select value={workType} onChange={(e) => setWorkType(e.target.value)} className={inputClass}>
                          {WORK_TYPES.map((w) => (
                            <option key={w} value={w}>
                              {translateWorkType(t, w)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.jobs.workingHours} *
                        </label>
                        <input
                          type="text"
                          value={workingHours}
                          onChange={(e) => setWorkingHours(e.target.value)}
                          placeholder={t.employerDash.workingHoursPlaceholder}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.jobs.experience} *
                        </label>
                        <select
                          value={experienceRequired}
                          onChange={(e) => setExperienceRequired(e.target.value)}
                          className={inputClass}
                        >
                          {EXPERIENCE_LEVELS.map((exp) => (
                            <option key={exp} value={exp}>
                              {translateExperience(t, exp)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.employerDash.contactName} *
                        </label>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.employerDash.contactPhone} *
                        </label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.employerDash.deadlineLabel} *
                        </label>
                        <input
                          type="date"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={hidePhoneUntilAccepted}
                        onChange={(e) => setHidePhoneUntilAccepted(e.target.checked)}
                        className="rounded border-slate-300 text-blue-900 focus:ring-blue-700"
                      />
                      <span>{t.employerDash.hidePhoneLabel}</span>
                    </label>

                    {jobError && (
                      <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {jobError}
                      </p>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={savingJob}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg disabled:opacity-60"
                      >
                        {savingJob
                          ? t.common.loading
                          : editingJobId
                          ? t.employerDash.updateJobBtn
                          : t.employerDash.publishJobBtn}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {tab === 'jobs' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 font-display">
                      {t.employerDash.manageJobsTab}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        resetJobForm();
                        setTab('post');
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 rounded-lg"
                    >
                      {t.employerDash.postJobTab}
                    </button>
                  </div>

                  {jobs.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-500">{t.employerDash.noJobsPosted}</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {jobs.map((job) => (
                        <div key={job.id} className="py-4 flex flex-col gap-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                  to={`/jobs/${job.id}`}
                                  className="text-base font-bold text-slate-900 hover:text-blue-800"
                                >
                                  {job.title}
                                </Link>
                                <span className="text-slate-300">·</span>
                                <JobStatusLabel status={job.status} />
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 font-mono-tabular">
                                {translateCategory(t, job.category)} · {job.area}, {job.city} · {job.salary_display} ·{' '}
                                {job.total_applicants} applicants
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEditJob(job)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{t.employerDash.editJob}</span>
                              </button>

                              {job.status === 'Active' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleJobStatusChange(job.id, 'Filled')}
                                    className="px-2.5 py-1.5 text-xs font-medium text-emerald-800 border border-emerald-200 bg-emerald-50 rounded-md hover:bg-emerald-100"
                                  >
                                    {t.employerDash.markFilled}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleJobStatusChange(job.id, 'Closed')}
                                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
                                  >
                                    {t.employerDash.closeJob}
                                  </button>
                                </>
                              )}

                              {['Closed', 'Filled'].includes(job.status) && (
                                <button
                                  type="button"
                                  onClick={() => handleJobStatusChange(job.id, 'Active')}
                                  className="px-2.5 py-1.5 text-xs font-medium text-blue-800 border border-blue-200 bg-blue-50 rounded-md hover:bg-blue-100"
                                >
                                  {t.employerDash.reopenJob}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteJob(job.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 border border-red-200 rounded-md hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{t.employerDash.deleteJob}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'applicants' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 font-display">
                      {t.employerDash.applicantsTab}
                    </h2>
                    <select
                      value={applicantJobFilter}
                      onChange={(e) => setApplicantJobFilter(e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white"
                    >
                      <option value="all">All Jobs</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={String(j.id)}>
                          {j.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {filteredApplications.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-500">
                      {t.employerDash.noApplicantsYet}
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredApplications.map((app) => (
                        <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-bold text-slate-900">{app.worker_name}</span>
                              <span className="text-slate-300">·</span>
                              <AppStatusLabel status={app.status} />
                            </div>
                            <p className="text-sm text-slate-700">
                              {app.job_title} · {app.worker_area ? `${app.worker_area}, ` : ''}
                              {app.worker_city}
                            </p>
                            <p className="text-xs text-slate-600">
                              {t.jobs.requiredSkills}: {app.worker_skills} ·{' '}
                              {translateExperience(t, app.worker_experience || 'Fresher')}
                            </p>
                            <p className="text-xs text-slate-500 font-mono-tabular">
                              {app.worker_mobile} · {app.worker_email}
                            </p>
                            {app.cover_note && (
                              <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 mt-1">
                                "{app.cover_note}"
                              </p>
                            )}
                          </div>

                          {app.status !== 'Withdrawn' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApp(app);
                                setEmployerNote(app.employer_note || '');
                              }}
                              className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shrink-0"
                            >
                              {t.employerDash.reviewApplicant}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'profile' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <h2 className="text-lg font-bold text-slate-900 font-display">
                    {t.employerDash.profileTab}
                  </h2>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.auth.employerName} *
                        </label>
                        <input
                          type="text"
                          value={empFullName}
                          onChange={(e) => setEmpFullName(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.auth.businessName}
                        </label>
                        <input
                          type="text"
                          value={empBusinessName}
                          onChange={(e) => setEmpBusinessName(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.auth.mobile} *
                        </label>
                        <input
                          type="tel"
                          value={empMobile}
                          onChange={(e) => setEmpMobile(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {t.auth.employerType}
                        </label>
                        <select value={empType} onChange={(e) => setEmpType(e.target.value)} className={inputClass}>
                          {EMPLOYER_TYPES.map((et) => (
                            <option key={et} value={et}>
                              {translateEmployerType(t, et)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <LocationFields
                      stateValue={empLocation.state}
                      districtValue={empLocation.district}
                      cityValue={empLocation.city}
                      areaValue={empLocation.area}
                      onChange={setEmpLocation}
                    />

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t.workerDash.bioLabel}
                      </label>
                      <textarea
                        rows={3}
                        value={empDescription}
                        onChange={(e) => setEmpDescription(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg disabled:opacity-60"
                    >
                      {savingProfile ? t.common.loading : t.employerDash.saveProfileBtn}
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

      {/* Review Applicant Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedApp.worker_name}</h3>
                <p className="text-xs text-slate-500">{selectedApp.job_title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5 text-sm">
              <p>
                <span className="font-semibold">Location:</span>{' '}
                {selectedApp.worker_area ? `${selectedApp.worker_area}, ` : ''}
                {selectedApp.worker_city}
              </p>
              <p>
                <span className="font-semibold">Skills:</span> {selectedApp.worker_skills}
              </p>
              <p>
                <span className="font-semibold">Experience:</span>{' '}
                {translateExperience(t, selectedApp.worker_experience || 'Fresher')} (
                {translateWorkType(t, selectedApp.worker_work_type || 'Full-time')})
              </p>
              <p className="font-mono-tabular">
                <span className="font-semibold font-sans">Contact:</span> {selectedApp.worker_mobile} ·{' '}
                {selectedApp.worker_email}
              </p>
              {selectedApp.worker_bio && <p className="text-xs text-slate-600 pt-1">{selectedApp.worker_bio}</p>}
              {selectedApp.cover_note && (
                <p className="text-xs text-blue-900 pt-1">Note: "{selectedApp.cover_note}"</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.employerDash.employerNoteLabel}
              </label>
              <textarea
                rows={3}
                value={employerNote}
                onChange={(e) => setEmployerNote(e.target.value)}
                placeholder={t.employerDash.employerNotePlaceholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={updatingApp}
                onClick={() => handleApplicationDecision('Under Review')}
                className="px-3.5 py-2 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg"
              >
                {t.employerDash.markUnderReviewBtn}
              </button>
              <button
                type="button"
                disabled={updatingApp}
                onClick={() => handleApplicationDecision('Rejected')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg"
              >
                {t.employerDash.rejectBtn}
              </button>
              <button
                type="button"
                disabled={updatingApp}
                onClick={() => handleApplicationDecision('Accepted')}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
              >
                {t.employerDash.acceptBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
