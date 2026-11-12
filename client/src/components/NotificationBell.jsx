import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import Icon from './Icon';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationBell({ className = '' }) {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get('/notifications/unread-count').then((res) => res.data.data),
    enabled: Boolean(user),
    refetchInterval: 30000,
  });
  const count = data?.count || 0;

  return (
    <Link
      to="/notifications"
      className={`relative rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 ${className}`}
      aria-label={`Notifications${count ? `, ${count} unread` : ''}`}
    >
      <Icon name="bell" className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}