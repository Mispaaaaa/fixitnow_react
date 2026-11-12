import { Outlet } from 'react-router-dom';
import Logo from '../components/Logo';
import Icon from '../components/Icon';

const points = [
  'Verified technicians with private document checks',
  'Track every repair from pending to completed',
  'Chat and share live location while help is on the way',
];

export default function AuthLayout() {
  return (
    <div className="grid min-h-dvh bg-slate-50 lg:grid-cols-[minmax(0,1fr)_minmax(420px,42%)]">
      <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-brand-600/40 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
        </div>
        <div className="relative">
          <Logo light to="/" />
        </div>
        <div className="relative max-w-lg">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
            <Icon name="shield-check" className="h-4 w-4 text-amber-300" />
            Trusted local appliance care
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Repairs that keep your home running.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            From a noisy aircon to a leaking washer, FixitNow gets a verified specialist to your
            door without the guesswork.
          </p>
          <ul className="mt-8 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-slate-200">
                <span className="mt-0.5 rounded-full bg-brand-500/20 p-1">
                  <Icon name="check" className="h-4 w-4 text-brand-300" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">
          FixitNow · Appliance Maintenance and Service Management System
        </p>
      </div>

      <div className="flex min-h-dvh flex-col">
        <div className="flex items-center justify-between px-5 py-5 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-8">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}