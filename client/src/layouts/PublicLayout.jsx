import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import Logo from '../components/Logo';
import Icon from '../components/Icon';
import { roleHome, useAuth } from '../contexts/AuthContext';

const links = [
  { label: 'Services', to: '/#services' },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Technicians', to: '/technicians' },
  { label: 'FAQ', to: '/#faq' },
];

export default function PublicLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <Link to={roleHome(user.role)} className="btn-primary">
                Go to dashboard
                <Icon name="arrow-right" className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary">
                  Book a repair
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            <Icon name={open ? 'x' : 'menu'} className="h-5 w-5" />
          </button>
        </div>
        {open && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <nav className="flex flex-col">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2">
              {user ? (
                <Link to={roleHome(user.role)} className="btn-primary">
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary">
                    Log in
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Book a repair
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
          <div>
            <Logo light to="/" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Verified appliance technicians, transparent scheduling and live job tracking for
              homes across Oriental Mindoro.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Quick links</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/technicians" className="hover:text-white">Find a technician</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-white">How it works</Link></li>
              <li><Link to="/#faq" className="hover:text-white">FAQ</Link></li>
              <li><Link to="/register" className="hover:text-white">Create an account</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Support</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2"><Icon name="mail" className="h-4 w-4" /> fixitnow@gmail.com</li>
              <li className="flex items-center gap-2"><Icon name="phone" className="h-4 w-4" /> Phone number pending</li>
              <li className="flex items-center gap-2"><Icon name="map-pin" className="h-4 w-4" /> MinSU Main Campus, Victoria, Oriental Mindoro</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} FixitNow. Built for reliable appliance care.
        </div>
      </footer>
    </div>
  );
}