import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { RETAIL_THEME } from "../../config/retailTheme";

const C = RETAIL_THEME.colors;

export default function RetailProfilePage() {
  const { workspace, refresh } = useOutletContext();
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ full_name: "", phone: "", nationality: "" });

  useEffect(() => {
    setForm({
      full_name: workspace.profile?.full_name || "",
      phone: workspace.profile?.phone || "",
      nationality: workspace.profile?.nationality || "",
    });
  }, [workspace.profile]);

  const completion = useMemo(() => {
    const values = [form.full_name, form.phone, form.nationality, workspace.request?.current_country, workspace.request?.visa_type].filter(Boolean).length;
    return Math.round((values / 5) * 100);
  }, [form, workspace.request]);

  const handleSave = async () => {
    setSaving(true);
    setNotice("");
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: form.full_name,
        phone: form.phone,
        nationality: form.nationality,
      }).eq("id", workspace.session.user.id);

      if (error) throw error;
      await refresh();
      setNotice("Profile updated successfully.");
    } catch (error) {
      setNotice(error.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const profileCards = [
    ["Email", workspace.profile?.email || workspace.session.user.email],
    ["UAE Country", workspace.request?.current_country || "—"],
    ["Visa Type", workspace.request?.visa_type || "—"],
    ["UAE Visa", workspace.request?.uae_visa || "—"],
  ];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, padding: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Profile completion</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.navy, marginBottom: 8 }}>{completion}% complete</div>
        <div style={{ height: 10, borderRadius: 999, background: C.offWhite2, overflow: "hidden" }}>
          <div style={{ width: `${completion}%`, height: "100%", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})` }} />
        </div>
        <p style={{ marginTop: 12, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>Keep your contact details up to date. Residency and visa fields are shown for reference from your submitted eligibility file.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
        {profileCards.map(([label, value]) => (
          <div key={label} style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, lineHeight: 1.7 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.white, borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${C.border}`, boxShadow: RETAIL_THEME.shadows.card, padding: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 16 }}>Edit contact details</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {[
            ["Full Name", "full_name", "Your legal name"],
            ["Phone", "phone", "+971..."],
            ["Nationality", "nationality", "Nationality"],
          ].map(([label, key, placeholder]) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{label}</label>
              <input value={form[key]} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder} style={{ width: "100%", padding: "14px 16px", borderRadius: RETAIL_THEME.radius.sm, border: `1.5px solid ${C.border}`, color: C.navy, fontSize: 14, outline: "none" }} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
          <button onClick={handleSave} disabled={saving} style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, border: "none", borderRadius: RETAIL_THEME.radius.sm, padding: "13px 18px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving…" : "Save Profile"}
          </button>
          {notice && <div style={{ alignSelf: "center", color: C.muted, fontSize: 13 }}>{notice}</div>}
        </div>
      </div>
    </div>
  );
}
