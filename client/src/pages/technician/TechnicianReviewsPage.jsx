import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { EmptyState, ErrorState, PageHeader, PageLoader, Pagination, Stars } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { timeAgo } from '../../lib/utils';

export default function TechnicianReviewsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const profileQuery = useQuery({
    queryKey: ['technician', 'me', 'profile'],
    queryFn: () => api.get('/technicians/me/profile').then((res) => res.data.data.profile),
  });
  const reviewsQuery = useQuery({
    queryKey: ['technician', 'me', 'reviews', page],
    queryFn: () =>
      api.get(`/technicians/${user.id}/reviews`, { params: { page, limit: 10 } })
        .then((res) => res.data.data),
    enabled: profileQuery.data?.verificationStatus === 'verified',
  });

  if (profileQuery.isLoading) return <PageLoader />;
  if (profileQuery.isError) {
    return <ErrorState message="We could not load your technician profile." onRetry={profileQuery.refetch} />;
  }
  if (profileQuery.data?.verificationStatus !== 'verified') {
    return (
      <div>
        <PageHeader title="Customer reviews" subtitle="Reviews appear here after your technician profile is verified." />
        <div className="mt-4">
          <EmptyState title="Verification required" text="Submit your verification documents before your profile and reviews become public." />
        </div>
      </div>
    );
  }
  if (reviewsQuery.isLoading) return <PageLoader label="Loading your reviews…" />;
  if (reviewsQuery.isError) {
    return <ErrorState message="We could not load your reviews." onRetry={reviewsQuery.refetch} />;
  }

  const reviews = reviewsQuery.data?.items || [];
  const summary = reviewsQuery.data?.summary || {};

  return (
    <div>
      <PageHeader title="Customer reviews" subtitle="Feedback from customers who completed a repair with you." />
      <section className="card mt-4 flex flex-wrap items-center gap-4 p-5">
        <Stars value={summary.avgRating} count={summary.reviewCount} size="md" />
        <p className="text-sm text-slate-500">{summary.reviewCount || 0} completed-job reviews</p>
      </section>
      <div className="mt-4 space-y-3">
        {reviews.length === 0 ? (
          <div className="card">
            <EmptyState title="No reviews yet" text="Customer reviews will appear here after completed jobs." />
          </div>
        ) : reviews.map((review) => (
          <article key={review.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{review.customer?.name || 'Customer'}</p>
                <Stars value={review.rating} showValue={false} />
              </div>
              <time className="text-xs text-slate-400">{timeAgo(review.createdAt)}</time>
            </div>
            {review.comment && <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.comment}</p>}
            {(review.tags || []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {review.tags.map((tag) => <span key={tag} className="badge-slate">{tag}</span>)}
              </div>
            )}
            {review.reply && (
              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">Your reply: </span>{review.reply}
              </p>
            )}
          </article>
        ))}
      </div>
      <Pagination meta={reviewsQuery.data?.meta} onPage={setPage} />
    </div>
  );
}
