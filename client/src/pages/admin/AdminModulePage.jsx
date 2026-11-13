import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { apiErrorMessage } from '../../lib/api';
import Icon from '../../components/Icon';
import { ErrorState, PageHeader, Pagination, Spinner, StatusBadge } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import { formatDate, timeAgo } from '../../lib/utils';

const modules = {
  requests: {
    title: 'Service requests',
    description: 'Review jobs and assign or reassign verified technicians.',
    endpoint: '/admin/requests',
    statuses: ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled'],
  },
  verification: {
    title: 'Verification queue',
    description: 'Review technician profiles and private verification documents.',
    endpoint: '/admin/verification',
    statuses: ['pending', 'verified', 'rejected', 'suspended'],
  },
  users: {
    title: 'User management',
    description: 'Search customer, technician, and admin accounts.',
    endpoint: '/admin/users',
    statuses: ['active', 'inactive', 'customer', 'technician', 'admin'],
  },
  reviews: {
    title: 'Review moderation',
    description: 'Inspect customer feedback and hide or restore reviews.',
    endpoint: '/admin/reviews',
    statuses: ['visible', 'hidden'],
  },
  categories: {
    title: 'Service categories',
    description: 'Create and manage the service catalogue.',
    endpoint: '/admin/categories',
  },
  content: {
    title: 'Site content',
    description: 'Edit content blocks displayed on the landing page and dashboards.',
    endpoint: '/admin/content',
  },
  announcements: {
    title: 'Announcements',
    description: 'Publish and manage dashboard announcements.',
    endpoint: '/admin/announcements',
  },
  archive: {
    title: 'Archive',
    description: 'Review and restore soft-deleted records.',
    endpoint: '/admin/archive',
  },
  audit: {
    title: 'Audit log',
    description: 'Review administrative changes and their before/after values.',
    endpoint: '/admin/audit',
  },
};

const archiveTypes = [
  'users',
  'requests',
  'categories',
  'reviews',
  'technicians',
  'announcements',
  'messages',
  'conversations',
  'saved-addresses',
];
const contentKeys = ['landing', 'dashboard_customer', 'dashboard_technician', 'dashboard_admin'];

function label(value) {
  return String(value || '').replaceAll('_', ' ');
}

function moduleQueryKey(section, status, page, type, contentKey, search) {
  return ['admin', section, status, page, type, contentKey, search];
}

function AdminContentEditor({ contentKey, blocks, onContentKeyChange, onSave, saving }) {
  const [text, setText] = useState(() => JSON.stringify(blocks, null, 2));
  const [error, setError] = useState('');
  const parsed = useMemo(() => {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }, [text]);

  function save() {
    try {
      onSave({ key: contentKey, blocks: JSON.parse(text) });
      setError('');
    } catch {
      setError('Enter valid JSON before saving.');
    }
  }

  return (
    <div className="card p-4 sm:p-6">
      <label className="label" htmlFor="content-key">Content section</label>
      <select
        id="content-key"
        className="input mb-4 max-w-md"
        value={contentKey}
        onChange={(event) => onContentKeyChange(event.target.value)}
      >
        {contentKeys.map((key) => <option key={key} value={key}>{label(key)}</option>)}
      </select>
      <label className="label" htmlFor="content-json">Content JSON</label>
      <textarea
        id="content-json"
        className="input min-h-[24rem] font-mono text-xs"
        value={text}
        onChange={(event) => setText(event.target.value)}
        spellCheck="false"
      />
      {error && <p className="field-error">{error}</p>}
      {!parsed && !error && <p className="mt-1 text-xs text-amber-700">JSON is not valid yet.</p>}
      <button type="button" className="btn-primary mt-4" onClick={save} disabled={!parsed || saving}>
        {saving && <Spinner className="h-4 w-4" />}
        Save content
      </button>
    </div>
  );
}

