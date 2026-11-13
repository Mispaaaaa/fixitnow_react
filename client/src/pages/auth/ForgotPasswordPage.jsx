import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../../lib/api';
import Icon from '../../components/Icon';
import { Field, Spinner } from '../../components/ui';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '' } });

  async function onSubmit(values) {
    setError('');
    try {
      await api.post('/auth/forgot-password', values);
      setSubmitted(true);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Could not send password recovery instructions.'));
    }
  }

  return (
    <div>
      <Link to="/login" className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900">
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to sign in
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Forgot password?</h1>
      {submitted ? (
        <p className="mt-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800" role="status">
          If an active account exists for that email, password reset instructions have been sent.
          Check your inbox and spam folder.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-500">
            Enter your account email and we’ll send a secure recovery link.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
            <Field label="Email address" htmlFor="forgot-email" error={errors.email?.message} required>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
                })}
              />
            </Field>
            {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              {isSubmitting ? 'Sending…' : 'Send recovery link'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
