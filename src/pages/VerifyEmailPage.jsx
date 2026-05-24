import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resendVerificationEmail } from "../services/retailAuth";
import { RETAIL_THEME as P } from "../config/retailTheme";

const z = P.colors;
const SERIF = P.fonts.serif;
const SANS = P.fonts.sans;

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const emailFromParam = params.get("email") || "";
  const pendingEmail = useMemo(() => localStorage.getItem("trc_pending_email") || "", []);

  const [email, setEmail] = useState(emailFromParam || pendingEmail);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");

  // Sync email state if the URL param arrives asynchronously
  useEffect(() => {
    if (!emailFromParam) return;
    const t = window.setTimeout(() => setEmail(emailFromParam), 0);
    return () => window.clearTimeout(t);
  }, [emailFromParam]);

  const handleResend = async () => {
    if (!email) { setMessage("Add the email address used for registration first."); return; }
    setResending(true);
    setMessage("");
    try {
      await resendVerificationEmail(email);
      setMessage("Verification email sent again.");
    } catch (e) {
      setMessage(e.message || "Unable to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${z.navyDark} 0%, ${z.navy} 52%, #1A3A72 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: SANS }}>
      <div style={{ width: "100%", maxWidth: 560, background: z.white, borderRadius: P.radius.lg, boxShadow: P.shadows.glass, border: `1px solid ${z.border}`, padding: 36, textAlign: "center" }}>

        {/* Icon */}
        <div style={{ width: 56, height: 56, borderRadius: 18, margin: "0 auto 18px", background: `linear-gradient(135deg, ${z.gold}, ${z.goldDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: z.white, fontSize: 24 }}>✉</div>

        <h1 style={{ fontFamily: SERIF, fontSize: 36, color: z.navy, marginBottom: 10 }}>Verify Your Email Address</h1>
        <p style={{ color: z.muted, fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>We've sent a verification link to your email address. Please open the message and confirm your account before logging in.</p>

        {/* Email input (editable so user can fix typos) */}
        <div style={{ display: "grid", gap: 12, marginBottom: 18, textAlign: "left" }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: z.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>Email Address</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
            style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: P.radius.sm, border: `1.5px solid ${z.border}`, fontFamily: SANS, fontSize: 14, color: z.navy, outline: "none" }} />
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/login")}
            style={{ background: z.offWhite, color: z.navy, border: `1px solid ${z.border}`, borderRadius: P.radius.sm, padding: "13px 18px", fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>
            Go to Login
          </button>
          <button onClick={handleResend} disabled={resending}
            style={{ background: `linear-gradient(135deg, ${z.gold}, ${z.goldDark})`, color: z.white, border: "none", borderRadius: P.radius.sm, padding: "13px 18px", fontWeight: 700, cursor: resending ? "not-allowed" : "pointer", opacity: resending ? 0.7 : 1, fontFamily: SANS }}>
            {resending ? "Resending…" : "Resend Email"}
          </button>
        </div>

        {message && <p style={{ marginTop: 16, color: z.muted, fontSize: 13 }}>{message}</p>}
      </div>
    </div>
  );
}
