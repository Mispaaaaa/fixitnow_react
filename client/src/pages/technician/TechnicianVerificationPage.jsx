import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { apiErrorMessage } from '../../lib/api';
import Icon from '../../components/Icon';
import { ErrorState, Field, PageHeader, PageLoader, Spinner } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import { titleCase, VERIFICATION_STYLES } from '../../lib/utils';

const DOCUMENTS = [
  { value: 'government_id', label: 'Government ID' },
  { value: 'selfie_id', label: 'Selfie with ID' },
  { value: 'certificate', label: 'Skill certificate' },
  { value: 'clearance', label: 'Police or barangay clearance' },
];

export default function TechnicianVerificationPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const fileInput = useRef(null);
  const [type, setType] = useState(DOCUMENTS[0].value);
  const [file, setFile] = useState(null);

  const profileQuery = useQuery({
    queryKey: ['technician', 'me', 'profile'],
    queryFn: () => api.get('/technicians/me/profile').then((res) => res.data.data.profile),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ documentType, document }) => {
      const body = new FormData();
      body.append('document', document);
      return api.post(`/technicians/me/documents?type=${encodeURIComponent(documentType)}`, body);
    },
    onSuccess: () => {
      toast.success('Document sent for review');
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['technician', 'me', 'profile'] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Could not upload this document')),
  });

  if (profileQuery.isLoading) return <PageLoader />;
  if (profileQuery.isError || !profileQuery.data) {
    return <ErrorState message="We could not load your verification details." onRetry={profileQuery.refetch} />;
  }

  const profile = profileQuery.data;
  const submitted = profile.documents || [];
  const latestDocuments = new Map();
  for (const document of submitted) {
    if (!latestDocuments.has(document.type)) latestDocuments.set(document.type, document);
  }

  function submit(event) {
    event.preventDefault();
    if (!file) {
      toast.error('Choose a JPG, PNG, WebP or PDF file first.');
      return;
    }
    uploadMutation.mutate({ documentType: type, document: file });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Technician verification"
        subtitle="Submit the documents required for admin review."
      />

      <section className="card mt-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={VERIFICATION_STYLES[profile.verificationStatus]}>
            {titleCase(profile.verificationStatus)}
          </span>
          {profile.submittedAt && (
            <span className="text-xs text-slate-500">
              Last submitted {new Date(profile.submittedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        {profile.verificationNote && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {profile.verificationNote}
          </p>
        )}
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {DOCUMENTS.map((document) => {
            const submittedDocument = latestDocuments.get(document.value);
            return (
              <div key={document.value} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <Icon
                  name={submittedDocument ? 'badge-check' : 'file-text'}
                  className={`h-5 w-5 shrink-0 ${submittedDocument ? 'text-emerald-600' : 'text-slate-400'}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{document.label}</p>
                  <p className="truncate text-xs text-slate-500">
                    {submittedDocument?.originalName || 'Not submitted'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <form onSubmit={submit} className="card mt-4 space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">Upload or replace a document</h2>
        <Field label="Document type" htmlFor="verification-type" required>
          <select
            id="verification-type"
            className="input"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {DOCUMENTS.map((document) => (
              <option key={document.value} value={document.value}>{document.label}</option>
            ))}
          </select>
        </Field>
        <Field label="File" htmlFor="verification-file" hint="JPG, PNG, WebP or PDF, up to 10 MB." required>
          <input
            ref={fileInput}
            id="verification-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="input"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </Field>
        <button type="submit" className="btn-primary" disabled={!file || uploadMutation.isPending}>
          {uploadMutation.isPending ? <Spinner /> : <Icon name="paperclip" className="h-4 w-4" />}
          Submit document
        </button>
      </form>
    </div>
  );
}
