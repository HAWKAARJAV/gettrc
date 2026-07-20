// OnboardingPage.jsx — legacy /onboarding multi-step signup page (no live
// nav link points here, only reachable by typing the URL directly).
// Extracted from TRCConnectApp.jsx so it lazy-loads as its own chunk.
import { useState, useRef, useCallback } from "react";
import { C } from "../theme/marketingColors";

const ALL_LANGUAGES = [
  "English","Arabic","French","German","Spanish","Dutch",
  "Portuguese","Italian","Mandarin","Hindi","Tamil",
  "Urdu","Russian","Greek","Maltese","Japanese",
];

const SPECIALTIES_LIST = [
  "Individual TRC","Corporate TRC","Double Tax Treaties","OECD Compliance",
  "Golden Visa Tax","Free Zone Setup","Expatriate Tax","Non-Dom Status",
  "IP Box Regime","Digital Nomad Visa","Estate Planning","VAT Advisory",
];

const ONB_STEPS = [
  { num:1, label:"Personal Info",      icon:"👤", sub:"Your identity & firm" },
  { num:2, label:"Credentials",        icon:"🏛",  sub:"Licences & experience" },
  { num:3, label:"Services & Pricing", icon:"💰", sub:"Coverage & rates" },
  { num:4, label:"Review & Submit",    icon:"✅", sub:"Confirm your details" },
];

const REQUIRED_DOCS = [
  "Professional tax licence issued by national authority",
  "Government-issued photo ID (passport or national ID)",
  "Proof of professional indemnity insurance",
  "Firm registration certificate (if applicable)",
];

/* ─── INITIAL FORM STATE ─────────────────────────────────────────── */
const INIT = {
  // Step 1
  firstName:"", lastName:"", email:"", phone:"",
  firmName:"", firmWebsite:"", bio:"",
  // Step 2
  licenseNumber:"", licenseAuthority:"", licenseExpiry:"",
  yearsExp:"", qualifications:"", uploadedDocs:[],
  linkedinUrl:"", backgroundCheck:false,
  // Step 3
  languages:[], specialties:[],
  tiers:[
    { name:"Standard", turnaround:"5–7 business days", price:"", currency:"USD", deliverables:"Digital TRC, document review, FTA/authority submission" },
    { name:"Express",  turnaround:"2–3 business days", price:"", currency:"USD", deliverables:"Priority handling, dedicated support, same-day prep" },
    { name:"Premium",  turnaround:"Next day",          price:"", currency:"USD", deliverables:"White-glove service, physical certificate, unlimited revisions" },
  ],
  escrowAgreed:false,
  // Step 4
  termsAccepted:false, codeAccepted:false,
};

/* ─── HELPERS ─────────────────────────────────────────────────────── */

function Label({ children, required }) {
  return (
    <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
      {children}{required && <span style={{ color:C.error, marginLeft:3 }}>*</span>}
    </label>
  );
}

function FieldWrap({ label, required, error, children, hint }) {
  return (
    <div>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {hint && !error && <p style={{ fontSize:11, color:C.muted, marginTop:5 }}>{hint}</p>}
      {error && <p style={{ fontSize:11, color:C.error, marginTop:5, display:"flex", alignItems:"center", gap:4 }}>⚠ {error}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type="text", error, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value} type={type} disabled={disabled}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      style={{
        width:"100%", padding:"13px 16px", borderRadius:11, fontFamily:"inherit",
        border:`1.5px solid ${error ? C.errorBorder : focused ? C.gold : C.border}`,
        background: error ? C.errorBg : disabled ? C.offWhite2 : C.white,
        fontSize:14, color:C.navy, outline:"none",
        boxShadow: focused && !error ? `0 0 0 3px ${C.gold}22` : "none",
        transition:"all 0.2s",
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows=3, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value} rows={rows}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      style={{
        width:"100%", padding:"13px 16px", borderRadius:11, fontFamily:"inherit",
        border:`1.5px solid ${error ? C.errorBorder : focused ? C.gold : C.border}`,
        background: error ? C.errorBg : C.white,
        fontSize:14, color:C.navy, outline:"none", resize:"vertical", lineHeight:1.6,
        boxShadow: focused && !error ? `0 0 0 3px ${C.gold}22` : "none",
        transition:"all 0.2s",
      }}
    />
  );
}

function Select({ value, onChange, options, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position:"relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width:"100%", padding:"13px 42px 13px 16px", borderRadius:11, fontFamily:"inherit",
          border:`1.5px solid ${error ? C.errorBorder : focused ? C.gold : C.border}`,
          background: error ? C.errorBg : C.white,
          fontSize:14, color: value ? C.navy : C.muted + "99",
          outline:"none", appearance:"none", cursor:"pointer",
          boxShadow: focused && !error ? `0 0 0 3px ${C.gold}22` : "none",
          transition:"all 0.2s",
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5" strokeLinecap="round"
        style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  );
}

function Toggle({ checked, onChange, label, sub }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, cursor:"pointer" }} onClick={() => onChange(!checked)}>
      <div>
        <p style={{ fontSize:14, fontWeight:600, color:C.navy }}>{label}</p>
        {sub && <p style={{ fontSize:12, color:C.muted, marginTop:2 }}>{sub}</p>}
      </div>
      <div style={{ width:46, height:26, borderRadius:13, background:checked ? C.gold : C.border, position:"relative", transition:"background 0.2s", flexShrink:0 }}>
        <div style={{ position:"absolute", top:3, left:checked?23:3, width:20, height:20, borderRadius:"50%", background:C.white, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }}/>
      </div>
    </div>
  );
}

