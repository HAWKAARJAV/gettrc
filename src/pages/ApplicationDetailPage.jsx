import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { fetchApplicationWithHistory } from "../workflow/applicationService";
import { subscribeToApplicationRefresh } from "../workflow/refreshApplication";
import DocumentReviewPanel from "../components/DocumentReviewPanel";
import WorkflowTimeline from "../components/WorkflowTimeline";
import OperationalTaskList from "../components/OperationalTaskList";
import ApplicationStatusStrip from "../components/ApplicationStatusStrip";
import { getApplicationCapabilities } from "../workflow/applicationCapabilities";
import { generateRequiredActions } from "../workflow/generateRequiredActions";
import { getApplicationStateMeta } from "../workflow/applicationWorkflow";
import useWorkflowMutation from "../hooks/useWorkflowMutation";

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState({ application: null, history: [] });
  const [showDocs, setShowDocs] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [advisors, setAdvisors] = useState([]);
  const { executeMutation, isLoading: mutationPending } = useWorkflowMutation("assignAdvisor");
  const timelineRef = useRef(null);
  const auditRef = useRef(null);
  const actionsRef = useRef(null);
  const [focusDocumentId, setFocusDocumentId] = useState(null);
  const app = bundle.application || {};
  const capabilities = getApplicationCapabilities(app);
  const documents = bundle?.documents || [];
  const tasks = generateRequiredActions(app, documents || []);
  const stateMeta = getApplicationStateMeta(app.workflow_state || app.review_state);
  const currentWorkflowState = app.workflow_state || app.review_state || "pending_review";

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await fetchApplicationWithHistory(id);
        if (!mounted) return;
        setBundle(data || { application: null, history: [] });
      } catch (err) {
        console.error("Failed to load application", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [id]);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribeToApplicationRefresh((detail) => {
      if (!mounted) return;
      if (detail?.status === "refreshing" || !detail?.bundle) return;
      if (String(detail.bundle?.application?.id) === String(id)) setBundle(detail.bundle);
    });
    return () => { mounted = false; unsubscribe(); };
  }, [id]);

  useEffect(() => {
    const panel = searchParams.get("panel");
    const focus = searchParams.get("focus");
    const doc = searchParams.get("doc");

    if (panel === "documents") {
      setFocusDocumentId(doc || null);
      setShowDocs(true);
      return;
    }

    setShowDocs(false);
    setFocusDocumentId(null);

    const target = panel === "audit" ? auditRef.current : panel === "actions" ? actionsRef.current : panel === "timeline" ? timelineRef.current : null;
    if (target) {
      window.requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    if (focus === "documents") {
      window.requestAnimationFrame(() => {
        actionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    async function loadAdvisors() {
      try {
        const { data, error } = await import('../supabaseClient').then(m => m.supabase.from('advisors').select('*').order('name'));
        if (error) throw error;
        if (!mounted) return;
        setAdvisors(data || []);
      } catch (e) {
        console.error('failed to load advisors', e);
      }
    }
    loadAdvisors();
    return () => (mounted = false);
  }, []);

  if (loading) return <div style={{ padding: 28 }}>Loading application…</div>;
  if (!app || !app.id) return <div style={{ padding: 28 }}>Application not found.</div>;

  const openDocuments = () => {
    setAssignOpen(false);
    setShowDocs(true);
  };

  const addReviewNote = async () => {
    const notes = window.prompt("Add an operational note:", "");
    if (!notes) return;
    const { updateWorkflowState } = await import("../workflow/workflowMutationService");
    await executeMutation(
      updateWorkflowState,
      { applicationId: app.id, newState: currentWorkflowState, notes, patch: {} },
      {
        applicationId: app.id,
        mutationLabel: "updateWorkflow",
        successMessage: "Workflow updated successfully",
        errorMessage: "Workflow update blocked: the application cannot accept a note update right now.",
      }
    );
  };

  return (
    <div style={{ padding: 28 }}>
      <style>{`
        @media (max-width: 1080px) {
          .application-detail-grid { grid-template-columns: 1fr !important; }
          .application-detail-sidebar { position: static !important; }
        }
      `}</style>
      <div style={{ marginBottom: 16 }}>
        <ApplicationStatusStrip application={app} documents={documents} tasks={tasks} />
      </div>
      <div className="application-detail-grid" style={{ display: "grid", gridTemplateColumns: "360px minmax(0, 1fr) 320px", gap: 20 }}>
        {/* Left — Summary */}
        <aside style={{ background: "#ffffff", border: "1px solid #E6EAF0", borderRadius: 12, padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>Application</h3>
          <p style={{ fontSize: 13, color: "#374151", fontWeight: 700 }}>{app.id}</p>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>Applicant</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{app.applicant_name || app.contact_name || app.contact_email || "—"}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>Country</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{app.country || app.jurisdiction || "UAE"}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>Workflow Status</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{stateMeta.label}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>Payment Status</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{app.payment_status || "unpaid"}</div>
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
            <button onClick={() => nav(-1)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #E6EAF0", background: "transparent" }}>Back</button>
            <button disabled={mutationPending} onClick={() => setAssignOpen(true)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: mutationPending ? "#9CA3AF" : "#0F2557", color: "#fff", cursor: mutationPending ? "not-allowed" : "pointer" }}>Assign</button>
          </div>
        </aside>

        {/* Center — Timeline & Activity */}
        <main>
          <section ref={timelineRef} style={{ background: "#fff", border: "1px solid #E6EAF0", borderRadius: 12, padding: 18, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Workflow Timeline</h3>
            <WorkflowTimeline
              steps={(bundle.history || []).map((h, idx, arr) => ({
                title: String(h.new_state || h.state || 'unknown').replaceAll('_', ' '),
                description: h.notes || '',
                date: h.created_at ? new Date(h.created_at).toLocaleString() : '',
                done: idx < arr.length - 1,
                active: String(h.new_state || '').includes('processing') || String(h.new_state || '').includes('in_progress'),
              }))}
            />
          </section>

          <section ref={auditRef} style={{ background: "#fff", border: "1px solid #E6EAF0", borderRadius: 12, padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>Audit Activity</h3>
            {bundle.history && bundle.history.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {bundle.history.slice().reverse().map((h) => (
                  <div key={`act-${h.id || h.created_at}`} style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>🔔</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{h.updated_by || "system"} — {h.new_state}</div>
                      <div style={{ fontSize: 13, color: "#6B7280" }}>{h.notes || ""}</div>
                      <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>{new Date(h.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#6B7280" }}>No recent activity.</div>
            )}
          </section>
        </main>

        {/* Right — Actions */}
          <aside ref={actionsRef} style={{ background: "#fff", border: "1px solid #E6EAF0", borderRadius: 12, padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>Action Required</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button disabled={mutationPending || !capabilities.canReviewDocuments} onClick={openDocuments} style={{ padding: 10, borderRadius: 8, border: "none", background: capabilities.canReviewDocuments && !mutationPending ? "#0F2557" : "#CBD5E1", color: "#fff", cursor: mutationPending || !capabilities.canReviewDocuments ? "not-allowed" : "pointer" }}>Request Documents</button>
            <button disabled={mutationPending || !capabilities.canReviewDocuments} onClick={openDocuments} style={{ padding: 10, borderRadius: 8, border: "1px solid #E6EAF0", background: capabilities.canReviewDocuments && !mutationPending ? "transparent" : "#F8FAFC", cursor: mutationPending || !capabilities.canReviewDocuments ? "not-allowed" : "pointer" }}>Mark Documents Approved</button>
            <button disabled={mutationPending || !capabilities.canAssignAdvisor} onClick={() => setAssignOpen(true)} style={{ padding: 10, borderRadius: 8, border: "1px solid #E6EAF0", background: capabilities.canAssignAdvisor && !mutationPending ? "transparent" : "#F8FAFC", cursor: mutationPending || !capabilities.canAssignAdvisor ? "not-allowed" : "pointer" }}>Escalate to Senior</button>
            <button disabled={mutationPending} onClick={addReviewNote} style={{ padding: 10, borderRadius: 8, border: "1px solid #E6EAF0", background: mutationPending ? "#F8FAFC" : "transparent", cursor: mutationPending ? "not-allowed" : "pointer" }}>Add Review Note</button>
          </div>

          <div style={{ marginTop: 18 }}>
            <h4 style={{ margin: "8px 0" }}>Documents</h4>
            <div style={{ fontSize: 13, color: "#6B7280" }}>Open the documents panel to review and approve uploads.</div>
            <div style={{ marginTop: 10 }}>
              <button onClick={() => setShowDocs(true)} style={{ padding: 10, borderRadius: 8, border: "none", background: "#C9A84C" }}>Open Documents</button>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <OperationalTaskList title="Action required" tasks={tasks} />
          </div>
        </aside>
      </div>

      {showDocs && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,26,61,0.6)', display: 'grid', placeItems: 'center', zIndex: 1200 }} onClick={() => setShowDocs(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(100%, 1100px)', maxHeight: '85vh', overflow: 'auto', padding: 18 }}>
            <DocumentReviewPanel applicationId={app.id} onClose={() => setShowDocs(false)} focusDocumentId={focusDocumentId} />
          </div>
        </div>
      )}

      {assignOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,26,61,0.6)', display: 'grid', placeItems: 'center', zIndex: 1300 }} onClick={() => setAssignOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(100%,720px)', background: '#fff', borderRadius: 12, padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>Assign Advisor</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {advisors.length === 0 ? (
                <div style={{ color: '#6B7280' }}>No advisors available.</div>
              ) : (
                advisors.map((adv) => (
                  <div key={adv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 8, border: '1px solid #F3F4F6' }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{adv.name}</div>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>{adv.country} · {adv.specialties}</div>
                    </div>
                    <div>
                      <button disabled={mutationPending} onClick={async () => {
                        if (!confirm(`Assign advisor ${adv.name} to application ${app.id}?`)) return;
                        const { assignAdvisor } = await import('../workflow/workflowMutationService');
                        const result = await executeMutation(
                          assignAdvisor,
                          { applicationId: app.id, advisorId: adv.id, notes: `Assigned via UI by admin` },
                          {
                            applicationId: app.id,
                            mutationLabel: "assignAdvisor",
                            successMessage: "Advisor assigned successfully",
                            errorMessage: "Advisor assignment failed: application is not eligible for advisor assignment.",
                          }
                        );
                        if (result?.success !== false) {
                          setAssignOpen(false);
                        }
                      }} style={{ padding: 8, borderRadius: 8, background: mutationPending ? '#9CA3AF' : '#0F2557', color: '#fff', border: 'none', cursor: mutationPending ? 'not-allowed' : 'pointer' }}>{mutationPending ? 'Assigning...' : 'Assign'}</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
