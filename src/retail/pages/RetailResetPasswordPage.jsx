import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { RETAIL_THEME } from "../../config/retailTheme";

const C    = RETAIL_THEME.colors;
const SANS = RETAIL_THEME.fonts.sans;
const SERIF = RETAIL_THEME.fonts.serif;

export default function RetailResetPasswordPage() {
  const navigate = useNavigate();

  const [ready,    setReady]    = useState(false);   // true once Supabase fires PASSWORD_RECOVERY
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [done,     setDone]     = useState(false);

  // Supabase automatically exchanges the recovery token from the URL hash
  // and fires PASSWORD_RECOVERY via onAuthStateChange
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => navigate("/retail/dashboard"), 2500);
    } catch (err) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Shared card wrapper ───────────────────────────────────────────────────

  const cardStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: C.offWhite,
    fontFamily: SANS,
    padding: 24,
  };

  const boxStyle = {
    background: C.white,
    borderRadius: RETAIL_THEME.radius.lg,
    border: `1px solid ${C.border}`,
    boxShadow: RETAIL_THEME.shadows.card,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
  };

  // ── Success state ─────────────────────────────────────────────────────────

  if (done) {
    return (
      <div style={cardStyle}>
        <div style={{ ...boxStyle, textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.navy, marginBottom: 10 }}>Password updated!</h2>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.75 }}>
            Your new password has been saved. Redirecting you to the dashboard…
          </p>
        </div>
      </div>
    );
  }

  // ── Waiting for Supabase to confirm the recovery token ────────────────────

  if (!ready) {
    return (
      <div style={cardStyle}>
        <div style={{ ...boxStyle, textAlign: "center" }}>
          {/* Gold top stripe */}
          <div style={{ height: 4, background: `linear-gradient(90deg, ${C.navy}, ${C.gold})`, borderRadius: "8px 8px 0 0", margin: "-40px -36px 32px" }} />
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔑</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 22, color: C.navy, marginBottom: 10 }}>Verifying reset link…</h2>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.75 }}>
            Please wait while we verify your password reset link. If nothing happens, the link may have expired — request a new one from the login page.
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{ marginTop: 20, background: "none", border: "none", color: C.navy, fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // ── Reset form ────────────────────────────────────────────────────────────

  return (
    <div style={cardStyle}>
      <div style={boxStyle}>
        {/* Gold top stripe */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${C.navy}, ${C.gold})`, borderRadius: "8px 8px 0 0", margin: "-40px -36px 32px" }} />

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 26, color: C.navy, marginBottom: 8 }}>Set a new password</h2>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>Choose a strong password — at least 8 characters.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              style={{
                width: "100%", padding: "13px 15px", borderRadius: RETAIL_THEME.radius.sm,
                border: `1.5px solid ${error && !password ? "#FECACA" : C.border}`,
                color: C.navy, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: SANS,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat the password"
              required
              style={{
                width: "100%", padding: "13px 15px", borderRadius: RETAIL_THEME.radius.sm,
                border: `1.5px solid ${error && password !== confirm ? "#FECACA" : C.border}`,
                color: C.navy, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: SANS,
              }}
            />
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: RETAIL_THEME.radius.sm, padding: "10px 14px", fontSize: 13, color: "#DC2626", fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !password || !confirm}
            style={{
              width: "100%", padding: "14px", borderRadius: RETAIL_THEME.radius.sm,
              background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`,
              color: "#fff", border: "none", fontWeight: 700, fontSize: 15,
              fontFamily: SANS, cursor: saving || !password || !confirm ? "not-allowed" : "pointer",
              opacity: saving || !password || !confirm ? 0.6 : 1,
              marginTop: 4,
            }}
          >
            {saving ? "Updating password…" : "Update Password"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            onClick={() => navigate("/login")}
            style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer" }}
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
