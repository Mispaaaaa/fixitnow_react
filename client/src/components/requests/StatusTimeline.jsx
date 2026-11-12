import Icon from '../Icon';
import { cn, formatDateTime, titleCase } from '../../lib/utils';

const STATUS_META = {
  pending: { icon: 'clock', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  accepted: { icon: 'check', color: 'border-brand-300 bg-brand-50 text-brand-700' },
  on_the_way: { icon: 'navigation', color: 'border-brand-300 bg-brand-50 text-brand-700' },
  arrived: { icon: 'map-pin', color: 'border-brand-300 bg-brand-50 text-brand-700' },
  in_progress: { icon: 'wrench', color: 'border-brand-300 bg-brand-50 text-brand-700' },
  completed: { icon: 'check-check', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  cancelled: { icon: 'x', color: 'border-rose-300 bg-rose-50 text-rose-700' },
};

export default function StatusTimeline({ history = [] }) {
  if (!history.length) {
    return <p className="text-sm text-slate-500">No activity recorded yet.</p>;
  }

  return (
    <ol className="relative ml-2 border-l border-slate-200">
      {history.map((entry, index) => {
        const meta = STATUS_META[entry.status] || STATUS_META.pending;
        const last = index === history.length - 1;
        return (
          <li key={entry.id || `${entry.status}-${index}`} className={cn('relative pl-7', !last && 'pb-6')}>
            <span
              className={cn(
                'absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full border',
                meta.color
              )}
            >
              <Icon name={meta.icon} className="h-3 w-3" />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{titleCase(entry.status)}</p>
              <p className="text-[11px] text-slate-400">{formatDateTime(entry.createdAt)}</p>
            </div>
            {entry.note && <p className="mt-1 text-sm leading-relaxed text-slate-500">{entry.note}</p>}
            {entry.changedByUser && (
              <p className="mt-1 text-[11px] text-slate-400">By {entry.changedByUser.name}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}