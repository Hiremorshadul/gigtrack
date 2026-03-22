import { useState } from "react";
import { supabase } from "./supabase";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Fraunces:wght@700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F5F4F0; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  input { font-family: 'DM Sans', sans-serif; }
  input:focus { outline: 2px solid #16A34A; outline-offset: 1px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .auth-card { animation: fadeUp 0.25s ease; }
`;

const Inp = ({ label, type = "text", value, onChange, placeholder }) => (
    <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", marginBottom: 5 }}>{label}</div>
        <input
            type={type} value={value} onChange={onChange} placeholder={placeholder}
            style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "11px 14px", color: "#111827", fontSize: 14, width: "100%" }}
            autoComplete={type === "password" ? "current-password" : type === "email" ? "email" : "off"}
        />
    </div>
);

export default function Auth() {
    const [mode, setMode] = useState("login"); // "login" | "register"
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [msg, setMsg] = useState(null);

    const reset = () => { setError(null); setMsg(null); };

    const handleSubmit = async () => {
        reset();
        if (!email || !password) return setError("Please fill in all fields.");
        if (mode === "register" && !name) return setError("Please enter your name.");
        if (password.length < 6) return setError("Password must be at least 6 characters.");

        setLoading(true);
        if (mode === "login") {
            const { error: e } = await supabase.auth.signInWithPassword({ email, password });
            if (e) setError(e.message);
        } else {
            const { error: e } = await supabase.auth.signUp({
                email, password,
                options: { data: { full_name: name } },
            });
            if (e) setError(e.message);
            else setMsg("Account created! Check your email to confirm, then log in.");
        }
        setLoading(false);
    };

    const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

    return (
        <>
            <style>{CSS}</style>
            <div style={{ minHeight: "100vh", background: "#F5F4F0", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>
                <div style={{ width: "100%", maxWidth: 400 }}>

                    {/* Logo */}
                    <div style={{ textAlign: "center", marginBottom: 32 }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 28 }}>⚡</span>
                            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 30, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>GigTrack</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#9CA3AF" }}>Track your delivery earnings — Glovo, Uber Eats & Bolt</div>
                    </div>

                    {/* Card */}
                    <div className="auth-card" style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)" }}>
                        {/* Mode toggle */}
                        <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 12, padding: 4, marginBottom: 24 }}>
                            {["login", "register"].map(m => (
                                <button key={m} onClick={() => { setMode(m); reset(); }} style={{
                                    flex: 1, border: "none", borderRadius: 9, padding: "9px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s",
                                    background: mode === m ? "#fff" : "transparent",
                                    color: mode === m ? "#111827" : "#9CA3AF",
                                    boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                }}>
                                    {m === "login" ? "Sign In" : "Register"}
                                </button>
                            ))}
                        </div>

                        {mode === "register" && (
                            <Inp label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morshadul Alam" />
                        )}
                        <Inp label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                        <Inp label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" />

                        {error && (
                            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#DC2626" }}>
                                {error}
                            </div>
                        )}
                        {msg && (
                            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#16A34A" }}>
                                {msg}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            onKeyDown={handleKey}
                            disabled={loading}
                            style={{ width: "100%", border: "none", borderRadius: 10, padding: "13px", fontWeight: 600, fontSize: 15, cursor: loading ? "default" : "pointer", background: loading ? "#D1FAE5" : "#16A34A", color: "#fff", transition: "opacity 0.15s" }}
                        >
                            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
                        </button>
                    </div>

                    {/* Footer */}
                    <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#9CA3AF" }}>
                        Built by{" "}
                        <a href="https://morshadul.eu/" target="_blank" rel="noopener noreferrer" style={{ color: "#16A34A", fontWeight: 600, textDecoration: "none" }}>Morshadul</a>
                        {" "}· Lisbon 🇵🇹
                    </div>
                </div>
            </div>
        </>
    );
}