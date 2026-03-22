import { useState, useEffect } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const FLEET_DEDUCTION = 0.08;
const PLATFORMS_WITH_DEDUCTION = ["Uber Eats", "Bolt"];

const INITIAL_INVESTMENT = [
  { id: "scooter",       label: "Scooter (Secondhand)", amount: 850,  icon: "🛵" },
  { id: "insurance",    label: "Insurance",             amount: 165,  icon: "🛡️" },
  { id: "registration", label: "Registration",          amount: 75,   icon: "📋" },
];
const TOTAL_INVESTED = INITIAL_INVESTMENT.reduce((s, i) => s + i.amount, 0);

const PLATFORMS    = ["Glovo", "Uber Eats", "Bolt"];
const EXPENSE_CATS = ["Fuel / Oil", "Maintenance", "Repair", "Platform Fee", "Accessories / Tags", "Other"];
const PCOL = { "Glovo": "#f0a500", "Uber Eats": "#6ee7b7", "Bolt": "#a78bfa" };

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_EARNINGS = [
  { id: "w1g", date: "2025-02-16", weekLabel: "16–22 Feb",    platform: "Glovo",     gross: 35.87  },
  { id: "w1u", date: "2025-02-16", weekLabel: "16–22 Feb",    platform: "Uber Eats", gross: 83.02  },
  { id: "w2g", date: "2025-02-23", weekLabel: "23 Feb–1 Mar", platform: "Glovo",     gross: 27.98  },
  { id: "w2u", date: "2025-02-23", weekLabel: "23 Feb–1 Mar", platform: "Uber Eats", gross: 133.14 },
  { id: "w3u", date: "2025-03-02", weekLabel: "2–8 Mar",      platform: "Uber Eats", gross: 23.50  },
  { id: "w3g", date: "2025-03-02", weekLabel: "2–8 Mar",      platform: "Glovo",     gross: 5.66   },
  { id: "w4g", date: "2025-03-09", weekLabel: "9–15 Mar",     platform: "Glovo",     gross: 5.13   },
  { id: "w4u", date: "2025-03-09", weekLabel: "9–15 Mar",     platform: "Uber Eats", gross: 9.21   },
  { id: "b1",  date: "2025-02-28", weekLabel: "28 Feb",       platform: "Bolt",      gross: 3.48   },
  { id: "b2",  date: "2025-03-01", weekLabel: "1 Mar",        platform: "Bolt",      gross: 4.20   },
  { id: "b3",  date: "2025-03-02", weekLabel: "2 Mar",        platform: "Bolt",      gross: 3.38   },
];

const SEED_EXPENSES = [
  { id: "e1", date: "2025-02-16", category: "Fuel / Oil",   amount: 12.80, note: "Oil purchase",      pending: false },
  { id: "e2", date: "2025-02-16", category: "Platform Fee", amount: 120,   note: "Uber Eats app fee", pending: false },
  { id: "e3", date: "2025-02-16", category: "Platform Fee", amount: 10,    note: "Bolt app fee",      pending: false },
  { id: "e4", date: "2025-02-16", category: "Platform Fee", amount: 50,    note: "Glovo app fee",     pending: false },
];

const defaultData = { earnings: SEED_EARNINGS, expenses: SEED_EXPENSES, pendingRepair: true };

// ─── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "gigtrack-v1";

const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    const eIds = new Set(stored.earnings.map(e => e.id));
    const xIds = new Set(stored.expenses.map(e => e.id));
    const missingE = SEED_EARNINGS.filter(e => !eIds.has(e.id));
    const missingX = SEED_EXPENSES.filter(e => !xIds.has(e.id));
    return {
      ...stored,
      earnings: [...missingE, ...stored.earnings],
      expenses: [...missingX, ...stored.expenses],
    };
  } catch { return null; }
};

