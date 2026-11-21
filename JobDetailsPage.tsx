import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Briefcase,
  Calendar,
  Clock,
  Flag,
  MapPin,
  Phone,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react';
import { useApp } from './AppContext.tsx';
import { apiFetch } from './api.ts';
import {
  translateCategory,
  translateEmployerType,
  translateExperience,
  translateWorkType,
} from './index.ts';
import { AppStatusLabel, JobStatusLabel } from './StatusText.tsx';
import { ReportModal } from './ReportModal.tsx';

export function JobDetailsPage() {
  const { id } = useParams();
  const { user, t, showToast } = useApp();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  const [reportTarget, setReportTarget] = useState<'job' | 'employer' | null>(null);

  const loadJob = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ job: any }>(`/api/jobs/${id}`);
      setJob(res.job);
    } catch (err: any) {
      setError(err.message || t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const handleToggleSave = async () => {
    if (!job) return;
    try {
      if (job.is_saved) {
        await apiFetch(`/api/worker/saved/${job.id}`, { method: 'DELETE' });
      } else {
        await apiFetch(`/api/worker/saved/${job.id}`, { method: 'POST' });
      }
      setJob((prev: any) => ({ ...prev, is_saved: !prev.is_saved }));
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    setSubmittingApp(true);
    try {
      await apiFetch(`/api/worker/apply/${job.id}`, {
        method: 'POST',
        body: JSON.stringify({ cover_note: coverNote }),
      });
      setApplyModalOpen(false);
      setCoverNote('');
      showToast('Application submitted successfully.', 'success');
      await loadJob();
    } catch (err: any) {
      showToast(err.message || t.common.errorGeneric, 'error');
    } finally {
      setSubmittingApp(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-72 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-lg font-semibold text-slate-900">{error || 'Job not found.'}</p>
        <Link to="/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800">
          <ArrowLeft className="w-4 h-4" />
          <span>{t.common.backToJobs}</span>
        </Link>
      </div>
    );
  }

  const orgName = job.business_name?.trim() || job.employer_name;
  const skillsList = String(job.required_skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t.common.backToJobs}</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Job Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-teal-800">{translateCategory(t, job.category)}</span>
                <span aria-hidden="true">·</span>
                <JobStatusLabel status={job.status} />
                {job.is_sample === 1 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{t.home.sampleListingLabel}</span>
                  </>
                )}
              </div>

              {user?.role === 'worker' && (
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    job.is_saved
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${job.is_saved ? 'fill-current' : ''}`} />
                  <span>{job.is_saved ? t.jobs.saved : t.jobs.saveJob}</span>
                </button>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display text-balance">
                {job.title}
              </h1>
              <p className="text-base text-slate-700 font-medium mt-1.5">
                {orgName}
                {job.employer_type ? ` · ${translateEmployerType(t, job.employer_type)}` : ''}
              </p>
            </div>

            <div className="text-xl sm:text-2xl font-bold text-blue-900 font-mono-tabular">
              {job.salary_display}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-sm text-slate-700">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {job.area}, {job.city}, {job.district}, {job.state}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {translateWorkType(t, job.work_type)} · {translateExperience(t, job.experience_required)}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {t.jobs.workingHours}: {job.working_hours}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="tabular-nums">
                  {t.jobs.workersNeeded.replace('{count}', String(job.workers_required))} ·{' '}
                  {t.jobs.applicantsCount.replace('{count}', String(job.applicant_count || 0))}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="tabular-nums">
                  {t.jobs.postedOn}: {new Date(job.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="tabular-nums">
                  {t.jobs.deadline}: {job.application_deadline}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h2 className="text-base font-bold text-slate-900">{t.jobs.jobDescription}</h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h2 className="text-base font-bold text-slate-900">{t.jobs.requiredSkills}</h2>
              <p className="text-sm text-slate-700">{skillsList.join(' · ')}</p>
            </div>
          </div>

          {/* Safety Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-950">{t.jobs.safetyBoxTitle}</h3>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">{t.jobs.safetyBoxBody}</p>
            </div>
          </div>
        </div>

        {/* Action & Contact Sidebar */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            {user?.role === 'worker' ? (
              job.my_application ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">{t.jobs.alreadyAppliedBanner}</p>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <AppStatusLabel status={job.my_application.status} />
                    {job.my_application.employer_note && (
                      <p className="text-xs text-slate-600 mt-2">
                        {job.my_application.employer_note}
                      </p>
                    )}
                  </div>
                  <Link
                    to="/worker/dashboard"
                    className="block w-full text-center py-2.5 px-4 text-sm font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg"
                  >
                    {t.nav.dashboard}
                  </Link>
                </div>
              ) : job.status === 'Active' ? (
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(true)}
                  className="w-full py-3 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors"
                >
                  {t.jobs.applyNow}
                </button>
              ) : (
                <p className="text-sm text-slate-600 font-medium">
                  This listing is currently {job.status}.
                </p>
              )
            ) : user?.role === 'employer' ? (
              <p className="text-sm text-slate-600">{t.jobs.employerCannotApply}</p>
            ) : !user ? (
              <Link
                to="/login"
                className="block w-full text-center py-3 px-4 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors"
              >
                {t.jobs.loginToApply}
              </Link>
            ) : null}

            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900">{t.jobs.contactDetails}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{job.contact_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-mono-tabular">{job.contact_phone}</span>
              </div>
              {job.phone_masked && (
                <p className="text-xs text-slate-500">{t.jobs.contactHiddenNotice}</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setReportTarget('job')}
                className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-red-700"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{t.jobs.reportJob}</span>
              </button>
              <button
                type="button"
                onClick={() => setReportTarget('employer')}
                className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-red-700"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{t.jobs.reportEmployer}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Apply Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">{t.jobs.applyModalTitle}</h2>
            <p className="text-sm text-slate-600 mb-4">{job.title}</p>
            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t.jobs.applyCoverLabel}
                </label>
                <textarea
                  rows={4}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder={t.jobs.applyCoverPlaceholder}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg disabled:opacity-60"
                >
                  {submittingApp ? t.common.loading : t.jobs.submitApplication}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ReportModal
        open={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        targetType={reportTarget || 'job'}
        targetJobId={reportTarget === 'job' ? job.id : undefined}
        targetEmployerId={reportTarget === 'employer' ? job.employer_id : undefined}
        targetLabel={reportTarget === 'employer' ? orgName : job.title}
      />
    </div>
  );
}
