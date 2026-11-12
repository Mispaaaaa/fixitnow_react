import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../../lib/api';
import Icon from '../../components/Icon';
import {
  Avatar,
  ErrorState,
  Field,
  Modal,
  PageLoader,
  Spinner,
  StatusBadge,
} from '../../components/ui';
import StatusTimeline from '../../components/requests/StatusTimeline';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  cn,
  formatCurrency,
  formatDate,
  STATUS_STYLES,
  titleCase,
} from '../../lib/utils';

const NEXT_ACTION = {
  accepted: { label: 'Mark on the way', icon: 'navigation', status: 'on_the_way' },
  on_the_way: { label: 'I have arrived', icon: 'map-pin', status: 'arrived' },
  arrived: { label: 'Start repair', icon: 'wrench', status: 'in_progress' },
  in_progress: { label: 'Complete job', icon: 'check-check', status: 'completed' },
};

export default function RequestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [finalCost, setFinalCost] = useState('');
  const [parts, setParts] = useState([{ name: '', qty: 1, cost: '' }]);
  const [completionError, setCompletionError] = useState('');
  const [actionError, setActionError] = useState('');

  const { data: request, isLoading, isError, refetch } = useQuery({
    queryKey: ['requests', 'detail', id],
    queryFn: () => api.get(`/requests/${id}`).then((res) => res.data.data.request),
  });

  function invalidateRequest() {
    queryClient.invalidateQueries({ queryKey: ['requests'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  const acceptMutation = useMutation({
    mutationFn: () => api.patch(`/requests/${id}/accept`),
    onSuccess: () => {
      toast.success('Job accepted. The customer has been notified.');
      invalidateRequest();
    },
    onError: (error) => setActionError(apiErrorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: (payload) => api.patch(`/requests/${id}/status`, payload),
    onSuccess: (response) => {
      const next = response.data.data.request.status;
      toast.success(next === 'completed' ? 'Job completed' : 'Job status updated');
      setCompleteOpen(false);
      resetCompletion();
      invalidateRequest();
    },
    onError: (error) => {
      if (completeOpen) setCompletionError(apiErrorMessage(error));
      else setActionError(apiErrorMessage(error));
    },
  });

  const declineMutation = useMutation({
    mutationFn: (payload) => api.patch(`/requests/${id}/decline`, payload),
    onSuccess: () => {
      toast.success('Job returned to the job board');
      setDeclineOpen(false);
      setDeclineReason('');
      invalidateRequest();
    },
    onError: (error) => setActionError(apiErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: (payload) => api.patch(`/requests/${id}/cancel`, payload),
    onSuccess: () => {
      toast.success('Request cancelled');
      setCancelOpen(false);
      setCancelReason('');
      invalidateRequest();
    },
    onError: (error) => setActionError(apiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/requests/${id}`),
    onSuccess: () => {
      toast.success('Request removed');
      invalidateRequest();
      navigate('/requests');
    },
    onError: (error) => setActionError(apiErrorMessage(error)),
  });

  function resetCompletion() {
    setDiagnosisNotes('');
    setFinalCost('');
    setParts([{ name: '', qty: 1, cost: '' }]);
    setCompletionError('');
  }

  function openComplete() {
    resetCompletion();
    if (request?.diagnosisNotes) setDiagnosisNotes(request.diagnosisNotes);
    setCompleteOpen(true);
  }

  function completeJob() {
    setCompletionError('');
    if (diagnosisNotes.trim().length < 5) {
      setCompletionError('Add diagnosis notes so the customer has a service record.');
      return;
    }
    const cost = Number(finalCost);
    if (finalCost === '' || !Number.isFinite(cost) || cost < 0) {
      setCompletionError('Enter the final cost for this repair.');
      return;
    }
    const cleanParts = parts
      .filter((part) => part.name.trim())
      .map((part) => ({
        name: part.name.trim(),
        qty: Number(part.qty),
        cost: Number(part.cost || 0),
      }));
    const invalidPart = cleanParts.find(
      (part) => !Number.isFinite(part.qty) || part.qty < 1 || !Number.isFinite(part.cost) || part.cost < 0
    );
    if (invalidPart) {
      setCompletionError('Check the quantity and cost for each part.');
      return;
    }
    statusMutation.mutate({
      status: 'completed',
      diagnosisNotes: diagnosisNotes.trim(),
      finalCost: cost,
      partsUsed: cleanParts,
    });
  }

  if (isLoading) return <PageLoader label="Loading request details" />;
  if (isError || !request) {
    return <ErrorState message="This service request could not be loaded." onRetry={refetch} />;
  }

  const isOwner = Number(request.customerId) === Number(user.id);
  const isAssignedTech = request.technicianId && Number(request.technicianId) === Number(user.id);
  const isOpen = request.status === 'pending' && !request.technicianId;
  const canAccept = user.role === 'technician' && request.status === 'pending' && (isOpen || isAssignedTech);
  const canDecline = user.role === 'technician' && isAssignedTech && ['pending', 'accepted'].includes(request.status);
  const canAdvance = user.role === 'technician' && isAssignedTech && Boolean(NEXT_ACTION[request.status]);
  const customerCanChange = isOwner && ['pending', 'accepted'].includes(request.status);
  const nextAction = NEXT_ACTION[request.status];
  const partsUsed = Array.isArray(request.partsUsed) ? request.partsUsed : [];
  const isBusy =
    acceptMutation.isPending ||
    statusMutation.isPending ||
    declineMutation.isPending ||
    cancelMutation.isPending ||
    deleteMutation.isPending;

  const backTo = user.role === 'technician' ? '/technician/jobs' : user.role === 'admin' ? '/admin' : '/requests';
  const backLabel =
    user.role === 'technician' ? 'Back to job board' : user.role === 'admin' ? 'Back to dashboard' : 'Back to requests';

  function advanceJob() {
    setActionError('');
    if (request.status === 'in_progress') {
      openComplete();
      return;
    }
    statusMutation.mutate({ status: nextAction.status });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          {backLabel}
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-5 py-6 text-white sm:px-8 sm:py-7">
        <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">
              {request.category?.icon || 'wrench'}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-200">
                Request #{request.id}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {request.category?.name || 'Appliance service'}
                {request.applianceBrand ? ` · ${request.applianceBrand}` : ''}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="calendar" className="h-3.5 w-3.5 text-brand-300" />
                  {formatDate(request.preferredDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" className="h-3.5 w-3.5 text-brand-300" />
                  {request.timeSlot}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="map-pin" className="h-3.5 w-3.5 text-brand-300" />
                  {request.city}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} className="ring-1 ring-white/20" />
            {request.urgency !== 'normal' && (
              <span className="badge-amber">{titleCase(request.urgency)} priority</span>
            )}
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          {customerCanChange && (
            <>
              <Link
                to={`/requests/${request.id}/edit${request.status === 'accepted' ? '?reschedule=1' : ''}`}
                className="btn-secondary border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15 hover:text-white"
              >
                <Icon name="edit" className="h-4 w-4" />
                {request.status === 'accepted' ? 'Reschedule' : 'Edit request'}
              </Link>
              <button
                type="button"
                className="btn-secondary border-rose-300/30 bg-rose-500/15 text-rose-100 hover:border-rose-300/50 hover:bg-rose-500/25 hover:text-white"
                onClick={() => setCancelOpen(true)}
              >
                <Icon name="x" className="h-4 w-4" />
                Cancel request
              </button>
            </>
          )}
          {canAccept && (
            <button type="button" className="btn-primary bg-amber-400 text-slate-950 hover:bg-amber-300" onClick={() => acceptMutation.mutate()} disabled={isBusy}>
              {acceptMutation.isPending ? <Spinner className="h-4 w-4" /> : <Icon name="check" className="h-4 w-4" />}
              Accept job
            </button>
          )}
          {canDecline && (
            <button
              type="button"
              className={cn('btn-secondary border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15 hover:text-white')}
              onClick={() => setDeclineOpen(true)}
              disabled={isBusy}
            >
              <Icon name="x" className="h-4 w-4" />
              Decline job
            </button>
          )}
          {canAdvance && (
            <button
              type="button"
              className="btn-primary bg-amber-400 text-slate-950 hover:bg-amber-300"
              onClick={advanceJob}
              disabled={isBusy}
            >
              {statusMutation.isPending ? <Spinner className="h-4 w-4" /> : <Icon name={nextAction.icon} className="h-4 w-4" />}
              {nextAction.label}
            </button>
          )}
          {isOwner && request.status === 'cancelled' && (
            <button
              type="button"
              className="btn-secondary border-rose-300/30 bg-rose-500/15 text-rose-100 hover:border-rose-300/50 hover:bg-rose-500/25 hover:text-white"
              onClick={() => setDeleteOpen(true)}
            >
              <Icon name="trash" className="h-4 w-4" />
              Delete request
            </button>
          )}
        </div>
      </section>

      {actionError && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <Icon name="alert-triangle" className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{actionError}</span>
          <button type="button" onClick={() => setActionError('')} aria-label="Dismiss">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-5">
          {request.status === 'cancelled' && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <p className="font-semibold">This request was cancelled.</p>
              {request.cancellationReason && <p className="mt-0.5">{request.cancellationReason}</p>}
            </div>
          )}

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Activity timeline</h2>
            <p className="mt-0.5 text-sm text-slate-500">Every status change is recorded for transparency.</p>
            <div className="mt-5">
              <StatusTimeline history={request.history || []} />
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Problem description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {request.issueDescription}
            </p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Brand</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">{request.applianceBrand || 'Not specified'}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Model</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">{request.applianceModel || 'Not specified'}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Urgency</dt>
                <dd className="mt-0.5 text-sm font-semibold capitalize text-slate-900">{request.urgency}</dd>
              </div>
            </dl>
          </section>

          {(request.diagnosisNotes || partsUsed.length > 0 || request.finalCost != null) && (
            <section className="card p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Repair record</h2>
              {request.diagnosisNotes && (
                <div className="mt-3 rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Diagnosis notes</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">{request.diagnosisNotes}</p>
                </div>
              )}
              {partsUsed.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Part</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {partsUsed.map((part, index) => (
                        <tr key={`${part.name}-${index}`}>
                          <td className="px-3 py-2.5 font-medium text-slate-700">{part.name}</td>
                          <td className="px-3 py-2.5 text-center text-slate-500">{part.qty}</td>
                          <td className="px-3 py-2.5 text-right text-slate-700">{formatCurrency(part.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {request.finalCost != null && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                  <span className="text-sm font-semibold text-emerald-900">Final cost</span>
                  <span className="text-lg font-extrabold text-emerald-900">{formatCurrency(request.finalCost)}</span>
                </div>
              )}
            </section>
          )}

          {request.photos?.length > 0 && (
            <section className="card p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Photos</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {request.photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                  >
                    <img src={photo.url} alt={photo.originalName || 'Request photo'} className="h-full w-full object-cover transition duration-200 group-hover:scale-105" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Visit details</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Icon name="calendar" className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{formatDate(request.preferredDate)}</p>
                  <p className="text-xs text-slate-500">{request.timeSlot}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Icon name="map-pin" className="h-4 w-4" />
                </span>
                <div>
                  {request.addressHidden ? (
                    <>
                      <p className="font-semibold text-slate-900">{request.city}</p>
                      <p className="text-xs text-slate-500">Full address is shared after a technician accepts.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-900">{request.city}</p>
                      <p className="text-xs leading-relaxed text-slate-500">{request.address}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Icon name="activity" className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Status</p>
                  <span className={STATUS_STYLES[request.status]}>{titleCase(request.status)}</span>
                </div>
              </div>
            </div>
          </div>

          {!request.technician && (
            <div className="card border-amber-200 bg-amber-50 p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <Icon name="clock" className="h-4 w-4" />
                Waiting for a technician
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-amber-800">
                Verified technicians matching this category and area can see and accept the job.
              </p>
            </div>
          )}

          {request.technician && !isAssignedTech && (
            <div className="card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Assigned technician</h2>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={request.technician.name} src={request.technician.avatarUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{request.technician.name}</p>
                  <p className="text-xs text-slate-500">Your repair professional</p>
                </div>
              </div>
              {request.technician.phone && (
                <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Icon name="phone" className="h-3.5 w-3.5" /> {request.technician.phone}
                </p>
              )}
              {user.role === 'customer' && (
                <Link to={`/technicians/${request.technician.id}`} className="btn-secondary mt-4 w-full">
                  View profile
                </Link>
              )}
            </div>
          )}

          {user.role !== 'customer' && request.customer && (
            <div className="card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Customer</h2>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={request.customer.name} src={request.customer.avatarUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{request.customer.name}</p>
                  {request.customer.phone ? (
                    <p className="text-xs text-slate-500">{request.customer.phone}</p>
                  ) : (
                    <p className="text-xs text-slate-400">Contact unlocks after acceptance</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
            <p className="flex items-center gap-1.5 font-bold text-slate-700">
              <Icon name="shield-check" className="h-4 w-4 text-brand-700" />
              Safety reminder
            </p>
            <p className="mt-1.5">
              Keep chats and payments inside FixitNow. Report suspicious requests to support.
            </p>
          </div>
        </aside>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this request?"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setCancelOpen(false)}>
              Keep request
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={cancelMutation.isPending || cancelReason.trim().length < 3}
              onClick={() => cancelMutation.mutate({ reason: cancelReason.trim() })}
            >
              {cancelMutation.isPending ? <Spinner className="h-4 w-4" /> : <Icon name="x" className="h-4 w-4" />}
              Cancel request
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          The technician will be notified if one has already accepted. Tell us why so we can improve
          the service.
        </p>
        <Field label="Reason" htmlFor="cancelReason" className="mt-4">
          <textarea
            id="cancelReason"
            rows={3}
            className="input mt-1.5 resize-y"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="e.g. We fixed it ourselves or found another provider."
          />
        </Field>
      </Modal>

      <Modal
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Decline this job?"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setDeclineOpen(false)}>
              Keep job
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={declineMutation.isPending}
              onClick={() => declineMutation.mutate({ reason: declineReason.trim() || undefined })}
            >
              {declineMutation.isPending ? <Spinner className="h-4 w-4" /> : <Icon name="x" className="h-4 w-4" />}
              Decline job
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          The request returns to the job board and the customer can choose another technician.
          Declining too often may affect your job match visibility.
        </p>
        <Field label="Reason (optional)" htmlFor="declineReason" className="mt-4">
          <textarea
            id="declineReason"
            rows={3}
            className="input mt-1.5 resize-y"
            value={declineReason}
            onChange={(event) => setDeclineReason(event.target.value)}
            placeholder="Share availability or skill constraints."
          />
        </Field>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this request?"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setDeleteOpen(false)}>
              Keep request
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? <Spinner className="h-4 w-4" /> : <Icon name="trash" className="h-4 w-4" />}
              Delete permanently
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          The request will be removed from your list. This action cannot be undone from your
          account.
        </p>
      </Modal>

      <Modal
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        title="Complete this job"
        size="md"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setCompleteOpen(false)}>
              Not yet
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={statusMutation.isPending}
              onClick={completeJob}
            >
              {statusMutation.isPending ? <Spinner className="h-4 w-4" /> : <Icon name="check-check" className="h-4 w-4" />}
              Complete job
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {completionError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{completionError}</p>
          )}
          <Field label="Diagnosis and work performed" htmlFor="diagnosisNotes" required>
            <textarea
              id="diagnosisNotes"
              rows={4}
              className="input mt-1.5 resize-y"
              value={diagnosisNotes}
              onChange={(event) => setDiagnosisNotes(event.target.value)}
              placeholder="Describe the fault, the fix and any advice for the customer."
            />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="label mb-0">Parts used</span>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => setParts((current) => [...current, { name: '', qty: 1, cost: '' }])}
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
                Add part
              </button>
            </div>
            <div className="space-y-2">
              {parts.map((part, index) => (
                <div key={index} className="grid grid-cols-[minmax(0,1fr)_60px_90px_32px] gap-2">
                  <input
                    className="input py-2 text-xs"
                    placeholder="Part name"
                    value={part.name}
                    onChange={(event) =>
                      setParts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, name: event.target.value } : item
                        )
                      )
                    }
                  />
                  <input
                    type="number"
                    min="1"
                    className="input py-2 text-xs"
                    value={part.qty}
                    onChange={(event) =>
                      setParts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, qty: event.target.value } : item
                        )
                      )
                    }
                    aria-label="Quantity"
                  />
                  <input
                    type="number"
                    min="0"
                    className="input py-2 text-xs"
                    placeholder="Cost"
                    value={part.cost}
                    onChange={(event) =>
                      setParts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, cost: event.target.value } : item
                        )
                      )
                    }
                    aria-label="Part cost"
                  />
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => setParts((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    aria-label="Remove part"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">Leave the part name blank if no parts were replaced.</p>
          </div>

          <Field label="Final cost (PHP)" htmlFor="finalCost" required>
            <input
              id="finalCost"
              type="number"
              min="0"
              className="input mt-1.5"
              value={finalCost}
              onChange={(event) => setFinalCost(event.target.value)}
              placeholder="e.g. 2500"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}