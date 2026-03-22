import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const DEDUCTED = ["Uber Eats", "Bolt"];
const netOf = (gross, platform) => DEDUCTED.includes(platform) ? gross * 0.92 : gross;
const fmt = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n ?? 0);

const Card = ({ children, style }) => (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 12, ...style }}>
        {children}
    </div>
);

export default function Admin({ adminUser, onSignOut }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        const [{ data: profiles }, { data: earnings }, { data: expenses }] = await Promise.all([
            supabase.from("profiles").select("*").order("created_at"),
            supabase.from("earnings").select("*"),
            supabase.from("expenses").select("*"),
        ]);

        const stats = (profiles || []).map(p => {
            const pEarnings = (earnings || []).filter(e => e.user_id === p.id);
            const pExpenses = (expenses || []).filter(e => e.user_id === p.id);
            const totalNet = pEarnings.reduce((s, e) => s + netOf(e.gross, e.platform), 0);
            const totalExp = pExpenses.filter(e => !e.pending).reduce((s, e) => s + e.amount, 0);

            // group earnings by platform
            const byPlatform = {};
            pEarnings.forEach(e => {
                byPlatform[e.platform] = (byPlatform[e.platform] || 0) + netOf(e.gross, e.platform);
            });

            // group expenses by category
            const byCat = {};
            pExpenses.filter(e => !e.pending).forEach(e => {
                byCat[e.category] = (byCat[e.category] || 0) + e.amount;
            });

            return { ...p, totalNet, totalExp, balance: totalNet - totalExp, earningCount: pEarnings.length, expenseCount: pExpenses.length, byPlatform, byCat, recentEarnings: [...pEarnings].sort((a, b) => b.date?.localeCompare(a.date)).slice(0, 5) };
        });

        setUsers(stats);
        setLoading(false);
    };

    const totalUsers = users.length;
    const totalEarned = users.reduce((s, u) => s + u.totalNet, 0);
    const totalExpenses = users.reduce((s, u) => s + u.totalExp, 0);

    const PCOL = { "Glovo": "#F59E0B", "Uber Eats": "#10B981", "Bolt": "#7C3AED" };

    return (
        <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#F5F4F0", minHeight: "100vh", paddingBottom: 60 }}>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Fraunces:wght@700&display=swap" rel="stylesheet" />

            {/* Header */}
            <div style={{ background: "#111827", padding: "18px 20px", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 18 }}>⚡</span>
                            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>GigTrack</span>
                            <span style={{ background: "#DC2626", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>ADMIN</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{adminUser.email}</div>
                    </div>
                    <button onClick={onSignOut} style={{ background: "#1F2937", border: "none", borderRadius: 8, padding: "8px 14px", color: "#9CA3AF", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                        Sign out
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>

                {/* Platform stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {[
                        ["Total Users", totalUsers + " users", "#3B82F6"],
                        ["Total Earned", fmt(totalEarned), "#16A34A"],
                        ["Total Spent", fmt(totalExpenses), "#DC2626"],
                    ].map(([l, v, c]) => (
                        <Card key={l} style={{ marginBottom: 0, textAlign: "center", padding: "14px 10px" }}>
                            <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>{l}</div>
                            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: c }}>{v}</div>
                        </Card>
                    ))}
                </div>

                {/* Refresh */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{totalUsers} registered users</div>
                    <button onClick={loadAll} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 14px", fontSize: 12, color: "#374151", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                        ↻ Refresh
                    </button>
                </div>

                {loading && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: 14 }}>Loading all users…</div>
                )}

                {!loading && users.map(u => (
                    <Card key={u.id} style={{ cursor: "pointer" }} onClick={() => setExpanded(expanded === u.id ? null : u.id)}>
                        {/* User row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#374151", flexShrink: 0 }}>
                                        {(u.full_name || u.email)?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{u.full_name || "—"}</div>
                                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>{u.email}</div>
                                    </div>
                                    {u.is_admin && <span style={{ background: "#DC262618", color: "#DC2626", borderRadius: 6, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>ADMIN</span>}
                                </div>
                                <div style={{ display: "flex", gap: 12, marginLeft: 42, fontSize: 12, color: "#6B7280" }}>
                                    <span>Joined {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}</span>
                                    <span>·</span>
                                    <span>{u.earningCount} earnings</span>
                                    <span>·</span>
                                    <span>{u.expenseCount} expenses</span>
                                </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: u.balance >= 0 ? "#16A34A" : "#DC2626" }}>{fmt(u.balance)}</div>
                                <div style={{ fontSize: 11, color: "#9CA3AF" }}>balance</div>
                            </div>
                        </div>

                        {/* Expanded details */}
                        {expanded === u.id && (
                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F3F4F6" }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                                    <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "12px 14px" }}>
                                        <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Net Earned</div>
                                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: "#16A34A" }}>{fmt(u.totalNet)}</div>
                                    </div>
                                    <div style={{ background: "#FEF2F2", borderRadius: 10, padding: "12px 14px" }}>
                                        <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Total Spent</div>
                                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: "#DC2626" }}>{fmt(u.totalExp)}</div>
                                    </div>
                                </div>

                                {/* By platform */}
                                {Object.keys(u.byPlatform).length > 0 && (
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>By Platform</div>
                                        {Object.entries(u.byPlatform).map(([p, n]) => (
                                            <div key={p} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #F9FAFB" }}>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: PCOL[p] || "#9CA3AF", display: "inline-block" }} />
                                                    {p}
                                                </span>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{fmt(n)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* By expense category */}
                                {Object.keys(u.byCat).length > 0 && (
                                    <div>
                                        <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Expenses by Category</div>
                                        {Object.entries(u.byCat).map(([cat, amt]) => (
                                            <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F9FAFB", fontSize: 13, color: "#374151" }}>
                                                <span>{cat}</span>
                                                <span style={{ fontWeight: 600, color: "#DC2626" }}>{fmt(amt)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {u.earningCount === 0 && u.expenseCount === 0 && (
                                    <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13, padding: "12px 0" }}>No activity yet</div>
                                )}
                            </div>
                        )}

                        <div style={{ textAlign: "right", marginTop: 8, fontSize: 11, color: "#D1D5DB" }}>
                            {expanded === u.id ? "▲ collapse" : "▼ expand"}
                        </div>
                    </Card>
                ))}

                {!loading && users.length === 0 && (
                    <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>○</div>
                        <div style={{ fontSize: 14 }}>No users yet</div>
                    </div>
                )}

                <div style={{ textAlign: "center", paddingTop: 24, fontSize: 12, color: "#9CA3AF" }}>
                    GigTrack Admin · Built by{" "}
                    <a href="https://morshadul.eu/" target="_blank" rel="noopener noreferrer" style={{ color: "#16A34A", textDecoration: "none", fontWeight: 600 }}>Morshadul</a>
                </div>
            </div>
        </div>
    );
}