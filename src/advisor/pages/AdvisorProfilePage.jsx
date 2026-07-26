import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../supabaseClient";

const C = { navy:"#0F2557", navyLight:"#1A3570", gold:"#C9A84C", goldDark:"#A07C2E", white:"#fff", offWhite:"#F7F8FC", muted:"#6B7A99", border:"#E2E8F0", success:"#059669", successBg:"#ECFDF5" };
const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'DM Sans', -apple-system, sans-serif";

function Field({ label, value }) {
  return (
    <div style={{ padding: "10px 0", borderBottom: `1px solid ${"var(--c-border)"}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>{value || "—"}</div>
    </div>
  );
}

function StarRating({ rating }) {
  const stars = Math.round(rating || 0);
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 18, color: i <= stars ? C.gold : "var(--c-border)" }}>★</span>
      ))}
      {rating != null && <span style={{ fontSize: 13, color: "var(--c-text-muted)", marginLeft: 6 }}>{Number(rating).toFixed(1)}</span>}
    </div>
  );
}

export default function AdvisorProfilePage() {
  const { workspace } = useOutletContext();
  const { profile, advisor, session } = workspace;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName.trim(), phone: phone.trim() }).eq("id", session.user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const specialties = Array.isArray(advisor?.specialties)
    ? advisor.specialties
    : typeof advisor?.specialties === "string"
      ? advisor.specialties.split(",").map(s => s.trim()).filter(Boolean)
      : [];

  const languages = Array.isArray(advisor?.languages)
    ? advisor.languages
    : typeof advisor?.languages === "string"
      ? advisor.languages.split(",").map(l => l.trim()).filter(Boolean)
      : [];

  return (
    <div style={{ display: "grid", gap: 20, fontFamily: SANS }}>
      {/* Header */}
      <div style={{ background: "var(--c-surface)", borderRadius: 18, border: `1px solid ${"var(--c-border)"}`, padding: "24px 28px", boxShadow: "0 2px 12px rgba(15,37,87,.05)", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 26, fontWeight: 700, flexShrink: 0 }}>
          {(profile?.full_name || advisor?.name || "A").charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: "var(--c-text)", marginBottom: 4 }}>
            {profile?.full_name || advisor?.name || "Advisor"}
          </h2>
          <div style={{ fontSize: 13, color: "var(--c-text-muted)" }}>{profile?.email || session?.user?.email}</div>
          <div style={{ marginTop: 8 }}>
            {advisor?.verified ? (
              <span style={{ background: C.successBg, color: C.success, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, marginRight: 8 }}>✓ Verified Advisor</span>
            ) : (
              <span style={{ background: "#F3F4F6", color: "var(--c-text-muted)", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, marginRight: 8 }}>Pending Verification</span>
            )}
            {advisor?.available && (
              <span style={{ background: "#ECFDF5", color: "#059669", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>● Available</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
        {/* Edit profile */}
        <div style={{ background: "var(--c-surface)", borderRadius: 16, border: `1px solid ${"var(--c-border)"}`, padding: 22, boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>Edit Profile</div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${"var(--c-border)"}`, fontFamily: SANS, fontSize: 14, outline: "none", color: "var(--c-text)", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${"var(--c-border)"}`, fontFamily: SANS, fontSize: 14, outline: "none", color: "var(--c-text)", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Email (read-only)</label>
            <input value={profile?.email || session?.user?.email || ""} readOnly
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${"var(--c-border)"}`, fontFamily: SANS, fontSize: 14, color: "var(--c-text-muted)", background: "var(--c-bg)", boxSizing: "border-box", cursor: "not-allowed" }} />
          </div>

          <div style={{ marginTop: 18 }}>
            <button onClick={handleSave} disabled={saving}
              style={{ background: `linear-gradient(135deg,${C.navy},${C.navyLight})`, color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .6 : 1, fontFamily: SANS }}>
              {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Advisor details (read-only from advisors table) */}
        <div style={{ background: "var(--c-surface)", borderRadius: 16, border: `1px solid ${"var(--c-border)"}`, padding: 22, boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>Advisor Details</div>

          {advisor ? (
            <>
              <Field label="Languages" value={languages.length ? languages.join(", ") : null} />

              <div style={{ padding: "10px 0", borderBottom: `1px solid ${"var(--c-border)"}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Specialties</div>
                {specialties.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {specialties.map(s => (
                      <span key={s} style={{ background: "#EFF6FF", color: "#1D6FB8", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>{s}</span>
                    ))}
                  </div>
                ) : <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>—</div>}
              </div>

              <div style={{ padding: "10px 0", borderBottom: `1px solid ${"var(--c-border)"}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Rating</div>
                <StarRating rating={advisor.rating} />
                {advisor.reviews != null && (
                  <div style={{ fontSize: 12, color: "var(--c-text-muted)", marginTop: 4 }}>{advisor.reviews} review{advisor.reviews !== 1 ? "s" : ""}</div>
                )}
              </div>
            </>
          ) : (
            <div style={{ color: "var(--c-text-muted)", fontSize: 14 }}>No advisor profile found. Contact admin to complete your advisor setup.</div>
          )}
        </div>

        {/* Fee schedule */}
        {advisor && (
          <div style={{ background: "var(--c-surface)", borderRadius: 16, border: `1px solid ${"var(--c-border)"}`, padding: 22, boxShadow: "0 2px 12px rgba(15,37,87,.05)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>Fee Schedule</div>

            {[
              ["Standard", advisor.fee_standard],
              ["Express", advisor.fee_express],
              ["Premium", advisor.fee_premium],
            ].map(([tier, fee]) => (
              <div key={tier} style={{ padding: "12px 0", borderBottom: `1px solid ${"var(--c-border)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>{tier}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>{fee != null ? (isNaN(Number(fee)) ? fee : `AED ${Number(fee).toLocaleString()}`) : "—"}</div>
              </div>
            ))}

            <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--c-bg)", borderRadius: 10, fontSize: 12, color: "var(--c-text-muted)", border: `1px solid ${"var(--c-border)"}` }}>
              Fee schedules are managed by the admin. Contact admin to update your rates.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
