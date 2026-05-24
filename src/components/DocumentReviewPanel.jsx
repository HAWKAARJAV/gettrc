import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchApplicationDocuments, createSignedDocumentUrl, updateDocumentReview, DOCUMENT_BUCKET } from '../documents/documentService';
import useWorkflowMutation, { emitToast } from '../hooks/useWorkflowMutation';

export default function DocumentReviewPanel({ applicationId, onClose, focusDocumentId = null }) {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const { executeMutation, isLoading: busy } = useWorkflowMutation('reviewDocument');
  const rowRefs = useRef(new Map());
  const focusedDocument = useMemo(() => documents.find((document) => String(document.id) === String(focusDocumentId)), [documents, focusDocumentId]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const docs = await fetchApplicationDocuments(applicationId);
        if (!mounted) return;
        setDocuments(docs || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (applicationId) load();
    return () => (mounted = false);
  }, [applicationId]);

  useEffect(() => {
    if (!focusDocumentId) return;
    const row = rowRefs.current.get(String(focusDocumentId));
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusDocumentId, documents]);

  async function handleAction(docId, action, reviewerNotes = '') {
    const result = await executeMutation(
      updateDocumentReview,
      { documentId: docId, reviewStatus: action, reviewerNotes },
      {
        applicationId,
        mutationLabel: action === 'approved' ? 'approveDocument' : 'rejectDocument',
        successMessage: action === 'approved' ? 'Document approved successfully' : 'Document rejected successfully',
        errorMessage: action === 'approved'
          ? 'Cannot approve document: required review context is missing.'
          : 'Cannot reject document: rejection notes are required.',
      }
    );
    if (result?.success === false) return;
    try {
      const docs = await fetchApplicationDocuments(applicationId);
      setDocuments(docs || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function openSignedUrl(path) {
    try {
      const url = await createSignedDocumentUrl(DOCUMENT_BUCKET, path, 600);
      return url;
    } catch (err) {
      console.error('signed url failed', err);
      return null;
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #E6EAF0', borderRadius: 12, padding: 16, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h4 style={{ margin: 0 }}>Documents</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ padding: 8, borderRadius: 8, border: '1px solid #E6EAF0', background: 'transparent' }}>Close</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 8 }}>
          {[1, 2, 3].map((item) => <div key={item} style={{ height: 42, borderRadius: 8, background: '#F3F4F6' }} />)}
        </div>
      ) : documents.length === 0 ? (
        <div style={{ color: '#6B7280' }}>No pending documents for review.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {documents.map((d) => (
            <div
              key={d.id}
              ref={(node) => { if (node) rowRefs.current.set(String(d.id), node); else rowRefs.current.delete(String(d.id)); }}
              style={{ display: 'flex', gap: 12, alignItems: 'center', borderRadius: 8, padding: 10, border: String(d.id) === String(focusDocumentId) ? '1px solid #C9A84C' : '1px solid #F3F4F6', background: String(d.id) === String(focusDocumentId) ? '#FFFBEB' : '#fff' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{d.document_type || d.file_url}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{d.review_status} • uploaded {d.uploaded_at ? new Date(d.uploaded_at).toLocaleString() : ''}</div>
                {d.uploaded_by && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>Uploaded by: {d.uploaded_by}</div>}
                {d.reviewer_notes && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>Reviewer notes: {d.reviewer_notes}</div>}
                {focusedDocument && String(d.id) === String(focusedDocument.id) && <div style={{ fontSize: 11, color: '#A16207', marginTop: 6, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em' }}>Target document</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={async () => {
                    const url = await openSignedUrl(d.file_url);
                    if (url) window.open(url, '_blank', 'noopener');
                  }}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #E6EAF0', background: 'transparent', cursor: 'pointer' }}
                >
                  Open
                </button>
                <button disabled={busy} onClick={async () => {
                  const notes = window.prompt('Reviewer notes (optional):', d.reviewer_notes || '');
                  await handleAction(d.id, 'approved', notes || '');
                }} style={{ padding: 8, borderRadius: 8, border: 'none', background: busy ? '#9CA3AF' : '#10B981', color: '#fff', cursor: busy ? 'not-allowed' : 'pointer' }}>{busy ? 'Working...' : 'Approve'}</button>
                <button disabled={busy} onClick={async () => {
                  const notes = window.prompt('Reason for rejection (required):', d.reviewer_notes || '');
                  if (!notes) {
                    emitToast({ type: 'error', message: 'Cannot reject document: rejection notes are required.' });
                    return;
                  }
                  await handleAction(d.id, 'rejected', notes);
                }} style={{ padding: 8, borderRadius: 8, border: 'none', background: busy ? '#9CA3AF' : '#EF4444', color: '#fff', cursor: busy ? 'not-allowed' : 'pointer' }}>{busy ? 'Working...' : 'Reject'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
