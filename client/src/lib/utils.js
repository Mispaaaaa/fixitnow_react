export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(
    new Date(value)
  );
}

export function timeAgo(value) {
  if (!value) return '';
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const ranges = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];
  for (const [unit, secondsInUnit] of ranges) {
    if (Math.abs(seconds) >= secondsInUnit) {
      return formatter.format(Math.round(seconds / secondsInUnit), unit);
    }
  }
  return formatter.format(seconds, 'second');
}

export function formatCurrency(value, { compact = false } = {}) {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(Number(value));
}

export function titleCase(value = '') {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function dateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export function fileUrl(path) {
  if (!path) return null;
  return path.startsWith('http') || path.startsWith('blob:') ? path : path;
}

export const STATUS_STYLES = {
  pending: 'badge-amber',
  accepted: 'badge-brand',
  on_the_way: 'badge-brand',
  arrived: 'badge-brand',
  in_progress: 'badge-brand',
  completed: 'badge-green',
  cancelled: 'badge-red',
};

export const VERIFICATION_STYLES = {
  verified: 'badge-green',
  pending: 'badge-amber',
  rejected: 'badge-red',
  suspended: 'badge-red',
};

export function numberOrDash(value) {
  return value === null || value === undefined ? '—' : Number(value).toLocaleString('en-PH');
}

export function todayISO(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}