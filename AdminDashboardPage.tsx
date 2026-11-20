import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Briefcase,
  Users,
  Building2,
  FileText,
  Flag,
  Mail,
  Settings,
  LogOut,
  Database,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { apiFetch } from '../lib/api.ts';
import { AppStatusLabel, JobStatusLabel } from '../components/StatusText.tsx';
import { AccountSettingsPanel } from '../components/AccountSettingsPanel.tsx';

type AdminTab =
  | 'overview'
  | 'jobs'
  | 'workers'
  | 'employers'
  | 'applications'
  | 'reports'
  | 'contacts'
  | 'settings';

export function AdminDashboardPage() {
  const { user, t, logout, showToast } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    workers: any[];
    employers: any[];
    jobs: any[];
    applications: any[];
    reports: any[];
    contacts: any[];
    sampleCounts: { jobs: number; users: number };
  } | null>(null);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/api/admin/overview');
      setData(res);
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleJobStatus = async (jobId: number, status: string) => {
    try {
      await apiFetch(`/api/admin/jobs/${jobId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast(`Job status updated to ${status}.`, 'success');
      loadOverview();
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    try {
      await apiFetch(`/api/admin/jobs/${jobId}`, { method: 'DELETE' });
      showToast('Listing permanently deleted.', 'info');
      loadOverview();
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    }
  };

  const handleToggleSuspend = async (userId: number, currentSuspended: number) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/suspend`, {
        method: 'PATCH',
        body: JSON.stringify({ is_suspended: currentSuspended === 0 }),
      });
      showToast(
        currentSuspended === 0 ? 'Account suspended.' : 'Account reactivated.',
        'success'
      );
      loadOverview();
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    }
  };

  const handleReportStatus = async (reportId: number, status: string) => {
    try {
      await apiFetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast(`Report marked as ${status}.`, 'success');
      loadOverview();
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    }
  };

  const handleContactStatus = async (contactId: number, status: string) => {
    try {
      await apiFetch(`/api/admin/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      loadOverview();
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    }
  };

  const handleClearSampleData = async () => {
    try {
      const res = await apiFetch<{ deletedJobs: number; deletedUsers: number }>(
        '/api/admin/sample-data/clear',
        { method: 'POST' }
      );
      showToast(
        `Removed ${res.deletedJobs} sample jobs and ${res.deletedUsers} sample accounts.`,
        'success'
      );
      loadOverview();
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    }
  };

  const handleLoadSampleData = async () => {
    try {
      await apiFetch('/api/admin/sample-data/load', { method: 'POST' });
      showToast('Sample listings and accounts loaded.', 'success');
      loadOverview();
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'overview', label: t.adminDash.overviewTab, icon: Shield },
    { id: 'jobs', label: t.adminDash.jobsTab, icon: Briefcase, count: data?.jobs.length },
    { id: 'workers', label: t.adminDash.workersTab, icon: Users, count: data?.workers.length },
    { id: 'employers', label: t.adminDash.employersTab, icon: Building2, count: data?.employers.length },
    { id: 'applications', label: t.adminDash.applicationsTab, icon: FileText, count: data?.applications.length },
    {
      id: 'reports',
      label: t.adminDash.reportsTab,
      icon: Flag,
      count: data?.reports.filter((r) => r.status === 'Open').length,
    },
    {
      id: 'contacts',
      label: t.adminDash.contactsTab,
      icon: Mail,
      count: data?.contacts.filter((c) => c.status === 'New').length,
    },
    { id: 'settings', label: t.workerDash.settingsTab, icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
          <div className="px-3 py-2 border-b border-slate-100 mb-2">
            <p className="text-xs font-semibold text-blue-800">{t.adminDash.title}</p>
            <p className="text-sm font-bold text-slate-900 truncate">{user?.full_name}</p>
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
                  active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className={`text-xs font-mono-tabular ${active ? 'text-teal-300' : 'text-slate-500'}`}>
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

        {/* Main Panel */}
        <div className="lg:col-span-9 space-y-6">
          {loading ? (
            <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ) : (
            <>
              {tab === 'overview' && data && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                      {t.adminDash.title}
                    </h1>
                    <p className="text-sm text-slate-600 mt-1">{t.adminDash.subtitle}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.adminDash.workersTab}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1 font-mono-tabular">
                        {data.workers.length}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.adminDash.employersTab}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1 font-mono-tabular">
                        {data.employers.length}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.adminDash.jobsTab}</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1 font-mono-tabular">
                        {data.jobs.length}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.adminDash.applicationsTab}</p>
                      <p className="text-2xl font-bold text-teal-700 mt-1 font-mono-tabular">
                        {data.applications.length}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">{t.adminDash.reportsTab} (Open)</p>
                      <p className="text-2xl font-bold text-amber-700 mt-1 font-mono-tabular">
                        {data.reports.filter((r) => r.status === 'Open').length}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-medium text-slate-500">Pending Review Jobs</p>
                      <p className="text-2xl font-bold text-red-700 mt-1 font-mono-tabular">
                        {data.jobs.filter((j) => j.status === 'Pending Review').length}
                      </p>
                    </div>
                  </div>

                  {/* Sample Data Management Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-800" />
                        <h3 className="text-base font-bold text-slate-900">{t.adminDash.sampleDataTitle}</h3>
                      </div>
                      <p className="text-sm text-slate-600">{t.adminDash.sampleDataDesc}</p>
                      <p className="text-xs text-slate-500 font-mono-tabular">
                        Active sample records: {data.sampleCounts.jobs} jobs · {data.sampleCounts.users} accounts
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {data.sampleCounts.jobs > 0 || data.sampleCounts.users > 0 ? (
                        <button
                          type="button"
                          onClick={handleClearSampleData}
                          className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg"
                        >
                          {t.adminDash.clearSampleBtn}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleLoadSampleData}
                          className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg"
                        >
                          {t.adminDash.loadSampleBtn}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'jobs' && data && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-lg font-bold text-slate-900">{t.adminDash.jobsTab}</h2>
                  <div className="divide-y divide-slate-100">
                    {data.jobs.map((job) => (
                      <div key={job.id} className="py-4 flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900">{job.title}</span>
                              <span className="text-slate-300">·</span>
                              <JobStatusLabel status={job.status} />
                              {job.is_sample === 1 && (
                                <span className="text-xs text-slate-400">· {t.home.sampleListingLabel}</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {job.business_name || job.employer_name} · {job.city} · {job.salary_display}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {job.status !== 'Active' && (
                              <button
                                type="button"
                                onClick={() => handleJobStatus(job.id, 'Active')}
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md"
                              >
                                {t.adminDash.approveJob}
                              </button>
                            )}
                            {job.status !== 'Pending Review' && (
                              <button
                                type="button"
                                onClick={() => handleJobStatus(job.id, 'Pending Review')}
                                className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-md"
                              >
                                {t.adminDash.flagJob}
                              </button>
                            )}
                            {job.status !== 'Removed' && (
                              <button
                                type="button"
                                onClick={() => handleJobStatus(job.id, 'Removed')}
                                className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-md"
                              >
                                {t.adminDash.removeJob}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteJob(job.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
                            >
                              {t.adminDash.deleteJob}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'workers' && data && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 overflow-x-auto">
                  <h2 className="text-lg font-bold text-slate-900">{t.adminDash.workersTab}</h2>
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="py-2.5 pr-4">Name</th>
                        <th className="py-2.5 pr-4">Contact</th>
                        <th className="py-2.5 pr-4">Location &amp; Skills</th>
                        <th className="py-2.5 pr-4">Status</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.workers.map((w) => (
                        <tr key={w.id}>
                          <td className="py-3 pr-4 font-semibold text-slate-900">
                            {w.full_name}
                            {w.is_sample === 1 && <span className="block text-xs font-normal text-slate-400">Sample</span>}
                          </td>
                          <td className="py-3 pr-4 text-xs font-mono-tabular text-slate-600">
                            {w.mobile}
                            <span className="block font-sans">{w.email}</span>
                          </td>
                          <td className="py-3 pr-4 text-xs text-slate-600">
                            {w.city} ({w.area || '-'})
                            <span className="block text-slate-500">{w.skills}</span>
                          </td>
                          <td className="py-3 pr-4 text-xs font-semibold">
                            {w.is_suspended === 1 ? (
                              <span className="text-red-700">Suspended</span>
                            ) : (
                              <span className="text-emerald-700">Active</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleSuspend(w.id, w.is_suspended)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                                w.is_suspended === 1
                                  ? 'text-emerald-800 border-emerald-200 bg-emerald-50'
                                  : 'text-red-700 border-red-200 bg-red-50'
                              }`}
                            >
                              {w.is_suspended === 1 ? t.adminDash.unsuspendUser : t.adminDash.suspendUser}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'employers' && data && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 overflow-x-auto">
                  <h2 className="text-lg font-bold text-slate-900">{t.adminDash.employersTab}</h2>
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="py-2.5 pr-4">Employer</th>
                        <th className="py-2.5 pr-4">Contact</th>
                        <th className="py-2.5 pr-4">Location &amp; Type</th>
                        <th className="py-2.5 pr-4 text-right">Jobs</th>
                        <th className="py-2.5 pr-4">Status</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.employers.map((emp) => (
                        <tr key={emp.id}>
                          <td className="py-3 pr-4 font-semibold text-slate-900">
                            {emp.business_name || emp.full_name}
                            <span className="block text-xs font-normal text-slate-500">{emp.full_name}</span>
                          </td>
                          <td className="py-3 pr-4 text-xs font-mono-tabular text-slate-600">
                            {emp.mobile}
                            <span className="block font-sans">{emp.email}</span>
                          </td>
                          <td className="py-3 pr-4 text-xs text-slate-600">
                            {emp.city}
                            <span className="block text-slate-500">{emp.employer_type}</span>
                          </td>
                          <td className="py-3 pr-4 text-right font-mono-tabular">{emp.jobs_count}</td>
                          <td className="py-3 pr-4 text-xs font-semibold">
                            {emp.is_suspended === 1 ? (
                              <span className="text-red-700">Suspended</span>
                            ) : (
                              <span className="text-emerald-700">Active</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleSuspend(emp.id, emp.is_suspended)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                                emp.is_suspended === 1
                                  ? 'text-emerald-800 border-emerald-200 bg-emerald-50'
                                  : 'text-red-700 border-red-200 bg-red-50'
                              }`}
                            >
                              {emp.is_suspended === 1 ? t.adminDash.unsuspendUser : t.adminDash.suspendUser}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'applications' && data && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 overflow-x-auto">
                  <h2 className="text-lg font-bold text-slate-900">{t.adminDash.applicationsTab}</h2>
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="py-2.5 pr-4">Worker</th>
                        <th className="py-2.5 pr-4">Job</th>
                        <th className="py-2.5 pr-4">Employer</th>
                        <th className="py-2.5 pr-4">Status</th>
                        <th className="py-2.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.applications.map((a) => (
                        <tr key={a.id}>
                          <td className="py-3 pr-4 font-medium text-slate-900">{a.worker_name}</td>
                          <td className="py-3 pr-4 text-slate-700">
                            {a.job_title} ({a.job_city})
                          </td>
                          <td className="py-3 pr-4 text-slate-600">{a.employer_name}</td>
                          <td className="py-3 pr-4">
                            <AppStatusLabel status={a.status} />
                          </td>
                          <td className="py-3 text-xs font-mono-tabular text-slate-500">
                            {new Date(a.created_at).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'reports' && data && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-lg font-bold text-slate-900">{t.adminDash.reportsTab}</h2>
                  {data.reports.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">No safety reports filed.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.reports.map((r) => (
                        <div key={r.id} className="py-4 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {r.target_type === 'job' ? `Job: ${r.target_job_title || '#' + r.target_job_id}` : `Employer: ${r.target_employer_name || '#' + r.target_employer_id}`}
                              </p>
                              <p className="text-xs text-red-700 font-semibold">{r.reason}</p>
                            </div>
                            <span className="text-xs font-semibold text-slate-700">{r.status}</span>
                          </div>
                          {r.details && <p className="text-sm text-slate-600">{r.details}</p>}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleReportStatus(r.id, 'Reviewed')}
                              className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-md"
                            >
                              {t.adminDash.reviewReport}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReportStatus(r.id, 'Resolved')}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md"
                            >
                              {t.adminDash.resolveReport}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReportStatus(r.id, 'Dismissed')}
                              className="px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-md"
                            >
                              {t.adminDash.dismissReport}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'contacts' && data && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-lg font-bold text-slate-900">{t.adminDash.contactsTab}</h2>
                  {data.contacts.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">No contact inquiries yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.contacts.map((c) => (
                        <div key={c.id} className="py-4 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-slate-900">{c.subject}</p>
                            <span className="text-xs font-semibold text-blue-800">{c.status}</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {c.name} ({c.email}
                            {c.phone ? ` · ${c.phone}` : ''})
                          </p>
                          <p className="text-sm text-slate-700">{c.message}</p>
                          {c.status !== 'Resolved' && (
                            <div className="pt-1 flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleContactStatus(c.id, 'Resolved')}
                                className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md"
                              >
                                {t.adminDash.resolveReport}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'settings' && <AccountSettingsPanel />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
