import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useApp } from './AppContext.tsx';
import { apiFetch } from './api.ts';

export function LoginPage() {
  const { t, setAuthData, showToast } = useApp();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<{ user: any; profile: any; csrfToken: string; authToken: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      setAuthData(res.user, res.profile, res.csrfToken, res.authToken);
      showToast(`Welcome, ${res.user.full_name}`, 'success');
      if (res.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (res.user.role === 'employer') {
        navigate('/employer/dashboard');
      } else {
        navigate('/worker/dashboard');
      }
    } catch (err: any) {
      setError(err.message || t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">{t.auth.loginTitle}</h1>
          <p className="text-sm text-slate-600">{t.auth.loginSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t.auth.identifierLabel}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t.auth.identifierPlaceholder}
              required
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t.auth.passwordLabel}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
            />
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? t.common.loading : t.auth.loginButton}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 space-y-2 text-sm text-center">
          <p className="text-slate-600">{t.auth.noAccount}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register/worker" className="font-semibold text-blue-800 hover:underline">
              {t.auth.registerWorkerLink}
            </Link>
            <span className="hidden sm:inline text-slate-300">·</span>
            <Link to="/register/employer" className="font-semibold text-teal-700 hover:underline">
              {t.auth.registerEmployerLink}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
