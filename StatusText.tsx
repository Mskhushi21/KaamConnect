import { CheckCircle2, Clock, Eye, XCircle, MinusCircle, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { translateAppStatus, translateJobStatus } from '../i18n/index.ts';

export function AppStatusLabel({ status }: { status: string }) {
  const { t } = useApp();
  const label = translateAppStatus(t, status);

  if (status === 'Accepted') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  if (status === 'Rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  if (status === 'Under Review') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800">
        <Eye className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  if (status === 'Withdrawn') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <MinusCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}

export function JobStatusLabel({ status }: { status: string }) {
  const { t } = useApp();
  const label = translateJobStatus(t, status);

  if (status === 'Active') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  if (status === 'Pending Review') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  if (status === 'Removed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
      <MinusCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