function SectionDivider({ title, icon }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, margin:"8px 0 4px" }}>
      <span style={{ fontSize:18 }}>{icon}</span>
      <span style={{ fontSize:13, fontWeight:700, color:C.navy, letterSpacing:"0.01em" }}>{title}</span>
      <div style={{ flex:1, height:1, background:C.border }}/>
    </div>
  );
}

function InfoBox({ icon="ℹ️", children, variant="info" }) {
  const s = {
    info:  { bg:C.infoBg,   border:C.infoBorder,  color:C.info   },
    warn:  { bg:C.warnBg,   border:C.warnBorder,  color:C.warn   },
    success:{ bg:C.successBg,border:C.successBorder,color:C.success },
  }[variant];
  return (
    <div style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:"13px 16px", display:"flex", gap:10, alignItems:"flex-start" }}>
      <span style={{ fontSize:15, flexShrink:0 }}>{icon}</span>
      <p style={{ fontSize:13, color:s.color, lineHeight:1.65 }}>{children}</p>
    </div>
  );
}

/* ─── TAG PILL ────────────────────────────────────────────────────── */
function TagPill({ label, selected, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        padding:"7px 14px", borderRadius:20, fontSize:13, fontWeight:600, cursor:"pointer",
        background: selected ? C.navy : C.white,
        color: selected ? C.white : C.muted,
        border:`1.5px solid ${selected ? C.navy : C.border}`,
        transition:"all 0.15s",
        boxShadow: selected ? "0 3px 10px rgba(15,37,87,0.2)" : "none",
      }}>
      {label}
    </button>
  );
}

