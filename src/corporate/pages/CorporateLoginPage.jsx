import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CorporateAuthShell from "../components/CorporateAuthShell";
import { RETAIL_THEME } from "../../config/retailTheme";
import { fetchCorporateWorkspace, loginCorporateUser, saveCorporateCache, sendCorporatePasswordReset } from "../services/corporateAuth";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;
const SANS = RETAIL_THEME.fonts.sans;

function AuthCard({ title, subtitle, children }) {
  return (
    <div style={{ width: "min(100%, 520px)", background: C.white, borderRadius: RETAIL_THEME.radius.lg, boxShadow: RETAIL_THEME.shadows.glass, border: `1px solid ${C.border}`, overflow: "hidden", boxSizing: "border-box" }}>
      <div style={{ padding: 24, borderBottom: `1px solid ${C.border}`, background: `linear-gradient(135deg, ${C.offWhite} 0%, ${C.white} 100%)` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Corporate Login</div>
        <h1 style={{ fontFamily: SERIF, fontSize: 32, color: C.navy, marginBottom: 8 }}>{title}</h1>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8 }}>{subtitle}</p>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

export default function CorporateLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter business email and password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const authData = await loginCorporateUser(email, password);
      const workspace = await fetchCorporateWorkspace(authData.user.id);
      saveCorporateCache(workspace);
      navigate("/corporate/dashboard");
    } catch (loginError) {
      setError(loginError.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      setError("Enter your email first, then try Forgot Password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await sendCorporatePasswordReset(email);
      setError("Password reset email sent.");
    } catch (forgotError) {
      setError(forgotError.message || "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CorporateAuthShell actions={<Link to="/corporate/check-eligibility" style={{ color: C.white, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Check Eligibility</Link>}>
      <style>{`*{box-sizing:border-box;}`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, .95fr) minmax(340px, 1.05fr)", gap: 24, alignItems: "center", minHeight: "calc(100vh - 120px)" }}>
        <div style={{ maxWidth: 540 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 14 }}>Enterprise Access</div>
          <h1 style={{ fontFamily: SERIF, fontSize: "clamp(42px, 5vw, 68px)", lineHeight: 1.02, color: C.white, marginBottom: 18 }}>Sign in to the corporate compliance workspace</h1>
          <p style={{ color: "rgba(255,255,255,.76)", fontSize: 17, lineHeight: 1.85, maxWidth: 500, marginBottom: 24 }}>
            Access your company review, payment status, and operational compliance modules from a secure enterprise dashboard.
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            {["Business email authentication", "Corporate profile retrieval", "Onboarding and payment status review", "Progressive workspace unlocking"].map((item) => (
              <div key={item} style={{ display: "flex", gap: 10, alignItems: "center", color: C.white, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", borderRadius: RETAIL_THEME.radius.sm, padding: "12px 14px" }}>
                <span style={{ color: C.goldLight }}>✓</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <AuthCard title="Corporate Login" subtitle="Use your business email to access the enterprise workspace.">
          <div style={{ display: "grid", gap: 16, fontFamily: SANS }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Business Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="business@example.com" style={{ width: "100%", padding: "14px 16px", borderRadius: RETAIL_THEME.radius.sm, border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: 14, color: C.navy, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Password</label>
              <input value={password} type="password" onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "14px 16px", borderRadius: RETAIL_THEME.radius.sm, border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: 14, color: C.navy, outline: "none", boxSizing: "border-box" }} />
            </div>

            {error && <div style={{ background: C.errorBg, border: `1px solid ${C.errorBorder}`, color: C.error, borderRadius: RETAIL_THEME.radius.sm, padding: "11px 14px", fontSize: 13 }}>{error}</div>}

            <button onClick={handleLogin} disabled={loading} style={{ width: "100%", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, border: "none", borderRadius: RETAIL_THEME.radius.sm, padding: "14px", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: RETAIL_THEME.shadows.gold, boxSizing: "border-box" }}>
              {loading ? "Signing in…" : "Login"}
            </button>

            <button onClick={handleForgot} type="button" style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, color: C.navy, borderRadius: RETAIL_THEME.radius.sm, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxSizing: "border-box" }}>
              Forgot Password
            </button>
          </div>
        </AuthCard>
      </div>
    </CorporateAuthShell>
  );
}