export default function AdminModulePage() {
  const { section } = useParams();
  const module = modules[section];
  const toast = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(section === 'verification' ? 'pending' : '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [archiveType, setArchiveType] = useState('users');
  const [contentKey, setContentKey] = useState('landing');
  const [categoryName, setCategoryName] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementText, setAnnouncementText] = useState('');

  useEffect(() => {
    setStatus(section === 'verification' ? 'pending' : '');
    setSearch('');
    setPage(1);
  }, [section]);

  const query = useQuery({
    queryKey: moduleQueryKey(section, status, page, archiveType, contentKey, search),
    queryFn: async () => {
      if (section === 'content') {
        const response = await api.get(`${module.endpoint}/${contentKey}`);
        return { blocks: response.data.data.blocks };
      }
      const params = { page, limit: 30 };
      if (status) params.status = status;
      if (search.trim()) params.q = search.trim();
      if (section === 'archive') params.type = archiveType;
      const response = await api.get(module.endpoint, { params });
      return response.data.data;
    },
    enabled: Boolean(module),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ action, record, value }) => {
      if (action === 'request-assignment') {
        return api.patch(`/admin/requests/${record.id}/assignment`, { technicianId: value });
      }
      if (action === 'verification') {
        return api.patch(`/admin/verification/${record.id}`, value);
      }
      if (action === 'user-status') {
        return api.patch(`/admin/users/${record.id}/status`, { isActive: value });
      }
      if (action === 'review-visibility') {
        return api.patch(`/admin/reviews/${record.id}/visibility`, value);
      }
      if (action === 'category-status') {
        return api.patch(`/admin/categories/${record.id}`, { isActive: value });
      }
      if (action === 'category-delete') {
        return api.delete(`/admin/categories/${record.id}`);
      }
      if (action === 'archive-restore') {
        return api.post(`/admin/archive/${archiveType}/${record.id}/restore`);
      }
      if (action === 'announcement-status') {
        return api.patch(`/admin/announcements/${record.id}`, { isActive: value });
      }
      if (action === 'category-create') {
        const slug = value.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return api.post('/admin/categories', { name: value.name, slug });
      }
      if (action === 'announcement-create') {
        return api.post('/admin/announcements', {
          role: 'all',
          style: 'info',
          title: value.title,
          text: value.text,
        });
      }
      if (action === 'content-save') {
        return api.put(`/admin/content/${value.key}`, { blocks: value.blocks });
      }
      return null;
    },
    onSuccess: () => {
      toast.success('Admin changes saved');
      queryClient.invalidateQueries({ queryKey: ['admin', section] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Could not save admin changes')),
  });

  const techniciansQuery = useQuery({
    queryKey: ['admin', 'verified-technicians'],
    queryFn: () => api.get('/technicians', { params: { limit: 100 } }).then((response) => response.data.data.items),
    enabled: section === 'requests',
  });

  if (!module) {
    return (
      <ErrorState
        message="This admin section does not exist."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['admin'] })}
      />
    );
  }

  const records = query.data?.items || [];

  async function openDocument(profileId, documentId) {
    try {
      const response = await api.get(
        `/admin/verification/${profileId}/documents/${documentId}`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(response.data);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Verification document could not be opened'));
    }
  }

  function renderActions(record) {
    if (section === 'requests') {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/requests/${record.id}`} className="btn-secondary btn-sm">Open request</Link>
          {!['completed', 'cancelled'].includes(record.status) && (
            <select
              aria-label={`Assign technician to request ${record.id}`}
              className="input min-w-48 py-1.5 text-xs"
              value={record.technicianId || ''}
              onChange={(event) => actionMutation.mutate({
                action: 'request-assignment',
                record,
                value: event.target.value ? Number(event.target.value) : null,
              })}
            >
              <option value="">Unassigned</option>
              {(techniciansQuery.data || []).map((technician) => (
                <option key={technician.userId} value={technician.userId}>{technician.name}</option>
              ))}
            </select>
          )}
        </div>
      );
    }
    if (section === 'verification') {
      return (
        <div className="flex flex-wrap items-center gap-2">
          {(record.documents || []).map((document) => (
            <button
              key={document.id}
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => openDocument(record.id, document.id)}
            >
              <Icon name="file-text" className="h-4 w-4" />
              {label(document.type)}
            </button>
          ))}
          <button type="button" className="btn-primary btn-sm" onClick={() => actionMutation.mutate({ action: 'verification', record, value: { action: 'approve' } })}>Approve</button>
          <button type="button" className="btn-secondary btn-sm" onClick={() => actionMutation.mutate({ action: 'verification', record, value: { action: 'reject', note: 'Rejected during admin review' } })}>Reject</button>
        </div>
      );
    }
    if (section === 'users') {
      return (
        <button
          type="button"
          className={record.isActive ? 'btn-danger btn-sm' : 'btn-primary btn-sm'}
          onClick={() => actionMutation.mutate({ action: 'user-status', record, value: !record.isActive })}
        >
          {record.isActive ? 'Deactivate' : 'Reactivate'}
        </button>
      );
    }
    if (section === 'reviews') {
      return (
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => actionMutation.mutate({
            action: 'review-visibility',
            record,
            value: { isHidden: !record.isHidden, hiddenNote: record.isHidden ? null : 'Hidden after admin moderation' },
          })}
        >
          {record.isHidden ? 'Restore review' : 'Hide review'}
        </button>
      );
    }
    if (section === 'categories') {
      return (
        <div className="flex gap-2">
          <button type="button" className="btn-secondary btn-sm" onClick={() => actionMutation.mutate({ action: 'category-status', record, value: !record.isActive })}>
            {record.isActive ? 'Deactivate' : 'Activate'}
          </button>
          {!record.deletedAt && (
            <button type="button" className="btn-danger btn-sm" onClick={() => actionMutation.mutate({ action: 'category-delete', record })}>
              Archive
            </button>
          )}
        </div>
      );
    }
    if (section === 'archive') {
      return (
        <button type="button" className="btn-primary btn-sm" onClick={() => actionMutation.mutate({ action: 'archive-restore', record })}>
          Restore
        </button>
      );
    }
    if (section === 'announcements') {
      return (
        <button type="button" className="btn-secondary btn-sm" onClick={() => actionMutation.mutate({ action: 'announcement-status', record, value: !record.isActive })}>
          {record.isActive ? 'Deactivate' : 'Activate'}
        </button>
      );
    }
    return null;
  }

  function recordHeading(record) {
    if (section === 'requests') return `Request #${record.id} · ${record.category?.name || 'Service'}`;
    if (section === 'verification') return record.user?.name || `Technician #${record.userId}`;
    if (section === 'users') return record.name;
    if (section === 'reviews') return `${record.rating}/5 · ${record.customer?.name || 'Customer'}`;
    if (section === 'categories') return record.name;
    if (section === 'announcements') return record.title;
    if (section === 'audit') return `${record.action} · ${record.entityType} #${record.entityId || ''}`;
    return `${record.name || record.title || record.email || record.id} · #${record.id}`;
  }

  function recordDetails(record) {
    if (section === 'requests') {
      return `${record.customer?.name || 'Customer'} · ${record.city} · ${label(record.status)}${record.technician?.name ? ` · ${record.technician.name}` : ''}`;
    }
    if (section === 'verification') {
      return `${record.user?.email || ''} · ${record.experienceYears || 0} years experience · ${record.documents?.length || 0} documents`;
    }
    if (section === 'users') return `${record.email} · ${label(record.role)} · Joined ${formatDate(record.createdAt)}`;
    if (section === 'reviews') return record.comment || 'No written comment';
    if (section === 'categories') return `${record.slug} · ${record.description || 'No description'}${record.deletedAt ? ' · Archived' : ''}`;
    if (section === 'announcements') return `${record.text} · ${label(record.role)} · ${record.isActive ? 'Active' : 'Inactive'}`;
    if (section === 'audit') return `${record.actor?.name || 'System'} · ${timeAgo(record.createdAt)}\n${JSON.stringify({ before: record.before, after: record.after }, null, 2)}`;
    return `${record.email || record.status || record.deletedAt || ''}`;
  }

  return (
    <div>
      <PageHeader
        title={module.title}
        subtitle={module.description}
        backTo="/admin"
        backLabel="Admin overview"
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {['requests', 'users'].includes(section) && (
          <input
            className="input max-w-xs"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder={section === 'users' ? 'Search name or email' : 'Find request by ID'}
            aria-label="Search admin records"
          />
        )}
        {module.statuses && (
          <select
            className="input max-w-xs"
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(1); }}
            aria-label={`Filter ${module.title.toLowerCase()}`}
          >
            <option value="">All statuses</option>
            {module.statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}
          </select>
        )}
        {section === 'archive' && (
          <select
            className="input max-w-xs"
            value={archiveType}
            onChange={(event) => { setArchiveType(event.target.value); setPage(1); }}
            aria-label="Archive record type"
          >
            {archiveTypes.map((item) => <option key={item} value={item}>{label(item)}</option>)}
          </select>
        )}
      </div>

      {section === 'content' && query.data && (
        <AdminContentEditor
          key={contentKey}
          contentKey={contentKey}
          onContentKeyChange={setContentKey}
          blocks={query.data.blocks}
          saving={actionMutation.isPending}
          onSave={(value) => actionMutation.mutate({ action: 'content-save', value })}
        />
      )}
      {section === 'categories' && (
        <form
          className="card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (!categoryName.trim()) return;
            actionMutation.mutate({ action: 'category-create', value: { name: categoryName } });
            setCategoryName('');
          }}
        >
          <div className="flex-1">
            <label className="label" htmlFor="new-category">New category</label>
            <input id="new-category" className="input" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Home appliances" />
          </div>
          <button type="submit" className="btn-primary" disabled={!categoryName.trim() || actionMutation.isPending}>Add category</button>
        </form>
      )}

      {section === 'announcements' && (
        <form
          className="card mb-4 grid gap-3 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!announcementTitle.trim() || !announcementText.trim()) return;
            actionMutation.mutate({ action: 'announcement-create', value: { title: announcementTitle, text: announcementText } });
            setAnnouncementTitle('');
            setAnnouncementText('');
          }}
        >
          <label className="label" htmlFor="announcement-title">New announcement</label>
          <input id="announcement-title" className="input" value={announcementTitle} onChange={(event) => setAnnouncementTitle(event.target.value)} placeholder="Title" />
          <textarea className="input" value={announcementText} onChange={(event) => setAnnouncementText(event.target.value)} placeholder="Announcement text" rows={3} />
          <button type="submit" className="btn-primary justify-self-start" disabled={!announcementTitle.trim() || !announcementText.trim() || actionMutation.isPending}>Publish announcement</button>
        </form>
      )}

      {query.isLoading ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
      ) : query.isError ? (
        <ErrorState message={apiErrorMessage(query.error, 'Admin records could not be loaded.')} onRetry={() => query.refetch()} />
      ) : section !== 'content' && records.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">No records found for this filter.</div>
      ) : section !== 'content' ? (
        <div className="space-y-3">
          {records.map((record) => (
            <article key={record.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-slate-900">{recordHeading(record)}</h2>
                  {record.status && <StatusBadge status={record.status} />}
                  {section === 'users' && <StatusBadge status={record.isActive ? 'active' : 'inactive'} />}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-500">{recordDetails(record)}</p>
                {section === 'reviews' && record.request && (
                  <Link to={`/requests/${record.request.id}`} className="mt-2 inline-flex text-xs font-semibold text-brand-700 hover:text-brand-900">
                    Open request #{record.request.id}
                  </Link>
                )}
              </div>
              {renderActions(record)}
            </article>
          ))}
        </div>
      ) : null}
      {query.data?.meta && <Pagination meta={query.data.meta} onPage={setPage} />}
    </div>
  );
}