/* ─── STEP PROGRESS ──────────────────────────────────────────────── */
function StepProgress({ current }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:0, padding:"0 8px" }}>
      {ONB_STEPS.map((step, i) => {
        const isDone   = i < current;
        const isActive = i === current;
        return (
          <div key={step.num} style={{ display:"flex", alignItems:"center", flex: i < ONB_STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, position:"relative" }}>
              {/* Circle */}
              <div style={{
                width:48, height:48, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                background: isDone ? `linear-gradient(135deg,${C.gold},${C.goldDark})` : isActive ? C.navy : C.white,
                border: isDone ? "none" : isActive ? `3px solid ${C.gold}` : `2px solid ${C.border}`,
                boxShadow: isActive ? `0 0 0 6px ${C.gold}1A, 0 6px 20px rgba(15,37,87,0.15)` : isDone ? "0 4px 14px rgba(201,168,76,0.3)" : "none",
                transition:"all 0.35s ease",
                zIndex:1,
              }}>
                {isDone
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span style={{ fontSize:18 }}>{step.icon}</span>
                }
              </div>
              {/* Label */}
              <div style={{ textAlign:"center", position:"absolute", top:56, width:110, left:"50%", transform:"translateX(-50%)" }}>
                <p style={{ fontSize:12, fontWeight: isActive||isDone ? 700 : 400, color: isActive ? C.navy : isDone ? C.gold : C.muted, whiteSpace:"nowrap" }}>{step.label}</p>
                <p style={{ fontSize:10, color:C.muted, marginTop:1, whiteSpace:"nowrap" }}>{step.sub}</p>
              </div>
            </div>

            {/* Connector */}
            {i < ONB_STEPS.length - 1 && (
              <div style={{ flex:1, height:3, margin:"0 6px", marginBottom:26, borderRadius:999, background: isDone ? `linear-gradient(90deg,${C.gold},${C.goldLight})` : C.border, transition:"background 0.5s ease" }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── STEP 1: PERSONAL INFO ──────────────────────────────────────── */

function Step1({ form, setField, errors }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <SectionDivider title="Personal Details" icon="👤"/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <FieldWrap label="First Name" required error={errors.firstName}>
          <Input value={form.firstName} onChange={v=>setField("firstName",v)} placeholder="Alexandra" error={errors.firstName}/>
        </FieldWrap>
        <FieldWrap label="Last Name" required error={errors.lastName}>
          <Input value={form.lastName} onChange={v=>setField("lastName",v)} placeholder="Chen" error={errors.lastName}/>
        </FieldWrap>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <FieldWrap label="Professional Email" required error={errors.email} hint="Used for advisor account and client notifications">
          <Input value={form.email} onChange={v=>setField("email",v)} placeholder="you@firm.com" type="email" error={errors.email}/>
        </FieldWrap>
        <FieldWrap label="Phone Number" required error={errors.phone} hint="Include country code, e.g. +971 50 …">
          <Input value={form.phone} onChange={v=>setField("phone",v)} placeholder="+971 50 123 4567" type="tel" error={errors.phone}/>
        </FieldWrap>
      </div>

      <SectionDivider title="Firm & Location" icon="🏢"/>
      <FieldWrap label="Firm / Practice Name" required error={errors.firmName}>
        <Input value={form.firmName} onChange={v=>setField("firmName",v)} placeholder="Al-Rashid Tax Advisory DMCC" error={errors.firmName}/>
      </FieldWrap>
      <FieldWrap label="Firm Website" hint="Optional — helps clients verify your practice">
        <Input value={form.firmWebsite} onChange={v=>setField("firmWebsite",v)} placeholder="https://www.yourfirm.com" type="url"/>
      </FieldWrap>
      <FieldWrap label="Professional Bio" required error={errors.bio} hint="Shown on your public advisor profile. 80–400 characters recommended.">
        <Textarea value={form.bio} onChange={v=>setField("bio",v)} rows={4} error={errors.bio}
          placeholder="Describe your background, specialisations, and what makes your TRC service exceptional. This is your pitch to potential clients…"/>
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:5 }}>
          <span style={{ fontSize:11, color: form.bio.length > 400 ? C.error : C.muted }}>{form.bio.length} / 400</span>
        </div>
      </FieldWrap>

      <InfoBox icon="🔒">
        Your email and phone are kept private. Clients contact you through our encrypted messaging system — your personal details are never exposed publicly.
      </InfoBox>
    </div>
  );
}

/* ─── STEP 2: CREDENTIALS ─────────────────────────────────────────── */
function Step2({ form, setField, errors }) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer?.files||[]);
    triggerUpload(files);
  },[]);

  const triggerUpload = files => {
    if (!files.length) return;
    setUploading(true);
    setTimeout(() => {
      const newDocs = files.map(f => ({ name:f.name, size:`${(f.size/1048576).toFixed(1)} MB`, status:"uploaded" }));
      setField("uploadedDocs", [...(form.uploadedDocs||[]), ...newDocs]);
      setUploading(false);
    }, 1200);
  };

  const removeDoc = idx => setField("uploadedDocs", form.uploadedDocs.filter((_,i)=>i!==idx));

  const YRS_OPTIONS = ["Less than 1 year","1–2 years","3–5 years","6–10 years","10–15 years","15+ years"];
  const QUAL_OPTIONS = [
    "Chartered Accountant (CA / ICAI)","Chartered Tax Adviser (CTA)","Certified Public Accountant (CPA)",
    "Association of Taxation Technicians (ATT)","ICPAC Member","Tax Practitioner Certificate",
    "Law Degree (Tax Specialisation)","Masters in Taxation","Other",
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <SectionDivider title="Professional Licence" icon="🪪"/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <FieldWrap label="Licence / Registration Number" required error={errors.licenseNumber} hint="e.g. UAE FTA Tax Agent Registration No.">
          <Input value={form.licenseNumber} onChange={v=>setField("licenseNumber",v)} placeholder="FTA-TA-2021-0892" error={errors.licenseNumber}/>
        </FieldWrap>
        <FieldWrap label="Issuing Authority" required error={errors.licenseAuthority}>
          <Input value={form.licenseAuthority} onChange={v=>setField("licenseAuthority",v)} placeholder="UAE Federal Tax Authority" error={errors.licenseAuthority}/>
        </FieldWrap>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <FieldWrap label="Licence Expiry Date" required error={errors.licenseExpiry}>
          <Input value={form.licenseExpiry} onChange={v=>setField("licenseExpiry",v)} type="date" error={errors.licenseExpiry}/>
        </FieldWrap>
        <FieldWrap label="Years of TRC Experience" required error={errors.yearsExp}>
          <Select value={form.yearsExp} onChange={v=>setField("yearsExp",v)} error={errors.yearsExp}
            placeholder="Select range…" options={YRS_OPTIONS}/>
        </FieldWrap>
      </div>
      <FieldWrap label="Highest Qualification" required error={errors.qualifications}>
        <Select value={form.qualifications} onChange={v=>setField("qualifications",v)} error={errors.qualifications}
          placeholder="Select qualification…" options={QUAL_OPTIONS}/>
      </FieldWrap>
      <FieldWrap label="LinkedIn Profile URL" hint="Helps with background verification — optional but recommended">
        <Input value={form.linkedinUrl} onChange={v=>setField("linkedinUrl",v)} placeholder="https://linkedin.com/in/yourprofile" type="url"/>
      </FieldWrap>

      <SectionDivider title="Credential Documents" icon="📎"/>

      {/* Required docs list */}
      <div style={{ background:C.offWhite2, borderRadius:14, padding:"16px 18px", border:`1px solid ${C.border}` }}>
        <p style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.07em" }}>Required Uploads</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {REQUIRED_DOCS.map((doc, i) => {
            const uploaded = (form.uploadedDocs||[]).length > i;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, background:uploaded?C.success:C.border, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {uploaded && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span style={{ fontSize:13, color: uploaded?C.success:C.navy }}>{doc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={e=>{e.preventDefault();setDragging(true)}}
        onDragLeave={e=>{e.preventDefault();setDragging(false)}}
        onDragOver={e=>e.preventDefault()}
        onDrop={handleDrop}
        onClick={()=>!uploading&&fileRef.current?.click()}
        style={{
          border:`2px dashed ${dragging?C.gold:errors.uploadedDocs?C.errorBorder:C.border}`,
          borderRadius:14, padding:"32px 24px", textAlign:"center",
          background: dragging?`${C.gold}08`:errors.uploadedDocs?C.errorBg:C.white,
          cursor:"pointer", transition:"all 0.2s",
          boxShadow: dragging?`0 0 0 4px ${C.gold}18`:"none",
        }}>
        <input ref={fileRef} type="file" multiple onChange={e=>triggerUpload(Array.from(e.target.files||[]))} style={{ display:"none" }} accept=".pdf,.jpg,.jpeg,.png"/>
        {uploading ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" style={{ animation:"spin 0.8s linear infinite" }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <p style={{ fontSize:14, fontWeight:600, color:C.gold }}>Uploading…</p>
          </div>
        ):(
          <>
            <div style={{ fontSize:36, marginBottom:10 }}>{dragging?"📂":"📤"}</div>
            <p style={{ fontSize:15, fontWeight:700, color:dragging?C.gold:C.navy, marginBottom:6 }}>
              {dragging?"Release to upload":"Drag & drop credential documents"}
            </p>
            <p style={{ fontSize:13, color:C.muted, marginBottom:10 }}>PDF, JPG, PNG · Max 20 MB per file</p>
            <span style={{ fontSize:12, fontWeight:700, color:C.gold, background:`${C.gold}14`, border:`1px solid ${C.gold}44`, borderRadius:20, padding:"5px 18px" }}>Browse Files</span>
          </>
        )}
      </div>
      {errors.uploadedDocs && <p style={{ fontSize:11, color:C.error, marginTop:-12 }}>⚠ {errors.uploadedDocs}</p>}

      {/* Uploaded list */}
      {(form.uploadedDocs||[]).length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {form.uploadedDocs.map((doc,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:C.successBg, border:`1px solid ${C.successBorder}`, borderRadius:11 }}>
              <span style={{ fontSize:20 }}>📄</span>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:C.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.name}</p>
                <p style={{ fontSize:11, color:C.muted }}>{doc.size}</p>
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:C.success, background:C.white, padding:"2px 9px", borderRadius:20, border:`1px solid ${C.successBorder}` }}>✓ Uploaded</span>
              <button onClick={()=>removeDoc(i)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:16, padding:"2px 6px" }}>×</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding:"16px 18px", background:C.offWhite, border:`1px solid ${C.border}`, borderRadius:12 }}>
        <Toggle
          checked={form.backgroundCheck}
          onChange={v=>setField("backgroundCheck",v)}
          label="I consent to a background verification check"
          sub="TRC Connect runs third-party verification on all advisor credentials before approval."
        />
      </div>

      <InfoBox icon="🔐" variant="warn">
        All uploaded documents are encrypted at rest and only accessed by our verification team. They are never shared with clients or third parties.
      </InfoBox>
    </div>
  );
}

