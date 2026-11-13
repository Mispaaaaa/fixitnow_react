import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api, { apiErrorMessage } from '../../lib/api';
import Icon from '../../components/Icon';
import { ErrorState, Field, PageHeader, PageLoader, Spinner } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';

const EMPTY_PROFILE = {
  bio: '',
  experienceYears: 0,
  hourlyRate: '',
  isAvailable: true,
};

export default function TechnicianProfileSettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [cities, setCities] = useState([]);
  const [skillCategoryIds, setSkillCategoryIds] = useState([]);
  const form = useForm({ defaultValues: EMPTY_PROFILE });

  const profileQuery = useQuery({
    queryKey: ['technician', 'me', 'profile'],
    queryFn: () => api.get('/technicians/me/profile').then((res) => res.data.data.profile),
  });
  const metaQuery = useQuery({
    queryKey: ['technicians', 'meta'],
    queryFn: () => api.get('/technicians/meta').then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    form.reset({
      bio: profile.bio || '',
      experienceYears: Number(profile.experienceYears || 0),
      hourlyRate: profile.hourlyRate || '',
      isAvailable: Boolean(profile.isAvailable),
    });
    const supportedCities = metaQuery.data?.cities || [];
    setCities(
      (profile.areas || [])
        .map((area) => area.city)
        .filter((city) => supportedCities.includes(city))
    );
    setSkillCategoryIds((profile.skills || []).map((skill) => skill.id));
  }, [form, metaQuery.data, profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (values) =>
      api.patch('/technicians/me/profile', {
        ...values,
        experienceYears: Number(values.experienceYears),
        hourlyRate: values.hourlyRate === '' ? null : Number(values.hourlyRate),
        skillCategoryIds: skillCategoryIds.map(Number),
        cities,
      }),
    onSuccess: () => {
      toast.success('Technician profile updated');
      queryClient.invalidateQueries({ queryKey: ['technician', 'me', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Could not update your technician profile')),
  });

  if (profileQuery.isLoading || metaQuery.isLoading) return <PageLoader />;
  if (profileQuery.isError || metaQuery.isError) {
    return (
      <ErrorState
        message="We could not load your technician profile settings."
        onRetry={() => {
          profileQuery.refetch();
          metaQuery.refetch();
        }}
      />
    );
  }

  const categories = metaQuery.data?.categories || [];
  const availableCities = metaQuery.data?.cities || [];

  function toggleValue(values, setter, value) {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Technician profile"
        subtitle="Manage the details customers see when they find you."
        actions={
          <Link to="/technician/verification" className="btn-secondary">
            <Icon name="shield-check" className="h-4 w-4" />
            Verification
          </Link>
        }
      />

      <form
        className="mt-4 space-y-4"
        onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
      >
        <section className="card space-y-4 p-5 sm:p-6">
          <Field label="Professional bio" htmlFor="technician-bio" hint="Tell customers about your experience and approach.">
            <textarea
              id="technician-bio"
              rows={5}
              className="input resize-y"
              maxLength={2000}
              {...form.register('bio')}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Years of experience" htmlFor="technician-experience">
              <input
                id="technician-experience"
                type="number"
                min="0"
                max="60"
                className="input"
                {...form.register('experienceYears', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Hourly rate (PHP)" htmlFor="technician-rate" hint="Leave blank to quote after inspection.">
              <input
                id="technician-rate"
                type="number"
                min="0"
                step="0.01"
                className="input"
                {...form.register('hourlyRate')}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-700" {...form.register('isAvailable')} />
            Accepting new service requests
          </label>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Services</h2>
          <p className="mt-1 text-sm text-slate-500">Choose the categories you are qualified to repair.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={skillCategoryIds.includes(category.id)}
                  onChange={() => toggleValue(skillCategoryIds, setSkillCategoryIds, category.id)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-700"
                />
                {category.name}
              </label>
            ))}
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Service areas</h2>
          <p className="mt-1 text-sm text-slate-500">Select the Oriental Mindoro municipalities where you accept jobs.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {availableCities.map((city) => (
              <label key={city} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={cities.includes(city)}
                  onChange={() => toggleValue(cities, setCities, city)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-700"
                />
                {city}
              </label>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Spinner />}
            Save technician profile
          </button>
        </div>
      </form>
    </div>
  );
}
