import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Icon from '../../components/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { ErrorState, PageLoader, Stars, VerifiedBadge } from '../../components/ui';
import { formatCurrency, VERIFICATION_STYLES, titleCase } from '../../lib/utils';

export default function TechnicianDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['technician', 'me', 'profile'],
    queryFn: () => api.get('/technicians/me/profile').then((res) => res.data.data.profile),
  });

  if (isLoading) return <PageLoader label="Loading your workspace…" />;
  if (isError) return <ErrorState message="We could not load your technician profile." onRetry={refetch} />;

  const profile = data;
  const verification = profile?.verificationStatus || 'pending';
  const firstName = user.name.split(' ')[0];

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-5 py-7 text-white sm:px-8 sm:py-9">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
              Technician workspace
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Good day, {firstName}.
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {verification === 'verified' ? (
                <VerifiedBadge />
              ) : (
                <span className={VERIFICATION_STYLES[verification]}>
                  {titleCase(verification)} verification
                </span>
              )}
              <span className="text-xs text-slate-400">
                {profile?.isAvailable ? 'Visible for new jobs' : 'Not accepting jobs'}
              </span>
            </div>
          </div>
          <Link to="/technician/jobs" className="btn-primary bg-amber-400 text-slate-950 hover:bg-amber-300">
            <Icon name="briefcase" className="h-4 w-4" />
            Open job board
          </Link>
        </div>
      </section>

      {verification !== 'verified' && (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Icon name="alert-triangle" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                {verification === 'rejected'
                  ? 'Your verification needs attention'
                  : verification === 'suspended'
                    ? 'Your account is suspended'
                    : 'Complete your verification'}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
                {profile?.verificationNote ||
                  'Upload your ID, selfie, certificate and clearance. An admin reviews them before your profile goes live.'}
              </p>
            </div>
          </div>
          <Link to="/technician/verification" className="btn-secondary shrink-0 border-amber-300 bg-white text-amber-900">
            Open verification
          </Link>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Average rating', value: Number(profile?.avgRating || 0).toFixed(1), icon: 'star', extra: <Stars value={profile?.avgRating} showValue={false} /> },
          { label: 'Reviews', value: profile?.reviewCount || 0, icon: 'message' },
          { label: 'Hourly rate', value: profile?.hourlyRate ? formatCurrency(profile.hourlyRate) : '—', icon: 'wallet' },
          { label: 'Experience', value: `${profile?.experienceYears || 0} yrs`, icon: 'briefcase' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {stat.label}
              </p>
              <Icon name={stat.icon} className="h-4 w-4 text-slate-300" />
            </div>
            <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">{stat.value}</p>
            {stat.extra}
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Link to="/technician/jobs" className="card card-hover p-5">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon name="briefcase" className="h-5 w-5" />
          </span>
          <h2 className="font-bold text-slate-900">Job board</h2>
          <p className="mt-1 text-sm text-slate-500">
            Find open repair requests that match your skills and service areas.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
            Browse open jobs <Icon name="arrow-right" className="h-3.5 w-3.5" />
          </span>
        </Link>
        <Link to="/technician/profile" className="card card-hover p-5">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon name="user" className="h-5 w-5" />
          </span>
          <h2 className="font-bold text-slate-900">Public profile</h2>
          <p className="mt-1 text-sm text-slate-500">
            Update your bio, skills, service areas, rates and weekly availability.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
            Edit profile <Icon name="arrow-right" className="h-3.5 w-3.5" />
          </span>
        </Link>
        <Link to="/messages" className="card card-hover p-5">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon name="message" className="h-5 w-5" />
          </span>
          <h2 className="font-bold text-slate-900">Messages</h2>
          <p className="mt-1 text-sm text-slate-500">
            Reply to customers, confirm arrival and share your live location safely.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
            Open inbox <Icon name="arrow-right" className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}