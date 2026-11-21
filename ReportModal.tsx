import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { REPORT_REASONS } from './constants.ts';
import { apiFetch } from './api.ts';
import { useApp } from './AppContext.tsx';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: 'job' | 'employer';
  targetJobId?: number;
  targetEmployerId?: number;
  targetLabel: string;
}

export function ReportModal({
  open,
  onClose,
  targetType,
  targetJobId,
  targetEmployerId,
  targetLabel,
}: ReportModalProps) {
  const { t, showToast } = useApp();
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          target_type: targetType,
          target_job_id: targetJobId,
          target_employer_id: targetEmployerId,
          reason,
          details,
        }),
      });
      showToast(t.common.reportSubmitted, 'success');
      setDetails('');
      onClose();
    } catch (err: any) {
      setError(err.message || t.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t.common.reportTitle}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{targetLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t.common.reportReason}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t.common.reportDetails}
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t.common.reportDetailsPlaceholder}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
              required
            />
          </div>

          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg disabled:opacity-60"
            >
              {submitting ? t.common.loading : t.common.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
