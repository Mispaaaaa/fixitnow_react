import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../../lib/api';
import Icon from '../../components/Icon';
import {
  Avatar,
  EmptyState,
  ErrorState,
  PageLoader,
  Pagination,
  Spinner,
  Stars,
  VerifiedBadge,
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, timeAgo } from '../../lib/utils';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TechnicianProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [reviewsPage, setReviewsPage] = useState(1);

  const profileQuery = useQuery({
    queryKey: ['technicians', 'public', id],
    queryFn: () => api.get(`/technicians/${id}`).then((res) => res.data.data.profile),
  });

  const consultationMutation = useMutation({
    mutationFn: (technicianId) => api.post('/conversations', { technicianId }),
    onSuccess: (response) => {
      const conversation = response.data.data.conversation;
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(`/messages?conversation=${conversation.id}`);
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Could not start a conversation')),
  });

  const reviewsQuery = useQuery({
    queryKey: ['technicians', 'public', id, 'reviews', reviewsPage],
    queryFn: () =>
      api
        .get(`/technicians/${id}/reviews`, { params: { page: reviewsPage, limit: 5 } })
        .then((res) => res.data.data),
    enabled: Boolean(profileQuery.data),
  });

  if (profileQuery.isLoading) return <PageLoader label="Loading technician profile…" />;
  if (profileQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState
          message="This technician could not be found or is not yet verified."
          onRetry={profileQuery.refetch}
        />
      </div>
    );
  }

  const profile = profileQuery.data;
  const summary = reviewsQuery.data?.summary || {
    avgRating: profile.avgRating,
    reviewCount: profile.reviewCount,
    ratingDistribution: profile.ratingDistribution || {},
  };
  const distribution = summary.ratingDistribution || {};
  const total = Number(summary.reviewCount) || 0;

  function startRequest() {
    const target = `/requests/new?technicianId=${profile.userId}`;
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/requests/new', search: `?technicianId=${profile.userId}` } } });
      return;
    }
    if (user.role !== 'customer') return;
    navigate(target);
  }

  function startConsultation() {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/technicians/${id}` } } });
      return;
    }
    consultationMutation.mutate(profile.userId);
  }

  const isOwnProfile = user?.id === profile.userId;
  const canConsult = !isOwnProfile && (!user || user.role === 'customer');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-4">
        <Link to="/technicians" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900">
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to directory
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600" />
            <div className="px-5 pb-6 sm:px-6">
              <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-end gap-4">
                  <Avatar name={profile.name} src={profile.user?.avatarUrl} size="xl" className="ring-4" />
                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {profile.name}
                      </h1>
                      <VerifiedBadge />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <Stars value={summary.avgRating} count={summary.reviewCount} size="md" />
                      <span className="text-xs text-slate-500">
                        {profile.experienceYears} years experience
                      </span>
                    </div>
                  </div>
                </div>
                {profile.featured && (
                  <span className="badge-amber mb-1">
                    <Icon name="star" className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                    Featured pro
                  </span>
                )}
              </div>

              <p className="mt-5 text-sm leading-relaxed text-slate-600">
                {profile.bio || 'This technician has not added a bio yet.'}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {(profile.skills || []).map((skill) => (
                  <span key={skill.id} className="badge-brand">
                    {skill.icon} {skill.name}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Rate</p>
                  <p className="mt-0.5 font-bold text-slate-900">
                    {profile.hourlyRate !== null && profile.hourlyRate !== undefined
                      ? `${formatCurrency(profile.hourlyRate)}/hr`
                      : 'Quote on visit'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Service areas</p>
                  <p className="mt-0.5 truncate font-bold text-slate-900" title={(profile.areas || []).map((area) => area.city).join(', ')}>
                    {(profile.areas || []).map((area) => area.city).join(', ') || '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Availability</p>
                  <p className="mt-0.5 font-bold text-slate-900">
                    {profile.isAvailable ? 'Accepting jobs' : 'Not available'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Weekly availability</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(profile.availability || []).length === 0 && (
                <p className="text-sm text-slate-500">Contact the technician for available slots.</p>
              )}
              {(profile.availability || []).map((slot) => (
                <div key={slot.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-700">{DAYS[slot.dayOfWeek]}</span>
                  <span className="text-slate-500">
                    {String(slot.startTime).slice(0, 5)} – {String(slot.endTime).slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Reviews</h2>
                <p className="text-sm text-slate-500">Only customers of completed jobs can review.</p>
              </div>
              <Stars value={summary.avgRating} count={summary.reviewCount} size="md" />
            </div>

            <div className="mt-5 grid gap-6 sm:grid-cols-[180px_minmax(0,1fr)]">
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-8 font-semibold text-slate-600">{star}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${total ? ((distribution[star] || 0) / total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-slate-400">{distribution[star] || 0}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {reviewsQuery.isLoading && <div className="skeleton h-24" />}
                {reviewsQuery.data?.items?.length === 0 && (
                  <EmptyState
                    icon="star"
                    title="No reviews yet"
                    text="Reviews will appear here after this technician completes a job."
                    className="py-6"
                  />
                )}
                {(reviewsQuery.data?.items || []).map((review) => (
                  <div key={review.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={review.customer?.name} src={review.customer?.avatarUrl} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{review.customer?.name}</p>
                          <p className="text-[11px] text-slate-400">{timeAgo(review.createdAt)}</p>
                        </div>
                      </div>
                      <Stars value={review.rating} showValue={false} />
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.comment}</p>
                    )}
                    {(review.tags || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {review.tags.map((tag) => (
                          <span key={tag} className="badge-slate">{tag}</span>
                        ))}
                      </div>
                    )}
                    {review.reply && (
                      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                          Reply from {profile.name.split(' ')[0]}
                        </p>
                        <p className="mt-1 text-slate-600">{review.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
                <Pagination meta={reviewsQuery.data?.meta} onPage={setReviewsPage} />
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <h2 className="font-bold text-slate-900">Book this technician</h2>
            <p className="mt-1 text-sm text-slate-500">
              Describe the issue and choose a preferred date. You can reschedule before work
              starts.
            </p>
            <button
              type="button"
              className="btn-primary mt-4 w-full"
              onClick={startRequest}
              disabled={!profile.isAvailable}
            >
              <Icon name="calendar" className="h-4 w-4" />
              {profile.isAvailable ? 'Request this technician' : 'Currently not accepting jobs'}
            </button>
            {canConsult && (
              <>
                <button
                  type="button"
                  className="btn-secondary mt-2 w-full"
                  onClick={startConsultation}
                  disabled={consultationMutation.isPending}
                >
                  {consultationMutation.isPending ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Icon name="message" className="h-4 w-4" />
                  )}
                  Ask a question
                </button>
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  Message this technician before booking.
                </p>
              </>
            )}
            {!user && (
              <p className="mt-2 text-center text-[11px] text-slate-400">
                You will be asked to log in or create a customer account.
              </p>
            )}
          </div>
          <div className="card p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Icon name="shield-check" className="h-4 w-4 text-brand-700" />
              Verification details
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2"><Icon name="check" className="h-3.5 w-3.5 text-emerald-600" /> Government ID reviewed</li>
              <li className="flex items-center gap-2"><Icon name="check" className="h-3.5 w-3.5 text-emerald-600" /> Selfie with ID reviewed</li>
              <li className="flex items-center gap-2"><Icon name="check" className="h-3.5 w-3.5 text-emerald-600" /> Skill certificate on file</li>
              <li className="flex items-center gap-2"><Icon name="check" className="h-3.5 w-3.5 text-emerald-600" /> Clearance on file</li>
            </ul>
            <p className="mt-3 text-[11px] text-slate-400">
              Private documents are never shown publicly.
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
            <p className="font-bold">Safety tip</p>
            <p className="mt-1">
              Keep conversations and payments inside the job flow. Report anything suspicious to
              support.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}