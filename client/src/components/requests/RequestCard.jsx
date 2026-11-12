import { Link } from 'react-router-dom';
import Icon from '../Icon';
import { StatusBadge } from '../ui';
import { cn, formatDate, titleCase } from '../../lib/utils';

const URGENCY_STYLES = {
  low: 'badge-slate',
  normal: 'badge-slate',
  high: 'badge-amber',
  emergency: 'badge-red',
};

export default function RequestCard({ request, role = 'customer', className = '' }) {
  const showCustomer = role !== 'customer';
  const technicianName = request.technician?.name;
  const category = request.category;

  return (
    <Link
      to={`/requests/${request.id}`}
      className={cn('card card-hover block p-4 sm:p-5', className)}
    >
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
          {category?.icon || 'wrench'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-bold text-slate-900">
                {category?.name || 'Appliance service'}
                {request.applianceBrand ? ` · ${request.applianceBrand}` : ''}
              </h3>
              <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-slate-500">
                {request.issueDescription}
              </p>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" className="h-3.5 w-3.5 text-slate-400" />
              {formatDate(request.preferredDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" className="h-3.5 w-3.5 text-slate-400" />
              {request.timeSlot}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="map-pin" className="h-3.5 w-3.5 text-slate-400" />
              {request.city}
            </span>
            {showCustomer && request.customer && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="user" className="h-3.5 w-3.5 text-slate-400" />
                {request.customer.name}
              </span>
            )}
            {!showCustomer && technicianName && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="wrench" className="h-3.5 w-3.5 text-slate-400" />
                {technicianName}
              </span>
            )}
            {!showCustomer && !technicianName && !request.technicianId && (
              <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
                <Icon name="clock" className="h-3.5 w-3.5" />
                Waiting for a technician
              </span>
            )}
            {request.urgency !== 'normal' && (
              <span className={URGENCY_STYLES[request.urgency] || 'badge-slate'}>
                {titleCase(request.urgency)}
              </span>
            )}
          </div>
        </div>
        <Icon name="chevron-right" className="mt-1 h-5 w-5 shrink-0 text-slate-300" />
      </div>
    </Link>
  );
}