/* ─── STEP 3: SERVICES & PRICING ─────────────────────────────────── */
function Step3({ form, setField, errors }) {
  const toggle = (key, val) => {
    const arr = form[key]||[];
    setField(key, arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val]);
  };

  const updateTier = (i, k, v) => {
    const tiers = [...form.tiers];
    tiers[i] = { ...tiers[i], [k]:v };
    setField("tiers", tiers);
  };

  const TIER_COLORS = [
    { border:C.border,  bg:C.white,   dot:C.muted,    label:"Standard" },
    { border:C.gold,    bg:`${C.gold}06`, dot:C.gold, label:"Express"  },
    { border:C.navy,    bg:`${C.navy}04`, dot:C.navy, label:"Premium"  },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <SectionDivider title="Languages" icon="🗣"/>
      <p style={{ fontSize:13, color:C.muted, marginTop:-12 }}>Languages in which you can communicate with and advise clients.</p>
      {errors.languages && <p style={{ fontSize:11, color:C.error }}>⚠ {errors.languages}</p>}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {ALL_LANGUAGES.map(l=>(
          <TagPill key={l} label={l}
            selected={(form.languages||[]).includes(l)}
            onClick={()=>toggle("languages",l)}/>
        ))}
      </div>

      <SectionDivider title="Specialties" icon="⚡"/>
      <p style={{ fontSize:13, color:C.muted, marginTop:-12 }}>Select all service areas relevant to your practice.</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {SPECIALTIES_LIST.map(s=>(
          <TagPill key={s} label={s}
            selected={(form.specialties||[]).includes(s)}
            onClick={()=>toggle("specialties",s)}/>
        ))}
      </div>

      <SectionDivider title="Pricing Tiers" icon="💰"/>
      <p style={{ fontSize:13, color:C.muted, marginTop:-12 }}>Define your service packages. Clients see these when browsing your profile. You can update them anytime.</p>
      {errors.tiers && <p style={{ fontSize:11, color:C.error }}>⚠ {errors.tiers}</p>}

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {form.tiers.map((tier, i) => {
          const tc = TIER_COLORS[i];
          const isGold = i===1;
          return (
            <div key={tier.name} style={{
              border:`2px solid ${tc.border}`,
              borderRadius:16, padding:"22px 24px",
              background: tc.bg,
              boxShadow: i===1?"0 6px 20px rgba(201,168,76,0.12)":i===2?"0 6px 20px rgba(15,37,87,0.08)":"none",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:tc.dot }}/>
                <span style={{ fontSize:15, fontWeight:800, color:C.navy, fontFamily:"'Cormorant Garamond',serif" }}>{tier.name}</span>
                {i===1 && <span style={{ fontSize:10, fontWeight:800, background:`${C.gold}22`, color:C.goldDark, padding:"2px 9px", borderRadius:20, letterSpacing:"0.06em" }}>MOST POPULAR</span>}
                {i===2 && <span style={{ fontSize:10, fontWeight:800, background:`${C.navy}11`, color:C.navy, padding:"2px 9px", borderRadius:20, letterSpacing:"0.06em" }}>WHITE GLOVE</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                <FieldWrap label="Price (USD)" required error={i===0&&errors.tier0||i===1&&errors.tier1||i===2&&errors.tier2}>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:14, color:C.muted, fontWeight:600 }}>$</span>
                    <input
                      value={tier.price}
                      onChange={e=>updateTier(i,"price",e.target.value)}
                      type="number" min="0" placeholder="0"
                      style={{ width:"100%", padding:"12px 14px 12px 28px", borderRadius:10, fontFamily:"inherit", border:`1.5px solid ${C.border}`, fontSize:14, color:C.navy, outline:"none" }}
                    />
                  </div>
                </FieldWrap>
                <FieldWrap label="Turnaround Time">
                  <Input value={tier.turnaround} onChange={v=>updateTier(i,"turnaround",v)} placeholder="e.g. 5–7 business days"/>
                </FieldWrap>
              </div>
              <FieldWrap label="What's Included">
                <Input value={tier.deliverables} onChange={v=>updateTier(i,"deliverables",v)} placeholder="List key deliverables…"/>
              </FieldWrap>
            </div>
          );
        })}
      </div>

      <div style={{ padding:"16px 18px", background:C.offWhite, border:`1px solid ${C.border}`, borderRadius:12 }}>
        <Toggle
          checked={form.escrowAgreed}
          onChange={v=>setField("escrowAgreed",v)}
          label="I agree to the TRC Connect Escrow Payment Policy"
          sub="Client fees are held in escrow and released only upon successful TRC delivery. Refunds are issued if the application is rejected due to advisor error."
        />
      </div>
      {errors.escrowAgreed && <p style={{ fontSize:11, color:C.error, marginTop:-12 }}>⚠ {errors.escrowAgreed}</p>}

      <InfoBox icon="💡">
        <strong>Pricing tip:</strong> Most top-rated UAE advisors price Standard at $250–$400, Express at $350–$550, and Premium at $500+. Competitive pricing combined with strong reviews drives significantly more bookings.
      </InfoBox>
    </div>
  );
}

