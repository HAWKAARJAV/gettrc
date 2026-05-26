// AdminDashboard.jsx — gettrc.com/admin
import { useState, useEffect, useRef } from "react";
import { SUPABASE_KEY, SUPABASE_URL, supabase } from "./supabaseClient";
import { APPLICATION_STATES, getApplicationStateMeta, mapLegacyRequestStatusToWorkflowState } from "./workflow/applicationWorkflow";
import { buildApplicationPatchFromRequest, getLegacyRequestKey, getLegacyRequestTable } from "./workflow/legacyRequestSync";
import { generateRequiredActions } from "./workflow/generateRequiredActions";
import useWorkflowMutation from "./hooks/useWorkflowMutation";
import ApplicationStatusStrip from "./components/ApplicationStatusStrip";
import EmptyState from './components/EmptyState';
import SkeletonCard from './components/SkeletonCard';

const ADMIN_EMAIL = "hawkwilds09@gmail.com";

// Always get a fresh token — uses supabase client so the JWT is auto-refreshed
// before each request (avoids expired-token 401s after 1 hour idle).
// Always try the live Supabase session first (auto-refreshes on expiry).
// Fall back to localStorage only if the client has no active session.
async function getFreshToken() {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      // Keep localStorage in sync so fallback path below stays fresh.
      localStorage.setItem("trc_token", data.session.access_token);
      return data.session.access_token;
    }
  } catch {}
  return localStorage.getItem("trc_token") || SUPABASE_KEY;
}

// Returns the admin's Supabase user ID (needed for sender_id inserts).
async function getAdminUserId() {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user?.id) return data.session.user.id;
  } catch {}
  return null;
}

