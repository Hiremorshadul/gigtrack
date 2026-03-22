import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEDUCTED = ["Uber Eats", "Bolt"];
const PLATFORMS = ["Glovo", "Uber Eats", "Bolt"];
const EXP_CATS = ["Fuel / Oil", "Maintenance", "Repair", "Platform Fee", "Accessories / Tags", "Other"];

const INVESTMENT = [
    { id: "scooter", label: "Scooter", amount: 850, icon: "🛵" },
    { id: "insurance", label: "Insurance", amount: 165, icon: "🛡️" },
    { id: "registration", label: "Registration", amount: 75, icon: "📋" },
];
const TOTAL_INV = INVESTMENT.reduce((s, i) => s + i.amount, 0);

const PCOL = {
    "Glovo": { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B", chart: "#F59E0B" },
    "Uber Eats": { bg: "#D1FAE5", text: "#065F46", dot: "#10B981", chart: "#10B981" },
    "Bolt": { bg: "#EDE9FE", text: "#4C1D95", dot: "#7C3AED", chart: "#7C3AED" },
};
const CAT_COL = {
    "Fuel / Oil": "#F59E0B", "Maintenance": "#3B82F6", "Repair": "#EF4444",
    "Platform Fee": "#8B5CF6", "Accessories / Tags": "#06B6D4", "Other": "#6B7280",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n ?? 0);
const now = () => new Date().toISOString().split("T")[0];
const netOf = (gross, platform) => DEDUCTED.includes(platform) ? gross * 0.92 : gross;
const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Fraunces:wght@700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { background:#F5F4F0; font-family:'DM Sans',sans-serif; -webkit-font-smoothing:antialiased; }
  input,select,button { font-family:'DM Sans',sans-serif; }
  input:focus,select:focus { outline:2px solid #16A34A; outline-offset:1px; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
  .tab-bar::-webkit-scrollbar { display:none; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .page { animation:fadeUp 0.2s ease; }
  @keyframes modalIn { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
  .modal-box { animation:modalIn 0.22s ease; }
  @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
  .toast { animation:toastIn 0.2s ease; }
  .row-action:hover { color:#16A34A !important; }
  .row-del:hover { color:#EF4444 !important; }
  .row-hover:hover { background:#FAFAFA; border-radius:8px; }
`;

// ─── UI Primitives ────────────────────────────────────────────────────────────
const Card = ({ children, style }) => <div style={{ background: "#fff", borderRadius: 16, padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 12, ...style }}>{children}</div>;
const SecTitle = ({ children }) => <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>{children}</div>;
const FLabel = ({ children }) => <div style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", marginBottom: 5 }}>{children}</div>;
const FGroup = ({ label, children, style }) => <div style={{ flex: 1, ...style }}><FLabel>{label}</FLabel>{children}</div>;
const FRow = ({ children }) => <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>{children}</div>;
const Empty = ({ msg }) => <div style={{ textAlign: "center", padding: "28px 0", color: "#D1D5DB" }}><div style={{ fontSize: 24, marginBottom: 6 }}>○</div><div style={{ fontSize: 13 }}>{msg}</div></div>;

const Inp = ({ value, onChange, placeholder, type = "text" }) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", color: "#111827", fontSize: 14, width: "100%" }} />
);
const EuroInp = ({ value, onChange }) => (
    <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: 14 }}>€</span>
        <Inp type="number" value={value} onChange={onChange} placeholder="0.00" />
        <style>{`.euro-inp input { padding-left: 26px; }`}</style>
    </div>
);
const Sel = ({ value, onChange, options }) => (
    <select value={value} onChange={onChange} style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", color: "#111827", fontSize: 14, width: "100%", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
        {options.map(o => <option key={o}>{o}</option>)}
    </select>
);
const Btn = ({ onClick, children, color = "#16A34A", text = "#fff", disabled, style }) => (
    <button onClick={onClick} disabled={disabled} style={{ border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 600, fontSize: 14, cursor: disabled ? "default" : "pointer", background: disabled ? "#D1FAE5" : color, color: text, transition: "opacity 0.15s", opacity: disabled ? 0.7 : 1, ...style }}
        onMouseOver={e => { if (!disabled) e.currentTarget.style.opacity = ".85"; }}
        onMouseOut={e => { e.currentTarget.style.opacity = "1"; }}>
        {children}
    </button>
);
const PBadge = ({ platform }) => {
    const c = PCOL[platform] || { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" };
    return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: c.bg, color: c.text, borderRadius: 20, padding: "3px 10px 3px 7px", fontSize: 12, fontWeight: 600 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />{platform}</span>;
};
const CBadge = ({ cat }) => <span style={{ background: `${CAT_COL[cat] || "#6B7280"}18`, color: CAT_COL[cat] || "#6B7280", borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 500 }}>{cat}</span>;
const DBadge = () => <span style={{ background: "#EDE9FE", color: "#5B21B6", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 600 }}>−8%</span>;

const Modal = ({ title, onClose, children }) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-box" style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, padding: "24px 20px 36px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: "#111827" }}>{title}</div>
                <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18, color: "#6B7280" }}>×</button>
            </div>
            {children}
        </div>
    </div>
);

const ConfirmModal = ({ msg, onConfirm, onCancel }) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        onClick={e => e.target === e.currentTarget && onCancel()}>
        <div className="modal-box" style={{ background: "#fff", borderRadius: 16, padding: "24px", maxWidth: 340, width: "100%" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Remove entry?</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>{msg}</div>
            <div style={{ display: "flex", gap: 10 }}>
                <Btn onClick={onCancel} color="#F3F4F6" text="#374151" style={{ flex: 1 }}>Cancel</Btn>
                <Btn onClick={onConfirm} color="#DC2626" style={{ flex: 1 }}>Remove</Btn>
            </div>
        </div>
    </div>
);

const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}>
            {label && <div style={{ fontWeight: 600, color: "#111827", marginBottom: 4 }}>{label}</div>}
            {payload.map((p, i) => <div key={i} style={{ color: p.color || "#374151", fontWeight: 500 }}>{p.name}: {fmt(p.value)}</div>)}
        </div>
    );
};

// ═════════════════════════════════════════════════════════════════════════════
export default function Dashboard({ user, onSignOut }) {
    const [earnings, setEarnings] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("overview");
    const [toast, setToast] = useState(null);
    const [chartView, setChartView] = useState("weekly");
    const [earnModal, setEarnModal] = useState(null);
    const [expModal, setExpModal] = useState(null);
    const [confirmDel, setConfirmDel] = useState(null);

    const blankE = { weekLabel: "", dateFrom: now(), platform: "Glovo", gross: "", hours: "", note: "" };
    const blankX = { date: now(), category: "Fuel / Oil", amount: "", note: "", pending: false };
    const [eF, setEF] = useState(blankE);
    const [xF, setXF] = useState(blankX);

    const notify = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2400); };

    // ── Load user data on mount ──
    useEffect(() => {
        (async () => {
            setLoading(true);
            const [{ data: e, error: eErr }, { data: x, error: xErr }] = await Promise.all([
                supabase.from("earnings").select("*").eq("user_id", user.id).order("date"),
                supabase.from("expenses").select("*").eq("user_id", user.id).order("date"),
            ]);
            if (eErr || xErr) notify("Failed to load data", false);
            setEarnings(e || []);
            setExpenses(x || []);
            setLoading(false);
        })();
    }, [user.id]);

    // ── Earning CRUD ──
    const saveEarning = async () => {
        if (!eF.gross || isNaN(eF.gross)) return notify("Enter a valid amount", false);
        const entry = { ...eF, gross: Number(eF.gross), hours: eF.hours ? Number(eF.hours) : null };
        if (earnModal === "add") {
            const newEntry = { ...entry, id: uid(), user_id: user.id };
            setEarnings(prev => [...prev, newEntry]);  // optimistic
            setEarnModal(null); notify("Earning added ✓");
            const { error } = await supabase.from("earnings").insert(newEntry);
            if (error) { setEarnings(prev => prev.filter(e => e.id !== newEntry.id)); notify("Failed to save", false); }
        } else {
            const updated = { ...entry, id: earnModal.id, user_id: user.id };
            setEarnings(prev => prev.map(e => e.id === earnModal.id ? updated : e));
            setEarnModal(null); notify("Earning updated ✓");
            const { error } = await supabase.from("earnings").update(entry).eq("id", earnModal.id);
            if (error) notify("Failed to update — refresh page", false);
        }
        setEF(blankE);
    };

    // ── Expense CRUD ──
    const saveExpense = async () => {
        if (!xF.amount || isNaN(xF.amount)) return notify("Enter a valid amount", false);
        const entry = { ...xF, amount: Number(xF.amount) };
        if (expModal === "add") {
            const newEntry = { ...entry, id: uid(), user_id: user.id };
            setExpenses(prev => [...prev, newEntry]);
            setExpModal(null); notify("Expense added ✓");
            const { error } = await supabase.from("expenses").insert(newEntry);
            if (error) { setExpenses(prev => prev.filter(e => e.id !== newEntry.id)); notify("Failed to save", false); }
        } else {
            const updated = { ...entry, id: expModal.id, user_id: user.id };
            setExpenses(prev => prev.map(e => e.id === expModal.id ? updated : e));
            setExpModal(null); notify("Expense updated ✓");
            const { error } = await supabase.from("expenses").update(entry).eq("id", expModal.id);
            if (error) notify("Failed to update — refresh page", false);
        }
        setXF(blankX);
    };

    // ── Delete ──
    const askDelete = (type, id, label) => setConfirmDel({ type, id, label });
    const doDelete = async () => {
        const { type, id } = confirmDel;
        if (type === "earnings") setEarnings(prev => prev.filter(e => e.id !== id));
        else setExpenses(prev => prev.filter(e => e.id !== id));
        setConfirmDel(null); notify("Removed");
        await supabase.from(type).delete().eq("id", id);
    };

    const openAddEarn = () => { setEF(blankE); setEarnModal("add"); };
    const openEditEarn = (e) => { setEF({ ...e, gross: String(e.gross), hours: String(e.hours || "") }); setEarnModal(e); };
    const openAddExp = () => { setXF(blankX); setExpModal("add"); };
    const openEditExp = (e) => { setXF({ ...e, amount: String(e.amount) }); setExpModal(e); };

    // ── Derived ──
    const allNet = earnings.map(e => ({ ...e, netAmt: netOf(e.gross, e.platform) }));
    const totalGross = earnings.reduce((s, e) => s + e.gross, 0);
    const totalNet = allNet.reduce((s, e) => s + e.netAmt, 0);
    const totalDed = totalGross - totalNet;
    const paidExp = expenses.filter(e => !e.pending).reduce((s, e) => s + e.amount, 0);
    const pendingExp = expenses.filter(e => e.pending).reduce((s, e) => s + e.amount, 0);
    const netBal = totalNet - paidExp;
    const roiPct = Math.min((totalNet / TOTAL_INV) * 100, 100);
    const byPlatform = PLATFORMS.map(p => ({
        p,
        gross: earnings.filter(e => e.platform === p).reduce((s, e) => s + e.gross, 0),
        net: allNet.filter(e => e.platform === p).reduce((s, e) => s + e.netAmt, 0),
    })).filter(p => p.gross > 0);

    // ── Week + Month maps ──
    const weekMap = useMemo(() => {
        const m = {};
        allNet.forEach(e => {
            const k = e.weekLabel || e.dateFrom || e.date;
            if (!m[k]) m[k] = { label: k, platforms: {}, net: 0, gross: 0 };
            m[k].platforms[e.platform] = (m[k].platforms[e.platform] || 0) + e.netAmt;
            m[k].net += e.netAmt; m[k].gross += e.gross;
        });
        return Object.values(m);
    }, [earnings]);

    const monthMap = useMemo(() => {
        const MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = {};
        allNet.forEach(e => {
            const d = new Date(e.date || now());
            const k = `${MN[d.getMonth()]} ${d.getFullYear()}`;
            if (!m[k]) m[k] = { label: k, sortKey: d.getFullYear() * 100 + d.getMonth(), platforms: {}, net: 0, gross: 0, expenses: 0 };
            m[k].platforms[e.platform] = (m[k].platforms[e.platform] || 0) + e.netAmt;
            m[k].net += e.netAmt; m[k].gross += e.gross;
        });
        expenses.filter(e => !e.pending).forEach(e => {
            const d = new Date(e.date || now());
            const k = `${MN[d.getMonth()]} ${d.getFullYear()}`;
            if (m[k]) m[k].expenses += e.amount;
        });
        return Object.values(m).sort((a, b) => a.sortKey - b.sortKey);
    }, [earnings, expenses]);

    const activeMap = chartView === "monthly" ? monthMap : weekMap;
    const chartData = activeMap.map(w => ({
        name: w.label,
        Glovo: +(w.platforms["Glovo"] || 0).toFixed(2),
        "Uber Eats": +(w.platforms["Uber Eats"] || 0).toFixed(2),
        Bolt: +(w.platforms["Bolt"] || 0).toFixed(2),
        Net: +w.net.toFixed(2),
        Expenses: +(w.expenses || 0).toFixed(2),
    }));

    const piePlatform = byPlatform.map(p => ({ name: p.p, value: +p.net.toFixed(2), color: PCOL[p.p]?.chart || "#9CA3AF" }));
    const pieExp = useMemo(() => {
        const m = {};
        expenses.filter(e => !e.pending).forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; });
        return Object.entries(m).map(([name, value]) => ({ name, value: +value.toFixed(2), color: CAT_COL[name] || "#6B7280" }));
    }, [expenses]);

    const monthExpCat = useMemo(() => {
        const MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = {};
        expenses.filter(e => !e.pending).forEach(e => {
            const d = new Date(e.date || now());
            const k = `${MN[d.getMonth()]} ${d.getFullYear()}`;
            if (!m[k]) m[k] = { name: k, sortKey: d.getFullYear() * 100 + d.getMonth() };
            m[k][e.category] = (m[k][e.category] || 0) + e.amount;
        });
        return Object.values(m).sort((a, b) => a.sortKey - b.sortKey);
    }, [expenses]);

    const previewNet = eF.gross && !isNaN(eF.gross) && Number(eF.gross) > 0 ? netOf(Number(eF.gross), eF.platform) : null;
    const TABS = ["overview", "weekly", "earnings", "expenses", "analytics", "investment"];

    if (loading) return (
        <>
            <style>{CSS}</style>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F5F4F0", fontFamily: "'DM Sans',sans-serif", color: "#9CA3AF", fontSize: 14 }}>
                Loading your data…
            </div>
        </>
    );

    return (
        <>
            <style>{CSS}</style>

            {/* ── Header ── */}
            <div style={{ background: "#fff", borderBottom: "1px solid #F3F4F6", position: "sticky", top: 0, zIndex: 20 }}>
                <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0 13px" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <span style={{ fontSize: 20 }}>⚡</span>
                                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>GigTrack</span>
                            </div>
                            <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>
                                {user.user_metadata?.full_name || user.email}
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Balance</div>
                                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: netBal >= 0 ? "#16A34A" : "#DC2626" }}>{fmt(netBal)}</div>
                            </div>
                            <button onClick={onSignOut} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: "#6B7280", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div style={{ background: "#fff", borderBottom: "1px solid #F3F4F6", position: "sticky", top: 66, zIndex: 19 }}>
                <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
                    <div className="tab-bar" style={{ display: "flex", gap: 0, overflowX: "auto" }}>
                        {TABS.map(t => (
                            <button key={t} onClick={() => setTab(t)} style={{
                                border: "none", background: "transparent", padding: "12px 12px", fontSize: 13,
                                fontWeight: tab === t ? 600 : 400, color: tab === t ? "#16A34A" : "#6B7280",
                                cursor: "pointer", whiteSpace: "nowrap",
                                borderBottom: tab === t ? "2px solid #16A34A" : "2px solid transparent",
                                transition: "all 0.15s", textTransform: "capitalize",
                            }}>{t}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 100px" }}>

                {/* ════ OVERVIEW ════ */}
                {tab === "overview" && (
                    <div className="page">
                        <div style={{ background: "linear-gradient(135deg,#16A34A,#15803D)", borderRadius: 20, padding: "24px 24px 20px", marginBottom: 12, color: "#fff", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                            <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Net Balance</div>
                            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 40, fontWeight: 700, letterSpacing: "-1px", lineHeight: 1 }}>{fmt(netBal)}</div>
                            <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
                                {[["Earned", fmt(totalNet)], ["Spent", fmt(paidExp)], ["Invested", fmt(TOTAL_INV)]].map(([l, v]) => (
                                    <div key={l}>
                                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{l}</div>
                                        <div style={{ fontSize: 15, fontWeight: 600 }}>{v}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {totalDed > 0 && (
                            <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 12, padding: "12px 14px", marginBottom: 12, fontSize: 13, color: "#5B21B6", display: "flex", gap: 10 }}>
                                <span>⚡</span>
                                <div><strong>8% fleet deduction</strong> on Uber Eats & Bolt<br />
                                    <span style={{ fontSize: 12, color: "#7C3AED" }}>Gross {fmt(totalGross)} → −{fmt(totalDed)} → Net <strong style={{ color: "#16A34A" }}>{fmt(totalNet)}</strong></span>
                                </div>
                            </div>
                        )}

                        <Card>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
                                <div>
                                    <SecTitle>Investment Recovery</SecTitle>
                                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700, color: "#111827" }}>{roiPct.toFixed(1)}%</div>
                                    <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>of {fmt(TOTAL_INV)} recovered</div>
                                </div>
                                <div style={{ textAlign: "right", fontSize: 12, color: "#9CA3AF" }}>
                                    <div style={{ color: "#16A34A", fontWeight: 600 }}>↑ {fmt(totalNet)}</div>
                                    <div>to go: {fmt(Math.max(TOTAL_INV - totalNet, 0))}</div>
                                </div>
                            </div>
                            <div style={{ background: "#F3F4F6", borderRadius: 999, height: 8, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${roiPct}%`, background: "linear-gradient(90deg,#16A34A,#4ADE80)", borderRadius: 999, transition: "width 0.6s" }} />
                            </div>
                        </Card>

                        {byPlatform.length > 0 && (
                            <Card>
                                <SecTitle>Earnings by Platform</SecTitle>
                                {byPlatform.map(({ p, gross, net: n }) => (
                                    <div key={p} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><PBadge platform={p} />{DEDUCTED.includes(p) && <DBadge />}</div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{fmt(n)}</div>
                                            {DEDUCTED.includes(p) && <div style={{ fontSize: 11, color: "#9CA3AF" }}>gross {fmt(gross)}</div>}
                                        </div>
                                    </div>
                                ))}
                            </Card>
                        )}

                        <Card>
                            <SecTitle>Full Summary</SecTitle>
                            {[
                                ["Startup Investment", fmt(TOTAL_INV), "#D97706"],
                                ["Running Expenses", fmt(paidExp), "#DC2626"],
                                ["Fleet Deductions", "−" + fmt(totalDed), "#7C3AED"],
                                ["Gross Earned", fmt(totalGross), "#6B7280"],
                                ["Net Earned", fmt(totalNet), "#16A34A"],
                            ].map(([l, v, c], i, arr) => (
                                <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                                    <span style={{ fontSize: 13, color: "#6B7280" }}>{l}</span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: c }}>{v}</span>
                                </div>
                            ))}
                        </Card>

                        {pendingExp > 0 && (
                            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px" }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#92400E", marginBottom: 2 }}>⏳ Pending / Unpaid</div>
                                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: "#D97706" }}>{fmt(pendingExp)}</div>
                                <div style={{ fontSize: 12, color: "#B45309", marginTop: 2 }}>Record in Weekly tab when paid</div>
                            </div>
                        )}

                        {earnings.length === 0 && expenses.length === 0 && (
                            <div style={{ textAlign: "center", padding: "24px 0" }}>
                                <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 12 }}>No data yet — start tracking your first earnings</div>
                                <Btn onClick={openAddEarn} style={{ marginRight: 8 }}>＋ Add Earning</Btn>
                                <Btn onClick={openAddExp} color="#DC2626">＋ Add Expense</Btn>
                            </div>
                        )}
                    </div>
                )}

                {/* ════ WEEKLY ════ */}
                {tab === "weekly" && (
                    <div className="page">
                        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                            <Btn onClick={openAddEarn} style={{ flex: 1 }}>＋ Add Earning</Btn>
                            <Btn onClick={openAddExp} color="#DC2626" style={{ flex: 1 }}>＋ Add Expense</Btn>
                        </div>
                        <Card>
                            <SecTitle>Week by Week</SecTitle>
                            {weekMap.length === 0 ? <Empty msg="No entries yet" /> : weekMap.map(w => (
                                <div key={w.label} style={{ padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{w.label}</span>
                                        <span style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: "#16A34A" }}>{fmt(w.net)}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                        {Object.entries(w.platforms).map(([p, n]) => (
                                            <span key={p} style={{ fontSize: 11, background: PCOL[p]?.bg || "#F3F4F6", color: PCOL[p]?.text || "#374151", borderRadius: 6, padding: "2px 8px", fontWeight: 500 }}>{p}: {fmt(n)}</span>
                                        ))}
                                        {w.gross !== w.net && <span style={{ fontSize: 11, background: "#F5F3FF", color: "#5B21B6", borderRadius: 6, padding: "2px 8px" }}>gross {fmt(w.gross)}</span>}
                                    </div>
                                </div>
                            ))}
                            {weekMap.length > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, fontSize: 13 }}>
                                    <span style={{ color: "#9CA3AF" }}>Gross: {fmt(totalGross)}</span>
                                    <span style={{ fontWeight: 600, color: "#16A34A" }}>Net: {fmt(totalNet)}</span>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* ════ EARNINGS ════ */}
                {tab === "earnings" && (
                    <div className="page">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div style={{ fontSize: 13, color: "#6B7280" }}>{earnings.length} entries · {fmt(totalNet)} net</div>
                            <Btn onClick={openAddEarn} style={{ padding: "9px 16px", fontSize: 13 }}>＋ Add</Btn>
                        </div>
                        <Card>
                            {earnings.length === 0 ? <Empty msg="No earnings yet" /> : [...allNet].reverse().map((e, i, arr) => (
                                <div key={e.id} className="row-hover" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 8px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none", transition: "background 0.12s" }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                                            <PBadge platform={e.platform} />{DEDUCTED.includes(e.platform) && <DBadge />}
                                            <span style={{ fontSize: 11, color: "#9CA3AF" }}>{e.weekLabel || e.dateFrom || e.date}</span>
                                        </div>
                                        {e.hours && <div style={{ fontSize: 11, color: "#9CA3AF" }}>{e.hours}h · {fmt(e.netAmt / e.hours)}/hr</div>}
                                        {e.note && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{e.note}</div>}
                                    </div>
                                    <div style={{ textAlign: "right", marginLeft: 12, flexShrink: 0 }}>
                                        <div style={{ fontSize: 15, fontWeight: 600, color: "#16A34A" }}>{fmt(e.netAmt)}</div>
                                        {e.gross !== e.netAmt && <div style={{ fontSize: 11, color: "#9CA3AF" }}>gross {fmt(e.gross)}</div>}
                                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                                            <button className="row-action" onClick={() => openEditEarn(e)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9CA3AF", padding: 0 }}>edit</button>
                                            <button className="row-del" onClick={() => askDelete("earnings", e.id, `${e.platform} – ${fmt(e.gross)}`)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9CA3AF", padding: 0 }}>remove</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Card>
                    </div>
                )}

                {/* ════ EXPENSES ════ */}
                {tab === "expenses" && (
                    <div className="page">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div style={{ fontSize: 13, color: "#6B7280" }}>{expenses.length} entries · {fmt(paidExp)} paid</div>
                            <Btn onClick={openAddExp} color="#DC2626" style={{ padding: "9px 16px", fontSize: 13 }}>＋ Add</Btn>
                        </div>
                        <Card>
                            {expenses.length === 0 ? <Empty msg="No expenses yet" /> : [...expenses].reverse().map((e, i, arr) => (
                                <div key={e.id} className="row-hover" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 8px", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none", transition: "background 0.12s" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                                            <CBadge cat={e.category} /><span style={{ fontSize: 11, color: "#9CA3AF" }}>{e.date}</span>
                                            {e.pending && <span style={{ background: "#FFFBEB", color: "#D97706", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>PENDING</span>}
                                        </div>
                                        {e.note && <div style={{ fontSize: 11, color: "#9CA3AF" }}>{e.note}</div>}
                                    </div>
                                    <div style={{ textAlign: "right", marginLeft: 12, flexShrink: 0 }}>
                                        <div style={{ fontSize: 15, fontWeight: 600, color: e.pending ? "#D97706" : "#DC2626" }}>{fmt(e.amount)}</div>
                                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                                            <button className="row-action" onClick={() => openEditExp(e)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9CA3AF", padding: 0 }}>edit</button>
                                            <button className="row-del" onClick={() => askDelete("expenses", e.id, `${e.category} – ${fmt(e.amount)}`)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9CA3AF", padding: 0 }}>remove</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Card>
                    </div>
                )}

                {/* ════ ANALYTICS ════ */}
                {tab === "analytics" && (
                    <div className="page">
                        <div style={{ display: "flex", background: "#fff", borderRadius: 12, padding: 4, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                            {["weekly", "monthly"].map(v => (
                                <button key={v} onClick={() => setChartView(v)} style={{ flex: 1, border: "none", borderRadius: 9, padding: "9px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s", background: chartView === v ? "#16A34A" : "transparent", color: chartView === v ? "#fff" : "#9CA3AF" }}>
                                    {v === "weekly" ? "📅 Weekly" : "🗓 Monthly"}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                            {(chartView === "weekly" ? [
                                ["Best Week", activeMap.length ? fmt(Math.max(...activeMap.map(w => w.net))) : fmt(0), "#16A34A"],
                                ["Avg / Week", fmt(activeMap.length ? totalNet / activeMap.length : 0), "#3B82F6"],
                                ["Weeks", activeMap.length + " wks", "#6B7280"],
                            ] : [
                                ["Best Month", activeMap.length ? fmt(Math.max(...activeMap.map(w => w.net))) : fmt(0), "#16A34A"],
                                ["Avg / Month", fmt(activeMap.length ? totalNet / activeMap.length : 0), "#3B82F6"],
                                ["Months", activeMap.length + " mo", "#6B7280"],
                            ]).map(([l, v, c]) => (
                                <Card key={l} style={{ marginBottom: 0, padding: "14px 10px", textAlign: "center" }}>
                                    <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>{l}</div>
                                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: c }}>{v}</div>
                                </Card>
                            ))}
                        </div>

                        <Card>
                            <SecTitle>{chartView === "monthly" ? "Monthly" : "Weekly"} Earnings by Platform</SecTitle>
                            {chartData.length === 0 ? <Empty msg="No data yet" /> : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barSize={chartView === "monthly" ? 26 : 12}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                                        <Tooltip content={<ChartTip />} /><Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                                        <Bar dataKey="Glovo" stackId="a" fill={PCOL["Glovo"]["chart"]} radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="Uber Eats" stackId="a" fill={PCOL["Uber Eats"]["chart"]} radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="Bolt" stackId="a" fill={PCOL["Bolt"]["chart"]} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Card>

                        {chartView === "monthly" && monthMap.length > 0 && (
                            <Card>
                                <SecTitle>Monthly Earnings vs Expenses</SecTitle>
                                <ResponsiveContainer width="100%" height={190}>
                                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barSize={20} barGap={4}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                                        <Tooltip content={<ChartTip />} /><Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                                        <Bar dataKey="Net" fill="#16A34A" radius={[4, 4, 0, 0]} name="Earnings" />
                                        <Bar dataKey="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expenses" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                        )}

                        <Card>
                            <SecTitle>Net Earnings Trend</SecTitle>
                            {chartData.length === 0 ? <Empty msg="No data yet" /> : (
                                <ResponsiveContainer width="100%" height={170}>
                                    <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                                        <Tooltip content={<ChartTip />} />
                                        <Line type="monotone" dataKey="Net" stroke="#16A34A" strokeWidth={2.5} dot={{ fill: "#16A34A", r: 4 }} activeDot={{ r: 6 }} name="Net Earned" />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </Card>

                        {chartView === "monthly" && monthExpCat.length > 0 && (
                            <Card>
                                <SecTitle>Monthly Expenses by Category</SecTitle>
                                <ResponsiveContainer width="100%" height={190}>
                                    <BarChart data={monthExpCat} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barSize={10}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                                        <Tooltip content={<ChartTip />} /><Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                                        {EXP_CATS.map((cat, i) => <Bar key={cat} dataKey={cat} stackId="x" fill={CAT_COL[cat] || "#6B7280"} radius={i === EXP_CATS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />)}
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <Card style={{ marginBottom: 0 }}>
                                <SecTitle>Platform Split</SecTitle>
                                {piePlatform.length === 0 ? <Empty msg="No data" /> : (
                                    <ResponsiveContainer width="100%" height={120}>
                                        <PieChart><Pie data={piePlatform} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                                            {piePlatform.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie><Tooltip content={<ChartTip />} /></PieChart>
                                    </ResponsiveContainer>
                                )}
                                <div style={{ marginTop: 6 }}>{piePlatform.map(p => (
                                    <div key={p.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6B7280", padding: "2px 0" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, display: "inline-block" }} />{p.name}</span>
                                        <span style={{ fontWeight: 600 }}>{fmt(p.value)}</span>
                                    </div>
                                ))}</div>
                            </Card>
                            <Card style={{ marginBottom: 0 }}>
                                <SecTitle>Expense Split</SecTitle>
                                {pieExp.length === 0 ? <Empty msg="No data" /> : (
                                    <ResponsiveContainer width="100%" height={120}>
                                        <PieChart><Pie data={pieExp} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                                            {pieExp.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie><Tooltip content={<ChartTip />} /></PieChart>
                                    </ResponsiveContainer>
                                )}
                                <div style={{ marginTop: 6 }}>{pieExp.map(c => (
                                    <div key={c.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6B7280", padding: "2px 0" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: c.color, display: "inline-block" }} />{c.name.split(" / ")[0]}</span>
                                        <span style={{ fontWeight: 600 }}>{fmt(c.value)}</span>
                                    </div>
                                ))}</div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ════ INVESTMENT ════ */}
                {tab === "investment" && (
                    <div className="page">
                        <div style={{ background: "linear-gradient(135deg,#D97706,#B45309)", borderRadius: 20, padding: "24px", marginBottom: 12, color: "#fff" }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Total Invested</div>
                            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 40, fontWeight: 700, letterSpacing: "-1px" }}>{fmt(TOTAL_INV)}</div>
                        </div>
                        {INVESTMENT.map(i => (
                            <Card key={i.id} style={{ padding: "16px 20px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{i.icon}</div>
                                        <div><div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{i.label}</div><div style={{ fontSize: 12, color: "#9CA3AF" }}>One-time</div></div>
                                    </div>
                                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: "#D97706" }}>{fmt(i.amount)}</div>
                                </div>
                            </Card>
                        ))}
                        <Card>
                            <SecTitle>Recovery Progress</SecTitle>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                                <span style={{ color: "#16A34A", fontWeight: 500 }}>Recovered: {fmt(totalNet)}</span>
                                <span style={{ color: "#DC2626", fontWeight: 500 }}>Still need: {fmt(Math.max(TOTAL_INV - totalNet, 0))}</span>
                            </div>
                            <div style={{ background: "#F3F4F6", borderRadius: 999, height: 12, overflow: "hidden", marginBottom: 8 }}>
                                <div style={{ height: "100%", width: `${roiPct}%`, background: "linear-gradient(90deg,#D97706,#16A34A)", borderRadius: 999, transition: "width 0.6s" }} />
                            </div>
                            <div style={{ textAlign: "center", fontSize: 13, color: "#6B7280" }}>{roiPct.toFixed(1)}% of {fmt(TOTAL_INV)} recovered</div>
                        </Card>
                    </div>
                )}

                {/* Footer */}
                <div style={{ textAlign: "center", paddingTop: 24 }}>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                        Built by{" "}
                        <a href="https://morshadul.eu/" target="_blank" rel="noopener noreferrer" style={{ color: "#16A34A", fontWeight: 600, textDecoration: "none" }}>Morshadul</a>
                        {" "}· GigTrack © {new Date().getFullYear()} · Lisbon 🇵🇹
                    </div>
                </div>
            </div>

            {/* ════ EARNING MODAL ════ */}
            {earnModal && (
                <Modal title={earnModal === "add" ? "Add Earning" : "Edit Earning"} onClose={() => { setEarnModal(null); setEF(blankE); }}>
                    <FRow>
                        <FGroup label="Week / Period"><Inp value={eF.weekLabel} onChange={e => setEF(p => ({ ...p, weekLabel: e.target.value }))} placeholder="e.g. 16–22 Mar" /></FGroup>
                        <FGroup label="Date"><Inp type="date" value={eF.dateFrom} onChange={e => setEF(p => ({ ...p, dateFrom: e.target.value }))} /></FGroup>
                    </FRow>
                    <FRow>
                        <FGroup label="Platform"><Sel value={eF.platform} onChange={e => setEF(p => ({ ...p, platform: e.target.value }))} options={PLATFORMS} /></FGroup>
                        <FGroup label="Gross Amount">
                            <div style={{ position: "relative" }}>
                                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: 14 }}>€</span>
                                <input type="number" value={eF.gross} onChange={e => setEF(p => ({ ...p, gross: e.target.value }))} placeholder="0.00"
                                    style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 12px 10px 26px", color: "#111827", fontSize: 14, width: "100%", fontFamily: "'DM Sans',sans-serif" }} />
                            </div>
                        </FGroup>
                    </FRow>
                    <FRow>
                        <FGroup label="Hours Worked"><Inp type="number" value={eF.hours} onChange={e => setEF(p => ({ ...p, hours: e.target.value }))} placeholder="optional" /></FGroup>
                        <FGroup label="Note"><Inp value={eF.note} onChange={e => setEF(p => ({ ...p, note: e.target.value }))} placeholder="optional" /></FGroup>
                    </FRow>
                    {previewNet !== null && (
                        <div style={{ background: DEDUCTED.includes(eF.platform) ? "#F5F3FF" : "#F0FDF4", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
                            {DEDUCTED.includes(eF.platform)
                                ? <>{fmt(Number(eF.gross))} <span style={{ color: "#7C3AED" }}>− 8% ({fmt(Number(eF.gross) * 0.08)})</span> = <strong style={{ color: "#16A34A" }}>{fmt(previewNet)} net</strong></>
                                : <>Glovo: no deduction → <strong style={{ color: "#16A34A" }}>{fmt(previewNet)}</strong></>}
                        </div>
                    )}
                    <Btn onClick={saveEarning} style={{ width: "100%" }}>{earnModal === "add" ? "Save Earning" : "Update Earning"}</Btn>
                </Modal>
            )}

            {/* ════ EXPENSE MODAL ════ */}
            {expModal && (
                <Modal title={expModal === "add" ? "Add Expense" : "Edit Expense"} onClose={() => { setExpModal(null); setXF(blankX); }}>
                    <FRow>
                        <FGroup label="Date"><Inp type="date" value={xF.date} onChange={e => setXF(p => ({ ...p, date: e.target.value }))} /></FGroup>
                        <FGroup label="Category"><Sel value={xF.category} onChange={e => setXF(p => ({ ...p, category: e.target.value }))} options={EXP_CATS} /></FGroup>
                    </FRow>
                    <FRow>
                        <FGroup label="Amount">
                            <div style={{ position: "relative" }}>
                                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: 14 }}>€</span>
                                <input type="number" value={xF.amount} onChange={e => setXF(p => ({ ...p, amount: e.target.value }))} placeholder="0.00"
                                    style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 12px 10px 26px", color: "#111827", fontSize: 14, width: "100%", fontFamily: "'DM Sans',sans-serif" }} />
                            </div>
                        </FGroup>
                        <FGroup label="Note"><Inp value={xF.note} onChange={e => setXF(p => ({ ...p, note: e.target.value }))} placeholder="optional" /></FGroup>
                    </FRow>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer", fontSize: 13, color: "#6B7280" }}>
                        <input type="checkbox" checked={xF.pending} onChange={e => setXF(p => ({ ...p, pending: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#F59E0B" }} />
                        Mark as pending (not paid yet)
                    </label>
                    <Btn onClick={saveExpense} color="#DC2626" style={{ width: "100%" }}>{expModal === "add" ? "Save Expense" : "Update Expense"}</Btn>
                </Modal>
            )}

            {confirmDel && <ConfirmModal msg={`Remove: ${confirmDel.label}`} onConfirm={doDelete} onCancel={() => setConfirmDel(null)} />}

            {toast && (
                <div className="toast" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#111827" : "#DC2626", color: "#fff", borderRadius: 10, padding: "11px 22px", fontSize: 13, fontWeight: 500, zIndex: 100, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                    {toast.msg}
                </div>
            )}
        </>
    );
}