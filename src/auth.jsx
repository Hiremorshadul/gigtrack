import { useState } from "react";
import { supabase } from "./supabase";

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F5F4F0; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  input { font-family: 'DM Sans', sans-serif; }
  input:focus { outline: 2px solid #16A34A; outline-offset: 1px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .auth-card { animation: fadeUp 0.25s ease; }
`;

const Inp = ({ label, type = "text", value, onChange, placeholder, autoComplete }) => (
    <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", marginBottom: 5 }}>{label}</div>
        <input
            type={type} value={value} onChange={onChange} placeholder={placeholder}
            autoComplete={autoComplete || (type === "password" ? "current-password" : type === "email" ? "email" : "off")}
            style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "11px 14px", color: "#111827", fontSize: 14, width: "100%" }}
        />
    </div>
);

const Alert = ({ msg, ok }) => (
    <div style={{ background: ok ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${ok ? "#BBF7D0" : "#FECACA"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: ok ? "#16A34A" : "#DC2626" }}>
        {msg}
    </div>
);

const SubmitBtn = ({ onClick, loading, label }) => (
    <button onClick={onClick} disabled={loading}
        style={{ width: "100%", border: "none", borderRadius: 10, padding: "13px", fontWeight: 600, fontSize: 15, cursor: loading ? "default" : "pointer", background: loading ? "#D1FAE5" : "#16A34A", color: "#fff", transition: "opacity 0.15s", fontFamily: "'DM Sans',sans-serif" }}>
        {loading ? "Please wait…" : label}
    </button>
);

export default function Auth() {
    // mode: "login" | "register" | "forgot" | "forgot_sent"
    const [mode, setMode] = useState("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [msg, setMsg] = useState(null);

    const clear = () => { setError(null); setMsg(null); };
    const go = (m) => { setMode(m); clear(); };

    // ── Login / Register ──────────────────────────────────────────────────────
    const handleSubmit = async () => {
        clear();
        if (!email || !password) return setError("Please fill in all fields.");
        if (mode === "register" && !name) return setError("Please enter your name.");
        if (password.length < 6) return setError("Password must be at least 6 characters.");
        setLoading(true);
        if (mode === "login") {
            const { error: e } = await supabase.auth.signInWithPassword({ email, password });
            if (e) setError(e.message);
        } else {
            const { error: e } = await supabase.auth.signUp({
                email, password, options: { data: { full_name: name } },
            });
            if (e) setError(e.message);
            else setMsg("Account created! Check your email to confirm, then sign in.");
        }
        setLoading(false);
    };

    // ── Forgot password ───────────────────────────────────────────────────────
    const handleForgot = async () => {
        clear();
        if (!email) return setError("Enter your email address first.");
        setLoading(true);
        const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        setLoading(false);
        if (e) return setError(e.message);
        setMode("forgot_sent");
    };

    const onKey = (e) => {
        if (e.key !== "Enter") return;
        if (mode === "forgot") handleForgot();
        else handleSubmit();
    };

    // ── Logo ──────────────────────────────────────────────────────────────────
    const Logo = () => (
        <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>⚡</span>
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 30, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>GigTrack</span>
            </div>
            <div style={{ fontSize: 13, color: "#9CA3AF" }}>Track your delivery earnings — Glovo, Uber Eats & Bolt</div>
        </div>
    );

    const Footer = () => (
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#9CA3AF" }}>
            Built by{" "}
            <a href="https://morshadul.eu/" target="_blank" rel="noopener noreferrer" style={{ color: "#16A34A", fontWeight: 600, textDecoration: "none" }}>Morshadul</a>
            {" "}· Lisbon 🇵🇹
        </div>
    );

    return (
        <>
            <style>{CSS}</style>
            <div style={{ minHeight: "100vh", background: "#F5F4F0", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>
                <div style={{ width: "100%", maxWidth: 400 }}>
                    <Logo />

                    {/* ── Email sent confirmation ── */}
                    {mode === "forgot_sent" ? (
                        <div className="auth-card" style={{ background: "#fff", borderRadius: 20, padding: "32px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)", textAlign: "center" }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
                            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Check your email</div>
                            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>
                                We sent a password reset link to <strong style={{ color: "#111827" }}>{email}</strong>.
                                Click the link in the email to set a new password.
                            </div>
                            <button onClick={() => go("login")}
                                style={{ width: "100%", border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, fontSize: 14, cursor: "pointer", background: "#F3F4F6", color: "#374151", fontFamily: "'DM Sans',sans-serif" }}>
                                Back to Sign In
                            </button>
                        </div>

                    ) : mode === "forgot" ? (
                        /* ── Forgot password form ── */
                        <div className="auth-card" style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)" }}>
                            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Reset Password</div>
                            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>Enter your email and we'll send you a reset link.</div>
                            <Inp label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                            {error && <Alert msg={error} ok={false} />}
                            <SubmitBtn onClick={handleForgot} loading={loading} label="Send Reset Link" />
                            <button onClick={() => go("login")}
                                style={{ width: "100%", marginTop: 10, border: "none", borderRadius: 10, padding: "11px", fontWeight: 500, fontSize: 13, cursor: "pointer", background: "transparent", color: "#9CA3AF", fontFamily: "'DM Sans',sans-serif" }}>
                                ← Back to Sign In
                            </button>
                        </div>

                    ) : (
                        /* ── Login / Register ── */
                        <div className="auth-card" style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)" }}>
                            {/* Toggle */}
                            <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 12, padding: 4, marginBottom: 24 }}>
                                {["login", "register"].map(m => (
                                    <button key={m} onClick={() => go(m)} style={{
                                        flex: 1, border: "none", borderRadius: 9, padding: "9px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s",
                                        background: mode === m ? "#fff" : "transparent", color: mode === m ? "#111827" : "#9CA3AF",
                                        boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none", fontFamily: "'DM Sans',sans-serif",
                                    }}>
                                        {m === "login" ? "Sign In" : "Register"}
                                    </button>
                                ))}
                            </div>

                            {mode === "register" && (
                                <Inp label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morshadul Alam" autoComplete="name" />
                            )}
                            <Inp label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                            <div style={{ marginBottom: 4 }}>
                                <Inp label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" />
                            </div>

                            {/* Forgot password link — only on login */}
                            {mode === "login" && (
                                <div style={{ textAlign: "right", marginBottom: 14, marginTop: -6 }}>
                                    <button onClick={() => go("forgot")}
                                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#16A34A", fontWeight: 500, padding: 0, fontFamily: "'DM Sans',sans-serif" }}>
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            {error && <Alert msg={error} ok={false} />}
                            {msg && <Alert msg={msg} ok={true} />}

                            <SubmitBtn onClick={handleSubmit} loading={loading} label={mode === "login" ? "Sign In" : "Create Account"} />
                        </div>
                    )}

                    <Footer />
                </div>
            </div>
        </>
    );
}