import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Icon from '../../components/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, STATUS_STYLES, titleCase } from '../../lib/utils';

const quickActions = [
  { to: '/requests/new', icon: 'plus', title: 'Book a repair', text: 'Describe the issue and pick a visit window.', primary: true },
  { to: '/technicians', icon: 'wrench', title: 'Find a technician', text: 'Browse verified pros by skill and area.' },
  { to: '/messages', icon: 'message', title: 'Open messages', text: 'Continue a conversation about a job.' },
  { to: '/profile', icon: 'map-pin', title: 'Saved addresses', text: 'Keep your home and office pins ready.' },
];

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'customer'],
    queryFn: () =>
      api
        .get('/dashboard/customer')
        .then((res) => res.data.data)
        .catch(() => ({ requests: [], content: null, announcements: [] })),
  });

  const firstName = user.name.split(' ')[0];
  const requests = data?.requests || [];
  const active = requests.filter((request) => !['completed', 'cancelled'].includes(request.status));

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-5 py-7 text-white sm:px-8 sm:py-9">
        <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
              Customer dashboard
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Track your repairs, chat with your technician and book your next visit in seconds.
            </p>
          </div>
          <Link to="/requests/new" className="btn-primary bg-amber-400 text-slate-950 hover:bg-amber-300">
            <Icon name="plus" className="h-4 w-4" />
            New service request
          </Link>
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`card card-hover flex items-start gap-3 p-4 ${action.primary ? 'border-brand-200 bg-brand-50/60' : ''}`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.primary ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Icon name={action.icon} className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{action.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{action.text}</p>
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your repair activity</h2>
            <p className="text-sm text-slate-500">Active and recent service requests.</p>
          </div>
          <Link to="/requests" className="text-xs font-semibold text-brand-700 hover:text-brand-900">
            View all requests →
          </Link>
        </div>
        {isLoading ? (
          <div className="skeleton h-40" />
        ) : active.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-10 text-center">
            <span className="mb-3 rounded-2xl bg-brand-50 p-3 text-brand-700">
              <Icon name="wrench" className="h-6 w-6" />
            </span>
            <h3 className="font-semibold text-slate-900">No active repairs right now</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              When something acts up, book a verified technician and track the visit from start to
              finish.
            </p>
            <Link to="/requests/new" className="btn-primary mt-4">Book a repair</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {active.slice(0, 3).map((request) => (
              <Link key={request.id} to={`/requests/${request.id}`} className="card card-hover flex flex-wrap items-center gap-4 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg">
                  {request.category?.icon || '🔧'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {request.category?.name || 'Appliance service'} · {request.applianceBrand || 'Appliance'}
                  </p>
                  <p className="truncate text-xs text-slate-500">{request.issueDescription}</p>
                </div>
                <div className="text-right">
                  <span className={STATUS_STYLES[request.status]}>{titleCase(request.status)}</span>
                  <p className="mt-1 text-[11px] text-slate-400">{formatDate(request.preferredDate)}</p>
                </div>
                <Icon name="chevron-right" className="h-5 w-5 text-slate-300" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}