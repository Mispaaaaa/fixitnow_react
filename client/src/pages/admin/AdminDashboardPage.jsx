import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import { useAuth } from '../../contexts/AuthContext';

const modules = [
  { to: '/admin/requests', icon: 'clipboard', title: 'Service requests', text: 'Monitor every job, assign or reassign technicians.' },
  { to: '/admin/verification', icon: 'shield-check', title: 'Verification queue', text: 'Review IDs, certificates and clearances.' },
  { to: '/admin/users', icon: 'users', title: 'User management', text: 'Manage customers and technician accounts.' },
  { to: '/admin/reviews', icon: 'star', title: 'Review moderation', text: 'Hide, restore or inspect flagged feedback.' },
  { to: '/admin/content', icon: 'edit', title: 'Site content', text: 'Edit the landing page and role dashboards.' },
  { to: '/admin/categories', icon: 'layers', title: 'Service categories', text: 'Keep the appliance catalogue current.' },
  { to: '/admin/archive', icon: 'archive', title: 'Archive', text: 'Restore soft-deleted records when needed.' },
  { to: '/admin/audit', icon: 'activity', title: 'Audit log', text: 'See who changed what, with before and after.' },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-5 py-7 text-white sm:px-8 sm:py-9">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
            Operations console
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Good to see you, {user.name.split(' ')[0]}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Keep FixitNow trustworthy: verify technicians, moderate reviews, and make sure every
            request reaches a good outcome.
          </p>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((module) => (
          <Link key={module.to} to={module.to} className="card card-hover p-4">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Icon name={module.icon} className="h-5 w-5" />
            </span>
            <p className="text-sm font-bold text-slate-900">{module.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{module.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}