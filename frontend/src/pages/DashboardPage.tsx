import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { AlertTriangle, TrendingDown, Award, DollarSign, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import clsx from "clsx";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-400", B: "text-blue-400", C: "text-yellow-400", D: "text-orange-400", F: "text-red-400",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
        <p className="text-slate-300 text-sm font-medium">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [country, setCountry] = useState("IN");
  const { overview, contractors, complaintsByType, complaintsBySeverity, atRiskRoads, loading } = useDashboard(country);

  const budgetData = overview ? [
    { name: "Sanctioned", value: parseFloat((overview.budget.total_sanctioned / 1e7).toFixed(2)), fill: "#3b82f6" },
    { name: "Spent", value: parseFloat((overview.budget.total_spent / 1e7).toFixed(2)), fill: "#10b981" },
  ] : [];

  const kpis = overview ? [
    { icon: DollarSign, label: "Budget Sanctioned", value: `₹${(overview.budget.total_sanctioned / 1e7).toFixed(1)}Cr`, sub: `${overview.budget.total_projects} projects`, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { icon: TrendingDown, label: "Utilization", value: `${overview.budget.utilization_pct}%`, sub: `₹${(overview.budget.total_spent / 1e7).toFixed(1)}Cr spent`, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    { icon: CheckCircle, label: "Resolved", value: `${overview.complaints.resolution_rate}%`, sub: `${overview.complaints.resolved}/${overview.complaints.total} complaints`, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { icon: AlertTriangle, label: "Anomalies", value: String(overview.budget.anomalous_projects), sub: "projects flagged", color: overview.budget.anomalous_projects > 0 ? "text-red-400" : "text-green-400", bg: overview.budget.anomalous_projects > 0 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20" },
  ] : [];

  return (
    <div className="md:ml-16 min-h-screen p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Transparency Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Public road spending and accountability metrics</p>
        </div>
        <select value={country} onChange={(e) => setCountry(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-2">
          <option value="IN">🇮🇳 India</option>
          <option value="US">🇺🇸 USA</option>
          <option value="GB">🇬🇧 UK</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-slate-500">
            <RefreshCw size={20} className="animate-spin" />
            Loading dashboard data...
          </div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          {overview ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {kpis.map(({ icon: Icon, label, value, sub, color, bg }) => (
                <div key={label} className={`border rounded-2xl p-4 ${bg}`}>
                  <div className={`flex items-center gap-2 text-xs mb-3 ${color}`}>
                    <Icon size={14} /> {label}
                  </div>
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-slate-500 text-xs mt-1">{sub}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-2xl p-4 mb-6 text-yellow-400 text-sm">
              ⚠️ No data yet — run <code className="bg-slate-800 px-1 rounded">python -m db.seed_data</code> in the Render Shell to populate sample data.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Budget chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">Budget Sanctioned vs Spent (₹Cr)</h3>
              {budgetData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={budgetData} barSize={50}>
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {budgetData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">No budget data yet</div>
              )}
            </div>

            {/* Complaints by type */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">Complaints by Type</h3>
              {complaintsByType.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={complaintsByType} dataKey="count" nameKey="type"
                      cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                      {complaintsByType.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(v) => <span className="text-slate-400 text-xs">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">No complaint data yet</div>
              )}
            </div>
          </div>

          {/* Contractor Scorecards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Award size={18} className="text-yellow-400" />
              <h3 className="font-semibold text-white">Contractor Accountability Scorecards</h3>
            </div>
            {contractors.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-slate-800">
                      <th className="text-left py-3 pr-4">Contractor</th>
                      <th className="text-center py-3 px-2">Grade</th>
                      <th className="text-center py-3 px-2">Trust Score</th>
                      <th className="text-center py-3 px-2">On-Time</th>
                      <th className="text-center py-3 px-2">Re-Complaints</th>
                      <th className="text-center py-3 px-2">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractors.map((c: any) => (
                      <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 pr-4 text-slate-200 font-medium">{c.name}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={clsx("font-bold text-xl", GRADE_COLORS[c.grade] || "text-slate-400")}>{c.grade}</span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${c.trust_score}%`, backgroundColor: c.trust_score >= 70 ? "#10b981" : c.trust_score >= 50 ? "#f59e0b" : "#ef4444" }} />
                            </div>
                            <span className="text-slate-300 text-xs">{c.trust_score?.toFixed(0)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-slate-300">{c.on_time_rate?.toFixed(0)}%</td>
                        <td className="py-3 px-2 text-center">
                          <span className={clsx("text-xs font-medium", c.re_complaint_rate > 20 ? "text-red-400" : "text-green-400")}>
                            {c.re_complaint_rate?.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-slate-300">⭐ {c.citizen_rating?.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-600">
                <Award size={32} className="mx-auto mb-2 opacity-30" />
                <p>No contractor data yet</p>
                <p className="text-xs mt-1">Seed the database to see contractor scorecards</p>
              </div>
            )}
          </div>

          {/* At-risk roads */}
          {atRiskRoads.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown size={18} className="text-orange-400" />
                <h3 className="font-semibold text-white">Roads Predicted to Deteriorate (Next 90 Days)</h3>
              </div>
              <div className="space-y-2">
                {atRiskRoads.slice(0, 8).map((road: any) => (
                  <div key={road.id} className="flex items-center justify-between py-2.5 border-b border-slate-800/50">
                    <div>
                      <div className="text-slate-200 text-sm font-medium">{road.name}</div>
                      <div className="text-slate-500 text-xs">{road.road_number} · {road.road_type}</div>
                    </div>
                    <div className="text-right">
                      <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", {
                        "bg-red-900/50 text-red-300 border border-red-800": road.deterioration_risk === "CRITICAL",
                        "bg-orange-900/50 text-orange-300 border border-orange-800": road.deterioration_risk === "HIGH",
                        "bg-yellow-900/50 text-yellow-300 border border-yellow-800": road.deterioration_risk === "MEDIUM",
                      })}>
                        {road.deterioration_risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
