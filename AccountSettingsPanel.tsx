import React, { useState } from 'react';
import { Globe, KeyRound } from 'lucide-react';
import { useApp } from './AppContext.tsx';
import { LANGUAGE_LABELS } from './index.ts';
import type { Language } from './constants.ts';
import { apiFetch } from './api.ts';

export function AccountSettingsPanel() {
  const { language, setLanguage, t, showToast } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwError, setPwError] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setSavingPassword(true);
    try {
      await apiFetch('/api/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setCurrentPassword('');
      setNewPassword('');
      showToast(t.common.passwordUpdated, 'success');
    } catch (err: any) {
      setPwError(err.message || t.common.errorGeneric);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-teal-700" />
          <h3 className="text-base font-bold text-slate-900">{t.common.languageSettingTitle}</h3>
        </div>
        <p className="text-sm text-slate-600">{t.common.languageSettingDesc}</p>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {(['en', 'kn', 'hi'] as Language[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              className={`px-3 py-2.5 text-sm font-semibold rounded-lg border transition-colors ${
                language === code
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {LANGUAGE_LABELS[code].native}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <KeyRound className="w-5 h-5 text-blue-800" />
          <h3 className="text-base font-bold text-slate-900">{t.common.changePasswordTitle}</h3>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.common.currentPassword}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.common.newPassword}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>
          {pwError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {pwError}
            </p>
          )}
          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg disabled:opacity-60"
          >
            {savingPassword ? t.common.loading : t.common.updatePasswordBtn}
          </button>
        </form>
      </div>
    </div>
  );
}
