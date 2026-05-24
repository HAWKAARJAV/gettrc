import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { RETAIL_FEATURES, isRetailWorkspaceUnlocked } from "../routes/retailWorkspaceRoutes";
import RetailLockedWorkspacePage from "./RetailLockedWorkspacePage";
import { RETAIL_THEME } from "../../config/retailTheme";
import { createSignedDocumentUrl, DOCUMENT_BUCKET, fetchApplicableDocumentRequirements, fetchApplicationDocuments, fetchDocumentRequests, uploadDocumentForRequest, summarizeDocumentReadiness, uploadApplicationDocument } from "../../documents/documentService";
import { fetchNotifications, markNotificationRead } from "../../notifications/notificationService";
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import { getApplicationStateMeta, getApplicationTimeline } from "../../workflow/applicationWorkflow";

const C = RETAIL_THEME.colors;

function Card({ eyebrow, title, children, action }) {
  return (
    <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          {eyebrow && <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>{eyebrow}</div>}
          {title && <h2 style={{ fontSize: 24, fontWeight: 800, color: C.navy, marginBottom: 14 }}>{title}</h2>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatusPill({ children, tone = "info" }) {
  const style = {
    success: { background: C.successBg, color: C.success },
    warning: { background: C.warningBg, color: C.warning },
    error: { background: C.errorBg, color: C.error },
    info: { background: C.offWhite2, color: C.navy },
  }[tone] || { background: C.offWhite2, color: C.navy };

  return <span style={{ ...style, borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap" }}>{children}</span>;
}

function DocumentsWorkspace({ workspace, refresh }) {
  const [requirements, setRequirements] = useState([]);
  const [documents, setDocuments]       = useState([]);
  const [docRequests, setDocRequests]   = useState([]);
  const [uploading, setUploading]       = useState(""); // document_name or request-{id}
  const [message, setMessage]           = useState("");

  const answers = useMemo(() => ({
    occupation: workspace.request?.occupation,
    business_owner: String(workspace.request?.occupation || "").toLowerCase().includes("business"),
  }), [workspace.request]);

  const loadDocuments = useCallback(async () => {
    if (!workspace.application?.id) return;
    const [nextRequirements, nextDocuments, nextRequests] = await Promise.all([
      fetchApplicableDocumentRequirements({ country: workspace.application?.country || "AE", applicantType: "retail", answers }),
      fetchApplicationDocuments(workspace.application.id),
      fetchDocumentRequests(workspace.application.id),
    ]);
    setRequirements(nextRequirements);
    setDocuments(nextDocuments);
    setDocRequests(nextRequests);
  }, [answers, workspace.application]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => loadDocuments())
      .catch((error) => {
        if (!cancelled) setMessage(error.message || "Unable to load documents.");
      });
    return () => { cancelled = true; };
  }, [loadDocuments]);

  const readiness = summarizeDocumentReadiness(requirements, documents);

  // Upload a standard required document
  const handleUpload = async (requirement, file) => {
    if (!file || !workspace.application?.id) return;
    setUploading(requirement.document_name);
    setMessage("");
    try {
      await uploadApplicationDocument({
        applicationId: workspace.application.id,
        documentType: requirement.document_name,
        file,
        uploadedBy: workspace.session.user.id,
      });
      await loadDocuments();
      await refresh();
      setMessage("Document uploaded successfully — your advisor will review it shortly.");
    } catch (error) {
      setMessage(error.message || "Upload failed.");
    } finally {
      setUploading("");
    }
  };

  // Upload a document in response to an advisor request
  const handleRequestUpload = async (req, file) => {
    if (!file || !workspace.application?.id) return;
    setUploading(`request-${req.id}`);
    setMessage("");
    try {
      await uploadDocumentForRequest({
        applicationId: workspace.application.id,
        requestId: req.id,
        documentType: req.document_type,
        file,
        uploadedBy: workspace.session.user.id,
      });
      await loadDocuments();
      await refresh();
      setMessage(`"${req.document_type}" uploaded and marked as fulfilled.`);
    } catch (error) {
      setMessage(error.message || "Upload failed.");
    } finally {
      setUploading("");
    }
  };

  const openSignedUrl = async (document) => {
    const signedUrl = await createSignedDocumentUrl(DOCUMENT_BUCKET, document.file_url);
    if (signedUrl) window.open(signedUrl, "_blank", "noopener,noreferrer");
  };

  const pendingRequests = docRequests.filter(r => r.status === "pending");

  return (
    <div style={{ display: "grid", gap: 18 }}>

      {/* ── Advisor Document Requests ── */}
      {docRequests.length > 0 && (
        <Card
          eyebrow={pendingRequests.length > 0 ? `${pendingRequests.length} action required` : "Document requests"}
          title="Requested by your advisor"
          action={pendingRequests.length > 0 ? <StatusPill tone="warning">{pendingRequests.length} Pending</StatusPill> : null}
        >
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 16, maxWidth: 680 }}>
            Your advisor has requested the following documents. Please upload each one as soon as possible to avoid delays.
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            {docRequests.map((req) => {
              const isUploading = uploading === `request-${req.id}`;
              const isPending   = req.status === "pending";
              return (
                <div key={req.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "center", background: isPending ? C.warningBg || "#FFFBEB" : C.offWhite, border: `1.5px solid ${isPending ? C.warning || "#D97706" : C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>{req.document_type}</div>
                      <StatusPill tone={req.status === "fulfilled" ? "success" : req.status === "cancelled" ? "info" : "warning"}>
                        {req.status === "fulfilled" ? "Uploaded ✓" : req.status === "cancelled" ? "Cancelled" : "Upload needed"}
                      </StatusPill>
                    </div>
                    {req.description && (
                      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 4 }}>{req.description}</div>
                    )}
                    <div style={{ fontSize: 11, color: C.muted }}>Requested {new Date(req.created_at).toLocaleDateString()}</div>
                  </div>
                  {isPending && (
                    <label style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, borderRadius: RETAIL_THEME.radius.sm, padding: "10px 14px", fontSize: 13, fontWeight: 800, cursor: isUploading ? "not-allowed" : "pointer", whiteSpace: "nowrap", display: "inline-block", opacity: isUploading ? 0.7 : 1 }}>
                      {isUploading ? "Uploading…" : "Upload"}
                      <input type="file" onChange={(e) => handleRequestUpload(req, e.target.files?.[0])} style={{ display: "none" }} disabled={isUploading} />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
          {message && (
            <div style={{ marginTop: 12, color: message.includes("failed") || message.includes("Unable") ? C.error : C.success, fontSize: 13, fontWeight: 700 }}>
              {message}
            </div>
          )}
        </Card>
      )}

      {/* ── Summary stats ── */}
      <Card eyebrow="Document management" title="Secure compliance document vault">
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8, maxWidth: 760 }}>
          Requirements are loaded from the document requirement engine and filtered against your application details.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 18 }}>
          {[
            ["Required",  readiness.requiredCount],
            ["Uploaded",  readiness.uploadedCount],
            ["Approved",  readiness.approvedCount],
            ["Missing",   readiness.missingCount],
          ].map(([label, value]) => (
            <div key={label} style={{ background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.navy }}>{value}</div>
            </div>
          ))}
        </div>
        {/* Show message here too if no pending requests above */}
        {docRequests.length === 0 && message && (
          <div style={{ marginTop: 12, color: message.includes("failed") || message.includes("Unable") ? C.error : C.gold, fontSize: 13, fontWeight: 700 }}>{message}</div>
        )}
      </Card>

      {/* ── Standard required documents ── */}
      <Card eyebrow="Requirements" title="Required documents">
        <div style={{ display: "grid", gap: 12 }}>
          {requirements.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 14 }}>No active document requirements are configured for this application.</div>
          ) : requirements.map((requirement) => {
            const relatedDocuments = documents.filter((document) => document.document_type === requirement.document_name);
            const latest = relatedDocuments[0];
            const isUploading = uploading === requirement.document_name;
            return (
              <div key={requirement.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "center", background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>{requirement.document_name}</div>
                    <StatusPill tone={latest?.review_status === "approved" ? "success" : latest ? "info" : "warning"}>
                      {latest?.review_status || "pending upload"}
                    </StatusPill>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{requirement.description || requirement.category || "Compliance evidence required."}</div>
                  {latest?.reviewer_notes && (
                    <div style={{ fontSize: 12, color: C.warning, marginTop: 6, fontWeight: 700, background: C.warningBg, borderRadius: 8, padding: "5px 10px", display: "inline-block" }}>
                      💬 Advisor note: {latest.reviewer_notes}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {latest?.file_url && (
                    <button onClick={() => openSignedUrl(latest)} style={{ background: C.white, color: C.navy, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: "10px 12px", fontWeight: 800, cursor: "pointer" }}>
                      View
                    </button>
                  )}
                  <label style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, borderRadius: RETAIL_THEME.radius.sm, padding: "10px 12px", fontSize: 13, fontWeight: 800, cursor: isUploading ? "not-allowed" : "pointer", opacity: isUploading ? 0.7 : 1 }}>
                    {isUploading ? "Uploading…" : latest ? "Re-upload" : "Upload"}
                    <input type="file" onChange={(event) => handleUpload(requirement, event.target.files?.[0])} style={{ display: "none" }} disabled={isUploading} />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        {/* Show message here if there are no pending requests and it's not shown above */}
        {docRequests.length > 0 && message && (
          <div style={{ marginTop: 12, color: message.includes("failed") || message.includes("Unable") ? C.error : C.success, fontSize: 13, fontWeight: 700 }}>{message}</div>
        )}
      </Card>
    </div>
  );
}

function ApplicationsWorkspace({ workspace }) {
  const application = workspace.application;
  const timeline = getApplicationTimeline(application, workspace.applicationHistory || []);
  const currentMeta = getApplicationStateMeta(application?.workflow_state || workspace.stage);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card eyebrow="Application lifecycle" title="State-driven TRC workflow">
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8, maxWidth: 760 }}>{currentMeta.description}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 18 }}>
          {[
            ["Workflow state", currentMeta.label],
            ["Payment state", application?.payment_state || "pending"],
            ["Application type", application?.application_type || "trc_eligibility"],
            ["Assigned manager", application?.assigned_manager || "Not assigned"],
          ].map(([label, value]) => (
            <div key={label} style={{ background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.sm, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.navy, lineHeight: 1.6 }}>{value}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card eyebrow="Audit timeline" title="Status history">
        <div style={{ display: "grid", gap: 10 }}>
          {timeline.map((step) => (
            <div key={step.key} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 14, border: `1px solid ${step.isCurrent ? C.gold : C.border}`, borderRadius: RETAIL_THEME.radius.sm, background: step.reached ? C.offWhite : C.white, opacity: step.reached ? 1 : 0.58 }}>
              <div style={{ width: 30, height: 30, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: step.reached ? C.gold : C.offWhite2, color: step.reached ? C.white : C.muted, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{step.index + 1}</div>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>{step.label}</div>
                  {step.isCurrent && <StatusPill tone={step.tone}>Current</StatusPill>}
                </div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginTop: 3 }}>{step.notes || step.description}</div>
                {step.changedAt && <div style={{ fontSize: 11, color: C.gold, fontWeight: 800, marginTop: 5 }}>{new Date(step.changedAt).toLocaleString()}</div>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NotificationsWorkspace({ workspace }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const resolveNotificationPath = useCallback((notification) => {
    if (notification.action_url) return notification.action_url;
    if (!notification.application_id) return null;
    return `/retail/applications/${notification.application_id}?panel=audit`;
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!workspace.session?.user?.id) { setNotifications([]); setLoading(false); return; }
    setLoading(true);
    fetchNotifications(workspace.session.user.id)
      .then((n) => { if (!mounted) return; setNotifications(n || []); })
      .catch(() => { if (!mounted) return; setNotifications([]); })
      .finally(() => { if (!mounted) return; setLoading(false); });
    return () => { mounted = false; };
  }, [workspace.session?.user?.id]);

  return (
    <Card eyebrow="Notifications" title="Compliance messages">
      <div style={{ display: "grid", gap: 10 }}>
        {loading ? (
          <div style={{ padding: 12 }}>
            <SkeletonCard height={96} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 12 }}>
            <EmptyState
              title="No workflow notifications"
              message="You currently have no workflow updates. Any advisor or admin updates will appear here automatically."
              cta={{ label: 'Refresh', onClick: () => { fetchNotifications(workspace.session.user.id).then(setNotifications).catch(() => setNotifications([])); } }}
            />
          </div>
        ) : notifications.map((notification) => (
          <div key={notification.id} onClick={async () => {
            await markNotificationRead(notification.id);
            setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
            const path = resolveNotificationPath(notification);
            if (path) navigate(path);
          }} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && event.currentTarget.click()} style={{ textAlign: "left", background: notification.read_at ? C.white : C.offWhite, border: `1px solid ${notification.read_at ? C.border : C.gold}`, borderRadius: RETAIL_THEME.radius.sm, padding: 16, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>{notification.title}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{new Date(notification.created_at).toLocaleDateString()}</div>
            </div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{notification.body}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function RetailFeatureWorkspacePage({ feature }) {
  const { workspace, refresh } = useOutletContext();
  const navigate = useNavigate();
  const unlocked = isRetailWorkspaceUnlocked(workspace.stage);
  const config = RETAIL_FEATURES[feature];

  if (!unlocked) {
    return <RetailLockedWorkspacePage featureLabel={config.title} />;
  }

  if (feature === "documents") return <DocumentsWorkspace workspace={workspace} refresh={refresh} />;
  if (feature === "applications") return <ApplicationsWorkspace workspace={workspace} />;
  if (feature === "messages") return <NotificationsWorkspace workspace={workspace} />;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, padding: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Workspace unlocked</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: C.navy, marginBottom: 8 }}>{config.title}</h2>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8, maxWidth: 760 }}>{config.subtitle}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {config.cards.map((card) => (
          <div key={card} style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, lineHeight: 1.7 }}>{card}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, padding: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 10 }}>Next step</div>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8, marginBottom: 14 }}>This is the expanded workspace for the {config.title.toLowerCase()} stage. The premium navigation is now route-based and section-aware.</p>
        <button onClick={() => navigate("/retail/support")} style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, border: "none", borderRadius: RETAIL_THEME.radius.sm, padding: "13px 18px", fontWeight: 700, cursor: "pointer" }}>
          Contact Support
        </button>
      </div>
    </div>
  );
}
