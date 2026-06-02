import { useState, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar
} from "recharts";
import { AlertTriangle, TrendingDown, Award, DollarSign, CheckCircle, RefreshCw, Zap } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useDashboard } from "../hooks/useDashboard";
import clsx from "clsx";

const COLORS = ["#38bdf8","#a78bfa","#34d399","#fbbf24","#f97316","#f472b6","#818cf8"];

// 3D tilt card
function TiltCard({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-80, 80], [6, -6]);
  const rotateY = useTransform(x, [-80, 80], [-6, 6]);
  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };
  return (
    <motion.div ref={ref} onMouseMove={handleMouse} onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", ...style }} className={className}>
      {children}
    </motion.div>
  );
}

// Floating particles
function Particles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div key={i}
          style={{
            position: "absolute",
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            borderRadius: "50%",
            background: COLORS[i % COLORS.length],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.3,
          }}
          animate={{ y: [0, -30, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}
      {/* Grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
      }} />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "10px 14px" }}>
      <p style={{ color: "white", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [country, setCountry] = useState("IN");
  const { overview, contractors, complaintsByType, complaintsBySeverity, atRiskRoads, loading } = useDashboard(country);

  const budgetData = overview ? [
    { name: "Sanctioned", value: parseFloat((overview.budget.total_sanctioned / 1e7).toFixed(2)), fill: "#38bdf8" },
    { name: "Spent", value: parseFloat((overview.budget.total_spent / 1e7).toFixed(2)), fill: "#a78bfa" },
  ] : [];

  const kpis = overview ? [
    { icon: DollarSign, label: "Budget Sanctioned", value: `₹${(overview.budget.total_sanctioned / 1e7).toFixed(1)}Cr`, sub: `${overview.budget.total_projects} projects`, color: "#38bdf8", glow: "rgba(56,189,248,0.2)" },
    { icon: TrendingDown, label: "Utilization", value: `${overview.budget.utilization_pct}%`, sub: `₹${(overview.budget.total_spent / 1e7).toFixed(1)}Cr spent`, color: "#a78bfa", glow: "rgba(167,139,250,0.2)" },
    { icon: CheckCircle, label: "Resolved", value: `${overview.complaints.resolution_rate}%`, sub: `${overview.complaints.resolved}/${overview.complaints.total}`, color: "#34d399", glow: "rgba(52,211,153,0.2)" },
    { icon: AlertTriangle, label: "Anomalies", value: String(overview.budget.anomalous_projects), sub: "flagged", color: overview.budget.anomalous_projects > 0 ? "#ef4444" : "#34d399", glow: overview.budget.anomalous_projects > 0 ? "rgba(239,68,68,0.2)" : "rgba(52,211,153,0.2)" },
  ] : [];

  const GRADE_COLORS: Record<string, string> = { A: "#34d399", B: "#38bdf8", C: "#fbbf24", D: "#f97316", F: "#ef4444" };

  return (
    <div className="md:ml-16 min-h-screen relative" style={{ background: "#000", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      <Particles />

      <div className="relative z-10 px-6 md:px-12 py-10 max-w-7xl mx-auto liquid-glass p-6 rounded-3xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-10">
          <div className="mb-3 inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "linear-gradient(90deg,#38bdf8,#a78bfa)", color: "black" }}>Dashboard</div>
          <div>
            <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 500, letterSpacing: "-1.5px", marginBottom: "6px" }}>
              Transparency{" "}
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, background: "linear-gradient(135deg,#38bdf8,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Dashboard
              </span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>Public road spending and accountability metrics</p>
          </div>
          <select value={country} onChange={e => setCountry(e.target.value)}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", borderRadius: "12px", padding: "8px 14px", fontSize: "13px", outline: "none" }}>
            <option value="IN">🇮🇳 India</option>
            <option value="US">🇺🇸 USA</option>
            <option value="GB">🇬🇧 UK</option>
          </select>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <RefreshCw size={28} style={{ color: "rgba(56,189,248,0.5)" }} />
            </motion.div>
          </div>
        ) : (
          <>
            {/* KPI Cards — 3D tilt */}
            {overview ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {kpis.map(({ icon: Icon, label, value, sub, color, glow }, i) => (
                  <TiltCard key={label}>
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="rounded-2xl p-5 relative overflow-hidden h-full"
                      style={{ background: "rgba(255,255,255,0.09)", border: `1px solid ${glow.replace("0.2","0.15")}`, boxShadow: `0 0 40px ${glow.replace("0.2","0.08")}` }}>
                      {/* Glow blob */}
                      <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, borderRadius: "50%", pointerEvents: "none" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.75)", fontSize: "11px", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        <Icon size={12} style={{ color }} /> {label}
                      </div>
                      <div style={{ fontSize: "28px", fontWeight: 700, color, marginBottom: "4px", fontVariantNumeric: "tabular-nums" }}>{value}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>{sub}</div>
                    </motion.div>
                  </TiltCard>
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl p-5 mb-8 flex items-center gap-3"
                style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24", fontSize: "14px" }}>
                <Zap size={16} />
                No data yet — the database auto-seeds on first backend startup. Check Render logs.
              </motion.div>
            )}

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Budget bar chart */}
              <TiltCard>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }} viewport={{ once: true }}
                  className="rounded-2xl p-6 relative overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}>
                  <div style={{ position: "absolute", bottom: "-40px", left: "-40px", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
                  <h3 style={{ fontWeight: 600, color: "white", marginBottom: "20px", fontSize: "15px" }}>Budget Sanctioned vs Spent (₹Cr)</h3>
                  {budgetData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={budgetData} barSize={56}>
                        <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {budgetData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.15)", fontSize: "14px" }}>No data yet</div>
                  )}
                </motion.div>
              </TiltCard>

              {/* Pie chart */}
              <TiltCard>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }}
                  className="rounded-2xl p-6 relative overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}>
                  <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
                  <h3 style={{ fontWeight: 600, color: "white", marginBottom: "20px", fontSize: "15px" }}>Complaints by Type</h3>
                  {complaintsByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={complaintsByType} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                          {complaintsByType.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.15)", fontSize: "14px" }}>No data yet</div>
                  )}
                </motion.div>
              </TiltCard>
            </div>

            {/* Contractor Scorecards */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }} viewport={{ once: true }}
              className="rounded-2xl p-6 mb-8 relative overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}>
              <div style={{ position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)", width: "400px", height: "200px", background: "radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Award size={16} style={{ color: "#fbbf24" }} />
                </div>
                <h3 style={{ fontWeight: 600, color: "white", fontSize: "15px" }}>Contractor Accountability Scorecards</h3>
              </div>

              {contractors.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        {["Contractor", "Grade", "Trust Score", "On-Time", "Re-Complaints", "Rating"].map(h => (
                          <th key={h} style={{ textAlign: h === "Contractor" ? "left" : "center", padding: "10px 12px", fontWeight: 500, color: "rgba(255,255,255,0.3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contractors.map((c: any, i: number) => (
                        <motion.tr key={c.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }} viewport={{ once: true }}
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "14px 12px", color: "white", fontWeight: 500 }}>{c.name}</td>
                          <td style={{ padding: "14px 12px", textAlign: "center" }}>
                            <span style={{ fontSize: "22px", fontWeight: 700, color: GRADE_COLORS[c.grade] || "white", textShadow: `0 0 20px ${GRADE_COLORS[c.grade] || "white"}` }}>{c.grade}</span>
                          </td>
                          <td style={{ padding: "14px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                              <div style={{ width: "64px", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "9999px", overflow: "hidden" }}>
                                <motion.div initial={{ width: 0 }} whileInView={{ width: `${c.trust_score}%` }}
                                  transition={{ duration: 1, delay: i * 0.1 }} viewport={{ once: true }}
                                  style={{ height: "100%", background: c.trust_score >= 70 ? "#34d399" : c.trust_score >= 50 ? "#fbbf24" : "#ef4444", borderRadius: "9999px", boxShadow: `0 0 8px ${c.trust_score >= 70 ? "#34d399" : c.trust_score >= 50 ? "#fbbf24" : "#ef4444"}` }} />
                              </div>
                              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{c.trust_score?.toFixed(0)}</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 12px", textAlign: "center", color: "rgba(255,255,255,0.6)" }}>{c.on_time_rate?.toFixed(0)}%</td>
                          <td style={{ padding: "14px 12px", textAlign: "center" }}>
                            <span style={{ color: c.re_complaint_rate > 20 ? "#ef4444" : "#34d399", fontWeight: 600 }}>{c.re_complaint_rate?.toFixed(0)}%</span>
                          </td>
                          <td style={{ padding: "14px 12px", textAlign: "center", color: "#fbbf24" }}>⭐ {c.citizen_rating?.toFixed(1)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "48px", color: "rgba(255,255,255,0.15)", fontSize: "14px" }}>
                  <Award size={32} style={{ margin: "0 auto 12px", opacity: 0.2 }} />
                  No contractor data yet
                </div>
              )}
            </motion.div>

            {/* At-risk roads */}
            {atRiskRoads.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }} viewport={{ once: true }}
                className="rounded-2xl p-6"
                style={{ background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                  <TrendingDown size={16} style={{ color: "#f97316" }} />
                  <h3 style={{ fontWeight: 600, color: "white", fontSize: "15px" }}>Roads Predicted to Deteriorate (Next 90 Days)</h3>
                </div>
                <div>
                  {atRiskRoads.slice(0, 6).map((road: any, i: number) => (
                    <motion.div key={road.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <div>
                        <div style={{ color: "white", fontSize: "14px", fontWeight: 500 }}>{road.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>{road.road_number} · {road.road_type}</div>
                      </div>
                      <span className={clsx("badge", { "badge-critical": road.deterioration_risk==="CRITICAL", "badge-high": road.deterioration_risk==="HIGH", "badge-medium": road.deterioration_risk==="MEDIUM" })}>
                        {road.deterioration_risk}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
