import { Link } from 'react-router-dom';
import { Bookmark, MapPin, Briefcase, Clock, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { translateCategory, translateExperience, translateWorkType } from '../i18n/index.ts';
import { AppStatusLabel } from './StatusText.tsx';

export interface JobListing {
  id: number;
  employer_id: number;
  title: string;
  category: string;
  description: string;
  required_skills: string;
  workers_required: number;
  state: string;
  district: string;
  city: string;
  area: string;
  pay_type: 'monthly' | 'daily';
  salary_min: number;
  salary_max: number;
  salary_display: string;
  work_type: string;
  working_hours: string;
  experience_required: string;
  contact_name: string;
  contact_phone: string;
  application_deadline: string;
  status: string;
  is_sample: number;
  created_at: string;
  employer_name?: string;
  business_name?: string;
  applicant_count?: number;
  is_saved?: boolean;
  my_application_status?: string | null;
}

interface JobCardProps {
  job: JobListing;
  onToggleSave?: (jobId: number, currentlySaved: boolean) => void;
}

export function JobCard({ job, onToggleSave }: JobCardProps) {
  const { user, t } = useApp();
  const orgName = job.business_name?.trim() || job.employer_name || '';
  const postedDate = new Date(job.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <article className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors flex flex-col justify-between gap-4">
      <div>
        {/* Quiet 1-line unboxed metadata kicker */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-teal-800">{translateCategory(t, job.category)}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{postedDate}</span>
            {job.is_sample === 1 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">{t.home.sampleListingLabel}</span>
              </>
            )}
          </div>
          {user?.role === 'worker' && onToggleSave && (
            <button
              type="button"
              onClick={() => onToggleSave(job.id, Boolean(job.is_saved))}
              aria-label={job.is_saved ? t.jobs.saved : t.jobs.saveJob}
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border transition-colors shrink-0 ${
                job.is_saved
                  ? 'border-blue-200 bg-blue-50 text-blue-800'
                  : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${job.is_saved ? 'fill-current' : ''}`} />
              <span>{job.is_saved ? t.jobs.saved : t.jobs.saveJob}</span>
            </button>
          )}
        </div>

        <Link to={`/jobs/${job.id}`} className="group block">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-800 transition-colors leading-snug">
            {job.title}
          </h3>
        </Link>

        {orgName && (
          <p className="text-sm text-slate-600 mt-1 font-medium">{orgName}</p>
        )}

        <p className="mt-3 text-base font-bold text-blue-900 font-mono-tabular">
          {job.salary_display}
        </p>

        <div className="mt-3 space-y-1.5 text-xs sm:text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">
              {job.area}, {job.city} ({job.district})
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{translateWorkType(t, job.work_type)}</span>
            <span aria-hidden="true">·</span>
            <span>{translateExperience(t, job.experience_required)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{job.working_hours}</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500 tabular-nums">
          {job.my_application_status ? (
            <AppStatusLabel status={job.my_application_status} />
          ) : (
            <span>{t.jobs.workersNeeded.replace('{count}', String(job.workers_required))}</span>
          )}
        </div>
        <Link
          to={`/jobs/${job.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <span>{t.jobs.viewDetails}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  );
}
