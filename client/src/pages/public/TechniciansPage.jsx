import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import Icon from '../../components/Icon';
import {
  Avatar,
  EmptyState,
  ErrorState,
  Pagination,
  SkeletonCards,
  Stars,
  VerifiedBadge,
} from '../../components/ui';
import { formatCurrency } from '../../lib/utils';

export default function TechniciansPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = {
    q: searchParams.get('q') || '',
    categoryId: searchParams.get('categoryId') || '',
    city: searchParams.get('city') || '',
    minRating: searchParams.get('minRating') || '',
    sort: searchParams.get('sort') || 'rating',
    page: Number(searchParams.get('page') || 1),
  };

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  }

  const { data: meta } = useQuery({
    queryKey: ['technicians', 'meta'],
    queryFn: () => api.get('/technicians/meta').then((res) => res.data.data),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['technicians', 'directory', filters],
    queryFn: () =>
      api
        .get('/technicians', {
          params: {
            ...(filters.q ? { q: filters.q } : {}),
            ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
            ...(filters.city ? { city: filters.city } : {}),
            ...(filters.minRating ? { minRating: filters.minRating } : {}),
            sort: filters.sort,
            page: filters.page,
            limit: 9,
          },
        })
        .then((res) => res.data.data),
  });

  function submitSearch(event) {
    event.preventDefault();
    updateFilter('q', search.trim());
  }

  const activeFilterCount = [
    filters.categoryId,
    filters.city,
    filters.minRating,
    filters.q,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Verified directory</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Find the right technician
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Every professional here passed identity, skills and clearance checks. Filter by the
          appliance, your city and the rating other customers gave them.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form onSubmit={submitSearch} className="relative min-w-0 flex-1 sm:max-w-md">
          <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by technician name"
            className="input pl-9"
            aria-label="Search technicians"
          />
        </form>
        <button
          type="button"
          className="btn-secondary lg:hidden"
          onClick={() => setFiltersOpen((value) => !value)}
        >
          <Icon name="filter" className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-brand-700 px-1.5 text-[10px] text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="card sticky top-20 space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Filter results</h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSearchParams(new URLSearchParams());
                  }}
                  className="text-[11px] font-semibold text-brand-700 hover:text-brand-900"
                >
                  Clear all
                </button>
              )}
            </div>
            <div>
              <label className="label" htmlFor="filter-category">Service</label>
              <select
                id="filter-category"
                className="input"
                value={filters.categoryId}
                onChange={(event) => updateFilter('categoryId', event.target.value)}
              >
                <option value="">All services</option>
                {(meta?.categories || []).map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="filter-city">Area</label>
              <select
                id="filter-city"
                className="input"
                value={filters.city}
                onChange={(event) => updateFilter('city', event.target.value)}
              >
                <option value="">All areas</option>
                {(meta?.cities || []).map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="filter-rating">Minimum rating</label>
              <select
                id="filter-rating"
                className="input"
                value={filters.minRating}
                onChange={(event) => updateFilter('minRating', event.target.value)}
              >
                <option value="">Any rating</option>
                <option value="4.5">4.5 and up</option>
                <option value="4">4.0 and up</option>
                <option value="3">3.0 and up</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="filter-sort">Sort by</label>
              <select
                id="filter-sort"
                className="input"
                value={filters.sort}
                onChange={(event) => updateFilter('sort', event.target.value)}
              >
                <option value="rating">Highest rated</option>
                <option value="jobs">Most reviewed</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
              <Icon name="shield-check" className="mb-1 h-4 w-4 text-brand-700" />
              Technicians appear here only after an admin approves their documents.
            </div>
          </div>
        </aside>

        <div>
          {isLoading && <SkeletonCards count={6} className="h-56" />}
          {isError && (
            <ErrorState message="We could not load the technician directory." onRetry={refetch} />
          )}
          {data && data.items.length === 0 && (
            <div className="card">
              <EmptyState
                icon="search"
                title="No technicians match those filters"
                text="Try a different service, area or rating, or clear the filters to see everyone."
                action={
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setSearch('');
                      setSearchParams(new URLSearchParams());
                    }}
                  >
                    Clear filters
                  </button>
                }
              />
            </div>
          )}
          {data && data.items.length > 0 && (
            <>
              <p className="mb-3 text-xs font-medium text-slate-500">
                Showing {data.items.length} of {data.meta.total} verified technicians
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((tech) => (
                  <Link
                    key={tech.id}
                    to={`/technicians/${tech.userId}`}
                    className="card card-hover group flex flex-col p-5"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={tech.name} src={tech.user?.avatarUrl} size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="font-bold text-slate-900 group-hover:text-brand-800">
                            {tech.name}
                          </h3>
                          <VerifiedBadge />
                        </div>
                        <div className="mt-1">
                          <Stars value={tech.avgRating} count={tech.reviewCount} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {tech.experienceYears} yrs experience
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">
                      {tech.bio || 'Verified appliance repair professional.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(tech.skills || []).slice(0, 2).map((skill) => (
                        <span key={skill.id} className="badge-slate">{skill.name}</span>
                      ))}
                      {(tech.skills || []).length > 2 && (
                        <span className="badge-slate">+{tech.skills.length - 2}</span>
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs">
                      <span className="flex min-w-0 items-center gap-1 text-slate-500">
                        <Icon name="map-pin" className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {(tech.areas || []).map((area) => area.city).join(', ') || 'On request'}
                        </span>
                      </span>
                      <span className="shrink-0 font-bold text-slate-900">
                        {tech.hourlyRate ? `${formatCurrency(tech.hourlyRate)}/hr` : 'Quote'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <Pagination meta={data.meta} onPage={(page) => updateFilter('page', page)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}