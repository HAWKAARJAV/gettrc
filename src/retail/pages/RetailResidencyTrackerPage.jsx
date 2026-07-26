import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { RETAIL_THEME } from "../../config/retailTheme";
import { addTravelHistoryEntry, calculatePresenceSummary, fetchTravelHistory } from "../../residency/travelHistoryService";
import { createNotification } from "../../notifications/notificationService";

const C = RETAIL_THEME.colors;

function Card({ eyebrow, title, children }) {
  return (
    <div style={{ background: "var(--c-surface)", borderRadius: RETAIL_THEME.radius.lg, border: `1px solid ${"var(--c-border)"}`, boxShadow: RETAIL_THEME.shadows.card, padding: 24 }}>
      {eyebrow && <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>{eyebrow}</div>}
      {title && <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--c-text)", marginBottom: 14 }}>{title}</h2>}
      {children}
    </div>
  );
}

export default function RetailResidencyTrackerPage() {
  const { workspace } = useOutletContext();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ entryDate: "", exitDate: "" });

  const loadTrips = useCallback(async () => {
    if (!workspace.session?.user?.id) return;
    setLoading(true);
    try {
      setTrips(await fetchTravelHistory(workspace.session.user.id));
    } finally {
      setLoading(false);
    }
  }, [workspace.session?.user?.id]);

  useEffect(() => {
    Promise.resolve().then(() => loadTrips());
  }, [loadTrips]);

  const summary = useMemo(() => calculatePresenceSummary(trips, "AE"), [trips]);

  useEffect(() => {
    if (!workspace.session?.user?.id) return;
    // send lightweight alerts when thresholds are within 7 days
    summary.thresholds.forEach(async (t) => {
      if (!t.met && Math.max(t.days - summary.totalDays, 0) <= 7) {
        try {
          await createNotification({ userId: workspace.session.user.id, title: `Residency threshold approaching: ${t.label}`, body: `${Math.max(t.days - summary.totalDays, 0)} days remaining to reach ${t.label}` });
        } catch (e) {
          // ignore notification errors
        }
      }
    });
  }, [summary, workspace.session?.user?.id]);

  const addTrip = async () => {
    if (!form.entryDate) {
      setMessage("Entry date is required.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const trip = await addTravelHistoryEntry({
        userId: workspace.session.user.id,
        country: "AE",
        entryDate: form.entryDate,
        exitDate: form.exitDate,
      });
      setTrips((prev) => [trip, ...prev]);
      setForm({ entryDate: "", exitDate: "" });
      setMessage("Travel period added.");
    } catch (error) {
      setMessage(error.message || "Unable to add travel period.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card eyebrow="Residency presence tracker" title="UAE day-count control center">
        <p style={{ color: "var(--c-text-muted)", fontSize: 14, lineHeight: 1.8, maxWidth: 760 }}>
          Presence days are calculated from travel records and used as operational evidence during TRC review.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginTop: 18 }}>
          <div style={{ background: "var(--c-bg)", border: `1px solid ${"var(--c-border)"}`, borderRadius: RETAIL_THEME.radius.sm, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>UAE presence</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: "var(--c-text)" }}>{summary.totalDays}</div>
            <div style={{ fontSize: 13, color: "var(--c-text-muted)" }}>tracked days</div>
          </div>
          {summary.thresholds.map((threshold) => (
            <div key={threshold.label} style={{ background: threshold.met ? C.successBg : "var(--c-bg)", border: `1px solid ${threshold.met ? C.success : "var(--c-border)"}`, borderRadius: RETAIL_THEME.radius.sm, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: threshold.met ? C.success : "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{threshold.met ? "Threshold met" : "Threshold open"}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--c-text)", lineHeight: 1.5 }}>{threshold.label}</div>
              <div style={{ fontSize: 13, color: "var(--c-text-muted)", marginTop: 4 }}>{Math.max(threshold.days - summary.totalDays, 0)} days remaining</div>
            </div>
          ))}
        </div>
      </Card>

      <Card eyebrow="Travel entry" title="Add travel period">
        <p style={{ color: "var(--c-text-muted)", fontSize: 13, lineHeight: 1.7, marginTop: -6, marginBottom: 14 }}>
          Log each period you were physically present in the UAE. Only UAE presence counts toward the residency thresholds above.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Entry date</label>
            <input type="date" value={form.entryDate} onChange={(event) => setForm((prev) => ({ ...prev, entryDate: event.target.value }))} style={{ width: "100%", padding: "13px 15px", borderRadius: RETAIL_THEME.radius.sm, border: `1.5px solid ${"var(--c-border)"}`, color: "var(--c-text)", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Exit date</label>
            <input type="date" value={form.exitDate} onChange={(event) => setForm((prev) => ({ ...prev, exitDate: event.target.value }))} style={{ width: "100%", padding: "13px 15px", borderRadius: RETAIL_THEME.radius.sm, border: `1.5px solid ${"var(--c-border)"}`, color: "var(--c-text)", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <button onClick={addTrip} disabled={saving} style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: "#fff", border: "none", borderRadius: RETAIL_THEME.radius.sm, padding: "14px 18px", fontWeight: 800, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Adding..." : "Add Period"}
          </button>
        </div>
        {message && <div style={{ marginTop: 12, color: message.includes("Unable") || message.includes("required") ? C.error : C.gold, fontSize: 13, fontWeight: 700 }}>{message}</div>}
      </Card>

      <Card eyebrow="Residency timeline" title="Travel history">
        {loading ? (
          <div style={{ color: "var(--c-text-muted)", fontSize: 14 }}>Loading travel history...</div>
        ) : trips.length === 0 ? (
          <div style={{ color: "var(--c-text-muted)", fontSize: 14 }}>No travel periods have been added yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {trips.map((trip) => (
              <div key={trip.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "center", background: "var(--c-bg)", border: `1px solid ${"var(--c-border)"}`, borderRadius: RETAIL_THEME.radius.sm, padding: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)" }}>{trip.entry_date} to {trip.exit_date || "present"}</div>
                  <div style={{ height: 6, borderRadius: 999, background: "var(--c-surface-2)", marginTop: 8, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(((trip.total_days || 0) / 183) * 100, 100)}%`, height: "100%", background: `linear-gradient(90deg, ${C.gold}, ${C.goldDark})` }} />
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--c-text)" }}>{trip.total_days || 0} days</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
