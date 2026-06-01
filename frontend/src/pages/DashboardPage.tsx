import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertTriangle, TrendingDown, Award, DollarSign, CheckCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useDashboard } from "../hooks/useDashboard";
import clsx from "clsx";

const COLORS = ["#fff", "#aaa", "#666", "#444", "#222", "#888"];

const cardStyle = {
  background: "hsl(0 0% 5%)",
  border: "1px solid hsl(0 0% 20%)",
  borderRadius: "16px",
  padding: "20px",
};

const GRADE_COLORS: Record<string, string> = {
  A: "#34d399", B: "#38bdf8", C: "#fbbf24", D: "#f97316", F: "#ef4444",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) return (
    <div style={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 20%)", borderRadius: "10px", padding: "10px 14px" }}>
      <p style={{ color: "white", fontSize: "13px", fontWeight: 500 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: "hsl(0 0% 65%)", fontSize: "12px" }}>{p.name}: {p.value?.toFixed(1)}</p>
      ))}
    </div>
  );
  return null;
};

export default function DashboardPage() {
  const [country, setCountry] = useState("IN");
  const { overview, contractors, complaintsByType, atRiskRoads, loading } = useDashboard(country);

  const budgetData = overview ? [
    { name: "Sanctioned", value: parseFloat((overview.budget.total_sanctioned / 1e7).toFixed(2)) },
    { name: "Spent", value: parseFloat((overview.budget.total_spent / 1e7).toFixed(2)) },
  ] : [];

  return (
    <div className="md:ml-16 min-h-screen px-8 md:px-16 py-12"
      style={{ background: "hsl(0 0% 0%)", color: "white", fontFamily: "'Inter', sans-serif" }}>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 500, letterSpacing: "-1.5px", marginBottom: "8px" }}>
              Transparency{" "}
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400 }}>
                Dashboard
              </span>
            </h1>
            <p style={{ color: "hsl(0 0% 65%)", fontSize: "16px" }}>Public road spending and accountability metrics</p>
          </div>
          <select value={country} onChange={e => setCountry(e.target.value)}
            style={{ background: "hsl(0 0% 5%)", border: "1px solid hsl(0 0% 20%)", color: "hsl(0 0% 65%)", borderRadius: "10px", padding: "8px 14px", fontSize: "14px", outline: "none" }}>
            <option value="IN">🇮🇳 India</option>
            <option value="US">🇺🇸 USA</option>
            <option value="GB">🇬🇧 UK</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className="animate-spin" style={{ color: "hsl(0 0% 40%)" }} />
          </div>
        ) : (
          <>
            {/* KPIs */}
            {overview ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: DollarSign, label: "Budget Sanctioned", value: `₹${(overview.budget.total_sanctioned / 1e7).toFixed(1)}Cr`, sub: `${overview.budget.total_projects} projects` },
                  { icon: TrendingDown, label: "Utilization", value: `${overview.budget.utilization_pct}%`, sub: `₹${(overview.budget.total_spent / 1e7).toFixed(1)}Cr spent` },
                  { icon: CheckCircle, label: "Resolved", value: `${overview.complaints.resolution_rate}%`, sub: `${overview.complaints.resolved}/${overview.complaints.total}` },
                  { icon: AlertTriangle, label: "Anomalies", value: String(overview.budget.anomalous_projects), sub: "projects flagged" },
                ].map(({ icon: Icon, label, value, sub }, i) => (
                  <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }} style={cardStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "hsl(0 0% 65%)", fontSize: "12px", marginBottom: "12px" }}>
                      <Icon size={13} /> {label}
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "white", marginBottom: "4px" }}>{value}</div>
                    <div style={{ fontSize: "12px", color: "hsl(0 0% 40%)" }}>{sub}</div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ ...cardStyle, marginBottom: "32px", color: "#fbbf24", fontSize: "14px" }}>
                ⚠️ No data yet — the database will auto-seed on first backend startup.
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }} viewport={{ once: true }} style={cardStyle}>
                <h3 style={{ fontWeight: 600, color: "white", marginBottom: "20px" }}>Budget Sanctioned vs Spent (₹Cr)</h3>
                {budgetData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={budgetData} barSize={48}>
                      <XAxis dataKey="name" tick={{ fill: "hsl(0 0% 65%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(0 0% 65%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="white" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(0 0% 30%)", fontSize: "14px" }}>No data yet</div>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }} style={cardStyle}>
                <h3 style={{ fontWeight: 600, color: "white", marginBottom: "20px" }}>Complaints by Type</h3>
                {complaintsByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={complaintsByType} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                        {complaintsByType.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(0 0% 30%)", fontSize: "14px" }}>No data yet</div>
                )}
              </motion.div>
            </div>

            {/* Contractor Scorecards */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }} viewport={{ once: true }} style={{ ...cardStyle, marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <Award size={16} style={{ color: "#fbbf24" }} />
                <h3 style={{ fontWeight: 600, color: "white" }}>Contractor Accountability Scorecards</h3>
              </div>
              {contractors.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ color: "hsl(0 0% 40%)", fontSize: "12px", borderBottom: "1px solid hsl(0 0% 15%)" }}>
                        {["Contractor", "Grade", "Trust Score", "On-Time", "Re-Complaints", "Rating"].map(h => (
                          <th key={h} style={{ textAlign: h === "Contractor" ? "left" : "center", padding: "8px 12px", fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contractors.map((c: any) => (
                        <tr key={c.id} style={{ borderBottom: "1px solid hsl(0 0% 8%)" }}>
                          <td style={{ padding: "12px", color: "white", fontWeight: 500 }}>{c.name}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            <span style={{ fontSize: "20px", fontWeight: 700, color: GRADE_COLORS[c.grade] || "white" }}>{c.grade}</span>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                              <div style={{ width: "60px", height: "4px", background: "hsl(0 0% 15%)", borderRadius: "9999px", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${c.trust_score}%`, background: c.trust_score >= 70 ? "#34d399" : c.trust_score >= 50 ? "#fbbf24" : "#ef4444", borderRadius: "9999px" }} />
                              </div>
                              <span style={{ color: "hsl(0 0% 65%)", fontSize: "12px" }}>{c.trust_score?.toFixed(0)}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px", textAlign: "center", color: "hsl(0 0% 65%)" }}>{c.on_time_rate?.toFixed(0)}%</td>
                          <td style={{ padding: "12px", textAlign: "center", color: c.re_complaint_rate > 20 ? "#ef4444" : "#34d399", fontSize: "13px" }}>{c.re_complaint_rate?.toFixed(0)}%</td>
                          <td style={{ padding: "12px", textAlign: "center", color: "hsl(0 0% 65%)" }}>⭐ {c.citizen_rating?.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "hsl(0 0% 30%)", fontSize: "14px" }}>No contractor data yet</div>
              )}
            </motion.div>

            {/* At-risk roads */}
            {atRiskRoads.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }} viewport={{ once: true }} style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                  <TrendingDown size={16} style={{ color: "#f97316" }} />
                  <h3 style={{ fontWeight: 600, color: "white" }}>Roads Predicted to Deteriorate (Next 90 Days)</h3>
                </div>
                <div>
                  {atRiskRoads.slice(0, 8).map((road: any) => (
                    <div key={road.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid hsl(0 0% 8%)" }}>
                      <div>
                        <div style={{ color: "white", fontSize: "14px", fontWeight: 500 }}>{road.name}</div>
                        <div style={{ color: "hsl(0 0% 40%)", fontSize: "12px" }}>{road.road_number} · {road.road_type}</div>
                      </div>
                      <span className={clsx("badge", {
                        "badge-critical": road.deterioration_risk === "CRITICAL",
                        "badge-high": road.deterioration_risk === "HIGH",
                        "badge-medium": road.deterioration_risk === "MEDIUM",
                      })}>{road.deterioration_risk}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
