import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { AlertTriangle, TrendingDown, Award, DollarSign, CheckCircle, Clock } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import clsx from "clsx";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-400",
  B: "text-blue-400",
  C: "text-yellow-400",
  D: "text-orange-400",
  F: "text-red-400",
};

export default function DashboardPage() {
  const [country, setCountry] = useState("IN");
  const { overview, contractors, complaintsByType, complaintsBySeverity, atRiskRoads, loading } = useDashboard(country);

  if (loading) {
    return (
      <div className="md:ml-16 min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  const budgetData = overview ? [
    { name: "Sanctioned", value: overview.budget.total_sanctioned / 1e7 },
    { name: "Spent", value: overview.budget.total_spent / 1e7 },
  ] : [];

  return (
    <div className="md:ml-16 min-h-screen p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Transparency Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Public road spending and accountability metrics</p>
        </div>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2"
        >
          <option value="IN">🇮🇳 India</option>
          <option value="US">🇺🇸 USA</option>
          <option value="GB">🇬🇧 UK</option>
        </select>
      </div>

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
              <DollarSign size={14} /> Budget Sanctioned
            </div>
            <div className="text-xl font-bold text-white">
              ₹{(overview.budget.total_sanctioned / 1e7).toFixed(1)}Cr
            </div>
            <div className="text-xs text-slate-500 mt-1">{overview.budget.total_projects} projects</div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
              <TrendingDown size={14} /> Budget Utilization
            </div>
            <div className="text-xl font-bold text-white">{overview.budget.utilization_pct}%</div>
            <div className="text-xs text-slate-500 mt-1">
              ₹{(overview.budget.total_spent / 1e7).toFixed(1)}Cr spent
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
              <CheckCircle size={14} /> Complaints Resolved
            </div>
            <div className="text-xl font-bold text-white">{overview.complaints.resolution_rate}%</div>
            <div className="text-xs text-slate-500 mt-1">{overview.complaints.resolved}/{overview.complaints.total}</div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
              <AlertTriangle size={14} /> Budget Anomalies
            </div>
            <div className={clsx("text-xl font-bold", overview.budget.anomalous_projects > 0 ? "text-red-400" : "text-green-400")}>
              {overview.budget.anomalous_projects}
            </div>
            <div className="text-xs text-slate-500 mt-1">projects flagged</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Budget chart */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Budget Sanctioned vs Spent (₹Cr)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={budgetData}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#f1f5f9" }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Complaints by type */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Complaints by Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={complaintsByType}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {complaintsByType.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contractor Scorecards */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award size={18} className="text-yellow-400" />
          <h3 className="font-semibold text-white">Contractor Accountability Scorecards</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs border-b border-slate-800">
                <th className="text-left py-2 pr-4">Contractor</th>
                <th className="text-center py-2 px-2">Grade</th>
                <th className="text-center py-2 px-2">Trust Score</th>
                <th className="text-center py-2 px-2">On-Time %</th>
                <th className="text-center py-2 px-2">Re-Complaint %</th>
                <th className="text-center py-2 px-2">Rating</th>
                <th className="text-center py-2 px-2">Projects</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((c: any) => (
                <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 pr-4 text-slate-200 font-medium">{c.name}</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={clsx("font-bold text-lg", GRADE_COLORS[c.grade] || "text-slate-400")}>
                      {c.grade}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${c.trust_score}%`,
                            backgroundColor: c.trust_score >= 70 ? "#10b981" : c.trust_score >= 50 ? "#f59e0b" : "#ef4444",
                          }}
                        />
                      </div>
                      <span className="text-slate-300 text-xs">{c.trust_score.toFixed(0)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{c.on_time_rate.toFixed(0)}%</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={clsx("text-xs", c.re_complaint_rate > 20 ? "text-red-400" : "text-slate-300")}>
                      {c.re_complaint_rate.toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-300">⭐ {c.citizen_rating.toFixed(1)}</td>
                  <td className="py-2.5 px-2 text-center text-slate-500 text-xs">{c.completed_projects}/{c.total_projects}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {contractors.length === 0 && (
            <div className="text-center text-slate-500 py-8">No contractor data available</div>
          )}
        </div>
      </div>

      {/* At-risk roads */}
      {atRiskRoads.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={18} className="text-orange-400" />
            <h3 className="font-semibold text-white">Roads Predicted to Deteriorate (Next 90 Days)</h3>
          </div>
          <div className="space-y-2">
            {atRiskRoads.slice(0, 8).map((road: any) => (
              <div key={road.id} className="flex items-center justify-between py-2 border-b border-slate-800/50">
                <div>
                  <div className="text-slate-200 text-sm font-medium">{road.name}</div>
                  <div className="text-slate-500 text-xs">{road.road_number} · {road.road_type}</div>
                </div>
                <div className="text-right">
                  <span className={clsx("badge", {
                    "badge-critical": road.deterioration_risk === "CRITICAL",
                    "badge-high": road.deterioration_risk === "HIGH",
                    "badge-medium": road.deterioration_risk === "MEDIUM",
                  })}>
                    {road.deterioration_risk}
                  </span>
                  <div className="text-slate-500 text-xs mt-1">
                    {road.predicted_failure_date
                      ? new Date(road.predicted_failure_date).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