const saveData = (d) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtE   = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n ?? 0);
const today  = () => new Date().toISOString().split("T")[0];
const netAmt = (gross, platform) =>
  PLATFORMS_WITH_DEDUCTION.includes(platform) ? gross * (1 - FLEET_DEDUCTION) : gross;

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [data,  setData]  = useState(() => loadData() || defaultData);
  const [tab,   setTab]   = useState("overview");
  const [toast, setToast] = useState(null);

  const [wForm, setWForm] = useState({ weekLabel: "", dateFrom: today(), platform: "Glovo", gross: "", hours: "", note: "" });
  const [eForm, setEForm] = useState({ date: today(), category: "Fuel / Oil", amount: "", note: "", pending: false });
  const [repairAmt, setRepairAmt] = useState("");

  const persist    = (d) => { setData(d); saveData(d); };
  const showToast  = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };

  // ── Computed ──────────────────────────────────────────────────────────────
  const allNet     = data.earnings.map(e => ({ ...e, net: netAmt(e.gross, e.platform) }));
  const totalGross = data.earnings.reduce((s, e) => s + e.gross, 0);
  const totalNet   = allNet.reduce((s, e) => s + e.net, 0);
  const totalDed   = totalGross - totalNet;
  const paidExp    = data.expenses.filter(e => !e.pending).reduce((s, e) => s + e.amount, 0);
  const pendingExp = data.expenses.filter(e => e.pending).reduce((s, e) => s + e.amount, 0);
  const netBal     = totalNet - paidExp;
  const roiPct     = ((totalNet / TOTAL_INVESTED) * 100).toFixed(1);

  const byPlatform = PLATFORMS.map(p => ({
    p,
    gross: data.earnings.filter(e => e.platform === p).reduce((s, e) => s + e.gross, 0),
    net:   allNet.filter(e => e.platform === p).reduce((s, e) => s + e.net, 0),
  }));

  const weekMap = {};
  allNet.forEach(e => {
    const k = e.weekLabel || e.dateFrom || e.date;
    if (!weekMap[k]) weekMap[k] = { label: k, platforms: {}, net: 0, gross: 0 };
    weekMap[k].platforms[e.platform] = (weekMap[k].platforms[e.platform] || 0) + e.net;
    weekMap[k].net += e.net;
    weekMap[k].gross += e.gross;
  });
  const weeks = Object.values(weekMap);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const addEarning = () => {
    if (!wForm.gross || isNaN(wForm.gross)) return showToast("Enter a valid gross amount", "err");
    persist({ ...data, earnings: [...data.earnings, { ...wForm, id: Date.now().toString(), gross: Number(wForm.gross) }] });
    setWForm({ weekLabel: "", dateFrom: today(), platform: "Glovo", gross: "", hours: "", note: "" });
    showToast("Earning added ✓");
  };

  const addExpense = () => {
    if (!eForm.amount || isNaN(eForm.amount)) return showToast("Enter a valid amount", "err");
    persist({ ...data, expenses: [...data.expenses, { ...eForm, id: Date.now().toString(), amount: Number(eForm.amount) }] });
    setEForm({ date: today(), category: "Fuel / Oil", amount: "", note: "", pending: false });
    showToast("Expense added ✓");
  };

  const settleRepair = () => {
    if (!repairAmt || isNaN(repairAmt)) return showToast("Enter repair cost", "err");
    persist({
      ...data,
      pendingRepair: false,
      expenses: [...data.expenses, { id: Date.now().toString(), date: today(), category: "Repair", amount: Number(repairAmt), note: "Scooter repair", pending: false }],
    });
    setRepairAmt("");
    showToast("Repair recorded ✓");
  };

  const del = (type, id) => {
    persist({ ...data, [type]: data[type].filter(e => e.id !== id) });
    showToast("Removed");
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const S = {
    root:     { fontFamily: "'Syne', sans-serif", background: "#0c0e10", minHeight: "100vh", color: "#e8e0d0", paddingBottom: 80 },
    hdr:      { background: "linear-gradient(135deg,#1a1200,#0c0e10)", borderBottom: "1px solid #2a2200", padding: "18px 18px 14px", position: "sticky", top: 0, zIndex: 10 },
    hdrTop:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    logo:     { fontSize: 22, fontWeight: 800, color: "#f0a500", letterSpacing: "-0.5px" },
    logoSub:  { fontSize: 11, color: "#664400", marginTop: 2, letterSpacing: 2, textTransform: "uppercase" },
    balLabel: { fontSize: 10, color: "#665544", textAlign: "right" },
    balVal:   (pos) => ({ fontSize: 20, fontWeight: 800, color: pos ? "#6ee7b7" : "#f87171", fontVariantNumeric: "tabular-nums" }),
    tabs:     { display: "flex", gap: 2, padding: "10px 14px 0", borderBottom: "1px solid #1a1a1a", background: "#0c0e10", position: "sticky", top: 62, zIndex: 9, overflowX: "auto" },
    tab: (a) => ({ padding: "8px 12px", borderRadius: "8px 8px 0 0", fontSize: 12, fontWeight: a ? 700 : 500, cursor: "pointer", border: "none", background: a ? "#1e1600" : "transparent", color: a ? "#f0a500" : "#665544", borderBottom: a ? "2px solid #f0a500" : "2px solid transparent", whiteSpace: "nowrap" }),
    body:     { padding: "16px 14px" },
    card:     { background: "#111418", border: "1px solid #1e2025", borderRadius: 12, padding: "15px 16px", marginBottom: 13 },
    goldCard: { background: "linear-gradient(135deg,#1a1200,#111418)", border: "1px solid #2a1e00", borderRadius: 12, padding: "15px 16px", marginBottom: 13 },
    grid2:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 13 },
    mCard: (c) => ({ background: "#111418", border: `1px solid ${c}22`, borderRadius: 12, padding: "13px 15px" }),
    mVal:  (c) => ({ fontSize: 19, fontWeight: 800, color: c, fontVariantNumeric: "tabular-nums" }),
    mLbl:     { fontSize: 10, color: "#554433", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 2 },
    secHd:    { fontSize: 12, fontWeight: 700, color: "#f0a500", letterSpacing: 1, textTransform: "uppercase", marginBottom: 11 },
    row:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #1a1a1a" },
    lbl:      { fontSize: 11, color: "#665544", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
    inp:      { background: "#0c0e10", border: "1px solid #2a2200", borderRadius: 8, padding: "9px 11px", color: "#e8e0d0", fontSize: 13, width: "100%", boxSizing: "border-box", outline: "none" },
    sel:      { background: "#0c0e10", border: "1px solid #2a2200", borderRadius: 8, padding: "9px 11px", color: "#e8e0d0", fontSize: 13, width: "100%", boxSizing: "border-box", outline: "none" },
    btn:      { background: "#f0a500", color: "#0c0e10", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 800, fontSize: 14, cursor: "pointer" },
    btnSm:    { background: "#1e2025", color: "#888", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" },
    badge: (c) => ({ background: `${c}22`, color: c, borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 700 }),
    dBadge:   { background: "#1a0030", color: "#a78bfa", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 700 },
    warn:     { background: "#1a0c00", border: "1px solid #aa4400", borderRadius: 10, padding: "13px 15px", marginBottom: 13 },
    fRow:     { display: "flex", gap: 8, marginBottom: 9 },
    toast: (t) => ({ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: t === "err" ? "#3a0000" : "#0f2a00", border: `1px solid ${t === "err" ? "#f05050" : "#4a9900"}`, color: t === "err" ? "#f05050" : "#8ddd44", borderRadius: 10, padding: "10px 22px", fontSize: 13, fontWeight: 700, zIndex: 100, whiteSpace: "nowrap" }),
    bar: (pct) => ({ height: "100%", width: `${Math.min(Math.max(pct, 0), 100)}%`, background: "linear-gradient(90deg,#f0a500,#6ee7b7)", borderRadius: 8, transition: "width 0.6s" }),
    // Footer
    footer:   { textAlign: "center", padding: "24px 16px 8px", borderTop: "1px solid #1a1a1a", marginTop: 10 },
    footerTxt:{ fontSize: 11, color: "#443322", letterSpacing: 0.5 },
    footerLnk:{ color: "#f0a500", textDecoration: "none", fontWeight: 700 },
  };

  const TABS = [
    { id: "overview",   icon: "📊", label: "Overview"   },
    { id: "weekly",     icon: "📅", label: "Weekly"     },
    { id: "earnings",   icon: "💶", label: "Earnings"   },
    { id: "expenses",   icon: "📤", label: "Expenses"   },
    { id: "investment", icon: "🛵", label: "Investment" },
  ];

  return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <div style={S.hdr}>
        <div style={S.hdrTop}>
          <div>
            <div style={S.logo}>⚡ GigTrack</div>
            <div style={S.logoSub}>Glovo · Uber Eats · Bolt · Lisbon</div>
          </div>
          <div>
            <div style={S.balLabel}>NET BALANCE</div>
            <div style={S.balVal(netBal >= 0)}>{fmtE(netBal)}</div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={S.body}>

        {/* ════════════ OVERVIEW ════════════ */}
        {tab === "overview" && <>
          {data.pendingRepair && (
            <div style={S.warn}>
              <div style={{ fontWeight: 700, color: "#f0a500", fontSize: 13 }}>⚠️ Pending Repair Cost</div>
              <div style={{ fontSize: 12, color: "#aa7744", marginTop: 3 }}>Enter the amount once you know it.</div>
              <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
                <input style={{ ...S.inp, width: 130 }} placeholder="€ Repair cost" value={repairAmt} onChange={e => setRepairAmt(e.target.value)} type="number" />
                <button style={S.btn} onClick={settleRepair}>Record</button>
              </div>
            </div>
          )}

          <div style={{ background: "#0e0a1a", border: "1px solid #3a2a6a", borderRadius: 10, padding: "10px 13px", marginBottom: 13, fontSize: 12, color: "#a78bfa" }}>
            ⚡ <strong>8% fleet deduction</strong> applied to Uber Eats & Bolt —{" "}
            Gross <strong>{fmtE(totalGross)}</strong> → Deducted <strong style={{ color: "#f87171" }}>−{fmtE(totalDed)}</strong> → Net <strong style={{ color: "#6ee7b7" }}>{fmtE(totalNet)}</strong>
          </div>

          <div style={S.grid2}>
            <div style={S.mCard("#6ee7b7")}><div style={S.mVal("#6ee7b7")}>{fmtE(totalNet)}</div><div style={S.mLbl}>Net Earned</div></div>
            <div style={S.mCard("#f87171")}><div style={S.mVal("#f87171")}>{fmtE(paidExp)}</div><div style={S.mLbl}>Total Spent</div></div>
            <div style={S.mCard(netBal >= 0 ? "#6ee7b7" : "#f87171")}><div style={S.mVal(netBal >= 0 ? "#6ee7b7" : "#f87171")}>{fmtE(netBal)}</div><div style={S.mLbl}>Net Balance</div></div>
            <div style={S.mCard("#f0a500")}><div style={S.mVal("#f0a500")}>{fmtE(TOTAL_INVESTED)}</div><div style={S.mLbl}>Invested</div></div>
          </div>

          <div style={S.goldCard}>
            <div style={S.lbl}>Investment Recovery</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: "#f0a500" }}>{roiPct}%</span>
              <span style={{ fontSize: 12, color: "#665544" }}>of {fmtE(TOTAL_INVESTED)} recovered</span>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, height: 10, marginTop: 9, overflow: "hidden" }}>
              <div style={S.bar(roiPct)} />
            </div>
          </div>

          <div style={S.card}>
            <div style={S.secHd}>Earnings by Platform</div>
            {byPlatform.filter(p => p.gross > 0).map(({ p, gross, net }) => (
              <div key={p} style={S.row}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={S.badge(PCOL[p] || "#aaa")}>{p}</span>
                  {PLATFORMS_WITH_DEDUCTION.includes(p) && <span style={S.dBadge}>−8%</span>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#6ee7b7" }}>{fmtE(net)}</div>
                  {PLATFORMS_WITH_DEDUCTION.includes(p) && <div style={{ fontSize: 10, color: "#554433" }}>gross {fmtE(gross)}</div>}
                </div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.secHd}>Full Summary</div>
            {[
              ["Startup Investment",           fmtE(TOTAL_INVESTED), "#f0a500"],
              ["Running Expenses (paid)",      fmtE(paidExp),        "#f87171"],
              ["Fleet Deductions (Uber+Bolt)", fmtE(totalDed),       "#a78bfa"],
              ["Gross Earned",                 fmtE(totalGross),     "#888"   ],
              ["Net Earned (after −8%)",       fmtE(totalNet),       "#6ee7b7"],
            ].map(([l, v, c]) => (
              <div key={l} style={S.row}>
                <span style={{ fontSize: 12, color: "#888" }}>{l}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</span>
              </div>
            ))}
            <div style={{ ...S.row, borderBottom: "none" }}>
              <span style={{ fontSize: 14, fontWeight: 800 }}>NET BALANCE</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: netBal >= 0 ? "#6ee7b7" : "#f87171" }}>{fmtE(netBal)}</span>
            </div>
          </div>

          {pendingExp > 0 && (
            <div style={{ ...S.card, borderColor: "#2a1800" }}>
              <div style={S.lbl}>⏳ Pending / Unpaid</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f0a500" }}>{fmtE(pendingExp)}</div>
              <div style={{ fontSize: 11, color: "#554433" }}>Not yet counted in expenses</div>
            </div>
          )}
        </>}

        {/* ════════════ WEEKLY ════════════ */}
        {tab === "weekly" && <>
          <div style={S.card}>
            <div style={S.secHd}>➕ Add Weekly / Daily Earning</div>
            <div style={S.fRow}>
              <div style={{ flex: 1 }}>
                <div style={S.lbl}>Week Label</div>
                <input style={S.inp} placeholder="e.g. 16–22 Mar" value={wForm.weekLabel} onChange={e => setWForm({ ...wForm, weekLabel: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={S.lbl}>Date</div>
                <input style={S.inp} type="date" value={wForm.dateFrom} onChange={e => setWForm({ ...wForm, dateFrom: e.target.value })} />
              </div>
            </div>
            <div style={S.fRow}>
              <div style={{ flex: 1 }}>
                <div style={S.lbl}>Platform</div>
                <select style={S.sel} value={wForm.platform} onChange={e => setWForm({ ...wForm, platform: e.target.value })}>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={S.lbl}>Gross Amount (€)</div>
                <input style={S.inp} type="number" placeholder="0.00" value={wForm.gross} onChange={e => setWForm({ ...wForm, gross: e.target.value })} />
              </div>
            </div>
            <div style={S.fRow}>
              <div style={{ flex: 1 }}>
                <div style={S.lbl}>Hours Worked</div>
                <input style={S.inp} type="number" placeholder="optional" value={wForm.hours} onChange={e => setWForm({ ...wForm, hours: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={S.lbl}>Note</div>
                <input style={S.inp} placeholder="optional" value={wForm.note} onChange={e => setWForm({ ...wForm, note: e.target.value })} />
              </div>
            </div>
            {wForm.gross && !isNaN(wForm.gross) && Number(wForm.gross) > 0 && (
              <div style={{ background: "#0f2a00", borderRadius: 8, padding: "8px 11px", marginBottom: 10, fontSize: 12 }}>
                {PLATFORMS_WITH_DEDUCTION.includes(wForm.platform)
                  ? <>Gross <strong>{fmtE(Number(wForm.gross))}</strong> → <strong style={{ color: "#a78bfa" }}>−8% ({fmtE(Number(wForm.gross) * 0.08)})</strong> → Net <strong style={{ color: "#6ee7b7" }}>{fmtE(Number(wForm.gross) * 0.92)}</strong></>
                  : <>Glovo: full amount → <strong style={{ color: "#6ee7b7" }}>{fmtE(Number(wForm.gross))}</strong> (no deduction)</>
                }
              </div>
            )}
            <button style={S.btn} onClick={addEarning}>Add Earning</button>
          </div>

          <div style={S.card}>
            <div style={S.secHd}>➕ Add Expense</div>
            <div style={S.fRow}>
              <div style={{ flex: 1 }}>
                <div style={S.lbl}>Date</div>
                <input style={S.inp} type="date" value={eForm.date} onChange={e => setEForm({ ...eForm, date: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={S.lbl}>Category</div>
                <select style={S.sel} value={eForm.category} onChange={e => setEForm({ ...eForm, category: e.target.value })}>
                  {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={S.fRow}>
              <div style={{ flex: 1 }}>
                <div style={S.lbl}>Amount (€)</div>
                <input style={S.inp} type="number" placeholder="0.00" value={eForm.amount} onChange={e => setEForm({ ...eForm, amount: e.target.value })} />
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#aaa", fontSize: 13 }}>
                  <input type="checkbox" checked={eForm.pending} onChange={e => setEForm({ ...eForm, pending: e.target.checked })} />
                  Mark as Pending
                </label>
              </div>
            </div>
            <div style={{ marginBottom: 11 }}>
              <div style={S.lbl}>Note</div>
              <input style={S.inp} placeholder="e.g. Fuel, tyre repair, phone holder tag..." value={eForm.note} onChange={e => setEForm({ ...eForm, note: e.target.value })} />
            </div>
            <button style={S.btn} onClick={addExpense}>Add Expense</button>
          </div>

          <div style={S.card}>
            <div style={S.secHd}>📆 Week-by-Week Summary</div>
            {weeks.length === 0 && <div style={{ color: "#554433", fontSize: 13 }}>No data yet.</div>}
            {weeks.map(w => (
              <div key={w.label} style={{ ...S.row, flexDirection: "column", alignItems: "flex-start", gap: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{w.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#6ee7b7" }}>{fmtE(w.net)}</span>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {Object.entries(w.platforms).map(([p, n]) => (
                    <span key={p} style={{ ...S.badge(PCOL[p] || "#aaa"), fontSize: 10 }}>{p}: {fmtE(n)}</span>
                  ))}
                  {w.gross !== w.net && <span style={S.dBadge}>gross {fmtE(w.gross)}</span>}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10 }}>
              <span style={{ fontSize: 11, color: "#665544" }}>Gross: {fmtE(totalGross)}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#6ee7b7" }}>NET TOTAL: {fmtE(totalNet)}</span>
            </div>
          </div>
        </>}

        {/* ════════════ EARNINGS ════════════ */}
        {tab === "earnings" && (
          <div style={S.card}>
            <div style={S.secHd}>All Earnings ({data.earnings.length})</div>
            {[...allNet].reverse().map(e => (
              <div key={e.id} style={S.row}>
                <div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={S.badge(PCOL[e.platform] || "#aaa")}>{e.platform}</span>
                    <span style={{ fontSize: 11, color: "#665544" }}>{e.weekLabel || e.dateFrom || e.date}</span>
                    {PLATFORMS_WITH_DEDUCTION.includes(e.platform) && <span style={S.dBadge}>−8%</span>}
                  </div>
                  {e.hours && <div style={{ fontSize: 11, color: "#554433", marginTop: 2 }}>{e.hours}h · {fmtE(e.net / e.hours)}/hr</div>}
                  {e.note  && <div style={{ fontSize: 11, color: "#554433" }}>{e.note}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "right" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#6ee7b7" }}>{fmtE(e.net)}</div>
                    {e.gross !== e.net && <div style={{ fontSize: 10, color: "#554433" }}>gross {fmtE(e.gross)}</div>}
                  </div>
                  <button style={S.btnSm} onClick={() => del("earnings", e.id)}>✕</button>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 9 }}>
              <span style={{ fontSize: 11, color: "#665544" }}>Gross: {fmtE(totalGross)} | Deducted: −{fmtE(totalDed)}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#6ee7b7" }}>NET: {fmtE(totalNet)}</span>
            </div>
          </div>
        )}

        {/* ════════════ EXPENSES ════════════ */}
        {tab === "expenses" && (
          <div style={S.card}>
            <div style={S.secHd}>All Expenses ({data.expenses.length})</div>
            {[...data.expenses].reverse().map(e => (
              <div key={e.id} style={S.row}>
                <div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={S.badge("#f87171")}>{e.category}</span>
                    <span style={{ fontSize: 11, color: "#665544" }}>{e.date}</span>
                    {e.pending && <span style={S.badge("#f0a500")}>PENDING</span>}
                  </div>
                  {e.note && <div style={{ fontSize: 11, color: "#554433", marginTop: 2 }}>{e.note}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: e.pending ? "#f0a500" : "#f87171" }}>{fmtE(e.amount)}</span>
                  <button style={S.btnSm} onClick={() => del("expenses", e.id)}>✕</button>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 9 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#f87171" }}>TOTAL PAID: {fmtE(paidExp)}</span>
            </div>
          </div>
        )}

        {/* ════════════ INVESTMENT ════════════ */}
        {tab === "investment" && <>
          <div style={S.goldCard}>
            <div style={S.lbl}>Total Startup Investment</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#f0a500" }}>{fmtE(TOTAL_INVESTED)}</div>
          </div>
          {INITIAL_INVESTMENT.map(i => (
            <div key={i.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
                  <span style={{ fontSize: 22 }}>{i.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{i.label}</div>
                    <div style={{ fontSize: 11, color: "#554433" }}>One-time cost</div>
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#f0a500" }}>{fmtE(i.amount)}</div>
              </div>
            </div>
          ))}
          <div style={S.card}>
            <div style={S.lbl}>Recovery Progress</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: "#6ee7b7" }}>Earned: {fmtE(totalNet)}</span>
              <span style={{ color: "#f87171" }}>Remaining: {fmtE(Math.max(TOTAL_INVESTED - totalNet, 0))}</span>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, height: 14, overflow: "hidden" }}>
              <div style={S.bar((totalNet / TOTAL_INVESTED) * 100)} />
            </div>
            <div style={{ textAlign: "center", marginTop: 6, fontSize: 12, color: "#665544" }}>
              {((totalNet / TOTAL_INVESTED) * 100).toFixed(1)}% of {fmtE(TOTAL_INVESTED)} recovered
            </div>
          </div>
        </>}

        {/* ════════════ FOOTER ════════════ */}
        <div style={S.footer}>
          <div style={S.footerTxt}>
            Built & designed by{" "}
            <a
              href="https://morshadul.eu/"
              target="_blank"
              rel="noopener noreferrer"
              style={S.footerLnk}
            >
              Morshadul
            </a>
            {" "}· GigTrack © {new Date().getFullYear()}
          </div>
          <div style={{ fontSize: 10, color: "#2a1a0a", marginTop: 4 }}>
            Lisbon, Portugal 🇵🇹
          </div>
        </div>

      </div>

      {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}
    </div>
  );
}