async function getAuthHeaders() {
  const token = await getFreshToken();
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${token}`,
  };
}

async function dbGet(table, params = "") {
  const headers = await getAuthHeaders();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers });
  if (!res.ok) {
    console.warn(`dbGet ${table} failed`, res.status, await res.text().catch(() => ""));
    return [];
  }
  return res.json();
}

async function dbPatch(table, id, data) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers, "Prefer": "return=minimal" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.warn(`dbPatch ${table}(${id}) failed [${res.status}]:`, detail);
    throw new Error(`DB update failed (${res.status}): ${detail}`);
  }
}

function deriveWorkflowState(status) {
  return mapLegacyRequestStatusToWorkflowState(status, "pending_review");
}

async function syncApplicationForRequest(requestId, patch, applicantType) {
  const requestTable = getLegacyRequestTable(applicantType);
  const requestKey = getLegacyRequestKey(applicantType);
  const requestRows = await dbGet(requestTable, `select=*&id=eq.${requestId}&limit=1`);
  const request = requestRows?.[0];

  if (!request) {
    return null;
  }

  const applicationFilter = applicantType === "corporate"
    ? `select=*&user_id=eq.${request.company_id}&applicant_type=eq.${applicantType}&limit=1`
    : `select=*&eligibility_request_id=eq.${request.id}&applicant_type=eq.${applicantType}&limit=1`;
  const rows = await dbGet("applications", applicationFilter);
  const application = rows?.[0];

  if (!application) {
    return null;
  }

  const appPatch = buildApplicationPatchFromRequest({
    applicantType,
    requestPatch: patch,
    currentApplication: application,
    currentRequest: request,
  });

  if (!appPatch) {
    return application.id;
  }

  await dbPatch("applications", application.id, appPatch);
  return application.id;
}

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

async function getSession() {
  // Prefer the live supabase session (auto-refreshed) over raw localStorage
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      const email = data.session.user?.email || "";
      if (email.toLowerCase() === ADMIN_EMAIL) {
        // Keep localStorage in sync so dbGet fallback works
        localStorage.setItem("trc_token", data.session.access_token);
        localStorage.setItem("trc_email", email);
        return { token: data.session.access_token, email };
      }
    }
  } catch {}
  // Fallback to localStorage (e.g. on first load before supabase restores)
  const token = localStorage.getItem("trc_token");
  const email = localStorage.getItem("trc_email");
  return token && email?.toLowerCase() === ADMIN_EMAIL ? { token, email } : null;
}

const C = {
  navy:"#0F2557", navyLight:"#1A3570", navyDark:"#091A3D",
  gold:"#C9A84C", goldLight:"#E2C47A", goldDark:"#A07C2E",
  white:"#FFFFFF", offWhite:"#F7F8FC", offWhite2:"#EEF2FA",
  muted:"#6B7A99", border:"#E2E8F0",
  success:"#059669", successBg:"#ECFDF5", successBorder:"#A7F3D0",
  error:"#DC2626", errorBg:"#FEF2F2", errorBorder:"#FECACA",
  warn:"#D97706", warnBg:"#FFFBEB",
  sidebar:"#0A1F4E",
};

function StatusBadge({ status }) {
  const s = {
    new:       { bg:"#EFF6FF", color:"#1D6FB8" },
    contacted: { bg:C.warnBg,  color:C.warn    },
    submitted: { bg:C.warnBg,  color:C.warn    },
    processing:{ bg:"#F5F3FF", color:"#5B21B6" },
    approved:  { bg:C.successBg,color:C.success },
    issued:    { bg:C.successBg,color:C.success },
    closed:    { bg:C.offWhite2,color:C.muted  },
  }[status] || { bg:C.offWhite2, color:C.muted };
  return (
    <span style={{background:s.bg,color:s.color,fontSize:11,fontWeight:700,
      padding:"3px 10px",borderRadius:20,letterSpacing:".04em",whiteSpace:"nowrap"}}>
      {status}
    </span>
  );
}

function ApplicationBadge({ status }) {
  const meta = getApplicationStateMeta(status);
  const tone = {
    success: { bg: C.successBg, color: C.success },
    warning: { bg: C.warnBg, color: C.warn },
    info: { bg: "#EFF6FF", color: "#1D6FB8" },
    error: { bg: C.errorBg, color: C.error },
  }[meta.tone] || { bg: C.offWhite2, color: C.muted };

  return <span style={{ background: tone.bg, color: tone.color, fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>{String(status || "pending_review").replaceAll("_", " ")}</span>;
}

function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter email and password"); return; }
    if (email.toLowerCase() !== ADMIN_EMAIL) { setError(`Only ${ADMIN_EMAIL} can access the admin dashboard`); return; }
    setLoading(true); setError("");
    const data = await signIn(email, password);
    if (data.access_token) {
      if (data.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        }).catch(() => {});
        localStorage.setItem("trc_session", JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user,
        }));
      }
      localStorage.setItem("trc_token", data.access_token);
      localStorage.setItem("trc_email", email);
      onLogin({ email, token: data.access_token });
    } else {
      setError(data.error_description || "Invalid email or password");
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${C.navyDark},${C.navy})`,
      display:"flex",alignItems:"center",justifyContent:"center",padding:24,
      fontFamily:"'DM Sans',-apple-system,sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{background:C.white,borderRadius:20,padding:"48px 40px",width:"100%",maxWidth:420,
        boxShadow:"0 40px 80px rgba(0,0,0,0.3)"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:52,height:52,background:`linear-gradient(135deg,${C.gold},${C.goldDark})`,
            borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:24,margin:"0 auto 16px"}}>⚖</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,color:C.navy,marginBottom:6}}>
            TRC Connect Admin
          </h1>
          <p style={{fontSize:14,color:C.muted}}>Sign in to access your dashboard</p>
          <p style={{fontSize:12,color:C.muted,marginTop:8}}>Use {ADMIN_EMAIL} only</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",
              letterSpacing:".08em",display:"block",marginBottom:8}}>Email</label>
            <input value={email} type="email" onChange={e=>setEmail(e.target.value)}
              placeholder={ADMIN_EMAIL}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              style={{width:"100%",padding:"13px 16px",borderRadius:11,fontFamily:"inherit",
                border:`1.5px solid ${C.border}`,fontSize:14,color:C.navy,outline:"none"}}
              onFocus={e=>e.target.style.borderColor=C.gold}
              onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",
              letterSpacing:".08em",display:"block",marginBottom:8}}>Password</label>
            <input value={password} type="password" onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              style={{width:"100%",padding:"13px 16px",borderRadius:11,fontFamily:"inherit",
                border:`1.5px solid ${C.border}`,fontSize:14,color:C.navy,outline:"none"}}
              onFocus={e=>e.target.style.borderColor=C.gold}
              onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          {error&&<div style={{background:C.errorBg,border:`1px solid ${C.errorBorder}`,
            borderRadius:10,padding:"11px 14px",fontSize:13,color:C.error}}>⚠ {error}</div>}
          <button onClick={handleLogin} disabled={loading}
            style={{background:`linear-gradient(135deg,${C.gold},${C.goldDark})`,
              color:C.white,border:"none",borderRadius:12,padding:"14px",
              fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",
              boxShadow:"0 6px 20px rgba(201,168,76,.4)",marginTop:8}}>
            {loading?"Signing in…":"Sign In →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InquiriesTab() {
  const [inquiries, setInquiries] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);

  useEffect(()=>{
    dbGet("inquiries","order=created_at.desc").then(d=>{
      setInquiries(d||[]);
      setLoading(false);
    });
  },[]);

  const updateStatus = async (id, status) => {
    await dbPatch("inquiries", id, { status });
    setInquiries(prev=>prev.map(i=>i.id===id?{...i,status}:i));
    if(selected?.id===id) setSelected(p=>({...p,status}));
  };

  const fmt = d => new Date(d).toLocaleDateString("en-GB",{
    day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"
  });

  if(loading) return <div style={{textAlign:"center",padding:60,color:C.muted}}>Loading inquiries…</div>;

  return (
    <div style={{display:"grid",gridTemplateColumns:selected?"1fr 380px":"1fr",gap:20}}>
      <div style={{background:C.white,borderRadius:18,border:`1px solid ${C.border}`,
        overflow:"hidden",boxShadow:"0 2px 12px rgba(15,37,87,.05)"}}>
        <div style={{padding:"16px 22px",background:C.offWhite2,borderBottom:`1px solid ${C.border}`,
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:14,fontWeight:700,color:C.navy}}>All Inquiries ({inquiries.length})</span>
          <button onClick={()=>dbGet("inquiries","order=created_at.desc").then(d=>setInquiries(d||[]))}
            style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,
              padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",color:C.navy}}>
            ↻ Refresh
          </button>
        </div>
        {inquiries.length===0?(
          <div style={{ padding: 20 }}>
            <EmptyState
              title="No inquiries yet"
              message="Inquiries will appear here when visitors submit requests."
              cta={{ label: 'Refresh', onClick: () => dbGet("inquiries","order=created_at.desc").then(d=>setInquiries(d||[])) }}
            />
          </div>
        ):inquiries.map((inq,i)=>(
          <div key={inq.id} onClick={()=>setSelected(inq)}
            style={{padding:"16px 22px",borderBottom:i<inquiries.length-1?`1px solid ${C.border}`:"none",
              cursor:"pointer",background:selected?.id===inq.id?C.offWhite2:C.white,transition:"background .15s"}}
            onMouseEnter={e=>{if(selected?.id!==inq.id)e.currentTarget.style.background=C.offWhite;}}
            onMouseLeave={e=>{e.currentTarget.style.background=selected?.id===inq.id?C.offWhite2:C.white;}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
              <div style={{minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <p style={{fontSize:14,fontWeight:700,color:C.navy}}>{inq.full_name}</p>
                  <StatusBadge status={inq.status}/>
                  {inq.status==="new"&&<span style={{width:8,height:8,borderRadius:"50%",background:C.error,display:"inline-block"}}/>}
                </div>
                <p style={{fontSize:12,color:C.muted}}>{inq.email} · {inq.country}</p>
                <p style={{fontSize:12,color:C.muted,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:400}}>{inq.message}</p>
              </div>
              <span style={{fontSize:11,color:C.muted,whiteSpace:"nowrap",flexShrink:0}}>{fmt(inq.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      {selected&&(
        <div style={{background:C.white,borderRadius:18,border:`1px solid ${C.border}`,
          padding:"24px",boxShadow:"0 2px 12px rgba(15,37,87,.05)",alignSelf:"start",
          position:"sticky",top:90}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:C.navy}}>Inquiry Detail</h3>
            <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.muted}}>×</button>
          </div>
          {[["Name",selected.full_name],["Email",selected.email],["Phone",selected.phone||"—"],
            ["Country",selected.country||"—"],["Advisor",selected.advisor_name||"No preference"],
            ["Residency",selected.residency_status||"—"],["Received",fmt(selected.created_at)]
          ].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",gap:12,
              padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:13,color:C.muted}}>{l}</span>
              <span style={{fontSize:13,fontWeight:600,color:C.navy,textAlign:"right"}}>{v}</span>
            </div>
          ))}
          <div style={{marginTop:16,marginBottom:20}}>
            <p style={{fontSize:12,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:".07em",fontWeight:700}}>Message</p>
            <p style={{fontSize:13,color:C.navy,lineHeight:1.7,background:C.offWhite2,borderRadius:10,padding:"12px 14px"}}>{selected.message}</p>
          </div>
          <div style={{marginBottom:20}}>
            <p style={{fontSize:12,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:".07em",fontWeight:700}}>Update Status</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {["new","contacted","submitted","processing","approved","issued","closed"].map(s=>(
                <button key={s} onClick={()=>updateStatus(selected.id,s)}
                  style={{padding:"7px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
                    background:selected.status===s?C.navy:C.offWhite2,
                    color:selected.status===s?C.white:C.navy,
                    border:`1px solid ${selected.status===s?C.navy:C.border}`}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <a href={`mailto:${selected.email}?subject=Your TRC Connect Inquiry&body=Dear ${selected.full_name},%0D%0A%0D%0AThank you for your inquiry.`}
            style={{display:"block",background:`linear-gradient(135deg,${C.gold},${C.goldDark})`,
              color:C.white,textDecoration:"none",borderRadius:12,padding:"13px",
              fontSize:14,fontWeight:700,textAlign:"center",
              boxShadow:"0 4px 14px rgba(201,168,76,.35)"}}>
            📧 Reply by Email
          </a>
        </div>
      )}
    </div>
  );
}

function QueuesTab() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [advisorsList, setAdvisorsList] = useState([]);
  const { executeMutation, isLoading: mutationPending } = useWorkflowMutation("updateWorkflow");

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoading(true);
      // Exclude pending_review + eligible — those are still in the eligibility
      // review stage and belong in the Eligibility Requests tab, not the Queue.
      dbGet('applications', 'order=created_at.desc&limit=50&workflow_state=not.in.(pending_review,eligible)').then((d) => {
        setApps(d || []);
        setLoading(false);
      }).catch(() => { setApps([]); setLoading(false); });
    });
  }, []);

  useEffect(() => {
    dbGet('advisors', 'select=id,name,country,specialties&order=name.asc&limit=200').then((d) => setAdvisorsList(d || [])).catch(() => setAdvisorsList([]));
  }, []);

  const takeAction = async (id, newState) => {
    const { updateWorkflowState } = await import('./workflow/workflowMutationService');
    const result = await executeMutation(
      updateWorkflowState,
      { applicationId: id, newState, notes: `Updated via admin UI` },
      { applicationId: id, mutationLabel: "updateWorkflow", successMessage: "Workflow updated successfully", errorMessage: "Workflow update blocked: review payment, documents, and advisor ownership first." }
    );
    if (result?.success !== false) setApps((prev) => prev.filter((a) => a.id !== id));
  };

  const takeAssign = async (applicationId, advisorId) => {
    const { assignAdvisor } = await import('./workflow/workflowMutationService');
    const result = await executeMutation(
      assignAdvisor,
      { applicationId, advisorId, notes: 'Assigned via admin UI' },
      { applicationId, mutationLabel: "assignAdvisor", successMessage: "Advisor assigned successfully", errorMessage: "Advisor assignment failed: application is not eligible." }
    );
    if (result?.success !== false) setApps((prev) => prev.filter((a) => a.id !== applicationId));
  };

  if (loading) return <div style={{ padding: 20 }}><SkeletonCard height={120} /></div>;

  const filtered = apps.filter(a => {
    if (query) {
      const q = String(query).toLowerCase();
      if (!(String(a.id).toLowerCase().includes(q) || (a.contact_email || '').toLowerCase().includes(q) || (a.applicant_name || '').toLowerCase().includes(q))) return false;
    }
    if (stateFilter) {
      if ((a.workflow_state || a.review_state || '').toLowerCase() !== stateFilter.toLowerCase()) return false;
    }
    return true;
  });

  function exportCsv(rows) {
    const keys = ['id','user_id','applicant_name','contact_email','country','workflow_state','payment_state','created_at'];
    const header = keys.join(',') + '\n';
    const body = rows.map(r => keys.map(k => '"' + (r[k] || '') + '"').join(',')).join('\n');
    const csv = header + body;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'queues-export.csv'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Operations Queues</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="Search by id, email or name" value={query} onChange={e=>setQuery(e.target.value)} style={{ padding: 10, borderRadius: 8, border: `1px solid ${C.border}`, flex: 1 }} />
        <select value={stateFilter} onChange={e=>setStateFilter(e.target.value)} style={{ padding: 10, borderRadius: 8, border: `1px solid ${C.border}` }}>
          <option value="">All states</option>
          {APPLICATION_STATES.map(s => <option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}
        </select>
        <button onClick={() => exportCsv(filtered)} style={{ padding: 10, borderRadius: 8, border: 'none', background: '#0F2557', color: '#fff' }}>Export CSV</button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 20 }}>
          <EmptyState
            title="No pending items"
            message="There are no items in the operations queue matching your filters."
            cta={{ label: 'Refresh', onClick: () => { setLoading(true); dbGet('applications','order=created_at.desc&limit=50&workflow_state=not.in.(pending_review,eligible)').then(d=>{setApps(d||[]);setLoading(false)}).catch(()=>{setApps([]);setLoading(false)}); } }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white }}>
              <div>
                <div style={{ fontWeight: 800 }}>{a.id} — {a.applicant_name || a.contact_email || a.user_id}</div>
                <div style={{ fontSize: 13, color: C.muted }}>{a.workflow_state}</div>
                <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, marginTop: 4 }}>{(generateRequiredActions(a, []).slice(0, 1)[0]?.title) || "Operational task ready"}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select disabled={mutationPending} defaultValue="" onChange={e => { const adv = e.target.value; if (!adv) return; takeAssign(a.id, adv); }} style={{ padding: 8, borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <option value="">Assign...</option>
                  {advisorsList.map(ad => <option key={ad.id} value={ad.id}>{ad.name} — {ad.country}</option>)}
                </select>
                <button disabled={mutationPending} onClick={() => takeAction(a.id, 'rejected')} style={{ padding: 10, borderRadius: 8, background: mutationPending ? '#9CA3AF' : '#EF4444', color: '#fff', border: 'none', cursor: mutationPending ? 'not-allowed' : 'pointer' }}>{mutationPending ? 'Working...' : 'Reject'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EligibilityRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [fetchInfo, setFetchInfo] = useState({ legacyCount: 0, appsCount: 0, legacyEmails: [], appsEmails: [] });
  const [advisorsList, setAdvisorsList] = useState([]);
  const [advisorDraft, setAdvisorDraft] = useState("");
  const [assigning, setAssigning] = useState(false);
  const { executeMutation, isLoading: mutationPending } = useWorkflowMutation("updateWorkflow");

  const loadRequests = async () => {
    setLoading(true);
    // Fetch legacy eligibility requests and also recent retail applications as a fallback
    const [legacy, apps] = await Promise.all([
      dbGet(
        "eligibility_requests",
        "select=id,user_id,current_country,uae_visa,emirates_id,days_in_uae,visa_type,occupation,income_source,purpose,urgency,status,review_notes,payment_status,created_at,profiles(full_name,email,phone,nationality,role)&order=created_at.desc"
      ),
      dbGet(
        "applications",
        "select=id,user_id,country,application_type,workflow_state,review_state,payment_state,eligibility_request_id,created_at,advisor_id,advisor_assigned_at,profiles(full_name,email,phone,nationality,role)&applicant_type=eq.retail&order=created_at.desc"
      ),
    ]);

    const legacyList = legacy || [];
    const appsList = (apps || []).filter(a => a.applicant_type !== "corporate");

    setFetchInfo({
      legacyCount: legacyList.length,
      appsCount: appsList.length,
      legacyEmails: (legacyList||[]).slice(0,3).map(r=>r.profiles?.email||""),
      appsEmails: (appsList||[]).slice(0,3).map(a=>a.profiles?.email||""),
    });

    // If legacy list is empty (RLS/visibility issue), use applications as a fallback (show apps as synthetic requests)
    const useAppsAsFallback = legacyList.length === 0 && appsList.length > 0;

    // Build synthetic request records from applications when there is no corresponding legacy request
    const syntheticFromApps = appsList
      .filter(a => {
        if (useAppsAsFallback) return true; // include all retail applications when legacy fetch returned nothing
        return !a.eligibility_request_id || !legacyList.find(r => String(r.id) === String(a.eligibility_request_id));
      })
      .map(a => ({
        id: `app-${a.id}`,
        _is_synthetic_from_application: true,
        application_id: a.id,
        user_id: a.user_id,
        current_country: a.country,
        urgency: a.application_type,
        status: a.review_state || a.workflow_state || "pending_review",
        payment_status: a.payment_state || "pending",
        created_at: a.created_at,
        advisor_id: a.advisor_id || null,
        advisor_assigned_at: a.advisor_assigned_at || null,
        profiles: a.profiles || {},
      }));

    // Merge and sort by created_at desc — prefer legacy rows when present
    const merged = useAppsAsFallback
      ? [...syntheticFromApps].sort((x, y) => new Date(y.created_at) - new Date(x.created_at))
      : [...legacyList, ...syntheticFromApps].sort((x, y) => new Date(y.created_at) - new Date(x.created_at));

    setRequests(merged || []);
    setLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(() => loadRequests());
  }, []);

  useEffect(() => {
    dbGet('advisors', 'select=id,name,country,user_id&order=name.asc&limit=200').then(d => setAdvisorsList(d || [])).catch(() => {});
  }, []);

  // Reset advisor draft when selected changes
  useEffect(() => {
    // If an application is already assigned, pre-select that advisor in the draft.
    if (!advisorsList || advisorsList.length === 0) {
      setAdvisorDraft("");
      return;
    }
    if (selected?.advisor_id) {
      const match = advisorsList.find(ad => String(ad.user_id) === String(selected.advisor_id));
      setAdvisorDraft(match ? match.id : "");
    } else {
      setAdvisorDraft("");
    }
  }, [selected?.id, selected?.advisor_id, advisorsList]);

  const assignAdvisorToApplication = async () => {
    if (!advisorDraft || !selected) return;
    // resolve application id from the request
    const appId = selected._is_synthetic_from_application
      ? selected.application_id
      : (await dbGet("applications", `select=id&eligibility_request_id=eq.${selected.id}&limit=1`).then(r => (r || [])[0]?.id).catch(() => null));
    if (!appId) { alert("No linked application found. Approve eligibility first, then assign an advisor."); return; }

    // advisorDraft is advisors.id in this UI; resolve to advisors.user_id so
    // advisor workspace queries by auth user id continue to work.
    const advisorUserId = await dbGet("advisors", `select=id,user_id&id=eq.${advisorDraft}&limit=1`)
      .then((rows) => rows?.[0]?.user_id || advisorDraft)
      .catch(() => advisorDraft);

    setAssigning(true);
    const result = await executeMutation(
      async () => {
        await dbPatch("applications", appId, {
          advisor_id: advisorUserId,
          advisor_assigned_at: new Date().toISOString(),
          workflow_state: "advisor_assigned",
          review_state: "advisor_assigned",
        });
        return { success: true, applicationId: appId };
      },
      { applicationId: appId, advisorId: advisorUserId, notes: "Assigned from eligibility review panel" },
      { applicationId: appId, mutationLabel: "assignAdvisor", successMessage: "Advisor assigned successfully", errorMessage: "Advisor assignment failed. Make sure the application is in a valid state." }
    );
    setAssigning(false);
    if (result?.success !== false) {
      setAdvisorDraft("");
      try {
        await loadRequests();
      } catch (e) {
        // best-effort refresh; ignore errors
      }
    }
  };

  const updateRequest = async (id, patch) => {
    const applicationId = String(id).startsWith("app-") ? String(id).split("app-")[1] : selected?.application_id;
    const result = await executeMutation(async () => {
      if (String(id).startsWith("app-")) {
        const appId = String(id).split("app-")[1];
        const appWorkflowState = deriveWorkflowState(patch.status || patch.review_state || patch.workflow_state);
        const appPatch = {
          workflow_state: appWorkflowState,
          review_state: patch.status || patch.review_state || appWorkflowState,
          payment_state: patch.payment_status || patch.payment_state || (appWorkflowState === "payment_completed" ? "completed" : "pending"),
          completed_at: appWorkflowState === "payment_completed" || appWorkflowState === "completed" ? new Date().toISOString() : null,
        };
        await dbPatch("applications", appId, appPatch);
        return { success: true, applicationId: appId };
      }

      await dbPatch("eligibility_requests", id, patch);
      const syncedApplicationId = await syncApplicationForRequest(id, patch, "retail");
      return { success: true, applicationId: syncedApplicationId };
    }, { applicationId }, {
      applicationId,
      mutationLabel: patch.payment_status === "completed" ? "updatePayment" : "updateWorkflow",
      successMessage: patch.payment_status === "completed" ? "Payment marked complete" : "Workflow updated successfully",
      errorMessage: patch.payment_status === "completed" ? "Workflow update blocked: payment could not be marked complete." : "Workflow update blocked: review eligibility requirements before progressing.",
      refresh: Boolean(applicationId),
    });
    if (result?.success === false) return;
    setRequests((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    if (selected?.id === id) setSelected((prev) => ({ ...prev, ...patch }));
  };

  const fmt = (d) => new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const badge = (status) => ({
    pending_review: { bg: "#EFF6FF", color: "#1D6FB8" },
    eligible: { bg: C.successBg, color: C.success },
    rejected: { bg: C.errorBg, color: C.error },
    needs_more_info: { bg: C.warnBg, color: C.warn },
    payment_pending: { bg: "#F5F3FF", color: "#5B21B6" },
    payment_completed: { bg: C.successBg, color: C.success },
  }[status] || { bg: C.offWhite2, color: C.muted });

  if (loading) return <div style={{textAlign:"center",padding:60,color:C.muted}}>Loading eligibility requests…</div>;

  return (
    <div style={{display:"grid",gridTemplateColumns:selected?"1fr 390px":"1fr",gap:20}}>
      <div style={{background:C.white,borderRadius:18,border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:"0 2px 12px rgba(15,37,87,.05)"}}>
        <div style={{padding:"16px 22px",background:C.offWhite2,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:14,fontWeight:700,color:C.navy}}>Eligibility Requests ({requests.length})</span>
          <button onClick={loadRequests} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",color:C.navy}}>↻ Refresh</button>
        </div>

        {requests.length===0 ? (
          <div style={{textAlign:"center",padding:40}}>
            <div style={{fontSize:34,marginBottom:8}}>📮</div>
            <p style={{color:C.muted,fontSize:15,marginBottom:16}}>No eligibility requests found. Try refreshing or check that RLS policies are in place.</p>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={loadRequests} style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:C.offWhite2,cursor:"pointer"}}>↻ Retry</button>
            </div>
          </div>
        ) : requests.map((req, i) => {
          const s = badge(req.status);
          const profile = req.profiles || {};
          return (
            <div key={req.id} onClick={()=>setSelected(req)}
              style={{padding:"16px 22px",borderBottom:i<requests.length-1?`1px solid ${C.border}`:"none",cursor:"pointer",background:selected?.id===req.id?C.offWhite2:C.white,transition:"background .15s"}}
              onMouseEnter={e=>{if(selected?.id!==req.id)e.currentTarget.style.background=C.offWhite;}}
              onMouseLeave={e=>{e.currentTarget.style.background=selected?.id===req.id?C.offWhite2:C.white;}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <p style={{fontSize:14,fontWeight:700,color:C.navy}}>{profile.full_name || "Retail Applicant"}</p>
                    <span style={{background:s.bg,color:s.color,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{req.status}</span>
                  </div>
                  <p style={{fontSize:12,color:C.muted}}>{profile.email || "No email"} · {profile.nationality || req.current_country || "—"}</p>
                  <p style={{fontSize:12,color:C.muted,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:420}}>{req.urgency || "standard"} · {req.uae_visa || "visa"} · {req.days_in_uae || "0"} days in UAE</p>
                </div>
                <span style={{fontSize:11,color:C.muted,whiteSpace:"nowrap",flexShrink:0}}>{fmt(req.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={{background:C.white,borderRadius:18,border:`1px solid ${C.border}`,padding:"24px",boxShadow:"0 2px 12px rgba(15,37,87,.05)",alignSelf:"start",position:"sticky",top:90}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:C.navy}}>Eligibility Review</h3>
            <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.muted}}>×</button>
          </div>

          {[
            ["Name", selected.profiles?.full_name || "—"],
            ["Email", selected.profiles?.email || "—"],
            ["Nationality", selected.profiles?.nationality || "—"],
            ["Current Country", selected.current_country || "—"],
            ["UAE Visa", selected.uae_visa || "—"],
            ["Emirates ID", selected.emirates_id || "—"],
            ["Days in UAE", selected.days_in_uae ?? "—"],
            ["Visa Type", selected.visa_type || "—"],
            ["Occupation", selected.occupation || "—"],
            ["Income Source", selected.income_source || "—"],
            ["Purpose", selected.purpose || "—"],
            ["Urgency", selected.urgency || "—"],
            ["Payment Status", selected.payment_status || "pending"],
            ["Assigned Advisor", (function(){ if (!selected?.advisor_id) return "—"; const match = (advisorsList||[]).find(ad => String(ad.user_id) === String(selected.advisor_id)); return match ? match.name : selected.advisor_id; })()],
          ].map(([label, value]) => (
            <div key={label} style={{display:"flex",justifyContent:"space-between",gap:12,padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:13,color:C.muted}}>{label}</span>
              <span style={{fontSize:13,fontWeight:600,color:C.navy,textAlign:"right"}}>{value}</span>
            </div>
          ))}

          <div style={{marginTop:16,marginBottom:20}}>
            <p style={{fontSize:12,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:".07em",fontWeight:700}}>Review Notes</p>
            <p style={{fontSize:13,color:C.navy,lineHeight:1.7,background:C.offWhite2,borderRadius:10,padding:"12px 14px"}}>{selected.review_notes || "No notes yet"}</p>
          </div>

          {/* Status Action Buttons */}
          <div style={{marginBottom:18}}>
            <p style={{fontSize:12,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:".07em",fontWeight:700}}>Update Status</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {[
                ["✓ Approve Eligibility", { status:"eligible", payment_status:"pending" }, C.success, C.successBg],
                ["✗ Reject",              { status:"rejected" },                            C.error,   C.errorBg],
                ["⚠ Request More Info",   { status:"needs_more_info" },                    C.warn,    C.warnBg],
                ["💳 Mark Payment Done",  { status:"payment_completed", payment_status:"completed" }, "#5B21B6", "#F5F3FF"],
              ].map(([label, patch, color, bg]) => (
                <button key={label} disabled={mutationPending} onClick={()=>updateRequest(selected.id, patch)}
                  style={{padding:"8px 14px",borderRadius:20,fontSize:12,fontWeight:700,cursor:mutationPending?"not-allowed":"pointer",background:mutationPending?C.offWhite:bg,color:mutationPending?C.muted:color,border:`1px solid ${mutationPending?C.border:color}`,opacity:mutationPending?0.6:1}}>
                  {mutationPending?"Working…":label}
                </button>
              ))}
            </div>
          </div>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:4}}>
            <span style={{fontSize:12,color:C.muted}}>Current status:</span>
            {(() => { const s=badge(selected.status); return <span style={{background:s.bg,color:s.color,fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:20}}>{selected.status?.replace(/_/g," ")}</span>; })()}
          </div>

          {/* Assign Advisor — only unlocked after payment is approved */}
          {(() => {
            const paymentDone = selected.status==="payment_completed" || selected.payment_status==="completed";
            return (
              <div style={{marginTop:18,borderTop:`1px solid ${C.border}`,paddingTop:16}}>
                <p style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8,
                  color: paymentDone ? C.muted : "#9CA3AF"}}>
                  {paymentDone ? "Assign Advisor" : "🔒 Assign Advisor (unlock after payment approved)"}
                </p>
                {paymentDone ? (
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <select value={advisorDraft} onChange={e=>setAdvisorDraft(e.target.value)} disabled={mutationPending||assigning}
                      style={{flex:1,minWidth:160,padding:"9px 12px",borderRadius:10,border:`1.5px solid ${C.gold}`,fontSize:13,fontFamily:"inherit",outline:"none",color:C.navy,background:"#fff"}}>
                      <option value="">— Select Advisor —</option>
                      {advisorsList.map(ad=><option key={ad.id} value={ad.id}>{ad.name} ({ad.country||"UAE"})</option>)}
                    </select>
                    <button onClick={assignAdvisorToApplication} disabled={!advisorDraft||mutationPending||assigning}
                      style={{padding:"9px 16px",borderRadius:10,background:!advisorDraft||mutationPending||assigning?"#9CA3AF":`linear-gradient(135deg,${C.gold},${C.goldDark})`,color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:!advisorDraft||mutationPending||assigning?"not-allowed":"pointer"}}>
                      {assigning?"Assigning…":"Assign →"}
                    </button>
                  </div>
                ) : (
                  <div style={{background:C.offWhite,borderRadius:10,padding:"10px 14px",fontSize:13,color:"#9CA3AF",border:`1px dashed ${C.border}`}}>
                    Mark payment as done above to unlock advisor assignment.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function CorporateEligibilityRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [specialistDraft, setSpecialistDraft] = useState("");
  const { executeMutation, isLoading: mutationPending } = useWorkflowMutation("updateWorkflow");

  const loadRequests = async () => {
    setLoading(true);
    const data = await dbGet(
      "corporate_eligibility_requests",
      "select=id,company_id,entity_type,employee_count,annual_revenue,countries_of_operation,uae_presence,purpose,target_jurisdiction,urgency,tax_structure,use_case,status,review_notes,payment_status,assigned_specialist,created_at,corporate_profiles(company_name,business_email,phone,registered_country,industry,website,role)&order=created_at.desc"
    );
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(() => loadRequests());
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => setSpecialistDraft(selected?.assigned_specialist || ""));
  }, [selected?.id, selected?.assigned_specialist]);

  const updateRequest = async (id, patch) => {
    const result = await executeMutation(async () => {
      await dbPatch("corporate_eligibility_requests", id, patch);
      const syncedApplicationId = await syncApplicationForRequest(id, patch, "corporate");
      return { success: true, applicationId: syncedApplicationId };
    }, { applicationId: selected?.application_id }, {
      applicationId: selected?.application_id,
      mutationLabel: patch.assigned_specialist ? "assignAdvisor" : patch.payment_status === "completed" ? "updatePayment" : "updateWorkflow",
      successMessage: patch.assigned_specialist ? "Advisor assigned successfully" : patch.payment_status === "completed" ? "Payment marked complete" : "Workflow updated successfully",
      errorMessage: patch.assigned_specialist ? "Advisor assignment failed: application is not eligible." : "Workflow update blocked: review corporate eligibility requirements first.",
    });
    if (result?.success === false) return;
    setRequests((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    if (selected?.id === id) setSelected((prev) => ({ ...prev, ...patch }));
  };

  const fmt = (d) => new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const badge = (status) => ({
    pending_review: { bg: "#EFF6FF", color: "#1D6FB8" },
    eligible: { bg: C.successBg, color: C.success },
    rejected: { bg: C.errorBg, color: C.error },
    needs_consultation: { bg: C.warnBg, color: C.warn },
    payment_pending: { bg: "#F5F3FF", color: "#5B21B6" },
    payment_completed: { bg: C.successBg, color: C.success },
  }[status] || { bg: C.offWhite2, color: C.muted });

  if (loading) return <div style={{textAlign:"center",padding:60,color:C.muted}}>Loading corporate eligibility requests…</div>;

  return (
    <div style={{display:"grid",gridTemplateColumns:selected?"1fr 390px":"1fr",gap:20}}>
      <div style={{background:C.white,borderRadius:18,border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:"0 2px 12px rgba(15,37,87,.05)"}}>
        <div style={{padding:"16px 22px",background:C.offWhite2,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:14,fontWeight:700,color:C.navy}}>Corporate Eligibility Requests ({requests.length})</span>
          <button onClick={loadRequests} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",color:C.navy}}>↻ Refresh</button>
        </div>

        {requests.length===0 ? (
          <div style={{textAlign:"center",padding:60}}>
            <div style={{fontSize:40,marginBottom:12}}>🏢</div>
            <p style={{color:C.muted,fontSize:15}}>No corporate requests yet</p>
          </div>
        ) : requests.map((req, i) => {
          const s = badge(req.status);
          const profile = req.corporate_profiles || {};
          return (
            <div key={req.id} onClick={()=>setSelected(req)}
              style={{padding:"16px 22px",borderBottom:i<requests.length-1?`1px solid ${C.border}`:"none",cursor:"pointer",background:selected?.id===req.id?C.offWhite2:C.white,transition:"background .15s"}}
              onMouseEnter={e=>{if(selected?.id!==req.id)e.currentTarget.style.background=C.offWhite;}}
              onMouseLeave={e=>{e.currentTarget.style.background=selected?.id===req.id?C.offWhite2:C.white;}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <p style={{fontSize:14,fontWeight:700,color:C.navy}}>{profile.company_name || "Corporate Applicant"}</p>
                    <span style={{background:s.bg,color:s.color,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{req.status}</span>
                  </div>
                  <p style={{fontSize:12,color:C.muted}}>{profile.business_email || "No email"} · {profile.registered_country || req.entity_type || "—"}</p>
                  <p style={{fontSize:12,color:C.muted,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:500}}>{req.urgency || "standard"} · {req.entity_type || "entity"} · {req.countries_of_operation || "No geography listed"}</p>
                </div>
                <span style={{fontSize:11,color:C.muted,whiteSpace:"nowrap",flexShrink:0}}>{fmt(req.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={{background:C.white,borderRadius:18,border:`1px solid ${C.border}`,padding:"24px",boxShadow:"0 2px 12px rgba(15,37,87,.05)",alignSelf:"start",position:"sticky",top:90}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:C.navy}}>Corporate Review</h3>
            <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.muted}}>×</button>
          </div>

          {[
            ["Company", selected.corporate_profiles?.company_name || "—"],
            ["Business Email", selected.corporate_profiles?.business_email || "—"],
            ["Registered Country", selected.corporate_profiles?.registered_country || "—"],
            ["Industry", selected.corporate_profiles?.industry || "—"],
            ["Entity Type", selected.entity_type || "—"],
            ["Employees", selected.employee_count ?? "—"],
            ["Annual Revenue", selected.annual_revenue || "—"],
            ["Countries of Operation", selected.countries_of_operation || "—"],
            ["UAE Presence", selected.uae_presence || "—"],
            ["Purpose", selected.purpose || "—"],
            ["Target Jurisdiction", selected.target_jurisdiction || "—"],
            ["Urgency", selected.urgency || "—"],
            ["Tax Structure", selected.tax_structure || "—"],
            ["Use Case", selected.use_case || "—"],
            ["Payment Status", selected.payment_status || "pending"],
            ["Assigned Specialist", selected.assigned_specialist || "—"],
          ].map(([label, value]) => (
            <div key={label} style={{display:"flex",justifyContent:"space-between",gap:12,padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:13,color:C.muted}}>{label}</span>
              <span style={{fontSize:13,fontWeight:600,color:C.navy,textAlign:"right"}}>{value}</span>
            </div>
          ))}

          <div style={{marginTop:16,marginBottom:20}}>
            <p style={{fontSize:12,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:".07em",fontWeight:700}}>Review Notes</p>
            <p style={{fontSize:13,color:C.navy,lineHeight:1.7,background:C.offWhite2,borderRadius:10,padding:"12px 14px"}}>{selected.review_notes || "No notes yet"}</p>
          </div>

          <div style={{marginBottom:18}}>
            <p style={{fontSize:12,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:".07em",fontWeight:700}}>Actions</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {[
                ["Approve", { status: "eligible", payment_status: "pending" }],
                ["Reject", { status: "rejected" }],
                ["Request Consultation", { status: "needs_consultation" }],
                ["Mark Payment Pending", { status: "payment_pending", payment_status: "pending" }],
                ["Mark Payment Complete", { status: "payment_completed", payment_status: "completed" }],
              ].map(([label, patch]) => (
                <button key={label} disabled={mutationPending} onClick={()=>updateRequest(selected.id, patch)} style={{padding:"7px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:mutationPending?"not-allowed":"pointer",background:mutationPending?C.offWhite:C.offWhite2,color:C.navy,border:`1px solid ${C.border}`}}>{mutationPending ? "Working..." : label}</button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:18}}>
            <p style={{fontSize:12,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:".07em",fontWeight:700}}>Assign Specialist</p>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <input value={specialistDraft} onChange={(e)=>setSpecialistDraft(e.target.value)} placeholder="Compliance specialist name" style={{flex:1,minWidth:180,padding:"10px 12px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:13,color:C.navy,outline:"none"}} />
              <button disabled={mutationPending} onClick={()=>updateRequest(selected.id,{ assigned_specialist: specialistDraft })} style={{padding:"10px 14px",borderRadius:20,fontSize:12,fontWeight:700,cursor:mutationPending?"not-allowed":"pointer",background:mutationPending?C.muted:C.navy,color:C.white,border:`1px solid ${mutationPending?C.muted:C.navy}`}}>{mutationPending ? "Assigning..." : "Assign"}</button>
            </div>
          </div>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <span style={{fontSize:12,color:C.muted}}>Updated manually by admin.</span>
            {(() => {
              const current = badge(selected.status);
              return <span style={{background:current.bg,color:current.color,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{selected.status}</span>;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationsTab() {
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [managerDraft, setManagerDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const { executeMutation, isLoading: mutationPending } = useWorkflowMutation("updateWorkflow");

  const loadApplications = async () => {
    setLoading(true);
    const data = await dbGet("applications", "select=*,profiles(full_name,email,phone,role)&order=created_at.desc");
    setApplications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(() => loadApplications());
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (!selected?.id) {
        setDocuments([]);
        setHistory([]);
        return;
      }
      setManagerDraft(selected.assigned_manager || "");
      Promise.all([
        dbGet("documents", `select=*&application_id=eq.${selected.id}&order=uploaded_at.desc`),
        dbGet("application_status_history", `select=*&application_id=eq.${selected.id}&order=created_at.asc`),
      ]).then(([documentRows, historyRows]) => {
        setDocuments(documentRows || []);
        setHistory(historyRows || []);
      });
    });
  }, [selected?.id, selected?.assigned_manager]);

  const updateApplication = async (id, patch) => {
    const { updateWorkflowState } = await import('./workflow/workflowMutationService');
    let result = { success: true };
    if (patch.workflow_state) {
      result = await executeMutation(
        updateWorkflowState,
        { applicationId: id, newState: patch.workflow_state, patch, notes: notesDraft || 'Updated via admin applications view' },
        { applicationId: id, mutationLabel: "updateWorkflow", successMessage: "Workflow updated successfully", errorMessage: "Workflow update blocked: payment, documents, or advisor ownership is incomplete." }
      );
    } else {
      // For non-workflow patches, call the REST endpoint directly (non-privileged)
      await dbPatch("applications", id, patch);
    }
    if (result?.success === false) return;
    setApplications((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    if (selected?.id === id) setSelected((prev) => ({ ...prev, ...patch }));
  };

  const transitionApplication = async (state) => {
    if (!selected?.id) return;
    await updateApplication(selected.id, {
      workflow_state: state,
      review_state: state,
      assigned_manager: managerDraft || selected.assigned_manager,
      completed_at: state === "completed" ? new Date().toISOString() : selected.completed_at,
    });
    setNotesDraft("");
    const nextHistory = await dbGet("application_status_history", `select=*&application_id=eq.${selected.id}&order=created_at.asc`);
    setHistory(nextHistory || []);
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: C.muted }}>Loading applications…</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", gap: 20 }}>
      <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
        <div style={{ padding: "16px 22px", background: C.offWhite2, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>Applications ({applications.length})</span>
          <button onClick={loadApplications} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.navy }}>↻ Refresh</button>
        </div>
        {applications.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState
              title="No applications"
              message="No applications have been created yet. Use the refresh button to re-check the database."
              cta={{ label: 'Refresh applications', onClick: loadApplications }}
            />
          </div>
        ) : applications.map((application, index) => {
          const profile = application.profiles || {};
          return (
            <div key={application.id} onClick={() => setSelected(application)} style={{ padding: "16px 22px", borderBottom: index < applications.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", background: selected?.id === application.id ? C.offWhite2 : C.white }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 5 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>{profile.full_name || application.user_id}</p>
                    <ApplicationBadge status={application.workflow_state} />
                  </div>
                  <p style={{ fontSize: 12, color: C.muted }}>{profile.email || "No email"} · {application.applicant_type} · {application.country || "AE"}</p>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{application.application_type || "trc_eligibility"} · Manager: {application.assigned_manager || "unassigned"}</p>
                </div>
                <span style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>{fmt(application.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.border}`, padding: 24, boxShadow: "0 2px 12px rgba(15,37,87,.05)", alignSelf: "start", position: "sticky", top: 90 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 800, color: C.navy }}>Operations File</h3>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.muted }}>×</button>
          </div>

          {[
            ["Applicant Type", selected.applicant_type],
            ["Country", selected.country || "AE"],
            ["Payment", selected.payment_state || "pending"],
            ["Review", selected.review_state || "pending_review"],
            ["Started", fmt(selected.started_at)],
            ["Completed", fmt(selected.completed_at)],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.navy, textAlign: "right" }}>{value}</span>
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <ApplicationStatusStrip application={selected} documents={documents} tasks={generateRequiredActions(selected, documents, history)} />
          </div>

          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 800 }}>Assigned Manager</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={managerDraft} onChange={(event) => setManagerDraft(event.target.value)} placeholder="Manager name" style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.navy, outline: "none" }} />
              <button disabled={mutationPending} onClick={() => updateApplication(selected.id, { assigned_manager: managerDraft })} style={{ padding: "10px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800, cursor: mutationPending ? "not-allowed" : "pointer", background: mutationPending ? C.muted : C.navy, color: C.white, border: `1px solid ${mutationPending ? C.muted : C.navy}` }}>{mutationPending ? "Saving..." : "Save"}</button>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 800 }}>Workflow Progression</p>
            <textarea value={notesDraft} onChange={(event) => setNotesDraft(event.target.value)} placeholder="Internal transition notes" rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, color: C.navy, outline: "none", resize: "vertical", marginBottom: 10 }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {APPLICATION_STATES.map((state) => (
                <button key={state} disabled={mutationPending} onClick={() => transitionApplication(state)} style={{ padding: "7px 11px", borderRadius: 20, fontSize: 11, fontWeight: 800, cursor: mutationPending ? "not-allowed" : "pointer", background: selected.workflow_state === state ? C.navy : C.offWhite2, color: selected.workflow_state === state ? C.white : C.navy, border: `1px solid ${selected.workflow_state === state ? C.navy : C.border}` }}>
                  {mutationPending ? "Working..." : state.replaceAll("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 800 }}>Documents ({documents.length})</p>
              <div style={{ display: "grid", gap: 7 }}>
                {documents.length === 0 ? <span style={{ fontSize: 13, color: C.muted }}>No documents uploaded for this application.</span> : documents.slice(0, 4).map((document) => (
                <div key={document.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{document.document_type}</span>
                  <span style={{ fontSize: 11, color: C.gold, fontWeight: 800 }}>{document.review_status}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 800 }}>Audit History ({history.length})</p>
            <div style={{ display: "grid", gap: 7, maxHeight: 180, overflow: "auto" }}>
              {history.length === 0 ? <span style={{ fontSize: 13, color: C.muted }}>No status changes recorded for this application.</span> : history.map((entry) => (
                <div key={entry.id} style={{ background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.navy }}>{entry.previous_state || "created"} → {entry.new_state}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{fmt(entry.created_at)} · {entry.updated_by || "system"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ROLE_META = {
  admin:   { label: "Admin",   bg: "#1E1B4B", color: "#A5B4FC", icon: "🔐" },
  advisor: { label: "Advisor", bg: "#14532D", color: "#86EFAC", icon: "⚖️" },
  retail:  { label: "Retail",  bg: "#1E3A5F", color: "#93C5FD", icon: "👤" },
  client:  { label: "Client",  bg: "#1E3A5F", color: "#93C5FD", icon: "👤" },
};

function RoleBadge({ role }) {
  const m = ROLE_META[role] || { label: role || "unknown", bg: "#374151", color: "#D1D5DB", icon: "❓" };
  return (
    <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span>{m.icon}</span> {m.label}
    </span>
  );
}

function AccountsTab() {
  const [profiles, setProfiles] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      dbGet("profiles", "select=id,full_name,email,role,created_at&order=role.asc,created_at.asc"),
      dbGet("advisors", "select=id,user_id,name,country,available,verified,rating,reviews"),
    ]).then(([p, a]) => {
      setProfiles(p || []);
      setAdvisors(a || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const advisorMap = Object.fromEntries((advisors || []).map(a => [a.user_id, a]));

  const filtered = (profiles || []).filter(p => {
    const matchRole = roleFilter === "all" || p.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (p.email || "").toLowerCase().includes(q) || (p.full_name || "").toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: C.navy }}>All Accounts</h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Every registered user with their role. Advisors show extra info.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontFamily: "inherit", fontSize: 14, outline: "none", color: C.navy }} />
        {["all","admin","advisor","retail","client"].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            style={{ padding: "9px 16px", borderRadius: 999, border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: roleFilter === r ? C.navy : C.white, color: roleFilter === r ? "#fff" : C.muted,
              boxShadow: "0 1px 4px rgba(15,37,87,.08)" }}>
            {r === "all" ? "All" : (ROLE_META[r]?.icon + " " + ROLE_META[r]?.label)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Loading accounts…</div>
      ) : (
        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1fr 120px", gap: 0, padding: "10px 20px", borderBottom: `1px solid ${C.border}`, background: C.offWhite }}>
            {["Account / Email", "Name", "Role", "Joined", "Advisor Info"].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 20 }}>
              <EmptyState
                title="No accounts match"
                message="Try clearing search or role filters to view accounts."
                cta={{ label: 'Reset filters', onClick: () => { setRoleFilter('all'); setSearch(''); } }}
              />
            </div>
          ) : filtered.map(p => {
            const adv = advisorMap[p.id];
            return (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1fr 120px", gap: 0, padding: "14px 20px", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.navy }}>{p.email}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2, fontFamily: "monospace" }}>{p.id.slice(0, 8)}…</div>
                </div>
                <div style={{ fontSize: 13, color: C.navy, fontWeight: 600 }}>{p.full_name || "—"}</div>
                <div><RoleBadge role={p.role} /></div>
                <div style={{ fontSize: 12, color: C.muted }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {adv ? (
                    <div>
                      <div style={{ color: C.gold, fontWeight: 700 }}>★ {adv.rating || "—"} ({adv.reviews || 0})</div>
                      <div>{adv.country || ""} · {adv.available ? "✅ Available" : "❌ Busy"}</div>
                    </div>
                  ) : p.role === "advisor" ? (
                    <span style={{ color: "#DC2626", fontSize: 11 }}>⚠ No advisor record</span>
                  ) : "—"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 16, padding: "12px 16px", background: "#FFFBEB", borderRadius: 10, border: "1px solid #FDE68A", fontSize: 13, color: "#92400E" }}>
        <strong>Test Credentials:</strong>
        {[
          { email: "hawkwilds09@gmail.com",  role: "admin",   pw: "hawkwilds" },
          { email: "thiswhats126@gmail.com",  role: "retail",  pw: "hawkiee" },
          { email: "advisor1@gmail.com",      role: "advisor", pw: "123456" },
          { email: "advisor2@gmail.com",      role: "advisor", pw: "123456" },
        ].map(({ email, role, pw }) => (
          <div key={email} style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <RoleBadge role={role} />
            <span style={{ fontWeight: 700 }}>{email}</span>
            <span style={{ color: "#78716C" }}>pw: <code style={{ background: "#FEF3C7", padding: "1px 6px", borderRadius: 4 }}>{pw}</code></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Admin ↔ Advisor chat tab ─────────────────────────────────────────────────
function AdminAdvisorChatTab() {
  const [advisors, setAdvisors]   = useState([]);
  const [selected, setSelected]   = useState(null); // advisor user_id
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState("");
  const [loadingAdv, setLoadingAdv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [sending, setSending]     = useState(false);
  const [adminUserId, setAdminUserId] = useState(null);
  const [unreadMap, setUnreadMap] = useState({});
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  useEffect(() => {
    getAdminUserId().then(id => setAdminUserId(id));
    dbGet("advisors","select=id,user_id,name,country&order=name.asc").then(d => {
      setAdvisors(d || []);
      setLoadingAdv(false);
      // seed first selection
      if (!selected && d && d[0]) setSelected(d[0].user_id);
    });
  }, []); // eslint-disable-line

  const loadMessages = async (advisorUserId) => {
    if (!advisorUserId) return;
    const { data } = await supabase.from("admin_advisor_messages")
      .select("*").eq("advisor_id", advisorUserId).order("created_at", { ascending: true });
    setMessages(data || []);
    // mark as read
    await supabase.from("admin_advisor_messages").update({ is_read: true })
      .eq("advisor_id", advisorUserId).eq("sender_role","advisor");
    setUnreadMap(prev => ({ ...prev, [advisorUserId]: 0 }));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
  };

  const fetchUnread = async () => {
    const all = advisors.map(a => a.user_id);
    if (!all.length) return;
    const { data } = await supabase.from("admin_advisor_messages")
      .select("advisor_id").eq("is_read", false).eq("sender_role","advisor")
      .in("advisor_id", all);
    const counts = {};
    (data || []).forEach(r => { counts[r.advisor_id] = (counts[r.advisor_id] || 0) + 1; });
    setUnreadMap(counts);
  };

  useEffect(() => {
    if (!selected) return;
    setLoadingMsg(true);
    loadMessages(selected).finally(() => setLoadingMsg(false));
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => { loadMessages(selected); fetchUnread(); }, 6_000);
    return () => clearInterval(pollRef.current);
  }, [selected]); // eslint-disable-line

  useEffect(() => { if (advisors.length) fetchUnread(); }, [advisors]); // eslint-disable-line

  const handleSend = async () => {
    if (!text.trim() || !selected || !adminUserId) return;
    setSending(true);
    try {
      const { data, error } = await supabase.from("admin_advisor_messages")
        .insert({ advisor_id: selected, sender_id: adminUserId, sender_role: "admin", message: text.trim() })
        .select("*").maybeSingle();
      if (error) throw error;
      setMessages(prev => [...prev, data]);
      setText("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
    } catch(e) { console.error(e); }
    finally { setSending(false); }
  };

  const selectedAdvisor = advisors.find(a => a.user_id === selected);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", height:"calc(100vh - 140px)", background:C.white, borderRadius:18, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 2px 12px rgba(15,37,87,.05)" }}>
      {/* Advisor list */}
      <div style={{ borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflowY:"auto", background:C.offWhite2 }}>
        <div style={{ padding:"14px 16px 10px", borderBottom:`1px solid ${C.border}`, fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".08em" }}>
          Advisors
        </div>
        {loadingAdv ? (
          <div style={{ padding:20, fontSize:13, color:C.muted }}>Loading…</div>
        ) : advisors.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState
              title="No advisors found"
              message="There are no advisors in the directory. Refresh to re-check advisor records."
              cta={{ label: 'Refresh advisors', onClick: () => { setLoadingAdv(true); dbGet('advisors','select=id,user_id,name,country,available,verified,rating,reviews').then(d=>{setAdvisors(d||[]);setLoadingAdv(false)}).catch(()=>setLoadingAdv(false)); } }}
            />
          </div>
        ) : advisors.map(adv => {
          const unread = unreadMap[adv.user_id] || 0;
          const isSel = selected === adv.user_id;
          return (
            <div key={adv.user_id} onClick={() => setSelected(adv.user_id)}
              style={{ padding:"12px 16px", cursor:"pointer", background: isSel ? "#EDE9FE" : "transparent", borderLeft: isSel ? "3px solid #5B21B6" : "3px solid transparent", transition:"background .15s" }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = C.offWhite; }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:6 }}>
                <div style={{ fontWeight:700, fontSize:13, color:C.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{adv.name || adv.user_id.slice(0,8)}</div>
                {unread > 0 && <span style={{ background:"#EF4444", color:"#fff", fontSize:10, fontWeight:800, minWidth:18, height:18, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px", flexShrink:0 }}>{unread}</span>}
              </div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{adv.country || "UAE"}</div>
            </div>
          );
        })}
      </div>

      {/* Chat area */}
      {!selected ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:14 }}>Select an advisor to chat.</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column" }}>
          {/* Header */}
          <div style={{ padding:"13px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10, background:C.white }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,#5B21B6,#7C3AED)`, color:"#fff", fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {(selectedAdvisor?.name||"A").charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:C.navy }}>{selectedAdvisor?.name || "Advisor"}</div>
              <div style={{ fontSize:11, color:C.muted }}>{selectedAdvisor?.country || "UAE"}</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", background:C.offWhite }}>
            {loadingMsg ? (
              <div style={{ textAlign:"center", color:C.muted, fontSize:13, paddingTop:40 }}>Loading…</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign:"center", color:C.muted, fontSize:13, paddingTop:40 }}>No messages yet. Start the conversation.</div>
            ) : messages.map(m => {
              const isOwn = m.sender_role === "admin";
              return (
                <div key={m.id} style={{ display:"flex", justifyContent:isOwn?"flex-end":"flex-start", marginBottom:10 }}>
                  <div style={{ maxWidth:"72%", padding:"10px 14px",
                    borderRadius: isOwn?"16px 16px 4px 16px":"16px 16px 16px 4px",
                    background: isOwn?`linear-gradient(135deg,${C.navy},${C.navyLight})`:C.white,
                    color: isOwn?"#fff":C.navy, fontSize:13, lineHeight:1.55,
                    boxShadow:"0 1px 6px rgba(0,0,0,.08)", border:isOwn?"none":`1px solid ${C.border}` }}>
                    {m.message}
                    <div style={{ fontSize:10, color:isOwn?"rgba(255,255,255,.6)":C.muted, marginTop:4, textAlign:"right" }}>
                      {isOwn?"Admin":selectedAdvisor?.name} · {new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding:"10px 16px", borderTop:`1px solid ${C.border}`, display:"flex", gap:8, alignItems:"flex-end" }}>
            <textarea value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();} }}
              placeholder="Message advisor… (Enter to send)"
              rows={2}
              style={{ flex:1, padding:"10px 13px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:13, resize:"none", outline:"none", color:C.navy, fontFamily:"inherit" }} />
            <button onClick={handleSend} disabled={sending||!text.trim()}
              style={{ padding:"10px 16px", borderRadius:10, background:`linear-gradient(135deg,${C.navy},${C.navyLight})`, color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:sending||!text.trim()?"not-allowed":"pointer", opacity:sending||!text.trim()?0.5:1, flexShrink:0 }}>
              {sending?"…":"Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Advisor updates / tickets tab ────────────────────────────────────────────
function AdminAdvisorUpdatesTab() {
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [reply, setReply]           = useState("");
  const [replying, setReplying]     = useState(false);
  const [roleFilter, setRoleFilter] = useState("all"); // "all" | "advisor" | "retail"
  const pollRef = useRef(null);

  const load = async () => {
    // Use explicit relationship name to avoid ambiguous join errors from PostgREST
    const data = await dbGet("support_tickets", "select=*,profiles!support_tickets_user_id_fkey(full_name,email,role)&order=created_at.desc");
    setAllTickets(data || []);
    setLoading(false);
  };

  // Derive visible tickets based on active role filter
  const tickets = allTickets.filter(t => {
    if (roleFilter === "all") return true;
    const role = t.profiles?.role;
    if (roleFilter === "advisor") return role === "advisor" || role === null || role === undefined;
    if (roleFilter === "retail")  return role === "retail";
    return true;
  });

  useEffect(() => { load(); }, []); // eslint-disable-line

  useEffect(() => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      load();
    }, 15_000);
    return () => clearInterval(pollRef.current);
  }, []); // eslint-disable-line

  const updateStatus = async (id, status) => {
    await dbPatch("support_tickets", id, { status });
    setAllTickets(prev => prev.map(t => t.id===id ? {...t, status} : t));
    setSelected(prev => prev?.id===id ? {...prev, status} : prev);
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setReplying(true);
    try {
      await dbPatch("support_tickets", selected.id, {
        admin_reply: reply.trim(),
        admin_replied_at: new Date().toISOString(),
        status: "resolved",
      });
      const updated = { ...selected, admin_reply: reply.trim(), admin_replied_at: new Date().toISOString(), status: "resolved" };
      setTickets(prev => prev.map(t => t.id===selected.id ? updated : t));
      setSelected(updated);
      setReply("");
    } catch(e) { console.error(e); }
    finally { setReplying(false); }
  };

  const STATUS_COLORS = {
    open:        ["#FFFBEB","#D97706"],
    in_progress: ["#F5F3FF","#5B21B6"],
    resolved:    ["#ECFDF5","#059669"],
    closed:      ["#F3F4F6","#6B7280"],
  };
  const PRIORITY_COLORS = {
    low:    ["#F3F4F6","#6B7280"],
    medium: ["#FFFBEB","#D97706"],
    high:   ["#FEF2F2","#DC2626"],
  };
  const pill = (val, map) => { const [bg, color] = map[val] || ["#F3F4F6","#6B7280"]; return <span style={{ background:bg, color, fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:999, textTransform:"uppercase", letterSpacing:".04em" }}>{val||"—"}</span>; };

  if (loading) return <div style={{ textAlign:"center", padding:60, color:C.muted }}>Loading support tickets…</div>;

  return (
    <div style={{ display:"grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", gap:20 }}>
      {/* Ticket list */}
      <div style={{ background:C.white, borderRadius:18, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 2px 12px rgba(15,37,87,.05)" }}>
        <div style={{ padding:"16px 22px", background:C.offWhite2, borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
          <span style={{ fontSize:14, fontWeight:700, color:C.navy }}>Support Tickets ({tickets.length})</span>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* Role filter toggle */}
            <div style={{ display:"flex", borderRadius:8, border:`1px solid ${C.border}`, overflow:"hidden" }}>
              {[["all","All"],["advisor","Advisors"],["retail","Retail"]].map(([val,label]) => (
                <button key={val} onClick={() => setRoleFilter(val)}
                  style={{ background: roleFilter===val ? C.navy : C.white, color: roleFilter===val ? "#fff" : C.navy, border:"none", padding:"5px 12px", fontSize:12, fontWeight:700, cursor:"pointer", borderRight: val!=="retail" ? `1px solid ${C.border}` : "none" }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={load} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", color:C.navy }}>↻ Refresh</button>
          </div>
        </div>
        {tickets.length === 0 ? (
          <div style={{ textAlign:"center", padding:60 }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
            <p style={{ color:C.muted, fontSize:14 }}>No {roleFilter !== "all" ? roleFilter+" " : ""}support tickets yet.</p>
          </div>
        ) : tickets.map((t, i) => (
          <div key={t.id} onClick={() => setSelected(selected?.id===t.id ? null : t)}
            style={{ padding:"14px 22px", borderBottom: i<tickets.length-1?`1px solid ${C.border}`:"none", cursor:"pointer", background:selected?.id===t.id?C.offWhite2:C.white, transition:"background .15s" }}
            onMouseEnter={e => { if (selected?.id!==t.id) e.currentTarget.style.background = C.offWhite; }}
            onMouseLeave={e => { e.currentTarget.style.background = selected?.id===t.id ? C.offWhite2 : C.white; }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:6 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:C.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.subject}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.muted }}>
                  {t.profiles?.full_name || t.profiles?.email || "Unknown user"}
                  {t.profiles?.role === "retail" && <span style={{ background:"#EFF6FF", color:"#1D6FB8", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20, textTransform:"uppercase" }}>Retail</span>}
                  {(t.profiles?.role === "advisor" || !t.profiles?.role) && <span style={{ background:"#F0FDF4", color:"#15803D", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20, textTransform:"uppercase" }}>Advisor</span>}
                </div>
              </div>
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                {pill(t.status, STATUS_COLORS)}
                {pill(t.priority, PRIORITY_COLORS)}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {t.admin_reply && <span style={{ fontSize:11, color:"#5B21B6", fontWeight:700 }}>✓ Replied</span>}
              <span style={{ fontSize:11, color:C.muted }}>{new Date(t.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail + reply panel */}
      {selected && (
        <div style={{ background:C.white, borderRadius:18, border:`1px solid ${C.border}`, padding:24, boxShadow:"0 2px 12px rgba(15,37,87,.05)", alignSelf:"start", position:"sticky", top:90 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:C.navy }}>{selected.subject}</h3>
            <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.muted }}>×</button>
          </div>

          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            {pill(selected.status, STATUS_COLORS)}
            {pill(selected.priority, PRIORITY_COLORS)}
            <span style={{ fontSize:12, color:C.muted }}>{selected.profiles?.full_name || selected.profiles?.email}</span>
          </div>

          {/* Original message */}
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Message</div>
          <div style={{ background:C.offWhite2, borderRadius:10, padding:"12px 14px", fontSize:13, color:C.navy, lineHeight:1.7, marginBottom:16, border:`1px solid ${C.border}` }}>
            {selected.message}
          </div>

          {/* Existing admin reply */}
          {selected.admin_reply && (
            <div style={{ background:"#EDE9FE", borderRadius:10, padding:"12px 14px", fontSize:13, color:"#3B0764", lineHeight:1.7, marginBottom:16, border:"1px solid #C4B5FD" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#5B21B6", marginBottom:6 }}>Your previous reply · {selected.admin_replied_at ? new Date(selected.admin_replied_at).toLocaleString() : ""}</div>
              {selected.admin_reply}
            </div>
          )}

          {/* Status buttons */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>Set Status</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {["open","in_progress","resolved","closed"].map(s => (
                <button key={s} onClick={() => updateStatus(selected.id, s)}
                  style={{ padding:"6px 12px", borderRadius:999, fontSize:11, fontWeight:700, cursor:"pointer",
                    background: selected.status===s ? C.navy : C.offWhite2,
                    color: selected.status===s ? C.white : C.navy,
                    border: `1px solid ${selected.status===s ? C.navy : C.border}` }}>
                  {s.replace("_"," ")}
                </button>
              ))}
            </div>
          </div>

          {/* Reply textarea */}
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>
            {selected.admin_reply ? "Update Reply" : "Reply to Advisor"}
          </div>
          <textarea value={reply} onChange={e => setReply(e.target.value)} rows={4}
            placeholder="Write your reply to the advisor…"
            style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:13, resize:"vertical", outline:"none", color:C.navy, fontFamily:"inherit", boxSizing:"border-box", marginBottom:10 }} />
          <button onClick={sendReply} disabled={replying || !reply.trim()}
            style={{ width:"100%", padding:"11px", borderRadius:10, background: replying||!reply.trim() ? "#9CA3AF" : `linear-gradient(135deg,#5B21B6,#7C3AED)`, color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:replying||!reply.trim()?"not-allowed":"pointer" }}>
            {replying ? "Sending…" : "Send Reply →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Analytics tab ──────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key:"pending_review",         label:"Eligibility Review" },
  { key:"eligible",               label:"Eligible" },
  { key:"payment_pending",        label:"Payment Pending" },
  { key:"payment_completed",      label:"Payment Done" },
  { key:"documents_pending",      label:"Docs Pending" },
  { key:"documents_under_review", label:"Docs Review" },
  { key:"advisor_assigned",       label:"Advisor Assigned" },
  { key:"processing",             label:"Processing" },
  { key:"submitted_to_authority", label:"Submitted to FTA" },
  { key:"completed",              label:"Completed" },
  { key:"rejected",               label:"Rejected" },
];

function AnalyticsTab() {
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    dbGet("applications","select=id,workflow_state,created_at,completed_at,assigned_manager,applicant_type")
      .then(data=>{ setApps(data||[]); setLoading(false); });
  },[]);

  if(loading) return <div style={{padding:60,textAlign:"center",color:C.muted}}>Loading analytics…</div>;

  const total     = apps.length;
  const completed = apps.filter(a=>a.workflow_state==="completed");
  const rejected  = apps.filter(a=>a.workflow_state==="rejected");
  const active    = apps.filter(a=>!["completed","rejected"].includes(a.workflow_state));

  // Avg days: completed apps only, from created_at → completed_at
  const completedWithDates = completed.filter(a=>a.created_at && a.completed_at);
  const avgDays = completedWithDates.length>0
    ? Math.round(completedWithDates.reduce((sum,a)=>{
        const diff=(new Date(a.completed_at)-new Date(a.created_at))/(1000*60*60*24);
        return sum+diff;
      },0)/completedWithDates.length)
    : null;

  // Revenue estimate: completed × AED 2,500
  const revenueEst = completed.length * 2500;

  // Pipeline counts
  const pipelineCounts = {};
  PIPELINE_STAGES.forEach(s=>{ pipelineCounts[s.key]=0; });
  apps.forEach(a=>{ if(pipelineCounts[a.workflow_state]!==undefined) pipelineCounts[a.workflow_state]++; });
  const maxCount = Math.max(...Object.values(pipelineCounts), 1);

  // Top advisors by completed cases
  const advisorMap = {};
  completed.forEach(a=>{
    const name = a.assigned_manager || "Unassigned";
    advisorMap[name] = (advisorMap[name]||0)+1;
  });
  const topAdvisors = Object.entries(advisorMap)
    .sort((a,b)=>b[1]-a[1]).slice(0,5);

  // This month's completions
  const now = new Date();
  const thisMonthCompleted = completed.filter(a=>{
    const d=new Date(a.completed_at||a.created_at);
    return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();
  }).length;

  const statCard = (icon,label,value,sub,color=C.navy)=>(
    <div style={{background:C.white,borderRadius:16,border:`1px solid ${C.border}`,padding:"22px 24px",boxShadow:"0 2px 10px rgba(15,37,87,.05)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontSize:26}}>{icon}</span>
        <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",textAlign:"right",maxWidth:110}}>{label}</span>
      </div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:800,color,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:12,color:C.muted,marginTop:6}}>{sub}</div>}
    </div>
  );

  return (
    <div style={{display:"grid",gap:22}}>

      {/* Header */}
      <div>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:C.navy,marginBottom:4}}>Analytics & Revenue</h2>
        <p style={{color:C.muted,fontSize:13}}>Live snapshot — all time unless stated.</p>
      </div>

      {/* Stat cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16}}>
        {statCard("▦","Total Applications", total,"All time")}
        {statCard("✅","Completed",completed.length,`${total>0?Math.round(completed.length/total*100):0}% completion rate`,C.success||"#059669")}
        {statCard("⏱","Avg. Days to Complete",avgDays!=null?avgDays+"d":"—","From submission to certificate",C.navy)}
        {statCard("💰","Est. Revenue (AED)",revenueEst.toLocaleString(),`${thisMonthCompleted} completed this month`,C.gold)}
      </div>

      {/* Active vs done */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16}}>
        {statCard("🔄","Active Applications",active.length,"Currently in pipeline")}
        {statCard("❌","Rejected",rejected.length,`${total>0?Math.round(rejected.length/total*100):0}% rejection rate`,"#DC2626")}
      </div>

      {/* Pipeline funnel */}
      <div style={{background:C.white,borderRadius:18,border:`1px solid ${C.border}`,padding:"24px 28px",boxShadow:"0 2px 12px rgba(15,37,87,.05)"}}>
        <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:C.navy,marginBottom:20}}>Pipeline Breakdown</h3>
        <div style={{display:"grid",gap:10}}>
          {PIPELINE_STAGES.map(s=>{
            const count=pipelineCounts[s.key]||0;
            const pct=Math.round((count/maxCount)*100);
            const isGood=["completed"].includes(s.key);
            const isBad=["rejected"].includes(s.key);
            const barColor=isGood?"#059669":isBad?"#DC2626":C.gold;
            return (
              <div key={s.key} style={{display:"grid",gridTemplateColumns:"160px 1fr 40px",alignItems:"center",gap:12}}>
                <span style={{fontSize:12,fontWeight:600,color:C.navy,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.label}</span>
                <div style={{height:8,background:C.offWhite,borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:barColor,borderRadius:99,transition:"width .5s"}} />
                </div>
                <span style={{fontSize:13,fontWeight:700,color:C.navy,textAlign:"right"}}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top advisors */}
      {topAdvisors.length>0&&(
        <div style={{background:C.white,borderRadius:18,border:`1px solid ${C.border}`,padding:"24px 28px",boxShadow:"0 2px 12px rgba(15,37,87,.05)"}}>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:C.navy,marginBottom:18}}>Top Advisors — Completed Cases</h3>
          <div style={{display:"grid",gap:8}}>
            {topAdvisors.map(([name,count],i)=>(
              <div key={name} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 14px",background:i===0?`${C.gold}12`:C.offWhite,borderRadius:10,border:`1px solid ${i===0?C.gold:C.border}`}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:i===0?C.gold:C.offWhite2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:i===0?"#fff":C.muted,flexShrink:0}}>
                  {i+1}
                </div>
                <div style={{flex:1,fontSize:14,fontWeight:700,color:C.navy}}>{name}</div>
                <div style={{fontSize:14,fontWeight:800,color:i===0?C.gold:C.navy}}>{count} completed</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default function AdminDashboard() {
  const [user,    setUser]    = useState(null);
  const [tab,     setTab]     = useState("overview");
  const [checking,setChecking]= useState(true);
  const [stats,   setStats]   = useState({retail:0,corporate:0,applications:0,advisorUpdates:0});

  useEffect(()=>{
    getSession().then(s=>{
      if(s) setUser(s);
      setChecking(false);
    });
  },[]);

  useEffect(()=>{
    if(!user) return;
    Promise.all([
      dbGet("eligibility_requests","select=id"),
      dbGet("corporate_eligibility_requests","select=id"),
      dbGet("applications","select=id"),
      dbGet("support_tickets","select=id,status"),
    ]).then(([retail, corporate, apps, tickets])=>{
      setStats({
        retail: retail.length,
        corporate: corporate.length,
        applications: apps.length,
        advisorUpdates: (tickets||[]).filter(t=>t.status==="open").length,
      });
    });
  },[user]);

  const handleLogout = () => {
    localStorage.removeItem("trc_token");
    localStorage.removeItem("trc_email");
    setUser(null);
  };

  if(checking) return (
    <div style={{minHeight:"100vh",background:C.navyDark,display:"flex",
      alignItems:"center",justifyContent:"center",color:C.white,fontSize:16,
      fontFamily:"sans-serif"}}>Loading…</div>
  );

  if(!user) return <LoginScreen onLogin={setUser}/>;

  const NAV=[
    {key:"overview",           label:"Overview",           icon:"◉"},
    {key:"retail_eligibility", label:"Retail Eligibility", icon:"🧾"},
    {key:"corporate",          label:"Corporate",          icon:"🏢"},
    {key:"advisor_chat",       label:"Advisor Chat",       icon:"💬"},
    {key:"advisor_updates",    label:"Advisor Updates",    icon:"📋"},
    {key:"accounts",           label:"Accounts",           icon:"👥"},
    {key:"analytics",          label:"Analytics",          icon:"📊"},
  ];

  return (
    <div style={{display:"flex",minHeight:"100vh",
      fontFamily:"'DM Sans',-apple-system,sans-serif",color:C.navy,background:C.offWhite}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=DM+Sans:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>

      {/* SIDEBAR */}
      <aside style={{width:240,flexShrink:0,background:C.sidebar,display:"flex",
        flexDirection:"column",minHeight:"100vh",position:"sticky",top:0,height:"100vh"}}>
        <div style={{padding:"22px 20px 18px",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:32,height:32,background:`linear-gradient(135deg,${C.gold},${C.goldDark})`,
              borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚖</div>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,fontWeight:700,
              color:C.white}}>TRC<span style={{color:C.goldLight,fontWeight:400}}> Admin</span></span>
          </div>
          <div style={{background:"rgba(255,255,255,.06)",borderRadius:10,padding:"10px 12px"}}>
            <p style={{fontSize:12,fontWeight:600,color:C.white,marginBottom:2}}>{user.email}</p>
            <p style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>Administrator</p>
          </div>
        </div>

        <nav style={{padding:"12px 11px",flex:1}}>
          {NAV.map(item=>{
            const isA=tab===item.key;
            return (
              <button key={item.key} onClick={()=>setTab(item.key)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:11,
                  padding:"10px 12px",borderRadius:10,marginBottom:3,
                  background:isA?"rgba(201,168,76,.15)":"transparent",
                  border:isA?"1px solid rgba(201,168,76,.25)":"1px solid transparent",
                  color:isA?C.goldLight:"rgba(255,255,255,.6)",
                  fontWeight:isA?700:400,fontSize:13,cursor:"pointer",textAlign:"left",
                  transition:"all .15s"}}
                onMouseEnter={e=>{if(!isA)e.currentTarget.style.background="rgba(255,255,255,.05)";}}
                onMouseLeave={e=>{if(!isA)e.currentTarget.style.background="transparent";}}>
                <span style={{fontSize:15,flexShrink:0}}>{item.icon}</span>
                <span style={{flex:1}}>{item.label}</span>
                {item.badge>0&&<span style={{background:"#DC2626",color:C.white,fontSize:10,
                  fontWeight:800,borderRadius:"50%",width:18,height:18,
                  display:"flex",alignItems:"center",justifyContent:"center"}}>{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{padding:"12px 11px",borderTop:"1px solid rgba(255,255,255,.07)"}}>
          <button onClick={handleLogout}
            style={{width:"100%",display:"flex",alignItems:"center",gap:10,
              padding:"10px 12px",borderRadius:10,background:"transparent",
              border:"1px solid transparent",color:"rgba(255,255,255,.4)",
              fontSize:13,cursor:"pointer",textAlign:"left"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.05)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            ↩ Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <div style={{height:62,background:C.white,borderBottom:`1px solid ${C.border}`,
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"0 32px",position:"sticky",top:0,zIndex:100,
          boxShadow:"0 1px 8px rgba(15,37,87,.05)"}}>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:C.navy}}>
            {NAV.find(n=>n.key===tab)?.label || "Admin"}
          </h1>
          <a href="https://gettrc.com" target="_blank" rel="noreferrer"
            style={{fontSize:13,color:C.gold,fontWeight:600,textDecoration:"none"}}>
            ↗ View Live Site
          </a>
        </div>

        <main style={{flex:1,padding:"28px 32px"}}>
          {tab==="overview"&&(
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16}}>
                {[
                  {icon:"🧾",label:"Retail Applications",value:stats.retail,    color:C.gold,   tab:"retail_eligibility"},
                  {icon:"🏢",label:"Corporate Requests", value:stats.corporate,  color:"#5B21B6",tab:"corporate"},
                  {icon:"▦", label:"Total Applications", value:stats.applications,color:C.navy,  tab:null},
                  {icon:"📋",label:"Open Advisor Updates",value:stats.advisorUpdates,color:C.error,tab:"advisor_updates"},
                ].map(s=>(
                  <div key={s.label} onClick={()=>s.tab&&setTab(s.tab)}
                    style={{background:C.white,borderRadius:16,border:`1px solid ${C.border}`,
                      padding:"22px",boxShadow:"0 2px 10px rgba(15,37,87,.05)",
                      cursor:s.tab?"pointer":"default",transition:"border-color .15s"}}
                    onMouseEnter={e=>{if(s.tab)e.currentTarget.style.borderColor=C.gold;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                      <span style={{fontSize:24}}>{s.icon}</span>
                      <span style={{fontSize:10,fontWeight:700,color:C.muted,
                        textTransform:"uppercase",letterSpacing:".08em",textAlign:"right",maxWidth:90}}>{s.label}</span>
                    </div>
                    <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,
                      fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div style={{background:C.white,borderRadius:18,border:`1px solid ${C.border}`,
                padding:"28px",boxShadow:"0 2px 12px rgba(15,37,87,.05)"}}>
                <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,
                  color:C.navy,marginBottom:16}}>Quick Actions</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
                  {[
                    {icon:"🧾",label:"Review Retail Eligibility",tab:"retail_eligibility"},
                    {icon:"🏢",label:"Review Corporate Requests",tab:"corporate"},
                    {icon:"💬",label:"Chat with Advisors",tab:"advisor_chat"},
                    {icon:"📋",label:"Advisor Updates",tab:"advisor_updates"},
                  ].map(a=>(
                    <button key={a.tab} onClick={()=>setTab(a.tab)}
                      style={{background:C.offWhite2,border:`1px solid ${C.border}`,borderRadius:14,
                        padding:"18px",textAlign:"left",cursor:"pointer",transition:"all .2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.background=C.white;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.offWhite2;}}>
                      <div style={{fontSize:22,marginBottom:8}}>{a.icon}</div>
                      <p style={{fontSize:13,fontWeight:700,color:C.navy}}>{a.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab==="retail_eligibility"&&<EligibilityRequestsTab/>}
          {tab==="corporate"&&<CorporateEligibilityRequestsTab/>}
          {tab==="advisor_chat"&&<AdminAdvisorChatTab/>}
          {tab==="advisor_updates"&&<AdminAdvisorUpdatesTab/>}
          {tab==="accounts"&&<AccountsTab/>}
          {tab==="analytics"&&<AnalyticsTab/>}
        </main>
      </div>
    </div>
  );
}
