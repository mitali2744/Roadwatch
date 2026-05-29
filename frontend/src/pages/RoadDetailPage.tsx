import { useParams } from "react-router-dom";
import { useRoadDetail } from "../hooks/useRoadDetail";
import { AlertTriangle, Calendar, DollarSign, User, Building } from "lucide-react";
import clsx from "clsx";

export default function RoadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useRoadDetail(id!);

  if (loading) return <div className="md:ml-16 p-8 text-slate-500">Loading road details...</div>;
  if (!data) return <div className="md:ml-16 p-8 text-slate-500">Road not found</div>;

  const { segment, projects } = data;

  return (
    <div className="md:ml-16 min-h-screen p-4 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="text-slate-500 text-sm mb-1">{segment.road_number} · {segment.road_type}</div>
        <h1 className="text-2xl font-bold text-white">{segment.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className={clsx("badge", {
            "badge-critical": segment.deterioration_risk === "CRITICAL",
            "badge-high": segment.deterioration_risk === "HIGH",
            "badge-medium": segment.deterioration_risk === "MEDIUM",
            "badge-low": segment.deterioration_risk === "LOW",
          })}>
            {segment.deterioration_risk || "UNKNOWN"} RISK
          </span>
          <span className="text-slate-500 text-sm">
            Condition: {segment.condition_score?.toFixed(0) || "N/A"}/100
          </span>
        </div>
      </div>

      {/* Projects */}
      <div className="space-y-4">
        {projects.map((p: any) => (
          <div key={p.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-white">{p.title}</h3>
              {p.is_anomalous && (
                <div className="flex items-center gap-1 text-red-400 text-xs">
                  <AlertTriangle size={12} />
                  Anomaly
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-slate-500" />
                <div>
                  <div className="text-slate-500 text-xs">Budget Sanctioned</div>
                  <div className="text-slate-200">₹{(p.budget_sanctioned / 1e7).toFixed(2)}Cr</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-slate-500" />
                <div>
                  <div className="text-slate-500 text-xs">Budget Spent</div>
                  <div className={clsx("text-sm", p.budget_spent > p.budget_sanctioned ? "text-red-400" : "text-slate-200")}>
                    ₹{(p.budget_spent / 1e7).toFixed(2)}Cr
                    {p.budget_spent > p.budget_sanctioned && " ⚠️"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-500" />
                <div>
                  <div className="text-slate-500 text-xs">Last Relaying</div>
                  <div className="text-slate-200">
                    {p.last_relaying_date ? new Date(p.last_relaying_date).toLocaleDateString() : "N/A"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building size={14} className="text-slate-500" />
                <div>
                  <div className="text-slate-500 text-xs">Status</div>
                  <div className="text-slate-200">{p.status}</div>
                </div>
              </div>
            </div>

            {p.anomaly_reason && (
              <div className="mt-3 p-2 bg-red-900/20 border border-red-800 rounded-lg text-xs text-red-400">
                ⚠️ {p.anomaly_reason}
              </div>
            )}
          </div>
        ))}
        {projects.length === 0 && (
          <div className="card text-center text-slate-500">No project data available for this road</div>
        )}
      </div>
    </div>
  );
}
