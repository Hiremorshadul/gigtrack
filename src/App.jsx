import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Auth from "./auth";
import Dashboard from "./Dashboard";
import Admin from "./Admin";

// ── Set New Password screen (shown after clicking reset email link) ──────────
function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handle = async () => {
    setError(null);
    if (!password || password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    const { error: e } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (e) return setError(e.message);
    setSuccess(true);
    // Give user a moment to read the success message, then go to dashboard
    setTimeout(onDone, 2000);
  };

  const inp = {
    background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10,
    padding: "11px 14px", color: "#111827", fontSize: 14, width: "100%",
    fontFamily: "'DM Sans',sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F4F0", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700, color: "#111827" }}>GigTrack</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)" }}>
          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Password updated!</div>
              <div style={{ fontSize: 13, color: "#6B7280" }}>Taking you to your dashboard…</div>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Set New Password</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>Choose a strong password for your account.</div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", marginBottom: 5 }}>New Password</div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" style={inp} autoComplete="new-password" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", marginBottom: 5 }}>Confirm Password</div>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Same password again" style={inp} autoComplete="new-password"
                  onKeyDown={e => e.key === "Enter" && handle()} />
              </div>

              {error && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#DC2626" }}>
                  {error}
                </div>
              )}

              <button onClick={handle} disabled={loading}
                style={{ width: "100%", border: "none", borderRadius: 10, padding: "13px", fontWeight: 600, fontSize: 15, cursor: loading ? "default" : "pointer", background: loading ? "#D1FAE5" : "#16A34A", color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>
                {loading ? "Updating…" : "Update Password"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false); // true = show reset password screen

  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => { if (mounted) setLoading(false); }, 6000);

    const loadUser = async (session) => {
      if (!session?.user) {
        if (mounted) { setUser(null); setIsAdmin(false); setResetting(false); setLoading(false); }
        return;
      }
      try {
        if (mounted) { setUser(session.user); setResetting(false); }
        const { data } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single();
        if (mounted) setIsAdmin(data?.is_admin === true);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // 1. Explicitly fetch current session on mount (fixes reload / Strict Mode issues)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) loadUser(session);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return; // Already handled by getSession
      if (event === "PASSWORD_RECOVERY") {
        if (mounted) { setUser(session?.user || null); setResetting(true); setLoading(false); }
        return;
      }
      if (mounted) loadUser(session);
    });

    return () => { 
      mounted = false; 
      clearTimeout(timeout); 
      subscription?.unsubscribe(); 
    };
  }, []);

  const handleSignOut = async () => {
    try { await supabase.auth.signOut(); } catch (e) { console.error(e); }
  };

  // After password update: stop showing reset screen, go to dashboard
  const handleResetDone = () => setResetting(false);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F5F4F0", fontFamily: "system-ui,sans-serif", color: "#9CA3AF", fontSize: 14 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
        <div>Loading GigTrack…</div>
      </div>
    </div>
  );

  // ── Password reset flow ──────────────────────────────────────────────────
  if (resetting) return <ResetPasswordScreen onDone={handleResetDone} />;

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!user) return <Auth />;

  // ── Admin ────────────────────────────────────────────────────────────────
  if (isAdmin) return <Admin adminUser={user} onSignOut={handleSignOut} />;

  // ── Dashboard ────────────────────────────────────────────────────────────
  return <Dashboard user={user} onSignOut={handleSignOut} />;
}