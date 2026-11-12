import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Icon from '../../components/Icon';
import { EmptyState, ErrorState, PageHeader, Pagination } from '../../components/ui';
import RequestCard from '../../components/requests/RequestCard';
import { cn } from '../../lib/utils';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function RequestsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['requests', 'list', { status, page, query }],
    queryFn: () =>
      api
        .get('/requests', {
          params: { page, limit: 10, status: status || undefined, q: query || undefined },
        })
        .then((res) => res.data.data),
  });

  function changeStatus(value) {
    setStatus(value);
    setPage(1);
  }

  function submitSearch(event) {
    event.preventDefault();
    setQuery(search.trim());
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="My service requests"
        subtitle="Track every repair, from the first request to the final diagnosis."
        actions={
          <Link to="/requests/new" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            New request
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => changeStatus(filter.value)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                status === filter.value
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <form onSubmit={submitSearch} className="relative sm:w-64">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search requests"
            className="input py-2 pl-9 text-xs"
            aria-label="Search requests"
          />
        </form>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => <div key={item} className="skeleton h-28" />)}
        </div>
      )}
      {isError && <ErrorState message="We could not load your service requests." onRetry={refetch} />}
      {data?.items?.length === 0 && (
        <div className="card">
          <EmptyState
            icon="clipboard"
            title={query || status ? 'No matching requests' : 'No service requests yet'}
            text={
              query || status
                ? 'Try another filter or clear your search.'
                : 'Book a verified technician for your next appliance repair.'
            }
            action={
              <Link to="/requests/new" className="btn-primary">
                <Icon name="plus" className="h-4 w-4" />
                Book a repair
              </Link>
            }
          />
        </div>
      )}
      <div className="space-y-3">
        {(data?.items || []).map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
      <Pagination meta={data?.meta} onPage={setPage} />
    </div>
  );
}