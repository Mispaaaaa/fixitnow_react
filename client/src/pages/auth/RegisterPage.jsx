import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { apiErrorMessage } from '../../lib/api';
import { roleHome, useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/Icon';
import { Field, Spinner } from '../../components/ui';
import { cn } from '../../lib/utils';

export default function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values) {
    try {
      const user = await registerAccount({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
        role,
      });
      toast.success(
        role === 'technician'
          ? 'Account created. Submit your verification documents next.'
          : 'Account created. Let us get your appliance fixed!'
      );
      navigate(roleHome(user.role), { replace: true });
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Unable to create your account'));
    }
  }

  return (
    <div>
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900">
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to home
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create your account</h1>
      <p className="mt-2 text-sm text-slate-500">Book repairs as a customer or earn as a technician.</p>

      <div className="mt-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account type">
        {[
          { value: 'customer', label: 'Customer', text: 'Book appliance service', icon: 'home' },
          { value: 'technician', label: 'Technician', text: 'Take on repair jobs', icon: 'wrench' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={role === option.value}
            onClick={() => setRole(option.value)}
            className={cn(
              'rounded-2xl border p-4 text-left transition',
              role === option.value
                ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <span
              className={cn(
                'mb-2 flex h-9 w-9 items-center justify-center rounded-xl',
                role === option.value ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-500'
              )}
            >
              <Icon name={option.icon} className="h-5 w-5" />
            </span>
            <span className="block text-sm font-bold text-slate-900">{option.label}</span>
            <span className="block text-xs text-slate-500">{option.text}</span>
          </button>
        ))}
      </div>

      {role === 'technician' && (
        <div className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Technician accounts need document verification before appearing in the directory or
            accepting jobs.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
        <Field label="Full name" htmlFor="name" error={errors.name?.message} required>
          <input
            id="name"
            className="input"
            placeholder="Juan Dela Cruz"
            autoComplete="name"
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Name is too short' },
            })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email address" htmlFor="register-email" error={errors.email?.message} required>
            <input
              id="register-email"
              type="email"
              className="input"
              placeholder="you@example.com"
              autoComplete="email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />
          </Field>
          <Field label="Phone (optional)" htmlFor="phone" error={errors.phone?.message}>
            <input
              id="phone"
              className="input"
              placeholder="+63 917 000 0000"
              autoComplete="tel"
              {...register('phone')}
            />
          </Field>
        </div>
        <Field label="Password" htmlFor="register-password" error={errors.password?.message} hint="At least 8 characters." required>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              className="input pr-11"
              autoComplete="new-password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Use at least 8 characters' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} className="h-4 w-4" />
            </button>
          </div>
        </Field>
        <Field label="Confirm password" htmlFor="confirm-password" error={errors.confirmPassword?.message} required>
          <input
            id="confirm-password"
            type="password"
            className="input"
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === watch('password') || 'Passwords do not match',
            })}
          />
        </Field>
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : <Icon name="user-plus" className="h-4 w-4" />}
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-900">
          Log in
        </Link>
      </p>
    </div>
  );
}