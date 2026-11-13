import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../../lib/api';
import Icon from '../../components/Icon';
import { Field, Spinner } from '../../components/ui';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { newPassword: '', confirmPassword: '' } });

  async function onSubmit(values) {
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: values.newPassword });
      setSubmitted(true);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not reset your password.'));
    }
  }

  return (
    <div>
      <Link to="/login" className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900">
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to sign in
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Reset password</h1>
      {submitted ? (
        <>
          <p className="mt-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800" role="status">
            Your password has been reset. Sign in with your new password.
          </p>
          <Link to="/login" className="btn-primary mt-5 w-full">Go to sign in</Link>
        </>
      ) : !token ? (
        <p className="mt-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">
          This reset link is incomplete. Request a new one.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-500">Choose a new password with at least 8 characters.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
            <Field label="New password" htmlFor="new-password" error={errors.newPassword?.message} required>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                className="input"
                {...register('newPassword', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Use at least 8 characters' },
                  maxLength: { value: 72, message: 'Password is too long' },
                })}
              />
            </Field>
            <Field label="Confirm password" htmlFor="confirm-password" error={errors.confirmPassword?.message} required>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                className="input"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === watch('newPassword') || 'Passwords do not match',
                })}
              />
            </Field>
            {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              {isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
