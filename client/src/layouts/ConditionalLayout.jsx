import { useAuth } from '../contexts/AuthContext';
import AppShell from './AppShell';
import PublicLayout from './PublicLayout';
import { PageLoader } from '../components/ui';

/**
 * Public pages (technician directory/profile) are reachable without logging in.
 * Signed-in users see them inside their role shell so navigation stays consistent.
 */
export default function ConditionalLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <PageLoader />
      </div>
    );
  }
  return user ? <AppShell /> : <PublicLayout />;
}