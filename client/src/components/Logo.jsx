import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Logo({ to = '/', className = '', light = false }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 shadow-sm">
        <svg viewBox="0 0 64 64" className="h-7 w-7" fill="none" aria-hidden="true">
          <path
            d="M43.8 17.2a10.6 10.6 0 0 0-13.9 12L17.7 41.3a4.4 4.4 0 0 0 6.2 6.2l12-12.2a10.6 10.6 0 0 0 12-13.9l-6.3 6.3-5.4-1.3-1.3-5.4 5.5-5.5 3.4 1.7Z"
            fill="#fff"
          />
          <circle cx="47" cy="17" r="5" fill="#fbbf24" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn('text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-slate-900')}>
          Fixit<span className="text-amber-500">Now</span>
        </span>
        <span className={cn('mt-1 text-[10px] font-semibold uppercase tracking-[0.18em]', light ? 'text-white/60' : 'text-slate-400')}>
          Appliance care
        </span>
      </span>
    </Link>
  );
}