import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { roleHome, useAuth } from '../contexts/AuthContext';

export default function NotFoundPage() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon name="search" className="h-8 w-8" />
      </span>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Error 404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        The page you are looking for may have moved, or the link is incomplete.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to={user ? roleHome(user.role) : '/'} className="btn-primary">
          {user ? 'Back to dashboard' : 'Back to home'}
        </Link>
        {!user && <Link to="/login" className="btn-secondary">Log in</Link>}
      </div>
    </div>
  );
}