import { useState } from "react";
import { Link } from "react-router-dom";
import { loginAdvisor } from "../services/advisorAuth";
import { supabase } from "../supabaseClient";
import { RETAIL_THEME } from "../config/retailTheme";
import { useSEO } from "../seo/useSEO";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;
const SANS = RETAIL_THEME.fonts.sans;

function isEmailNotConfirmed(err) {
  return err?.code === "email_not_confirmed" ||
    String(err?.message || "").toLowerCase().includes("email not confirmed");
}

export default function AdvisorLoginPage() {
  useSEO({
    title: "Advisor Sign In | TRC Connect",
    description: "Sign in to the TRC Connect advisor portal to manage assigned UAE Tax Residency Certificate cases, message clients, and track application status.",
    path: "/advisor/login",
    noindex: true,
  });

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [screen, setScreen]     = useState("login"); // "login" | "not-advisor" | "verify"

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError("");
    try {
      const data = await loginAdvisor(email, password);
      // Verify this is actually an advisor account
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", data.user.id).maybeSingle();
      if (profile?.role !== "advisor") {
        setScreen("not-advisor");
        setLoading(false);
        return;
      }
      window.location.assign("/advisor/dashboard");
    } catch (err) {
      if (isEmailNotConfirmed(err)) setScreen("verify");
      else setError(err?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.navyDark} 0%, ${C.navy} 52%, #1A3A72 100%)`, padding: 24, fontFamily: SANS, boxSizing: "border-box" }}>
      <style>{`*, *::before, *::after { box-sizing: border-box; }
        .al-grid { display: grid; grid-template-columns: minmax(300px,.9fr) minmax(340px,1.1fr); gap: 24px; align-items: center; min-height: calc(100vh - 100px); }
        .al-card { width: min(100%, 500px); background: #fff; border-radius: 24px; box-shadow: 0 40px 80px rgba(0,0,0,.18); border: 1px solid ${C.border}; overflow: hidden; }
        .al-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1.5px solid ${C.border}; font-family: ${SANS}; font-size: 14px; color: ${C.navy}; outline: none; }
        .al-input:focus { border-color: ${C.gold}; box-shadow: 0 0 0 3px rgba(201,168,76,.18); }
        .al-btn { width: 100%; background: linear-gradient(135deg, ${C.gold}, ${C.goldDark}); color: #fff; border: none; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 700; font-family: ${SANS}; cursor: pointer; }
        .al-btn:disabled { opacity: .65; cursor: not-allowed; }
        @media(max-width:880px){ .al-grid{grid-template-columns:1fr;} .al-left{order:2;} .al-card{order:1;width:100%;} }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", rowGap: 10 }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚖</div>
            <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: "#fff" }}>TRC</span>
            <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 400, color: C.goldLight }}> Connect</span>
          </Link>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link to="/retail/login" style={{ color: "rgba(255,255,255,.6)", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Retail Login</Link>
            <Link to="/corporate/login" style={{ color: "rgba(255,255,255,.6)", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Corporate Login</Link>
          </div>
        </div>

        {screen === "not-advisor" && (
          <div className="al-grid">
            <div className="al-left" />
            <div className="al-card">
              <div style={{ padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
                <h2 style={{ fontFamily: SERIF, fontSize: 22, color: C.navy, marginBottom: 8 }}>Not an advisor account</h2>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>
                  This email is registered as a client, not an advisor. Please use the correct portal.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <Link to="/retail/login"><button style={{ padding: "10px 20px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "#fff", color: C.navy, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Retail Login</button></Link>
                  <button onClick={() => setScreen("login")} style={{ padding: "10px 20px", borderRadius: 10, background: `linear-gradient(135deg,${C.gold},${C.goldDark})`, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Try Again</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {screen === "verify" && (
          <div className="al-grid">
            <div className="al-left" />
            <div className="al-card">
              <div style={{ padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✉️</div>
                <h2 style={{ fontFamily: SERIF, fontSize: 22, color: C.navy, marginBottom: 8 }}>Verify your email</h2>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>
                  Check your inbox for a verification link sent to <strong style={{ color: C.navy }}>{email}</strong>, then return here to sign in.
                </p>
                <button onClick={() => setScreen("login")} style={{ padding: "11px 24px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "#fff", color: C.navy, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>← Back to Sign In</button>
              </div>
            </div>
          </div>
        )}

        {screen === "login" && (
          <div className="al-grid">
            {/* Left */}
            <div className="al-left">
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 14 }}>Advisor Portal</div>
              <h1 style={{ fontFamily: SERIF, fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.05, color: "#fff", marginBottom: 18 }}>
                Sign in to your advisor workspace
              </h1>
              <p style={{ color: "rgba(255,255,255,.8)", fontSize: 15, lineHeight: 1.8, maxWidth: 460, marginBottom: 24 }}>
                Manage your assigned cases, communicate with clients, and send updates to the TRC Connect team — all from one place.
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                {["View & manage assigned applications", "Chat directly with your clients", "Send updates and inquiries to admin", "Track case status in real time"].map(f => (
                  <div key={f} style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "11px 14px", color: "#fff" }}>
                    <span style={{ color: C.goldLight, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card */}
            <div className="al-card">
              <div style={{ padding: 24, borderBottom: `1px solid ${C.border}`, background: `linear-gradient(135deg,${C.offWhite},#fff)` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Advisor Login</div>
                <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.navy, marginBottom: 6 }}>Sign in to continue</h2>
                <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8 }}>Access your TRC Connect advisor dashboard.</p>
              </div>
              <div style={{ padding: 24, display: "grid", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Email</label>
                  <input className="al-input" type="email" value={email} autoComplete="email"
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    placeholder="advisor@example.com" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Password</label>
                  <input className="al-input" type="password" value={password} autoComplete="current-password"
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    placeholder="••••••••" />
                </div>
                {error && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 10, padding: "11px 14px", fontSize: 13 }}>{error}</div>
                )}
                <button className="al-btn" onClick={handleLogin} disabled={loading}>
                  {loading ? "Signing in…" : "Sign In →"}
                </button>
                <p style={{ fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>
                  Not an advisor?{" "}
                  <Link to="/retail/login" style={{ color: C.gold, fontWeight: 700, textDecoration: "none" }}>Retail login</Link>
                  {" · "}
                  <Link to="/corporate/login" style={{ color: C.gold, fontWeight: 700, textDecoration: "none" }}>Corporate login</Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