/* ─── STEP 4: REVIEW ──────────────────────────────────────────────── */
function Step4({ form, setField, errors, onEdit }) {
  const ReviewBlock = ({ title, icon, step, children }) => (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden", boxShadow:"0 2px 10px rgba(15,37,87,0.04)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px", background:C.offWhite2, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <span style={{ fontSize:14, fontWeight:700, color:C.navy }}>{title}</span>
        </div>
        <button onClick={()=>onEdit(step)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:700, color:C.gold, display:"flex", alignItems:"center", gap:4 }}>
          ✎ Edit
        </button>
      </div>
      <div style={{ padding:"18px 22px" }}>{children}</div>
    </div>
  );

  const Row = ({ label, value }) => value ? (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:20, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:13, color:C.muted, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:600, color:C.navy, textAlign:"right" }}>{value}</span>
    </div>
  ) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <InfoBox icon="👁" variant="info">
        Please review all details carefully before submitting. Our team will verify your credentials within <strong>2–3 business days</strong> and send you an activation email.
      </InfoBox>

      {/* Personal */}
      <ReviewBlock title="Personal Information" icon="👤" step={0}>
        <Row label="Full Name"    value={`${form.firstName} ${form.lastName}`}/>
        <Row label="Email"        value={form.email}/>
        <Row label="Phone"        value={form.phone}/>
        <Row label="Firm"         value={form.firmName}/>
        {form.firmWebsite && <Row label="Website" value={form.firmWebsite}/>}
        {form.bio && (
          <div style={{ paddingTop:10 }}>
            <p style={{ fontSize:12, color:C.muted, marginBottom:6 }}>Bio</p>
            <p style={{ fontSize:13, color:C.navy, lineHeight:1.65 }}>{form.bio}</p>
          </div>
        )}
      </ReviewBlock>

      {/* Credentials */}
      <ReviewBlock title="Credentials" icon="🏛" step={1}>
        <Row label="Licence Number"  value={form.licenseNumber}/>
        <Row label="Issuing Body"    value={form.licenseAuthority}/>
        <Row label="Expires"         value={form.licenseExpiry}/>
        <Row label="Experience"      value={form.yearsExp}/>
        <Row label="Qualification"   value={form.qualifications}/>
        {form.linkedinUrl && <Row label="LinkedIn" value={form.linkedinUrl}/>}
        <Row label="Documents"       value={`${(form.uploadedDocs||[]).length} file(s) uploaded`}/>
        <Row label="BG Check Consent" value={form.backgroundCheck ? "✓ Agreed" : "✗ Not agreed"}/>
      </ReviewBlock>

      {/* Services */}
      <ReviewBlock title="Services & Pricing" icon="💰" step={2}>
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:12, color:C.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:700 }}>Languages</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {(form.languages||[]).map(l=><span key={l} style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20, background:C.offWhite2, color:C.navy, border:`1px solid ${C.border}` }}>{l}</span>)}
          </div>
        </div>
        {(form.specialties||[]).length > 0 && (
          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:12, color:C.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:700 }}>Specialties</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {form.specialties.map(s=><span key={s} style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20, background:C.infoBg, color:C.info, border:`1px solid ${C.infoBorder}` }}>{s}</span>)}
            </div>
          </div>
        )}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
          <p style={{ fontSize:12, color:C.muted, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:700 }}>Pricing Tiers</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {form.tiers.map((t,i)=>(
              <div key={i} style={{ background:C.offWhite2, borderRadius:12, padding:"12px 14px", border:`1px solid ${C.border}` }}>
                <p style={{ fontSize:11, fontWeight:800, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>{t.name}</p>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:800, color:C.gold }}>{t.price ? `$${t.price}` : "—"}</p>
                <p style={{ fontSize:11, color:C.muted, marginTop:3 }}>{t.turnaround}</p>
              </div>
            ))}
          </div>
        </div>
      </ReviewBlock>

      {/* Agreements */}
      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 22px", display:"flex", flexDirection:"column", gap:16, boxShadow:"0 2px 10px rgba(15,37,87,0.04)" }}>
        <p style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:4 }}>📋 Agreements & Policies</p>

        {[
          {
            key:"termsAccepted",
            label:"I accept the TRC Connect Advisor Terms of Service",
            sub:"Including platform fees (15% per transaction), client conduct policy, and dispute resolution process.",
            err: errors.termsAccepted,
          },
          {
            key:"codeAccepted",
            label:"I agree to uphold the TRC Connect Advisor Code of Conduct",
            sub:"Commitment to accurate advice, timely delivery, transparent pricing, and professional standards.",
            err: errors.codeAccepted,
          },
        ].map(({ key, label, sub, err }) => (
          <div key={key}>
            <div
              onClick={() => setField(key, !form[key])}
              style={{ display:"flex", alignItems:"flex-start", gap:13, cursor:"pointer", padding:"14px", borderRadius:12, background: err ? C.errorBg : C.offWhite2, border:`1px solid ${err?C.errorBorder:C.border}`, transition:"all 0.15s" }}
            >
              <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, marginTop:1,
                border:`2px solid ${form[key]?C.gold:C.border}`, background:form[key]?C.gold:C.white,
                display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
                {form[key] && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:C.navy }}>{label}</p>
                <p style={{ fontSize:12, color:C.muted, marginTop:3, lineHeight:1.5 }}>{sub}</p>
              </div>
            </div>
            {err && <p style={{ fontSize:11, color:C.error, marginTop:5 }}>⚠ {err}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SUCCESS SCREEN ─────────────────────────────────────────────── */

function SuccessScreen({ form }) {
  const ref = `ADV-${Date.now().toString(36).toUpperCase().slice(-7)}`;
  return (
    <div style={{ textAlign:"center", padding:"60px 24px 40px", maxWidth:580, margin:"0 auto" }}>
      <div style={{ width:80, height:80, borderRadius:"50%", background:`linear-gradient(135deg,${C.gold},${C.goldDark})`, margin:"0 auto 28px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, boxShadow:"0 12px 36px rgba(201,168,76,0.35)", animation:"scaleIn 0.5s ease" }}>✓</div>

      <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:700, color:C.navy, lineHeight:1.1, marginBottom:14 }}>
        Application Submitted!
      </h2>
      <p style={{ fontSize:16, color:C.muted, lineHeight:1.7, marginBottom:28, maxWidth:460, margin:"0 auto 28px" }}>
        Welcome to TRC Connect, <strong style={{ color:C.navy }}>{form.firstName}</strong>. Your advisor profile is now under review. We'll send a confirmation to <strong style={{ color:C.navy }}>{form.email}</strong> within 24 hours.
      </p>

      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:18, padding:"24px 28px", marginBottom:28, boxShadow:"0 4px 20px rgba(15,37,87,0.07)", textAlign:"left" }}>
        <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:16 }}>Application Summary</p>
        {[
          { l:"Reference",       v:ref },
          { l:"Name",            v:`${form.firstName} ${form.lastName}` },
          { l:"Jurisdiction",    v:"🇦🇪 UAE" },
          { l:"Firm",            v:form.firmName },
          { l:"Documents",       v:`${(form.uploadedDocs||[]).length} uploaded` },
          { l:"Review Timeline", v:"2–3 business days" },
          { l:"Status",          v:"⏳ Pending Verification" },
        ].map(r=>(
          <div key={r.l} style={{ display:"flex", justifyContent:"space-between", gap:20, padding:"9px 0", borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontSize:13, color:C.muted }}>{r.l}</span>
            <span style={{ fontSize:13, fontWeight:600, color:C.navy, textAlign:"right" }}>{r.v}</span>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
        <button style={{ background:`linear-gradient(135deg,${C.gold},${C.goldDark})`, color:C.white, border:"none", borderRadius:12, padding:"14px 28px", fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 20px rgba(201,168,76,0.35)" }}>
          Go to Advisor Dashboard →
        </button>
        <button style={{ background:"transparent", color:C.navy, border:`1.5px solid ${C.border}`, borderRadius:12, padding:"14px 24px", fontSize:15, fontWeight:600, cursor:"pointer" }}>
          Return to Homepage
        </button>
      </div>

      <p style={{ fontSize:12, color:C.muted, marginTop:24, lineHeight:1.65 }}>
        Questions? Email <a href="mailto:advisors@trcconnect.com" style={{ color:C.gold, fontWeight:700 }}>advisors@trcconnect.com</a> with your reference number <strong style={{ fontFamily:"monospace" }}>{ref}</strong>.
      </p>
    </div>
  );
}

/* ─── VALIDATION ─────────────────────────────────────────────────── */

function validate(step, form) {
  const e = {};
  if (step === 0) {
    if (!form.firstName.trim())    e.firstName    = "First name is required";
    if (!form.lastName.trim())     e.lastName     = "Last name is required";
    if (!form.email.includes("@")) e.email        = "Valid email address required";
    if (!form.phone.trim())        e.phone        = "Phone number is required";
    if (!form.firmName.trim())     e.firmName     = "Firm name is required";
    if (!form.bio.trim())          e.bio          = "A professional bio is required";
    if (form.bio.length > 400)     e.bio          = "Bio must be under 400 characters";
  }
  if (step === 1) {
    if (!form.licenseNumber.trim())   e.licenseNumber   = "Licence number is required";
    if (!form.licenseAuthority.trim())e.licenseAuthority= "Issuing authority is required";
    if (!form.licenseExpiry)          e.licenseExpiry   = "Expiry date is required";
    if (!form.yearsExp)               e.yearsExp        = "Select years of experience";
    if (!form.qualifications)         e.qualifications  = "Select your qualification";
    if (!(form.uploadedDocs||[]).length) e.uploadedDocs = "Upload at least one credential document";
  }
  if (step === 2) {
    if (!(form.languages||[]).length)        e.languages        = "Select at least one language";
    const missingPrice = form.tiers.some(t=>!t.price);
    if (missingPrice) e.tiers = "Set a price for each service tier";
    if (!form.escrowAgreed) e.escrowAgreed = "You must agree to the escrow policy";
  }
  if (step === 3) {
    if (!form.termsAccepted) e.termsAccepted = "You must accept the Terms of Service";
    if (!form.codeAccepted)  e.codeAccepted  = "You must agree to the Code of Conduct";
  }
  return e;
}

/* ─── NAVBAR ─────────────────────────────────────────────────────── */
/* ─── ROOT ───────────────────────────────────────────────────────── */

export default function OnboardingPage() {
  const [step,     setStep]     = useState(0);
  const [form,     setFormData] = useState(INIT);
  const [errors,   setErrors]   = useState({});
  const [dir,      setDir]      = useState(1);    // 1=forward, -1=back
  const [animKey,  setAnimKey]  = useState(0);
  const [submitted,setSubmitted]= useState(false);
  const [submitting,setSubmitting]=useState(false);
  const topRef = useRef(null);

  const setField = useCallback((k,v) => {
    setFormData(f=>({...f,[k]:v}));
    setErrors(e=>({...e,[k]:""}));
  },[]);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior:"smooth", block:"start" });

  const goNext = () => {
    const e = validate(step, form);
    if (Object.keys(e).length) { setErrors(e); scrollTop(); return; }
    setErrors({});
    setDir(1); setAnimKey(k=>k+1);
    setStep(s=>s+1); scrollTop();
  };

  const goBack = () => {
    setErrors({});
    setDir(-1); setAnimKey(k=>k+1);
    setStep(s=>s-1); scrollTop();
  };

  const goEdit = (s) => { setDir(-1); setAnimKey(k=>k+1); setStep(s); scrollTop(); };

  const handleSubmit = () => {
    const e = validate(3, form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setSubmitted(true); scrollTop(); }, 1800);
  };

  const STEP_COMPS = [
    <Step1 form={form} setField={setField} errors={errors}/>,
    <Step2 form={form} setField={setField} errors={errors}/>,
    <Step3 form={form} setField={setField} errors={errors}/>,
    <Step4 form={form} setField={setField} errors={errors} onEdit={goEdit}/>,
  ];

  const completePct = submitted ? 100 : Math.round((step / ONB_STEPS.length) * 100);

  return (
    <div style={{ fontFamily:"'DM Sans',-apple-system,sans-serif", color:C.navy, background:C.offWhite, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:${C.gold}33;}
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes scaleIn { from{transform:scale(0.6);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateX(var(--slide-x,24px))} to{opacity:1;transform:none} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        input[type=date]::-webkit-calendar-picker-indicator { opacity:0.5; cursor:pointer; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:99px}
      `}</style>

      

      {/* ── HERO ── */}
      <div style={{ background:`linear-gradient(160deg,${C.navyDark} 0%,${C.navy} 55%,#1A3A72 100%)`, padding:"110px 24px 80px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:0.035, backgroundImage:`linear-gradient(${C.white} 1px,transparent 1px),linear-gradient(90deg,${C.white} 1px,transparent 1px)`, backgroundSize:"60px 60px", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", right:"5%", top:"15%", width:500, height:500, background:`radial-gradient(circle,${C.gold}10,transparent 70%)`, pointerEvents:"none" }}/>
        <div style={{ maxWidth:780, margin:"0 auto", textAlign:"center", position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(201,168,76,0.15)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:24, padding:"5px 16px", marginBottom:24 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:C.gold, display:"inline-block" }}/>
            <span style={{ fontSize:11, color:C.goldLight, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>Advisor Registration</span>
          </div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(36px,5vw,58px)", fontWeight:700, color:C.white, lineHeight:1.1, letterSpacing:"-0.02em", marginBottom:18 }}>
            Join the TRC Connect<br/><span style={{ color:C.gold, fontStyle:"italic" }}>Advisor Network</span>
          </h1>
          <p style={{ fontSize:17, color:"rgba(255,255,255,0.6)", lineHeight:1.7, maxWidth:520, margin:"0 auto 36px", fontWeight:300 }}>
            Connect with clients seeking TRC assistance in your jurisdiction. Transparent fees, escrow-protected payments, and a full practice dashboard.
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:20, flexWrap:"wrap" }}>
            {[{ v:"200+", l:"Active Advisors" },{ v:"15%", l:"Platform Fee" },{ v:"48h", l:"Avg. Payout" },{ v:"98%", l:"Client Satisfaction" }].map(s=>(
              <div key={s.l} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:800, color:C.gold }}>{s.v}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.07em", marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, lineHeight:0 }}>
          <svg viewBox="0 0 1440 40" fill={C.offWhite}><path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z"/></svg>
        </div>
      </div>

      {/* ── FORM AREA ── */}
      <div ref={topRef} style={{ maxWidth:820, margin:"0 auto", padding:"48px 24px 80px" }}>

        {!submitted ? (
          <>
            {/* Stepper */}
            <div style={{ background:C.white, borderRadius:20, border:`1px solid ${C.border}`, padding:"32px 40px 52px", marginBottom:28, boxShadow:"0 4px 20px rgba(15,37,87,0.07)" }}>
              <StepProgress current={step}/>
            </div>

            {/* Step header */}
            <div style={{ marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:C.gold, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>Step {step+1} of {ONB_STEPS.length}</p>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(22px,3vw,30px)", fontWeight:700, color:C.navy }}>{ONB_STEPS[step].label}</h2>
                <p style={{ fontSize:14, color:C.muted, marginTop:4 }}>{ONB_STEPS[step].sub}</p>
              </div>
              <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 18px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ height:6, width:100, background:C.offWhite2, borderRadius:999, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${completePct}%`, background:`linear-gradient(90deg,${C.gold},${C.goldDark})`, borderRadius:999, transition:"width 0.5s ease" }}/>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:C.gold }}>{completePct}%</span>
              </div>
            </div>

            {/* Form card */}
            <div
              key={animKey}
              style={{
                background:C.white, borderRadius:20, border:`1px solid ${C.border}`,
                padding:"36px 40px", boxShadow:"0 4px 24px rgba(15,37,87,0.08)",
                "--slide-x": dir > 0 ? "24px" : "-24px",
                animation:"fadeSlideIn 0.3s ease both",
              }}
            >
              {STEP_COMPS[step]}
            </div>

            {/* Nav buttons */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:24, gap:12, flexWrap:"wrap" }}>
              <button onClick={goBack} disabled={step===0}
                style={{
                  background:"transparent", color: step===0?C.muted:C.navy,
                  border:`1.5px solid ${step===0?C.border:C.navy}`,
                  borderRadius:12, padding:"13px 28px", fontSize:14, fontWeight:700,
                  cursor:step===0?"not-allowed":"pointer", opacity:step===0?0.4:1,
                  transition:"all 0.2s",
                }}>
                ← Back
              </button>

              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {/* Step dots */}
                <div style={{ display:"flex", gap:6 }}>
                  {ONB_STEPS.map((_,i)=>(
                    <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:i===step?C.gold:i<step?`${C.gold}66`:C.border, transition:"all 0.25s" }}/>
                  ))}
                </div>

                {step < ONB_STEPS.length - 1 ? (
                  <button onClick={goNext} style={{
                    background:`linear-gradient(135deg,${C.gold},${C.goldDark})`, color:C.white,
                    border:"none", borderRadius:12, padding:"13px 32px", fontSize:14, fontWeight:700,
                    cursor:"pointer", boxShadow:"0 6px 20px rgba(201,168,76,0.4)", transition:"all 0.2s",
                  }}>
                    Continue →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting}
                    style={{
                      background: submitting?`${C.gold}99`:`linear-gradient(135deg,${C.gold},${C.goldDark})`,
                      color:C.white, border:"none", borderRadius:12, padding:"13px 32px", fontSize:14, fontWeight:700,
                      cursor:submitting?"not-allowed":"pointer",
                      boxShadow:submitting?"none":"0 6px 20px rgba(201,168,76,0.4)",
                      display:"flex", alignItems:"center", gap:8, transition:"all 0.2s",
                    }}>
                    {submitting ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2.5" style={{ animation:"spin 0.8s linear infinite" }}>
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                        </svg>
                        Submitting…
                      </>
                    ) : "Submit Application ✓"}
                  </button>
                )}
              </div>
            </div>

            {/* Bottom trust signals */}
            <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:28, flexWrap:"wrap" }}>
              {["🔒 End-to-end encrypted","🛡 15% platform fee only on success","⚡ 2–3 day review turnaround","💬 Dedicated onboarding support"].map(s=>(
                <span key={s} style={{ fontSize:12, color:C.muted, display:"flex", alignItems:"center", gap:5 }}>{s}</span>
              ))}
            </div>
          </>
        ) : (
          <div style={{ background:C.white, borderRadius:20, border:`1px solid ${C.border}`, boxShadow:"0 8px 40px rgba(15,37,87,0.1)", animation:"fadeIn 0.4s ease" }}>
            <SuccessScreen form={form}/>
          </div>
        )}
      </div>
    </div>
  );
}
