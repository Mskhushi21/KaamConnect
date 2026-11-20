import { Bell, CheckCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { apiFetch } from '../lib/api.ts';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  link: string;
  is_read: number;
  created_at: string;
}

interface NotificationsPanelProps {
  notifications: NotificationItem[];
  onRefresh: () => void;
}

export function NotificationsPanel({ notifications, onRefresh }: NotificationsPanelProps) {
  const { t, showToast } = useApp();

  const markOneRead = async (id: number) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      onRefresh();
    } catch {
      showToast(t.common.errorGeneric, 'error');
    }
  };

  const markAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
      onRefresh();
    } catch {
      showToast(t.common.errorGeneric, 'error');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <Bell className="w-5 h-5 text-blue-800" />
          <h3 className="text-base font-bold text-slate-900">{t.workerDash.notificationsTab}</h3>
        </div>
        {notifications.some((n) => n.is_read === 0) && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 hover:text-blue-900 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{t.common.markAllRead}</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">{t.common.noNotifications}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`py-4 flex items-start justify-between gap-4 ${
                n.is_read === 0 ? 'bg-blue-50/40 -mx-6 px-6' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span>{n.title}</span>
                  {n.is_read === 0 && (
                    <span className="text-xs font-semibold text-teal-700">· New</span>
                  )}
                </div>
                <p className="text-sm text-slate-600">{n.message}</p>
                <p className="text-xs text-slate-400 tabular-nums">
                  {new Date(n.created_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              {n.is_read === 0 && (
                <button
                  type="button"
                  onClick={() => markOneRead(n.id)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md px-2.5 py-1 shrink-0"
                >
                  ✓
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
