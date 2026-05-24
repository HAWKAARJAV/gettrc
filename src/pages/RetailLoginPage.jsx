import { useState } from "react";
import { Link } from "react-router-dom";
import { loginRetailUser, sendRetailPasswordReset, resendVerificationEmail } from "../services/retailAuth";
import { supabase } from "../supabaseClient";
import { RETAIL_THEME } from "../config/retailTheme";

const C = RETAIL_THEME.colors;
const SERIF = RETAIL_THEME.fonts.serif;
const SANS = RETAIL_THEME.fonts.sans;

// ─── helpers ────────────────────────────────────────────────────────────────

function isEmailNotConfirmedError(err) {
  return (
    err?.code === "email_not_confirmed" ||
    String(err?.message || "").toLowerCase().includes("email not confirmed") ||
    String(err?.msg || "").toLowerCase().includes("email not confirmed")
  );
}

async function hasEligibilityRequest(userId) {
  const { data } = await supabase
    .from("eligibility_requests")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  return Array.isArray(data) && data.length > 0;
}

// ─── shell ──────────────────────────────────────────────────────────────────

function AuthShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.navyDark} 0%, ${C.navy} 52%, #1A3A72 100%)`, padding: 24, fontFamily: SANS, boxSizing: "border-box" }}>
      <style>{`*, *::before, *::after { box-sizing: border-box; }`}</style>
      <style>{`
        .rl-grid { display: grid; grid-template-columns: minmax(300px, .95fr) minmax(340px, 1.05fr); gap: 24px; align-items: center; min-height: calc(100vh - 100px); }
        .rl-card { width: min(100%, 520px); background: ${C.white}; border-radius: ${RETAIL_THEME.radius.lg}px; box-shadow: ${RETAIL_THEME.shadows.glass}; border: 1px solid ${C.border}; overflow: hidden; }
        .rl-card-header { padding: 24px; border-bottom: 1px solid ${C.border}; background: linear-gradient(135deg, ${C.offWhite} 0%, ${C.white} 100%); }
        .rl-card-body { padding: 24px; display: grid; gap: 16px; }
        .rl-input { width: 100%; padding: 14px 16px; border-radius: ${RETAIL_THEME.radius.sm}px; border: 1.5px solid ${C.border}; font-family: ${SANS}; font-size: 14px; color: ${C.navy}; outline: none; transition: border-color .2s; }
        .rl-input:focus { border-color: ${C.gold}; box-shadow: 0 0 0 3px rgba(201,168,76,.18); }
        .rl-btn-primary { width: 100%; background: linear-gradient(135deg, ${C.gold}, ${C.goldDark}); color: ${C.white}; border: none; border-radius: ${RETAIL_THEME.radius.sm}px; padding: 14px; font-size: 15px; font-weight: 700; font-family: ${SANS}; cursor: pointer; box-shadow: ${RETAIL_THEME.shadows.gold}; }
        .rl-btn-primary:disabled { opacity: .65; cursor: not-allowed; }
        .rl-btn-ghost { width: 100%; background: transparent; border: 1.5px solid ${C.border}; color: ${C.navy}; border-radius: ${RETAIL_THEME.radius.sm}px; padding: 13px; font-size: 14px; font-weight: 700; font-family: ${SANS}; cursor: pointer; }
        .rl-btn-ghost:hover { border-color: ${C.navy}; }
        .rl-label { display: block; font-size: 12px; font-weight: 700; color: ${C.muted}; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }
        @media (max-width: 880px) {
          .rl-grid { grid-template-columns: 1fr; padding: 0; gap: 18px; }
          .rl-left { order: 2; }
          .rl-card { order: 1; width: 100%; }
        }
      `}</style>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column" }}>
        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", rowGap: 10 }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚖</div>
            <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: C.white }}>TRC</span>
            <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 400, color: C.goldLight }}> Connect</span>
          </Link>
          <a href="mailto:support@gettrc.com" style={{ color: C.white, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Need Help?</a>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── verify-email screen ─────────────────────────────────────────────────────

function VerifyEmailScreen({ email, onBack }) {
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentError, setResentError] = useState("");

  const handleResend = async () => {
    setResending(true);
    setResentError("");
    try {
      await resendVerificationEmail(email);
      setResent(true);
    } catch (e) {
      setResentError(e?.message || "Could not send email. Try again shortly.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="rl-grid">
      {/* left */}
      <div className="rl-left">
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 14 }}>One More Step</div>
        <h1 style={{ fontFamily: SERIF, fontSize: "clamp(30px, 4vw, 44px)", lineHeight: 1.05, color: C.white, marginBottom: 18 }}>
          Verify your email to unlock your workspace
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 1.8, maxWidth: 480 }}>
          We sent a verification link when you registered. Check your inbox (and spam folder) and click the link to activate your account.
        </p>
      </div>

      {/* card */}
      <div className="rl-card">
        <div className="rl-card-header">
          <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 6 }}>Email Verification Required</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 22, color: C.navy, marginBottom: 6 }}>Check your inbox</h2>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
            A verification email was sent to <strong style={{ color: C.navy }}>{email}</strong>. Click the link in that email to verify your account, then come back here to sign in.
          </p>
        </div>

        <div className="rl-card-body">
          {resent ? (
            <div style={{ background: C.successBg, border: `1px solid #A7F3D0`, color: C.success, borderRadius: RETAIL_THEME.radius.sm, padding: "12px 14px", fontSize: 13, fontWeight: 600 }}>
              ✅ Verification email resent — check your inbox (and spam).
            </div>
          ) : (
            <>
              <p style={{ fontSize: 14, color: C.muted }}>Didn't receive the email?</p>
              {resentError && (
                <div style={{ background: C.errorBg, border: `1px solid ${C.errorBorder}`, color: C.error, borderRadius: RETAIL_THEME.radius.sm, padding: "11px 14px", fontSize: 13 }}>
                  {resentError}
                </div>
              )}
              <button className="rl-btn-primary" onClick={handleResend} disabled={resending}>
                {resending ? "Sending…" : "Resend Verification Email"}
              </button>
            </>
          )}

          <button className="rl-btn-ghost" onClick={onBack}>
            ← Back to Sign In
          </button>

          <p style={{ fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>
            After verifying, return to this page and sign in with your credentials.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── new-user screen ─────────────────────────────────────────────────────────

function NewUserScreen({ name }) {
  return (
    <div className="rl-grid">
      {/* left */}
      <div className="rl-left">
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 14 }}>Welcome</div>
        <h1 style={{ fontFamily: SERIF, fontSize: "clamp(30px, 4vw, 44px)", lineHeight: 1.05, color: C.white, marginBottom: 18 }}>
          Let's check if you're eligible for a TRC
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 1.8, maxWidth: 480 }}>
          Before accessing your workspace, we need a few details about your residency situation. It only takes 2 minutes.
        </p>
      </div>

      {/* card */}
      <div className="rl-card">
        <div className="rl-card-header">
          <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 6 }}>New Account</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 22, color: C.navy, marginBottom: 6 }}>
            Hi{name ? ` ${name}` : ""}! Complete your eligibility check first
          </h2>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
            Your account is active but you haven't submitted an eligibility form yet. This takes less than 2 minutes and unlocks your compliance workspace.
          </p>
        </div>

        <div className="rl-card-body">
          <div style={{ display: "grid", gap: 10 }}>
            {["Tell us about your residency situation", "We review your eligibility in 24 hrs", "Your workspace unlocks automatically"].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", background: C.offWhite, borderRadius: RETAIL_THEME.radius.sm, border: `1px solid ${C.border}` }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.white, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: C.navy, fontWeight: 600, lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>

          <a href="/check-eligibility" style={{ display: "block", width: "100%", textDecoration: "none" }}>
            <button className="rl-btn-primary" style={{ width: "100%" }}>
              Start Eligibility Check →
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── main login form ─────────────────────────────────────────────────────────

export default function RetailLoginPage() {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  // "login" | "verify-email" | "new-user"
  const [screen, setScreen]         = useState("login");
  const [newUserName, setNewUserName] = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    setError("");

    try {
      const data = await loginRetailUser(email, password);

      // ── check if this user has ever submitted an eligibility request ──────
      const userId = data?.user?.id;
      if (userId) {
        const hasRequest = await hasEligibilityRequest(userId);
        if (!hasRequest) {
          // Brand-new user — show the "complete eligibility first" screen
          const name = data?.user?.user_metadata?.full_name || data?.user?.email?.split("@")[0] || "";
          setNewUserName(name);
          setScreen("new-user");
          setLoading(false);
          return;
        }
      }

      // All good — go to dashboard
      window.location.assign("/retail/dashboard");
    } catch (err) {
      if (isEmailNotConfirmedError(err)) {
        // Show the verify-email screen instead of a raw error message
        setScreen("verify-email");
      } else {
        setError(err?.message || "Unable to sign in. Check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) { setError("Enter your email address first, then click Forgot Password."); return; }
    setLoading(true);
    setError("");
    try {
      await sendRetailPasswordReset(email);
      setError("Password reset email sent — check your inbox.");
    } catch (e) {
      setError(e?.message || "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  // ── non-login screens ────────────────────────────────────────────────────
  if (screen === "verify-email") {
    return (
      <AuthShell>
        <VerifyEmailScreen email={email} onBack={() => { setScreen("login"); setError(""); }} />
      </AuthShell>
    );
  }

  if (screen === "new-user") {
    return (
      <AuthShell>
        <NewUserScreen name={newUserName} />
      </AuthShell>
    );
  }

  // ── login form ────────────────────────────────────────────────────────────
  return (
    <AuthShell>
      <div className="rl-grid">
        {/* left panel */}
        <div className="rl-left">
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 14 }}>Retail Access</div>
          <h1 style={{ fontFamily: SERIF, fontSize: "clamp(34px, 4vw, 48px)", lineHeight: 1.02, color: C.white, marginBottom: 18 }}>
            Sign in to your personal compliance workspace
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 1.85, maxWidth: 520, marginBottom: 24 }}>
            Track your application, upload documents, and receive advisor updates — all from your secure retail dashboard.
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            {[
              "Personal email authentication",
              "Profile and application retrieval",
              "Document uploads and secure sharing",
              "Notifications and advisor messaging",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: 10, alignItems: "center", color: C.white, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: RETAIL_THEME.radius.sm, padding: "12px 14px" }}>
                <span style={{ color: C.goldLight }}>✓</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* register link */}
          <p style={{ marginTop: 28, fontSize: 14, color: "rgba(255,255,255,0.65)" }}>
            Don't have an account?{" "}
            <a href="/check-eligibility" style={{ color: C.goldLight, fontWeight: 700, textDecoration: "none" }}>
              Start here →
            </a>
          </p>
        </div>

        {/* card */}
        <div className="rl-card">
          <div className="rl-card-header">
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>Retail Login</div>
            <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.navy, marginBottom: 6 }}>Sign in to continue</h2>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8 }}>Access your retail TRC compliance workspace.</p>
          </div>

          <div className="rl-card-body">
            <div>
              <label className="rl-label">Email address</label>
              <input
                className="rl-input"
                value={email}
                type="email"
                autoComplete="email"
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="rl-label">Password</label>
              <input
                className="rl-input"
                value={password}
                type="password"
                autoComplete="current-password"
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{ background: C.errorBg, border: `1px solid ${C.errorBorder}`, color: C.error, borderRadius: RETAIL_THEME.radius.sm, padding: "11px 14px", fontSize: 13, fontWeight: 500 }}>
                {error}
              </div>
            )}

            <button className="rl-btn-primary" onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>

            <button className="rl-btn-ghost" onClick={handleForgot} disabled={loading} type="button">
              Forgot Password
            </button>

            <p style={{ fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>
              🔒 Your data is encrypted and never shared with third parties.
            </p>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
