import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useApp } from './AppContext.tsx';
import { EXPERIENCE_LEVELS, JOB_CATEGORIES, WORK_TYPES } from './constants.ts';
import {
  translateCategory,
  translateExperience,
  translateWorkType,
} from './index.ts';
import { apiFetch } from './api.ts';
import { LocationFields } from './LocationFields.tsx';

export function WorkerRegisterPage() {
  const { language, t, setAuthData, showToast } = useApp();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation] = useState({
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    area: '',
  });
  const [skills, setSkills] = useState('');
  const [experienceLabel, setExperienceLabel] = useState<string>(EXPERIENCE_LEVELS[0]);
  const [preferredCategory, setPreferredCategory] = useState<string>(JOB_CATEGORIES[0]);
  const [preferredWorkType, setPreferredWorkType] = useState<string>(WORK_TYPES[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<{ user: any; profile: any; csrfToken: string; authToken: string }>(
        '/api/auth/register/worker',
        {
          method: 'POST',
          body: JSON.stringify({
            full_name: fullName,
            email,
            mobile,
            password,
            state: location.state,
            district: location.district,
            city: location.city,
            area: location.area,
            skills,
            experience_label: experienceLabel,
            preferred_category: preferredCategory,
            preferred_work_type: preferredWorkType,
            language,
          }),
        }
      );
      setAuthData(res.user, res.profile, res.csrfToken, res.authToken);
      showToast('Worker account created successfully.', 'success');
      navigate('/worker/dashboard');
    } catch (err: any) {
      setError(err.message || t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-12">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-slate-900 font-display">{t.auth.workerRegTitle}</h1>
          <p className="text-sm text-slate-600">{t.auth.workerRegSubtitle}</p>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3.5 flex items-center gap-2.5 text-xs sm:text-sm text-teal-900">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span>{t.auth.safetyDataNote}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t.auth.email} *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t.auth.mobile} *
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="98XXXXXXXX"
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t.auth.skillsLabel} *
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder={t.auth.skillsPlaceholder}
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t.auth.experienceLabel} *
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t.auth.preferredCategory} *
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t.auth.preferredWorkType} *
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t.auth.password} *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t.auth.confirmPassword} *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? t.common.loading : t.auth.createWorkerBtn}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-sm text-slate-600">
          {t.auth.alreadyHaveAccount}{' '}
          <Link to="/login" className="font-semibold text-blue-800 hover:underline">
            {t.nav.login}
          </Link>
        </div>
      </div>
    </div>
  );
}
